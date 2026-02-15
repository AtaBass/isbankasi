const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const { email, password, full_name, phone } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, şifre ve ad soyad gerekli' });
    }
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone) VALUES ($1, $2, $3, $4)
       RETURNING id, email, full_name, main_balance, created_at`,
      [email, hash, full_name, phone || null]
    );
    const user = rows[0];
    await pool.query(
      'INSERT INTO user_points (user_id) VALUES ($1)',
      [user.id]
    );
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );
    res.status(201).json({ user: { id: user.id, email: user.email, full_name: user.full_name, main_balance: user.main_balance }, token });
  } catch (e) {
    if (e.code === '23505') return res.status(400).json({ error: 'Bu email zaten kayıtlı' });
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { rows } = await pool.query(
      'SELECT id, email, password_hash, full_name, main_balance, avatar_url FROM users WHERE email = $1',
      [email]
    );
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ error: 'Email veya şifre hatalı' });
    }
    const user = rows[0];
    delete user.password_hash;
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );
    res.json({ user: { id: user.id, email: user.email, full_name: user.full_name, main_balance: user.main_balance, avatar_url: user.avatar_url }, token });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
