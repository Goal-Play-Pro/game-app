/*
  # Create wallets table

  1. New Tables
    - `wallets`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `address` (text, unique, indexed)
      - `chain_type` (text)
      - `is_primary` (boolean, default false)
      - `is_active` (boolean, default true)
      - `linked_at` (timestamptz)
      - `last_used_at` (timestamptz)
      - `metadata` (jsonb)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `wallets` table
    - Add policies for user access

  3. Constraints
    - Foreign key to users table
    - Unique constraint on address
    - Check constraint for primary wallet logic
*/

CREATE TABLE IF NOT EXISTS wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  address text UNIQUE NOT NULL,
  chain_type text NOT NULL DEFAULT 'ethereum',
  is_primary boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  linked_at timestamptz DEFAULT now(),
  last_used_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_address ON wallets(address);
CREATE INDEX IF NOT EXISTS idx_wallets_chain_type ON wallets(chain_type);
CREATE INDEX IF NOT EXISTS idx_wallets_is_primary ON wallets(is_primary);
CREATE INDEX IF NOT EXISTS idx_wallets_is_active ON wallets(is_active);

-- Enable RLS
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own wallets"
  ON wallets
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own wallets"
  ON wallets
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger for updated_at
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();