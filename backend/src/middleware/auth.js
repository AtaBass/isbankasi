const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkisiz' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    const { rows } = await pool.query('SELECT id, email, full_name, main_balance, avatar_url FROM users WHERE id = $1', [decoded.userId]);
    if (!rows.length) return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    req.user = rows[0];
    next();
  } catch {
    return res.status(401).json({ error: 'Geçersiz token' });
  }
}

module.exports = { authMiddleware };
