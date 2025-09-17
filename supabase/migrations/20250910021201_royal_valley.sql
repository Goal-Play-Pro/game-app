/*
  # Create inventory tables

  1. New Tables
    - `owned_players`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `player_id` (uuid, foreign key to gacha_players)
      - `source_order_id` (uuid, foreign key to orders)
      - `source_draw_id` (uuid, foreign key to gacha_draws)
      - `acquired_at` (timestamptz)
      - `current_level` (integer, default 1)
      - `experience` (integer, default 0)
      - `is_active` (boolean, default true)
      - `metadata` (jsonb)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `player_kits`
      - `id` (uuid, primary key)
      - `owned_player_id` (uuid, foreign key to owned_players)
      - `version` (integer)
      - `name` (text)
      - `primary_color` (text)
      - `secondary_color` (text)
      - `logo_url` (text)
      - `is_active` (boolean, default true)
      - `equipped_at` (timestamptz)
      - `unequipped_at` (timestamptz)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Add policies for user access

  3. Constraints
    - Foreign key relationships
    - Check constraints for valid values
*/

-- Owned players table
CREATE TABLE IF NOT EXISTS owned_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES gacha_players(id) ON DELETE RESTRICT,
  source_order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  source_draw_id uuid REFERENCES gacha_draws(id) ON DELETE SET NULL,
  acquired_at timestamptz NOT NULL DEFAULT now(),
  current_level integer NOT NULL DEFAULT 1,
  experience integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT owned_players_level_check CHECK (current_level >= 1 AND current_level <= 100),
  CONSTRAINT owned_players_experience_check CHECK (experience >= 0)
);

-- Player kits table
CREATE TABLE IF NOT EXISTS player_kits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owned_player_id uuid NOT NULL REFERENCES owned_players(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 1,
  name text NOT NULL,
  primary_color text NOT NULL DEFAULT '#FF0000',
  secondary_color text NOT NULL DEFAULT '#FFFFFF',
  logo_url text,
  is_active boolean NOT NULL DEFAULT true,
  equipped_at timestamptz,
  unequipped_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT player_kits_version_check CHECK (version > 0),
  CONSTRAINT player_kits_colors_check CHECK (
    primary_color ~ '^#[0-9A-Fa-f]{6}$' AND 
    secondary_color ~ '^#[0-9A-Fa-f]{6}$'
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_owned_players_user_id ON owned_players(user_id);
CREATE INDEX IF NOT EXISTS idx_owned_players_player_id ON owned_players(player_id);
CREATE INDEX IF NOT EXISTS idx_owned_players_source_order_id ON owned_players(source_order_id);
CREATE INDEX IF NOT EXISTS idx_owned_players_source_draw_id ON owned_players(source_draw_id);
CREATE INDEX IF NOT EXISTS idx_owned_players_is_active ON owned_players(is_active);
CREATE INDEX IF NOT EXISTS idx_owned_players_current_level ON owned_players(current_level);
CREATE INDEX IF NOT EXISTS idx_player_kits_owned_player_id ON player_kits(owned_player_id);
CREATE INDEX IF NOT EXISTS idx_player_kits_is_active ON player_kits(is_active);
CREATE INDEX IF NOT EXISTS idx_player_kits_equipped_at ON player_kits(equipped_at);

-- Enable RLS
ALTER TABLE owned_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_kits ENABLE ROW LEVEL SECURITY;

-- Policies for owned_players
CREATE POLICY "Users can read own players"
  ON owned_players
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own players"
  ON owned_players
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create owned players"
  ON owned_players
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policies for player_kits
CREATE POLICY "Users can read own player kits"
  ON player_kits
  FOR SELECT
  TO authenticated
  USING (owned_player_id IN (
    SELECT id FROM owned_players WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own player kits"
  ON player_kits
  FOR ALL
  TO authenticated
  USING (owned_player_id IN (
    SELECT id FROM owned_players WHERE user_id = auth.uid()
  ));

-- Triggers
CREATE TRIGGER update_owned_players_updated_at
  BEFORE UPDATE ON owned_players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_kits_updated_at
  BEFORE UPDATE ON player_kits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();