ALTER TABLE measurements
  ADD COLUMN IF NOT EXISTS thigh_lower DECIMAL(10, 2);

COMMENT ON COLUMN measurements.thigh IS 'Thigh (Upper) girth measurement.';
COMMENT ON COLUMN measurements.thigh_lower IS 'Thigh (Lower) girth measurement.';
