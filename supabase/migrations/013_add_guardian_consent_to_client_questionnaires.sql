ALTER TABLE client_questionnaires
  ADD COLUMN IF NOT EXISTS guardian_name TEXT,
  ADD COLUMN IF NOT EXISTS guardian_relationship TEXT,
  ADD COLUMN IF NOT EXISTS guardian_email TEXT,
  ADD COLUMN IF NOT EXISTS guardian_phone TEXT,
  ADD COLUMN IF NOT EXISTS guardian_consent_accepted BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN client_questionnaires.guardian_name IS 'Parent/legal guardian full name, required when the applicant is a minor.';
COMMENT ON COLUMN client_questionnaires.guardian_relationship IS 'Parent/legal guardian relationship to the applicant.';
COMMENT ON COLUMN client_questionnaires.guardian_email IS 'Parent/legal guardian email address.';
COMMENT ON COLUMN client_questionnaires.guardian_phone IS 'Parent/legal guardian phone number.';
COMMENT ON COLUMN client_questionnaires.guardian_consent_accepted IS 'Whether the parent/legal guardian accepted the consent agreement.';
