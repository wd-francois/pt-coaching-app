ALTER TABLE measurements
  ADD COLUMN IF NOT EXISTS hips_lower DECIMAL(10, 2);

COMMENT ON COLUMN measurements.hips IS 'Hips (Upper) girth measurement.';
COMMENT ON COLUMN measurements.hips_lower IS 'Hips (Lower) girth measurement.';
