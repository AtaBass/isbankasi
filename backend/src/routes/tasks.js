const express = require('express');
const { pool } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Tüm aktif görevler
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM tasks WHERE is_active = true ORDER BY points_reward DESC'
    );
    const { rows: completed } = await pool.query(
      'SELECT task_id FROM task_completions WHERE user_id = $1',
      [req.user.id]
    );
    const completedIds = new Set(completed.map((c) => c.task_id));
    const tasksWithStatus = rows.map((t) => ({ ...t, completed: completedIds.has(t.id) }));
    res.json(tasksWithStatus);
  } catch (e) {
    next(e);
  }
});

// Görev tamamla → puan ver + streak güncelle
router.post('/:id/complete', async (req, res, next) => {
  try {
    const taskId = req.params.id;
    const { rows: task } = await pool.query(
      'SELECT id, points_reward FROM tasks WHERE id = $1 AND is_active = true',
      [taskId]
    );
    if (!task.length) return res.status(404).json({ error: 'Görev bulunamadı' });

    const { rows: already } = await pool.query(
      'SELECT id FROM task_completions WHERE user_id = $1 AND task_id = $2',
      [req.user.id, taskId]
    );
    if (already.length) return res.status(400).json({ error: 'Bu görev zaten tamamlandı' });

    const points = task[0].points_reward;
    const client = await pool.connect();
    try {
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
        [req.user.id, points]
      );
      await client.query(
        'INSERT INTO task_completions (user_id, task_id, points_earned) VALUES ($1, $2, $3)',
        [req.user.id, taskId, points]
      );
      const { rows: up } = await client.query(
        'SELECT total_points, current_streak_days FROM user_points WHERE user_id = $1',
        [req.user.id]
      );
      res.status(201).json({
        points_earned: points,
        total_points: up[0]?.total_points ?? 0,
        current_streak_days: up[0]?.current_streak_days ?? 1
      });
    } finally {
      client.release();
    }
  } catch (e) {
    next(e);
  }
});

module.exports = router;
