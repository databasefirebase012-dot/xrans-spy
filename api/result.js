const { dbGet, dbUpdate, dbPush } = require('./fb');   // ← './fb'

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });

  const { deviceId, token, commandId, output, success } = req.body || {};
  if (!deviceId || !token || !commandId) return res.status(400).json({ error: 'missing' });

  try {
    const dev = await dbGet(`devices/${deviceId}`);
    if (!dev || dev.token !== token) return res.status(403).json({ error: 'forbidden' });

    await dbUpdate(`devices/${deviceId}/commands/${commandId}`, {
      status: success ? 'done' : 'failed',
      output: output || '',
      finishedAt: Date.now(),
    });

    await dbPush(`devices/${deviceId}/logs`, {
      commandId,
      output: output || '',
      success: !!success,
      at: Date.now(),
    });

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'server' });
  }
};