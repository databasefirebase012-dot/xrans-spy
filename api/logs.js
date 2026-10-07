const { dbGet, auth } = require('./fb');

module.exports = async (req, res) => {
  const session = auth(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });

  const { deviceId } = req.query || {};
  if (!deviceId) return res.status(400).json({ error: 'missing' });

  try {
    const dev = await dbGet(`devices/${deviceId}`);
    if (!dev) return res.status(404).json({ error: 'not_found' });
    if (dev.adminId !== session.username) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const logs = await dbGet(`devices/${deviceId}/logs`);
    if (!logs) return res.status(200).json({ logs: [] });

    const list = Object.values(logs).sort((a, b) => b.at - a.at).slice(0, 50);
    return res.status(200).json({ logs: list });
  } catch {
    return res.status(500).json({ error: 'server' });
  }
};