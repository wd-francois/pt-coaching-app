-- Client Questionnaires table for signup/pre-screening forms
CREATE TABLE IF NOT EXISTS client_questionnaires (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Personal Information
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT,
    email TEXT NOT NULL,
    
    -- Medical Conditions (stored as JSONB)
    medical_conditions JSONB DEFAULT '{}'::jsonb,
    medical_details TEXT,
    
    -- Fitness Information
    fitness_level INTEGER,
    current_activities TEXT,
    exercise_history TEXT,
    trainer_experience TEXT,
    
    -- Goals
    goals TEXT,
    timeframe TEXT,
    importance INTEGER,
    
    -- Agreement
    agreement_accepted BOOLEAN DEFAULT FALSE,
    
    -- Metadata
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_client_questionnaires_email ON client_questionnaires(email);
CREATE INDEX IF NOT EXISTS idx_client_questionnaires_submitted_at ON client_questionnaires(submitted_at);
CREATE INDEX IF NOT EXISTS idx_client_questionnaires_created_at ON client_questionnaires(created_at);

-- Add trigger to update updated_at automatically
CREATE TRIGGER update_client_questionnaires_updated_at BEFORE UPDATE ON client_questionnaires
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE client_questionnaires ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (for now - you can restrict these later with authentication)
CREATE POLICY "Allow all operations on client_questionnaires" ON client_questionnaires
    FOR ALL USING (true) WITH CHECK (true);
