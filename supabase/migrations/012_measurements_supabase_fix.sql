-- =============================================================================
-- HOW TO RUN THIS (important)
-- Do NOT type or paste the file path (e.g. supabase/migrations/...) into the
-- SQL Editor — that is not SQL and will error with "syntax error at or near".
--
-- Instead: open THIS file in your code editor, select EVERYTHING (Ctrl+A),
-- copy (Ctrl+C), paste into Supabase Dashboard → SQL → New query, then Run.
-- =============================================================================
--
-- One-shot fix when the app reports: measurements table / schema cache (PGRST205).
-- Safe to run on projects that already have `clients` and other tables.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- FK target must exist
CREATE TABLE IF NOT EXISTS clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    date_of_birth DATE,
    gender TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
    skinfold_readings JSONB DEFAULT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE measurements ADD COLUMN IF NOT EXISTS hips_lower DECIMAL(10, 2);
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS thigh_lower DECIMAL(10, 2);
ALTER TABLE measurements ADD COLUMN IF NOT EXISTS skinfold_readings JSONB DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_measurements_client_id ON measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_measurements_date ON measurements(date);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_measurements_updated_at ON measurements;
CREATE TRIGGER update_measurements_updated_at
    BEFORE UPDATE ON measurements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on measurements" ON measurements;
CREATE POLICY "Allow all operations on measurements" ON measurements
    FOR ALL USING (true) WITH CHECK (true);

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.measurements TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';
