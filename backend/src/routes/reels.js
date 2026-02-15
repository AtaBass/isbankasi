const express = require('express');
const { pool } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Liste (auth olmadan da reels listelenebilir; puan için auth gerekir)
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, title, description, video_url, thumbnail_url, duration_seconds, points_reward, category FROM reels WHERE is_active = true ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// İzleme kaydet ve puan ver + streak güncelle
router.post('/:id/watch', authMiddleware, async (req, res, next) => {
  try {
    const reelId = req.params.id;
    const { watched_seconds } = req.body;
    const { rows: reel } = await pool.query(
      'SELECT id, points_reward, duration_seconds FROM reels WHERE id = $1 AND is_active = true',
      [reelId]
    );
    if (!reel.length) return res.status(404).json({ error: 'Video bulunamadı' });

    const client = await pool.connect();
    try {
      const { rows: existing } = await client.query(
        'SELECT id, points_earned FROM reel_views WHERE user_id = $1 AND reel_id = $2',
        [req.user.id, reelId]
      );
      const pointsToAdd = existing.length ? 0 : reel[0].points_reward; // bir kez puan

      if (pointsToAdd > 0) {
        await client.query(
          `INSERT INTO user_points (user_id, total_points, current_streak_days, last_activity_date, updated_at)
           VALUES ($1, $2, 1, CURRENT_DATE, CURRENT_TIMESTAMP)
           ON CONFLICT (user_id) DO UPDATE SET
             total_points = user_points.total_points + $2,
             current_streak_days = CASE
               WHEN user_points.last_activity_date = CURRENT_DATE - INTERVAL '1 day' THEN user_points.current_streak_days + 1
               WHEN user_points.last_activity_date = CURRENT_DATE THEN user_points.current_streak_days
               ELSE 1
             END,
             last_activity_date = CURRENT_DATE,
             updated_at = CURRENT_TIMESTAMP`,
          [req.user.id, pointsToAdd]
        );
      }

      await client.query(
        `INSERT INTO reel_views (user_id, reel_id, watched_seconds, points_earned) VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, reel_id) DO UPDATE SET watched_seconds = GREATEST(reel_views.watched_seconds, $3)`,
        [req.user.id, reelId, watched_seconds || reel[0].duration_seconds || 0, pointsToAdd]
      );

      const { rows: up } = await client.query(
        'SELECT total_points, current_streak_days, last_activity_date FROM user_points WHERE user_id = $1',
        [req.user.id]
      );
      res.json({
        points_earned: pointsToAdd,
        total_points: up[0]?.total_points ?? 0,
        current_streak_days: up[0]?.current_streak_days ?? 1,
        last_activity_date: up[0]?.last_activity_date
      });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

// Kullanıcının izlediği reels (hangi videolar puanlı tamamlanmış)
router.get('/my-views', authMiddleware, async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT reel_id, points_earned, created_at FROM reel_views WHERE user_id = $1',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
