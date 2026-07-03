
ALTER TABLE regions ADD COLUMN IF NOT EXISTS legacy_id integer;
CREATE INDEX IF NOT EXISTS idx_regions_legacy ON regions(legacy_id, type);
