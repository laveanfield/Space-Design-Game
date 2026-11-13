-- Schema SQLite cho du lieu do NGUOI CHOI sinh ra. Catalog van la JSON (khong nam o day).
CREATE TABLE IF NOT EXISTS players  (id TEXT PRIMARY KEY, name TEXT NOT NULL, xp INTEGER NOT NULL DEFAULT 0, created_at REAL NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, mission_id TEXT NOT NULL, log_json TEXT NOT NULL, created_at REAL NOT NULL);
CREATE TABLE IF NOT EXISTS rooms    (id TEXT PRIMARY KEY, mission_id TEXT NOT NULL, status TEXT NOT NULL, state_json TEXT NOT NULL, updated_at REAL NOT NULL);
CREATE TABLE IF NOT EXISTS scores (
  id TEXT PRIMARY KEY, mission_id TEXT NOT NULL, player_id TEXT NOT NULL, team_id TEXT, display_name TEXT NOT NULL,
  mode TEXT NOT NULL, members INTEGER NOT NULL, score_total REAL NOT NULL, grade TEXT NOT NULL, time_s REAL NOT NULL,
  science_pts REAL NOT NULL, cost_musd REAL NOT NULL, design_ok INTEGER NOT NULL, achievements_json TEXT NOT NULL,
  session_id TEXT, session_hash TEXT, verified INTEGER NOT NULL, created_at REAL NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_scores_board ON scores (mission_id, verified, score_total DESC, time_s ASC);
CREATE INDEX IF NOT EXISTS idx_scores_player ON scores (player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_rooms_open ON rooms (mission_id, status);
