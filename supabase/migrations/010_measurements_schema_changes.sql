-- Measurements table: apply all schema changes (idempotent)
-- Run after 001_initial_schema.sql. 008 and 009 may have already added hips_lower and thigh_lower.

ALTER TABLE measurements
  ADD COLUMN IF NOT EXISTS hips_lower DECIMAL(10, 2);

ALTER TABLE measurements
  ADD COLUMN IF NOT EXISTS thigh_lower DECIMAL(10, 2);

COMMENT ON COLUMN measurements.date IS $$Date and time of the measurement (TIMESTAMPTZ).$$;
COMMENT ON COLUMN measurements.hips IS $$Hips girth measurement.$$;
COMMENT ON COLUMN measurements.hips_lower IS $$Hips Lower - optional.$$;
COMMENT ON COLUMN measurements.thigh IS $$Thigh Upper girth measurement.$$;
COMMENT ON COLUMN measurements.thigh_lower IS $$Thigh Lower girth measurement.$$;
COMMENT ON COLUMN measurements.notes IS $$Session or measurement notes.$$;
