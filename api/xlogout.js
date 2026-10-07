module.exports = (req, res) => {
  res.setHeader('Set-Cookie', 'panel_token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict');
  res.status(200).json({ ok: true });
};