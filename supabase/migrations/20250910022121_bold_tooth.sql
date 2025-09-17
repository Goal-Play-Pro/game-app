/*
  # Create system tables

  1. New Tables
    - `challenges`
      - `id` (uuid, primary key)
      - `nonce` (text, unique)
      - `address` (text)
      - `chain_type` (text)
      - `message` (text)
      - `expires_at` (timestamptz)
      - `used` (boolean, default false)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `idempotency_keys`
      - `id` (uuid, primary key)
      - `key` (text, unique)
      - `user_id` (uuid, foreign key to users)
      - `response` (jsonb)
      - `expires_at` (timestamptz)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `audit_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `action` (text)
      - `resource_type` (text)
      - `resource_id` (text)
      - `old_values` (jsonb)
      - `new_values` (jsonb)
      - `ip_address` (text)
      - `user_agent` (text)
      - `correlation_id` (text)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies

  3. Constraints
    - Foreign key relationships
    - Check constraints for valid values
*/

-- Challenges table (for authentication)
CREATE TABLE IF NOT EXISTS challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce text UNIQUE NOT NULL,
  address text NOT NULL,
  chain_type text NOT NULL DEFAULT 'ethereum',
  message text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT challenges_chain_type_check CHECK (chain_type IN ('ethereum', 'polygon', 'bsc', 'arbitrum', 'solana')),
  CONSTRAINT challenges_expires_check CHECK (expires_at > created_at)
);

-- Idempotency keys table
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  response jsonb NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT idempotency_keys_expires_check CHECK (expires_at > created_at)
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  correlation_id text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_challenges_nonce ON challenges(nonce);
CREATE INDEX IF NOT EXISTS idx_challenges_address ON challenges(address);
CREATE INDEX IF NOT EXISTS idx_challenges_expires_at ON challenges(expires_at);
CREATE INDEX IF NOT EXISTS idx_challenges_used ON challenges(used);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_key ON idempotency_keys(key);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_user_id ON idempotency_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_idempotency_keys_expires_at ON idempotency_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_id ON audit_logs(resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation_id ON audit_logs(correlation_id);

-- Enable RLS
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies for challenges (public access for authentication)
CREATE POLICY "Anyone can read unexpired challenges"
  ON challenges
  FOR SELECT
  TO anon, authenticated
  USING (expires_at > now() AND used = false);

CREATE POLICY "Anyone can create challenges"
  ON challenges
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (expires_at > now());

CREATE POLICY "Anyone can update challenges"
  ON challenges
  FOR UPDATE
  TO anon, authenticated
  USING (expires_at > now());

-- Policies for idempotency_keys
CREATE POLICY "Users can read own idempotency keys"
  ON idempotency_keys
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create idempotency keys"
  ON idempotency_keys
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Policies for audit_logs
CREATE POLICY "Users can read own audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create audit logs"
  ON audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Triggers
CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_idempotency_keys_updated_at
  BEFORE UPDATE ON idempotency_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Cleanup function for expired records
CREATE OR REPLACE FUNCTION cleanup_expired_records()
RETURNS void AS $$
BEGIN
  -- Clean up expired challenges
  DELETE FROM challenges WHERE expires_at < now() - interval '1 hour';
  
  -- Clean up expired idempotency keys
  DELETE FROM idempotency_keys WHERE expires_at < now();
  
  -- Clean up old audit logs (keep 90 days)
  DELETE FROM audit_logs WHERE created_at < now() - interval '90 days';
END;
$$ LANGUAGE plpgsql;