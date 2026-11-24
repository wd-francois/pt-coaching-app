ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN clients.is_active IS 'Whether the client is currently active. Inactive clients are hidden from scheduling but keep their history.';
