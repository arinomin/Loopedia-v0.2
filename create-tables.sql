-- プリセット関連のテーブルを作成

-- presets テーブル
CREATE TABLE IF NOT EXISTS presets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- effects テーブル
CREATE TABLE IF NOT EXISTS effects (
  id SERIAL PRIMARY KEY,
  preset_id INTEGER NOT NULL REFERENCES presets(id),
  position TEXT NOT NULL,
  effect_type TEXT NOT NULL,
  sw BOOLEAN NOT NULL DEFAULT FALSE,
  sw_mode TEXT NOT NULL DEFAULT 'TOGGLE',
  insert TEXT NOT NULL DEFAULT 'ALL',
  parameters TEXT NOT NULL
);

-- tags テーブル
CREATE TABLE IF NOT EXISTS tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

-- preset_tags テーブル
CREATE TABLE IF NOT EXISTS preset_tags (
  preset_id INTEGER NOT NULL REFERENCES presets(id),
  tag_id INTEGER NOT NULL REFERENCES tags(id),
  PRIMARY KEY (preset_id, tag_id)
);

-- comments テーブル
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  preset_id INTEGER NOT NULL REFERENCES presets(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- likes テーブル
CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  preset_id INTEGER NOT NULL REFERENCES presets(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- bookmarks テーブル
CREATE TABLE IF NOT EXISTS bookmarks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  preset_id INTEGER NOT NULL REFERENCES presets(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- user_loopers テーブル
CREATE TABLE IF NOT EXISTS user_loopers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  looper_name TEXT NOT NULL,
  display_order INTEGER NOT NULL
);

-- user_settings テーブル
CREATE TABLE IF NOT EXISTS user_settings (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  show_likes BOOLEAN DEFAULT TRUE NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- user_follows テーブル
CREATE TABLE IF NOT EXISTS user_follows (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id),
  followed_id INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT follower_followed_unique UNIQUE (follower_id, followed_id)
);

-- notifications テーブル
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

-- contacts テーブル
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

-- contact_replies テーブル
CREATE TABLE IF NOT EXISTS contact_replies (
  id SERIAL PRIMARY KEY,
  contact_id INTEGER NOT NULL REFERENCES contacts(id),
  reply TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- titles テーブル
CREATE TABLE IF NOT EXISTS titles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon_url TEXT,
  is_automatic BOOLEAN NOT NULL DEFAULT FALSE,
  condition TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- user_titles テーブル
CREATE TABLE IF NOT EXISTS user_titles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
  granted_at TIMESTAMP DEFAULT NOW() NOT NULL,
  CONSTRAINT user_title_unique UNIQUE (user_id, title_id)
);