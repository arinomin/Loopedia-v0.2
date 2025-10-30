import { exec } from 'child_process';
import { Pool } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('Applying database schema...');
  
  // データベース接続の確認
  try {
    console.log('Testing database connection...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const { rows } = await pool.query('SELECT 1 as result');
    console.log('Database connection successful:', rows[0].result);
    pool.end();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }

  // スキーマ定義を直接適用するSQLを生成
  const schema = fs.readFileSync(path.join(__dirname, 'shared/schema.ts'), 'utf8');
  
  // スキーマからテーブル名を抽出
  const tableNames = schema.match(/pgTable\("([^"]+)"/g)
    .map(match => match.replace('pgTable("', '').replace('"', ''));
  
  console.log('Found tables in schema:', tableNames);

  // カスタムSQLスクリプトを生成
  const sqlScript = `
-- テーブルの存在確認と作成
DO $$
BEGIN
  -- users テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      nickname TEXT,
      password TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      profile_text TEXT,
      country TEXT,
      birthday TIMESTAMP,
      show_birthday BOOLEAN DEFAULT FALSE,
      avatar_url TEXT,
      is_verified BOOLEAN DEFAULT FALSE
    );
    RAISE NOTICE 'Created users table';
  ELSE
    RAISE NOTICE 'users table already exists';
  END IF;

  -- presets テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'presets') THEN
    CREATE TABLE presets (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      type TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    RAISE NOTICE 'Created presets table';
  ELSE
    RAISE NOTICE 'presets table already exists';
  END IF;

  -- effects テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'effects') THEN
    CREATE TABLE effects (
      id SERIAL PRIMARY KEY,
      preset_id INTEGER NOT NULL REFERENCES presets(id),
      position TEXT NOT NULL,
      effect_type TEXT NOT NULL,
      sw BOOLEAN NOT NULL DEFAULT FALSE,
      sw_mode TEXT NOT NULL DEFAULT 'TOGGLE',
      insert TEXT NOT NULL DEFAULT 'ALL',
      parameters TEXT NOT NULL
    );
    RAISE NOTICE 'Created effects table';
  ELSE
    RAISE NOTICE 'effects table already exists';
  END IF;

  -- tags テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tags') THEN
    CREATE TABLE tags (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );
    RAISE NOTICE 'Created tags table';
  ELSE
    RAISE NOTICE 'tags table already exists';
  END IF;

  -- preset_tags テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'preset_tags') THEN
    CREATE TABLE preset_tags (
      preset_id INTEGER NOT NULL REFERENCES presets(id),
      tag_id INTEGER NOT NULL REFERENCES tags(id),
      PRIMARY KEY (preset_id, tag_id)
    );
    RAISE NOTICE 'Created preset_tags table';
  ELSE
    RAISE NOTICE 'preset_tags table already exists';
  END IF;

  -- comments テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
    CREATE TABLE comments (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      preset_id INTEGER NOT NULL REFERENCES presets(id),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    RAISE NOTICE 'Created comments table';
  ELSE
    RAISE NOTICE 'comments table already exists';
  END IF;

  -- likes テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'likes') THEN
    CREATE TABLE likes (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      preset_id INTEGER NOT NULL REFERENCES presets(id),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    RAISE NOTICE 'Created likes table';
  ELSE
    RAISE NOTICE 'likes table already exists';
  END IF;

  -- bookmarks テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bookmarks') THEN
    CREATE TABLE bookmarks (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      preset_id INTEGER NOT NULL REFERENCES presets(id),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    RAISE NOTICE 'Created bookmarks table';
  ELSE
    RAISE NOTICE 'bookmarks table already exists';
  END IF;

  -- user_loopers テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_loopers') THEN
    CREATE TABLE user_loopers (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      looper_name TEXT NOT NULL,
      display_order INTEGER NOT NULL
    );
    RAISE NOTICE 'Created user_loopers table';
  ELSE
    RAISE NOTICE 'user_loopers table already exists';
  END IF;

  -- user_settings テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_settings') THEN
    CREATE TABLE user_settings (
      user_id INTEGER PRIMARY KEY REFERENCES users(id),
      show_likes BOOLEAN DEFAULT TRUE NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    RAISE NOTICE 'Created user_settings table';
  ELSE
    RAISE NOTICE 'user_settings table already exists';
  END IF;

  -- user_follows テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_follows') THEN
    CREATE TABLE user_follows (
      id SERIAL PRIMARY KEY,
      follower_id INTEGER NOT NULL REFERENCES users(id),
      followed_id INTEGER NOT NULL REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW() NOT NULL,
      CONSTRAINT follower_followed_unique UNIQUE (follower_id, followed_id)
    );
    CREATE INDEX follower_followed_unique_idx ON user_follows (follower_id, followed_id);
    RAISE NOTICE 'Created user_follows table';
  ELSE
    RAISE NOTICE 'user_follows table already exists';
  END IF;

  -- contacts テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contacts') THEN
    CREATE TABLE contacts (
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
    RAISE NOTICE 'Created contacts table';
  ELSE
    RAISE NOTICE 'contacts table already exists';
  END IF;

  -- contact_replies テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contact_replies') THEN
    CREATE TABLE contact_replies (
      id SERIAL PRIMARY KEY,
      contact_id INTEGER NOT NULL REFERENCES contacts(id),
      reply TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    RAISE NOTICE 'Created contact_replies table';
  ELSE
    RAISE NOTICE 'contact_replies table already exists';
  END IF;

  -- notifications テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'notifications') THEN
    CREATE TABLE notifications (
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
    RAISE NOTICE 'Created notifications table';
  ELSE
    RAISE NOTICE 'notifications table already exists';
  END IF;

  -- titles テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'titles') THEN
    CREATE TABLE titles (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon_url TEXT,
      is_automatic BOOLEAN NOT NULL DEFAULT FALSE,
      condition TEXT,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    );
    RAISE NOTICE 'Created titles table';
  ELSE
    RAISE NOTICE 'titles table already exists';
  END IF;

  -- user_titles テーブル
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_titles') THEN
    CREATE TABLE user_titles (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title_id INTEGER NOT NULL REFERENCES titles(id) ON DELETE CASCADE,
      granted_at TIMESTAMP DEFAULT NOW() NOT NULL,
      CONSTRAINT user_title_unique UNIQUE (user_id, title_id)
    );
    CREATE INDEX user_title_unique ON user_titles (user_id, title_id);
    RAISE NOTICE 'Created user_titles table';
  ELSE
    RAISE NOTICE 'user_titles table already exists';
  END IF;

END $$;
  `;

  // SQLスクリプトを保存
  fs.writeFileSync(path.join(__dirname, 'schema.sql'), sqlScript);
  console.log('Generated SQL script saved to schema.sql');

  // SQLスクリプトを実行
  try {
    console.log('Executing SQL script...');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query(sqlScript);
    console.log('SQL script executed successfully');
    pool.end();
  } catch (err) {
    console.error('Error executing SQL script:', err.message);
    process.exit(1);
  }

  console.log('Schema application complete!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});