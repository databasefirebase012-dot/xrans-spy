const { dbGet, dbPush, auth } = require('./fb');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const session = auth(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });

  const { deviceId, action, args } = req.body || {};
  if (!deviceId || !action) return res.status(400).json({ error: 'missing' });

  try {
    const dev = await dbGet(`devices/${deviceId}`);
    if (!dev) return res.status(404).json({ error: 'not_found' });
    if (dev.adminId !== session.username) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const result = await dbPush(`devices/${deviceId}/commands`, {
      action,
      args: args || {},
      status: 'pending',
      createdAt: Date.now(),
    });

    return res.status(200).json({ ok: true, commandId: result.name });
  } catch {
    return res.status(500).json({ error: 'server' });
  }
};