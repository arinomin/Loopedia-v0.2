-- contacts テーブルを先に作成
CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name TEXT NOT NULL,
  contact_method TEXT,
  contact_detail TEXT,
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- notificationsテーブルを再作成
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  actor_id INTEGER REFERENCES users(id),
  type TEXT NOT NULL,
  preset_id INTEGER REFERENCES presets(id),
  comment_id INTEGER REFERENCES comments(id),
  contact_id INTEGER REFERENCES contacts(id),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- contact_replies テーブル
CREATE TABLE IF NOT EXISTS contact_replies (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL REFERENCES contacts(id),
  reply TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);