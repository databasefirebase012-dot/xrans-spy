const { dbGet, hashPassword, jwt } = require('./fb');   // ← './fb'

const attempts = new Map();

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const rec = attempts.get(ip) || { count: 0, first: now };

  if (now - rec.first > 60000) { rec.count = 0; rec.first = now; }
  rec.count++;
  attempts.set(ip, rec);

  if (rec.count > 5) return res.status(429).json({ error: 'too_many' });

  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'missing' });
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) return res.status(401).json({ error: 'invalid' });

  try {
    const adminData = await dbGet(`admins/${username}`);
    if (!adminData) return res.status(401).json({ error: 'invalid' });

    const hash = hashPassword(password, adminData.salt || '');
    if (hash !== adminData.passwordHash) return res.status(401).json({ error: 'invalid' });

    const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.setHeader('Set-Cookie',
      `panel_token=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${60*60*24*7}`);
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'server' });
  }
};