-- ================================
-- RESET TABLES (SAFE FOR DEV ONLY)
-- Remove if you do NOT want auto-drop
-- ================================
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS sessions;

-- ================================
-- USERS TABLE
-- Matches your login.js + register.js
-- ================================
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- Optional: sample user for testing (password: testpass)
-- INSERT INTO users (username, password) VALUES ('test', 'testpass');

-- ================================
-- SESSIONS TABLE
-- ================================
CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ================================
-- CLEANUP OLD SESSIONS (optional)
-- ================================
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
