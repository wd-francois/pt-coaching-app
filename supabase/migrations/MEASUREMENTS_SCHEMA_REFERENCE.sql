-- Measurements table - full schema reference (all changes applied)
-- Use this as reference. To create from scratch, ensure 001_initial_schema ran first, then 008, 009, 010.

CREATE TABLE IF NOT EXISTS measurements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    date TIMESTAMPTZ NOT NULL,
    weight DECIMAL(10, 2),
    neck DECIMAL(10, 2),
    shoulders DECIMAL(10, 2),
    chest DECIMAL(10, 2),
    waist DECIMAL(10, 2),
    hips DECIMAL(10, 2),
    hips_lower DECIMAL(10, 2),
    thigh DECIMAL(10, 2),
    thigh_lower DECIMAL(10, 2),
    arm DECIMAL(10, 2),
    chest_skinfold DECIMAL(10, 2),
    abdominal_skinfold DECIMAL(10, 2),
    thigh_skinfold DECIMAL(10, 2),
    tricep_skinfold DECIMAL(10, 2),
    subscapular_skinfold DECIMAL(10, 2),
    suprailiac_skinfold DECIMAL(10, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_measurements_client_id ON measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_measurements_date ON measurements(date);

COMMENT ON TABLE measurements IS 'Client body measurements with date/time, girth, and skinfolds.';
COMMENT ON COLUMN measurements.date IS 'Date and time of the measurement (TIMESTAMPTZ).';
COMMENT ON COLUMN measurements.hips IS 'Hips girth measurement (single).';
COMMENT ON COLUMN measurements.hips_lower IS 'Hips (Lower) - optional column, app uses single hips.';
COMMENT ON COLUMN measurements.thigh IS 'Thigh (Upper) girth measurement.';
COMMENT ON COLUMN measurements.thigh_lower IS 'Thigh (Lower) girth measurement.';
COMMENT ON COLUMN measurements.notes IS 'Session or measurement notes.';
