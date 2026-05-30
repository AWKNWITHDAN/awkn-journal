export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { entries, count } = req.body;

  if (!entries) {
    return res.status(400).json({ error: 'No entries provided' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const systemPrompt = `You are a sharp, direct coach named Dan who works with men aged 35-55 on body transformation and mindset. 
You have a deep understanding of how years of stress, responsibility, and self-neglect create patterns in how men think, talk about themselves, and resist change.

Your job is to read a client's recent journal entries and name the patterns running beneath them — the beliefs, fears, loops, or blindspots that keep appearing across their writing.

Rules:
- Be direct and specific. No generic coaching language.
- Reference actual phrases or ideas from their entries — show them you actually read it.
- Name what you see even if it's uncomfortable. These men respect honesty over softness.
- Keep it to 3-4 short paragraphs. No bullet points. No headers.
- End with one precise question — not a motivational statement — that names the real thing they're circling around.
- Write in first person as Dan, speaking directly to the client as "you".`;

  const userPrompt = `Here are my client's last ${count} journal entries. Read them carefully and tell them what patterns you see running beneath their words — what keeps showing up, what they're really saying underneath the surface.

${entries}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return res.status(502).json({ error: 'Upstream API error' });
    }

    const data = await response.json();
    const reflection = data.content?.[0]?.text || '';

    return res.status(200).json({ reflection });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Internal error' });
  }
}
