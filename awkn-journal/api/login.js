import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { password } = req.body || {};
  if (!password) return res.status(400).json({ error: 'Missing password' });

  const correct = process.env.AWKN_PASSWORD;
  if (!correct) return res.status(500).json({ error: 'Server not configured' });

  if (password !== correct) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  const secret = process.env.AWKN_SECRET;
  if (!secret) return res.status(500).json({ error: 'Secret not configured' });

  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const payload = `client|${expiry}`;
  const sig = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  const token = Buffer.from(`${payload}|${sig}`).toString('base64');

  return res.status(200).json({ token });
}
