/*
  # Create ledger and accounting tables

  1. New Tables
    - `ledger_entries`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `transaction_id` (text)
      - `account` (text)
      - `type` (text, enum-like)
      - `amount` (decimal(18,8))
      - `currency` (text)
      - `description` (text)
      - `reference_type` (text)
      - `reference_id` (text)
      - `balance_after` (decimal(18,8))
      - `metadata` (jsonb)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `accounts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `name` (text)
      - `type` (text, enum-like)
      - `currency` (text)
      - `balance` (decimal(18,8))
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Add policies for user access

  3. Constraints
    - Foreign key relationships
    - Check constraints for valid values
*/

-- Ledger entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_id text NOT NULL,
  account text NOT NULL,
  type text NOT NULL,
  amount decimal(18,8) NOT NULL,
  currency text NOT NULL DEFAULT 'USDT',
  description text NOT NULL,
  reference_type text NOT NULL,
  reference_id text NOT NULL,
  balance_after decimal(18,8) NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT ledger_entries_type_check CHECK (type IN ('debit', 'credit')),
  CONSTRAINT ledger_entries_reference_type_check CHECK (reference_type IN ('order', 'gacha_draw', 'penalty_reward', 'refund', 'adjustment', 'referral'))
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  currency text NOT NULL DEFAULT 'USDT',
  balance decimal(18,8) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT accounts_type_check CHECK (type IN ('asset', 'liability', 'revenue', 'expense')),
  UNIQUE(user_id, name, currency)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ledger_entries_user_id ON ledger_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_transaction_id ON ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON ledger_entries(account);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_type ON ledger_entries(type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_currency ON ledger_entries(currency);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_reference_type ON ledger_entries(reference_type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_reference_id ON ledger_entries(reference_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_created_at ON ledger_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_name ON accounts(name);
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_accounts_currency ON accounts(currency);
CREATE INDEX IF NOT EXISTS idx_accounts_is_active ON accounts(is_active);

-- Enable RLS
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Policies for ledger_entries
CREATE POLICY "Users can read own ledger entries"
  ON ledger_entries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create ledger entries"
  ON ledger_entries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policies for accounts
CREATE POLICY "Users can read own accounts"
  ON accounts
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own accounts"
  ON accounts
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Triggers
CREATE TRIGGER update_ledger_entries_updated_at
  BEFORE UPDATE ON ledger_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();