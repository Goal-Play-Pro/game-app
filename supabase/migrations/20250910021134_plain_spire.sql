/*
  # Create gacha system tables

  1. New Tables
    - `gacha_pools`
      - `id` (uuid, primary key)
      - `name` (text)
      - `division` (text, enum-like)
      - `is_active` (boolean, default true)
      - `anti_duplicate_policy` (text)
      - `guaranteed_rarity` (text)
      - `boosted_rarities` (text array)
      - `boost_multiplier` (decimal)
      - `valid_from` (timestamptz)
      - `valid_until` (timestamptz)
      - `metadata` (jsonb)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `gacha_players`
      - `id` (uuid, primary key)
      - `name` (text)
      - `position` (text, enum-like)
      - `rarity` (text, enum-like)
      - `division` (text, enum-like)
      - `base_stats` (jsonb for player stats)
      - `image_url` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `gacha_pool_entries`
      - `id` (uuid, primary key)
      - `pool_id` (uuid, foreign key to gacha_pools)
      - `player_id` (uuid, foreign key to gacha_players)
      - `weight` (decimal)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `gacha_draws`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `order_id` (uuid, foreign key to orders)
      - `pool_id` (uuid, foreign key to gacha_pools)
      - `players_drawn` (uuid array)
      - `seed` (text)
      - `draw_date` (timestamptz)
      - `metadata` (jsonb)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies

  3. Constraints
    - Foreign key relationships
    - Check constraints for valid enums
*/

-- Gacha pools table
CREATE TABLE IF NOT EXISTS gacha_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  division text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  anti_duplicate_policy text NOT NULL DEFAULT 'ALLOW_DUPLICATES',
  guaranteed_rarity text,
  boosted_rarities text[],
  boost_multiplier decimal(4,2),
  valid_from timestamptz,
  valid_until timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT gacha_pools_division_check CHECK (division IN ('primera', 'segunda', 'tercera')),
  CONSTRAINT gacha_pools_policy_check CHECK (anti_duplicate_policy IN ('ALLOW_DUPLICATES', 'EXCLUDE_OWNED_AT_DRAW', 'EXCLUDE_OWNED_GLOBALLY')),
  CONSTRAINT gacha_pools_rarity_check CHECK (guaranteed_rarity IS NULL OR guaranteed_rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary'))
);

-- Gacha players table
CREATE TABLE IF NOT EXISTS gacha_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  position text NOT NULL,
  rarity text NOT NULL,
  division text NOT NULL,
  base_stats jsonb NOT NULL DEFAULT '{"speed": 50, "shooting": 50, "passing": 50, "defending": 50, "goalkeeping": 50, "overall": 50}'::jsonb,
  image_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT gacha_players_position_check CHECK (position IN ('goalkeeper', 'defender', 'midfielder', 'forward')),
  CONSTRAINT gacha_players_rarity_check CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  CONSTRAINT gacha_players_division_check CHECK (division IN ('primera', 'segunda', 'tercera'))
);

-- Gacha pool entries table
CREATE TABLE IF NOT EXISTS gacha_pool_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid NOT NULL REFERENCES gacha_pools(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES gacha_players(id) ON DELETE CASCADE,
  weight decimal(8,4) NOT NULL DEFAULT 1.0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT gacha_pool_entries_weight_check CHECK (weight > 0),
  UNIQUE(pool_id, player_id)
);

-- Gacha draws table
CREATE TABLE IF NOT EXISTS gacha_draws (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  pool_id uuid NOT NULL REFERENCES gacha_pools(id) ON DELETE RESTRICT,
  players_drawn uuid[] NOT NULL DEFAULT '{}',
  seed text NOT NULL,
  draw_date timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gacha_pools_division ON gacha_pools(division);
CREATE INDEX IF NOT EXISTS idx_gacha_pools_is_active ON gacha_pools(is_active);
CREATE INDEX IF NOT EXISTS idx_gacha_players_position ON gacha_players(position);
CREATE INDEX IF NOT EXISTS idx_gacha_players_rarity ON gacha_players(rarity);
CREATE INDEX IF NOT EXISTS idx_gacha_players_division ON gacha_players(division);
CREATE INDEX IF NOT EXISTS idx_gacha_pool_entries_pool_id ON gacha_pool_entries(pool_id);
CREATE INDEX IF NOT EXISTS idx_gacha_pool_entries_player_id ON gacha_pool_entries(player_id);
CREATE INDEX IF NOT EXISTS idx_gacha_pool_entries_is_active ON gacha_pool_entries(is_active);
CREATE INDEX IF NOT EXISTS idx_gacha_draws_user_id ON gacha_draws(user_id);
CREATE INDEX IF NOT EXISTS idx_gacha_draws_order_id ON gacha_draws(order_id);
CREATE INDEX IF NOT EXISTS idx_gacha_draws_pool_id ON gacha_draws(pool_id);
CREATE INDEX IF NOT EXISTS idx_gacha_draws_draw_date ON gacha_draws(draw_date);

-- Enable RLS
ALTER TABLE gacha_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_pool_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gacha_draws ENABLE ROW LEVEL SECURITY;

-- Policies for gacha_pools (public read)
CREATE POLICY "Anyone can read active gacha pools"
  ON gacha_pools
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Policies for gacha_players (public read)
CREATE POLICY "Anyone can read gacha players"
  ON gacha_players
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policies for gacha_pool_entries (public read)
CREATE POLICY "Anyone can read active pool entries"
  ON gacha_pool_entries
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Policies for gacha_draws (user access)
CREATE POLICY "Users can read own draws"
  ON gacha_draws
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create draws"
  ON gacha_draws
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Triggers
CREATE TRIGGER update_gacha_pools_updated_at
  BEFORE UPDATE ON gacha_pools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gacha_players_updated_at
  BEFORE UPDATE ON gacha_players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gacha_pool_entries_updated_at
  BEFORE UPDATE ON gacha_pool_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gacha_draws_updated_at
  BEFORE UPDATE ON gacha_draws
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();