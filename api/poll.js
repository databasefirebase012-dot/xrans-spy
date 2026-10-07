const { dbGet, dbUpdate } = require('./fb');   // ← './fb'

module.exports = async (req, res) => {
  const { deviceId, token } = req.query || {};
  if (!deviceId || !token) return res.status(400).json({ error: 'missing' });

  try {
    const dev = await dbGet(`devices/${deviceId}`);
    if (!dev) return res.status(404).json({ error: 'not_registered' });
    if (dev.token !== token) return res.status(403).json({ error: 'forbidden' });

    await dbUpdate(`devices/${deviceId}`, { lastSeen: Date.now(), online: true });

    const commands = await dbGet(`devices/${deviceId}/commands`);
    if (!commands) return res.status(200).json({ command: null });

    const pending = Object.entries(commands).find(([_, c]) => c.status === 'pending');
    if (!pending) return res.status(200).json({ command: null });

    const [cmdId, cmd] = pending;
    await dbUpdate(`devices/${deviceId}/commands/${cmdId}`, {
      status: 'sent',
      sentAt: Date.now(),
    });

    return res.status(200).json({
      command: { id: cmdId, action: cmd.action, args: cmd.args || {} },
    });
  } catch {
    return res.status(500).json({ error: 'server' });
  }
};