CREATE TABLE tracker_rows (
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
  notes TEXT
);

CREATE TABLE label_mappings (
  field_name TEXT PRIMARY KEY,
  intraone_mapping TEXT,
  source_mapping TEXT,
  sort_order INTEGER
);
