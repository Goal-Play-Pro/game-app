/*
  # Create orders table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `product_variant_id` (uuid, foreign key to product_variants)
      - `quantity` (integer)
      - `unit_price_usdt` (decimal(10,2))
      - `total_price_usdt` (decimal(10,2))
      - `status` (text, enum-like)
      - `payment_wallet` (text)
      - `receiving_wallet` (text)
      - `chain_type` (text)
      - `transaction_hash` (text)
      - `block_number` (bigint)
      - `confirmations` (integer)
      - `expires_at` (timestamptz)
      - `paid_at` (timestamptz)
      - `fulfilled_at` (timestamptz)
      - `cancelled_at` (timestamptz)
      - `failure_reason` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on orders table
    - Add policies for user access

  3. Constraints
    - Foreign key relationships
    - Check constraints for valid statuses and amounts
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  unit_price_usdt decimal(10,2) NOT NULL,
  total_price_usdt decimal(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_wallet text NOT NULL,
  receiving_wallet text NOT NULL,
  chain_type text NOT NULL DEFAULT 'ethereum',
  transaction_hash text,
  block_number bigint,
  confirmations integer DEFAULT 0,
  expires_at timestamptz NOT NULL,
  paid_at timestamptz,
  fulfilled_at timestamptz,
  cancelled_at timestamptz,
  failure_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT orders_status_check CHECK (status IN ('pending', 'paid', 'fulfilled', 'cancelled', 'expired')),
  CONSTRAINT orders_chain_type_check CHECK (chain_type IN ('ethereum', 'polygon', 'bsc', 'arbitrum', 'solana')),
  CONSTRAINT orders_quantity_check CHECK (quantity > 0),
  CONSTRAINT orders_price_check CHECK (unit_price_usdt > 0 AND total_price_usdt > 0),
  CONSTRAINT orders_expires_check CHECK (expires_at > created_at)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_product_variant_id ON orders(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_chain_type ON orders(chain_type);
CREATE INDEX IF NOT EXISTS idx_orders_payment_wallet ON orders(payment_wallet);
CREATE INDEX IF NOT EXISTS idx_orders_transaction_hash ON orders(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_orders_expires_at ON orders(expires_at);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Admin policies
CREATE POLICY "Admins can manage all orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Trigger
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();