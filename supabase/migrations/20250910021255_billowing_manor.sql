/*
  # Create referral system tables

  1. New Tables
    - `referral_codes`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `wallet_address` (text)
      - `code` (text, unique)
      - `is_active` (boolean, default true)
      - `total_referrals` (integer, default 0)
      - `total_commissions` (decimal(18,8), default 0)
      - `metadata` (jsonb)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `referral_registrations`
      - `id` (uuid, primary key)
      - `referrer_user_id` (uuid, foreign key to users)
      - `referrer_wallet` (text)
      - `referred_user_id` (uuid, foreign key to users)
      - `referred_wallet` (text)
      - `referral_code` (text)
      - `registered_at` (timestamptz)
      - `is_active` (boolean, default true)
      - `metadata` (jsonb)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `referral_commissions`
      - `id` (uuid, primary key)
      - `referrer_user_id` (uuid, foreign key to users)
      - `referrer_wallet` (text)
      - `referred_user_id` (uuid, foreign key to users)
      - `referred_wallet` (text)
      - `order_id` (uuid, foreign key to orders)
      - `order_amount` (decimal(18,8))
      - `commission_amount` (decimal(18,8))
      - `commission_percentage` (decimal(5,2))
      - `status` (text, enum-like)
      - `paid_at` (timestamptz)
      - `metadata` (jsonb)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add policies for user access

  3. Constraints
    - Foreign key relationships
    - Check constraints for valid values
*/

-- Referral codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_address text NOT NULL,
  code text UNIQUE NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  total_referrals integer NOT NULL DEFAULT 0,
  total_commissions decimal(18,8) NOT NULL DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT referral_codes_total_referrals_check CHECK (total_referrals >= 0),
  CONSTRAINT referral_codes_total_commissions_check CHECK (total_commissions >= 0),
  UNIQUE(user_id)
);

-- Referral registrations table
CREATE TABLE IF NOT EXISTS referral_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referrer_wallet text NOT NULL,
  referred_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_wallet text NOT NULL,
  referral_code text NOT NULL,
  registered_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(referred_user_id)
);

-- Referral commissions table
CREATE TABLE IF NOT EXISTS referral_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referrer_wallet text NOT NULL,
  referred_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_wallet text NOT NULL,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_amount decimal(18,8) NOT NULL,
  commission_amount decimal(18,8) NOT NULL,
  commission_percentage decimal(5,2) NOT NULL DEFAULT 5.00,
  status text NOT NULL DEFAULT 'pending',
  paid_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT referral_commissions_status_check CHECK (status IN ('pending', 'paid', 'failed')),
  CONSTRAINT referral_commissions_amounts_check CHECK (order_amount > 0 AND commission_amount > 0),
  CONSTRAINT referral_commissions_percentage_check CHECK (commission_percentage >= 0 AND commission_percentage <= 100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_wallet_address ON referral_codes(wallet_address);
CREATE INDEX IF NOT EXISTS idx_referral_codes_is_active ON referral_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_registrations_referrer_user_id ON referral_registrations(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_registrations_referred_user_id ON referral_registrations(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_registrations_referral_code ON referral_registrations(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_registrations_is_active ON referral_registrations(is_active);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referrer_user_id ON referral_commissions(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referred_user_id ON referral_commissions(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_order_id ON referral_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_status ON referral_commissions(status);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_paid_at ON referral_commissions(paid_at);

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;

-- Policies for referral_codes
CREATE POLICY "Users can read own referral code"
  ON referral_codes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own referral code"
  ON referral_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own referral code"
  ON referral_codes
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Policies for referral_registrations
CREATE POLICY "Users can read own referral registrations"
  ON referral_registrations
  FOR SELECT
  TO authenticated
  USING (referrer_user_id = auth.uid() OR referred_user_id = auth.uid());

CREATE POLICY "System can create referral registrations"
  ON referral_registrations
  FOR INSERT
  TO authenticated
  WITH CHECK (referred_user_id = auth.uid());

-- Policies for referral_commissions
CREATE POLICY "Users can read own referral commissions"
  ON referral_commissions
  FOR SELECT
  TO authenticated
  USING (referrer_user_id = auth.uid());

CREATE POLICY "System can create referral commissions"
  ON referral_commissions
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "System can update referral commissions"
  ON referral_commissions
  FOR UPDATE
  TO authenticated
  USING (true);

-- Triggers
CREATE TRIGGER update_referral_codes_updated_at
  BEFORE UPDATE ON referral_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_registrations_updated_at
  BEFORE UPDATE ON referral_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_commissions_updated_at
  BEFORE UPDATE ON referral_commissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();