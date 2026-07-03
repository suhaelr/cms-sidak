-- Store kode dagri instead of local regions UUID

ALTER TABLE sppg_kitchens DROP CONSTRAINT IF EXISTS sppg_kitchens_region_id_fkey;
ALTER TABLE inspections DROP CONSTRAINT IF EXISTS inspections_region_id_fkey;
ALTER TABLE news DROP CONSTRAINT IF EXISTS news_region_id_fkey;
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_region_id_fkey;

UPDATE users SET region_id = NULL WHERE region_id IS NOT NULL;
UPDATE sppg_kitchens SET region_id = NULL WHERE region_id IS NOT NULL;
UPDATE inspections SET region_id = NULL WHERE region_id IS NOT NULL;
UPDATE news SET region_id = NULL WHERE region_id IS NOT NULL;
UPDATE complaints SET region_id = NULL WHERE region_id IS NOT NULL;

ALTER TABLE users ALTER COLUMN region_id TYPE TEXT USING region_id::text;
ALTER TABLE sppg_kitchens ALTER COLUMN region_id TYPE TEXT USING region_id::text;
ALTER TABLE inspections ALTER COLUMN region_id TYPE TEXT USING region_id::text;
ALTER TABLE news ALTER COLUMN region_id TYPE TEXT USING region_id::text;
ALTER TABLE complaints ALTER COLUMN region_id TYPE TEXT USING region_id::text;
