-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clients table
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

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT,
    equipment_tags TEXT[], -- Array of equipment tags (mapped from 'equipment' in app)
    muscle_groups TEXT[], -- Array of muscle groups
    instructions TEXT, -- Mapped from 'description' in app
    video_url TEXT, -- Video demonstration URL
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    date TEXT NOT NULL, -- Stored as string (YYYY-MM-DD format)
    time TEXT, -- Stored as string (HH:MM format)
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of exercise objects with sets
    is_group BOOLEAN DEFAULT FALSE,
    group_session_id TEXT, -- Shared ID for group sessions
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Measurements table
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
    thigh DECIMAL(10, 2),
    arm DECIMAL(10, 2),
    -- Skinfold measurements
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

-- Workout Templates table
CREATE TABLE IF NOT EXISTS workout_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    exercises JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of exercise objects
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_workouts_client_id ON workouts(client_id);
CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(date);
CREATE INDEX IF NOT EXISTS idx_workouts_group_session_id ON workouts(group_session_id);
CREATE INDEX IF NOT EXISTS idx_measurements_client_id ON measurements(client_id);
CREATE INDEX IF NOT EXISTS idx_measurements_date ON measurements(date);
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_clients_name ON clients(name);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to update updated_at automatically
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at BEFORE UPDATE ON exercises
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workouts_updated_at BEFORE UPDATE ON workouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_measurements_updated_at BEFORE UPDATE ON measurements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workout_templates_updated_at BEFORE UPDATE ON workout_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - you can customize these policies based on your auth needs
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (for now - you can restrict these later with authentication)
-- Note: These policies allow public access. You should restrict these when you add authentication.

CREATE POLICY "Allow all operations on clients" ON clients
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on exercises" ON exercises
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on workouts" ON workouts
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on measurements" ON measurements
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on workout_templates" ON workout_templates
    FOR ALL USING (true) WITH CHECK (true);
