-- Fix overflow for Indonesian village legacy IDs (e.g. 2171010001)
-- Existing integer type cannot store values > 2,147,483,647.
ALTER TABLE public.regions
ALTER COLUMN legacy_id TYPE bigint
USING legacy_id::bigint;