import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token } = req.body || {};
  if (!token) return res.status(401).json({ valid: false });

  const secret = process.env.AWKN_SECRET;
  if (!secret) return res.status(500).json({ valid: false });

  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts = decoded.split('|');
    if (parts.length !== 3) throw new Error('Invalid format');

    const [username, expiry, sig] = parts;
    const payload = `${username}|${expiry}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    if (sig !== expected) throw new Error('Bad signature');
    if (Date.now() > parseInt(expiry)) throw new Error('Expired');

    const displayName = username.charAt(0).toUpperCase() + username.slice(1);
    return res.status(200).json({ valid: true, username, displayName });
  } catch {
    return res.status(401).json({ valid: false });
  }
}
