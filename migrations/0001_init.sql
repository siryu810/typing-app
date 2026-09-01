-- Reply Day schema: problems and anonymous play results.
CREATE TABLE problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  partner_name TEXT NOT NULL,
  partner_key TEXT NOT NULL,
  incoming TEXT NOT NULL,
  reply_ja TEXT NOT NULL,
  reading TEXT NOT NULL
);

CREATE TABLE plays (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anonymous_id TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  salary INTEGER NOT NULL,
  wpm REAL NOT NULL,
  accuracy REAL NOT NULL,
  misses INTEGER NOT NULL,
  max_combo INTEGER NOT NULL,
  sent_count INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_problems_difficulty ON problems (difficulty);
CREATE INDEX idx_plays_anonymous ON plays (anonymous_id);
