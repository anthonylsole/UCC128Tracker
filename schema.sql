-- UCC128 Tracker database schema (D1 / SQLite)
-- Matches the live ucc128-tracker-db as of October 2026.
-- Safe to re-run: IF NOT EXISTS skips tables that already exist.
--   wrangler d1 execute ucc128-tracker-db --remote --file=schema.sql

-- One row per account / customer / template combination in the rollout.
-- Empty date fields inherit the date from that row's wave (see waves).
CREATE TABLE IF NOT EXISTS tracker_rows (
  id TEXT PRIMARY KEY,
  account TEXT,
  customer TEXT,
  wave TEXT,
  template TEXT,
  test_start TEXT,
  test_end TEXT,
  prod_start TEXT,
  prod_end TEXT,
  testing_required TEXT,
  test_resource TEXT,
  ops_reviewer TEXT,
  status TEXT DEFAULT 'Not Started',
  approval_scope TEXT DEFAULT 'This Combo Only',
  test_pos TEXT,
  notes TEXT,
  inventory_resource TEXT,
  co TEXT
);

-- Label field mappings between IntraOne and the source system.
CREATE TABLE IF NOT EXISTS label_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_name TEXT,
  intraone_mapping TEXT,
  source_mapping TEXT,
  sort_order INTEGER
);

-- Go-live dates for an entire customer wave.
CREATE TABLE IF NOT EXISTS waves (
  wave TEXT PRIMARY KEY,
  test_start TEXT,
  test_end TEXT,
  prod_start TEXT,
  prod_end TEXT,
  updated_at TEXT DEFAULT (datetime('now'))
);
