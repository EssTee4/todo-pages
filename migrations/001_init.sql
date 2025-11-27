CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE,
  password_hash TEXT,
  password_salt TEXT
);

CREATE TABLE todos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  task TEXT,
  completed INTEGER DEFAULT 0,
  status TEXT DEFAULT 'todo'
);
