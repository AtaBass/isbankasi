const express = require('express');
const { pool } = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Basit kurallara dayalı “AI” insight (gerçek model entegrasyonu yok; örnek mantık)
function generateInsights(transactions, goals) {
  const insights = [];
  const byCategory = {};
  let totalExpense = 0;
  const now = new Date();
  const thisMonth = transactions.filter((t) => {
    const d = new Date(t.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() && t.amount < 0;
  });
  thisMonth.forEach((t) => {
    totalExpense += Math.abs(Number(t.amount));
    const cat = t.category || 'Diğer';
    byCategory[cat] = (byCategory[cat] || 0) + Math.abs(Number(t.amount));
  });
  const lastMonth = transactions.filter((t) => {
    const d = new Date(t.created_at);
    const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return d.getMonth() === lm && d.getFullYear() === ly && t.amount < 0;
  });
  let lastMonthTotal = 0;
  const lastMonthByCat = {};
  lastMonth.forEach((t) => {
    lastMonthTotal += Math.abs(Number(t.amount));
    const cat = t.category || 'Diğer';
    lastMonthByCat[cat] = (lastMonthByCat[cat] || 0) + Math.abs(Number(t.amount));
  });

  Object.keys(byCategory).forEach((cat) => {
    const thisVal = byCategory[cat];
    const lastVal = lastMonthByCat[cat] || 0;
    if (lastVal > 0 && thisVal > lastVal * 1.2) {
      const pct = Math.round(((thisVal - lastVal) / lastVal) * 100);
      insights.push({
        insight_type: 'spending_alert',
        message: `Bu ay "${cat}" harcamanız geçen aya göre %${pct} arttı.`,
        data: { category: cat, thisMonth: thisVal, lastMonth: lastVal }
      });
    }
  });

  if (goals.length > 0 && totalExpense > 0) {
    insights.push({
      insight_type: 'savings_tip',
      message: 'Hedeflerinize otomatik dağıtım açarak gelirlerinizin bir kısmını birikime yönlendirebilirsiniz.',
      data: { goalsCount: goals.length }
    });
  }

  if (insights.length === 0) {
    insights.push({
      insight_type: 'savings_tip',
      message: 'Harcamalarınızı kategorilere ayırarak takip edin; bütçenizi daha iyi yönetirsiniz.',
      data: {}
    });
  }

  return insights;
}

// Son insight'ları getir veya yeniden hesapla
router.get('/insights', async (req, res, next) => {
  try {
    const [txRes, goalsRes] = await Promise.all([
      pool.query(
        'SELECT * FROM transactions WHERE user_id = $1 AND created_at >= $2 ORDER BY created_at DESC',
        [req.user.id, new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)]
      ),
      pool.query('SELECT * FROM goals WHERE user_id = $1 AND is_active = true', [req.user.id])
    ]);
    const insights = generateInsights(txRes.rows, goalsRes.rows);

    // Önbelleğe yaz (son 5)
    await pool.query(
      'DELETE FROM ai_insights WHERE user_id = $1',
      [req.user.id]
    );
    for (let i = 0; i < Math.min(5, insights.length); i++) {
      const inq = insights[i];
      await pool.query(
        'INSERT INTO ai_insights (user_id, insight_type, message, data) VALUES ($1, $2, $3, $4)',
        [req.user.id, inq.insight_type, inq.message, JSON.stringify(inq.data || {})]
      );
    }

    const { rows: saved } = await pool.query(
      'SELECT * FROM ai_insights WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(saved);
  } catch (e) {
    next(e);
  }
});

// Günün tek tavsiyesi (dashboard için)
router.get('/daily-tip', async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM ai_insights WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [req.user.id]
    );
    if (rows.length) return res.json(rows[0]);
    const [txRes, goalsRes] = await Promise.all([
      pool.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [req.user.id]),
      pool.query('SELECT * FROM goals WHERE user_id = $1 AND is_active = true', [req.user.id])
    ]);
    const insights = generateInsights(txRes.rows, goalsRes.rows);
    res.json(insights[0] || { message: 'Harcamalarınızı kaydederek AI danışmanından daha iyi öneriler alın.', insight_type: 'savings_tip' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
