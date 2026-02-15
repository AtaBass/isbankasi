const express = require('express');
const { pool } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Ödül listesi (herkese açık)
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, name, description, points_cost, type, image_url FROM rewards WHERE is_active = true ORDER BY points_cost'
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// Puanım ve kullanılabilir puan
router.get('/my-points', authMiddleware, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT total_points, spent_points, current_streak_days, last_activity_date FROM user_points WHERE user_id = $1',
      [req.user.id]
    );
    const up = rows[0];
    const available = (up?.total_points ?? 0) - (up?.spent_points ?? 0);
    res.json({
      total_points: up?.total_points ?? 0,
      spent_points: up?.spent_points ?? 0,
      available_points: available,
      current_streak_days: up?.current_streak_days ?? 0,
      last_activity_date: up?.last_activity_date
    });
  } catch (e) {
    next(e);
  }
});

// Ödül kullan (puan harca)
router.post('/redeem', authMiddleware, async (req, res, next) => {
  try {
    const { reward_id } = req.body;
    const { rows: reward } = await pool.query(
      'SELECT * FROM rewards WHERE id = $1 AND is_active = true',
      [reward_id]
    );
    if (!reward.length) return res.status(404).json({ error: 'Ödül bulunamadı' });

    const cost = reward[0].points_cost;
    const { rows: up } = await pool.query(
      'SELECT total_points, spent_points FROM user_points WHERE user_id = $1',
      [req.user.id]
    );
    const available = (up[0]?.total_points ?? 0) - (up[0]?.spent_points ?? 0);
    if (available < cost) return res.status(400).json({ error: 'Yetersiz puan' });

    await pool.query(
      'UPDATE user_points SET spent_points = spent_points + $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [cost, req.user.id]
    );
    const { rows: red } = await pool.query(
      `INSERT INTO reward_redemptions (user_id, reward_id, points_spent) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, reward_id, cost]
    );
    res.status(201).json(red[0]);
  } catch (e) {
    next(e);
  }
});

// Kullanıcının kullandığı ödüller
router.get('/my-redemptions', authMiddleware, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT rr.*, r.name AS reward_name, r.type AS reward_type FROM reward_redemptions rr
       JOIN rewards r ON r.id = rr.reward_id WHERE rr.user_id = $1 ORDER BY rr.redeemed_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
