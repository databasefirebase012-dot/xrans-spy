const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const DB_URL = process.env.FIREBASE_DATABASE_URL;
const DB_SECRET = process.env.FIREBASE_DB_SECRET;

async function dbGet(path) {
  const url = `${DB_URL}/${path}.json?auth=${DB_SECRET}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('db_get_failed');
  return r.json();
}

async function dbSet(path, value) {
  const url = `${DB_URL}/${path}.json?auth=${DB_SECRET}`;
  const r = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (!r.ok) throw new Error('db_set_failed');
  return r.json();
}

async function dbUpdate(path, value) {
  const url = `${DB_URL}/${path}.json?auth=${DB_SECRET}`;
  const r = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (!r.ok) throw new Error('db_update_failed');
  return r.json();
}

async function dbPush(path, value) {
  const url = `${DB_URL}/${path}.json?auth=${DB_SECRET}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value),
  });
  if (!r.ok) throw new Error('db_push_failed');
  return r.json();
}

function auth(req) {
  const cookie = req.headers.cookie || '';
  const m = cookie.match(/panel_token=([^;]+)/);
  if (!m) return null;
  try { return jwt.verify(m[1], process.env.JWT_SECRET); }
  catch { return null; }
}

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(salt + ':' + password).digest('hex');
}

module.exports = {
  dbGet, dbSet, dbUpdate, dbPush,
  auth, hashPassword, jwt, crypto
};