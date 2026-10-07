const { dbGet, dbSet, crypto } = require('./fb');

const attempts = new Map();

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const rec = attempts.get(ip) || { count: 0, first: now };
  if (now - rec.first > 3600000) { rec.count = 0; rec.first = now; }
  rec.count++;
  attempts.set(ip, rec);
  if (rec.count > 10) return res.status(429).json({ error: 'rate_limit' });

  const { deviceId, model, android, brand, signature, adminId } = req.body || {};

  if (!deviceId || !/^[A-F0-9]{8}$/.test(deviceId)) {
    return res.status(400).json({ error: 'bad_id' });
  }
  if (!adminId || !/^[a-zA-Z0-9_]{3,32}$/.test(adminId)) {
    return res.status(400).json({ error: 'bad_admin' });
  }

  const expectedSig = process.env.APK_SIGNATURE;
  if (expectedSig && expectedSig.length > 0 && signature !== expectedSig) {
    return res.status(403).json({ error: 'bad_signature' });
  }

  try {
    const admin = await dbGet(`admins/${adminId}`);
    if (!admin) return res.status(403).json({ error: 'unknown_admin' });

    const existing = await dbGet(`devices/${deviceId}`);

    if (existing && existing.token) {
      await dbSet(`devices/${deviceId}`, {
        ...existing,
        lastSeen: Date.now(),
        online: true,
        adminId: adminId,
      });
      return res.status(200).json({ ok: true, token: existing.token, deviceId });
    }

    const token = crypto.randomBytes(32).toString('hex');

    await dbSet(`devices/${deviceId}`, {
      deviceId,
      model: model || 'Unknown',
      android: android || '',
      brand: brand || '',
      adminId,
      token,
      registeredAt: Date.now(),
      lastSeen: Date.now(),
      online: true,
    });

    return res.status(200).json({ ok: true, token, deviceId });
  } catch {
    return res.status(500).json({ error: 'server' });
  }
};