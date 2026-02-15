-- İş Bankası Genç Mobil Bankacılık - PostgreSQL Şeması
-- Lacivert (#003399) temalı FinTech uygulaması

-- Kullanıcılar
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url TEXT,
  main_balance DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hedefler (Goals) - Birikim / Yatırım hesapları
CREATE TABLE IF NOT EXISTS goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'savings' | 'investment' | 'donation'
  target_amount DECIMAL(15, 2),
  current_amount DECIMAL(15, 2) DEFAULT 0,
  icon VARCHAR(50),
  color VARCHAR(7),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Otomatik Dağıtım Kuralları (Automatic Splitter)
CREATE TABLE IF NOT EXISTS automatic_splits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  percentage DECIMAL(5, 2) NOT NULL CHECK (percentage >= 0 AND percentage <= 100),
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, goal_id)
);

-- STK'lar (Round-Up bağış hedefleri) - round_up_rules'tan önce
CREATE TABLE IF NOT EXISTS ngos (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Round-Up Kuralları (Yuvarlama → yatırım/STK)
CREATE TABLE IF NOT EXISTS round_up_rules (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  round_to VARCHAR(20) NOT NULL DEFAULT 'nearest', -- 'nearest' (1 TL), '5', '10', 'custom'
  custom_multiple DECIMAL(10, 2),
  destination_type VARCHAR(50) NOT NULL, -- 'goal' | 'ngo'
  goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
  ngo_id INTEGER REFERENCES ngos(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sosyal Gruplar (Ortak Kumbara, borç takibi)
CREATE TABLE IF NOT EXISTS social_groups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'piggy_bank' | 'expense_group'
  created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_amount DECIMAL(15, 2),
  current_amount DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grup üyelikleri
CREATE TABLE IF NOT EXISTS group_members (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES social_groups(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member', -- 'admin' | 'member'
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_id, user_id)
);

-- Finansal Challenge'lar
CREATE TABLE IF NOT EXISTS challenges (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'spending_limit' | 'savings_target'
  target_value DECIMAL(15, 2),
  current_value DECIMAL(15, 2) DEFAULT 0,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active' | 'completed' | 'failed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grup harcamaları (Splitwise mantığı)
CREATE TABLE IF NOT EXISTS group_expenses (
  id SERIAL PRIMARY KEY,
  group_id INTEGER NOT NULL REFERENCES social_groups(id) ON DELETE CASCADE,
  paid_by_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  description VARCHAR(500),
  split_type VARCHAR(20) DEFAULT 'equal', -- 'equal' | 'custom'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Borç dağılımı (kim kime ne kadar borçlu)
CREATE TABLE IF NOT EXISTS debt_splits (
  id SERIAL PRIMARY KEY,
  expense_id INTEGER NOT NULL REFERENCES group_expenses(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(15, 2) NOT NULL,
  is_settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMP
);

-- İşlemler (Transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'income' | 'expense' | 'transfer' | 'round_up' | 'split'
  amount DECIMAL(15, 2) NOT NULL,
  balance_after DECIMAL(15, 2),
  category VARCHAR(100),
  description VARCHAR(500),
  goal_id INTEGER REFERENCES goals(id) ON DELETE SET NULL,
  round_up_amount DECIMAL(15, 2),
  source VARCHAR(50), -- 'manual' | 'automatic_split' | 'round_up' | 'challenge'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);

-- Reels (Finansal okuryazarlık videoları)
CREATE TABLE IF NOT EXISTS reels (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  points_reward INTEGER DEFAULT 10,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İzleme kayıtları (puan verilecek)
CREATE TABLE IF NOT EXISTS reel_views (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reel_id INTEGER NOT NULL REFERENCES reels(id) ON DELETE CASCADE,
  watched_seconds INTEGER,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, reel_id)
);

-- Görevler (Tasks) - daha yüksek puan
CREATE TABLE IF NOT EXISTS tasks (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  points_reward INTEGER NOT NULL,
  type VARCHAR(50), -- 'one_time' | 'daily' | 'weekly'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kullanıcı görev tamamlama
CREATE TABLE IF NOT EXISTS task_completions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  points_earned INTEGER NOT NULL
);

-- Puan ve Streak
CREATE TABLE IF NOT EXISTS user_points (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  spent_points INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ödüller (Rewards)
CREATE TABLE IF NOT EXISTS rewards (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  type VARCHAR(50), -- 'cashback' | 'cinema' | 'concert' | 'voucher'
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Kullanıcı ödül kullanımı
CREATE TABLE IF NOT EXISTS reward_redemptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_id INTEGER NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending' -- 'pending' | 'claimed'
);

-- AI Buddy - analiz önbelleği
CREATE TABLE IF NOT EXISTS ai_insights (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  insight_type VARCHAR(50), -- 'spending_alert' | 'savings_tip' | 'trend'
  message TEXT NOT NULL,
  data JSONB, -- grafik/istatistik verisi
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_transactions_user_created ON transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_challenges_users ON challenges(from_user_id, to_user_id);
CREATE INDEX IF NOT EXISTS idx_debt_splits_user ON debt_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_user ON ai_insights(user_id, created_at DESC);
