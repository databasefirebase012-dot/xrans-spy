const { dbGet, auth } = require('./fb');

module.exports = async (req, res) => {
  const session = auth(req);
  if (!session) return res.status(401).json({ error: 'unauthorized' });

  try {
    const devices = await dbGet('devices');
    if (!devices) return res.status(200).json({ devices: [] });

    const list = Object.entries(devices)
      .filter(([_, v]) => v.adminId === session.username)
      .map(([id, v]) => ({
        deviceId: id,
        model: v.model,
        android: v.android,
        brand: v.brand,
        online: !!v.online,
        lastSeen: v.lastSeen,
        registeredAt: v.registeredAt,
      }));

    return res.status(200).json({ devices: list });
  } catch {
    return res.status(500).json({ error: 'server' });
  }
};