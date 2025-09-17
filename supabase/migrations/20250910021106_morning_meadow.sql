/*
  # Create products and product variants tables

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `type` (text, enum-like)
      - `is_active` (boolean, default true)
      - `metadata` (jsonb)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `product_variants`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key to products)
      - `name` (text)
      - `description` (text)
      - `division` (text, enum-like)
      - `level` (integer)
      - `price_usdt` (decimal(10,2))
      - `is_active` (boolean, default true)
      - `max_purchases_per_user` (integer)
      - `gacha_pool_id` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access

  3. Constraints
    - Foreign key relationships
    - Check constraints for valid enums
*/

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  type text NOT NULL DEFAULT 'character_pack',
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT products_type_check CHECK (type IN ('character_pack', 'cosmetic', 'boost'))
);

-- Product variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  division text NOT NULL,
  level integer NOT NULL,
  price_usdt decimal(10,2) NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  max_purchases_per_user integer,
  gacha_pool_id text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT product_variants_division_check CHECK (division IN ('primera', 'segunda', 'tercera')),
  CONSTRAINT product_variants_level_check CHECK (level >= 1 AND level <= 5),
  CONSTRAINT product_variants_price_check CHECK (price_usdt > 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_type ON products(type);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_division ON product_variants(division);
CREATE INDEX IF NOT EXISTS idx_product_variants_level ON product_variants(level);
CREATE INDEX IF NOT EXISTS idx_product_variants_is_active ON product_variants(is_active);
CREATE INDEX IF NOT EXISTS idx_product_variants_price ON product_variants(price_usdt);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Policies (public read access for shop)
CREATE POLICY "Anyone can read active products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Anyone can read active product variants"
  ON product_variants
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Admin policies for management
CREATE POLICY "Admins can manage products"
  ON products
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can manage product variants"
  ON product_variants
  FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' = 'admin');

-- Triggers
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();