-- Store up to three skinfold readings per site (JSONB).
-- Legacy single columns remain; app may sync average or first reading for compatibility.

ALTER TABLE measurements
  ADD COLUMN IF NOT EXISTS skinfold_readings JSONB DEFAULT NULL;

COMMENT ON COLUMN measurements.skinfold_readings IS $$Per-site arrays of up to three readings in mm, e.g. {"chest":[12.1,12.2,12.0],"abdominal":[...]}.$$
