/*
  # Create penalty game tables

  1. New Tables
    - `penalty_sessions`
      - `id` (uuid, primary key)
      - `host_user_id` (uuid, foreign key to users)
      - `guest_user_id` (uuid, foreign key to users)
      - `type` (text, enum-like)
      - `status` (text, enum-like)
      - `host_player_id` (uuid, foreign key to owned_players)
      - `guest_player_id` (uuid, foreign key to owned_players)
      - `max_rounds` (integer)
      - `current_round` (integer)
      - `host_score` (integer)
      - `guest_score` (integer)
      - `winner_id` (uuid, foreign key to users)
      - `seed` (text)
      - `started_at` (timestamptz)
      - `completed_at` (timestamptz)
      - `metadata` (jsonb)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

    - `penalty_attempts`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key to penalty_sessions)
      - `round` (integer)
      - `shooter_user_id` (uuid, foreign key to users)
      - `goalkeeper_id` (text)
      - `shooter_player_id` (uuid, foreign key to owned_players)
      - `goalkeeper_player_id` (text)
      - `direction` (text, enum-like)
      - `power` (integer)
      - `keeper_direction` (text, enum-like)
      - `is_goal` (boolean)
      - `attempted_at` (timestamptz)
      - `seed` (text)
      - `metadata` (jsonb)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on both tables
    - Add policies for user access

  3. Constraints
    - Foreign key relationships
    - Check constraints for valid values
*/

-- Penalty sessions table
CREATE TABLE IF NOT EXISTS penalty_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  guest_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'single_player',
  status text NOT NULL DEFAULT 'waiting',
  host_player_id uuid NOT NULL REFERENCES owned_players(id) ON DELETE RESTRICT,
  guest_player_id uuid REFERENCES owned_players(id) ON DELETE RESTRICT,
  max_rounds integer NOT NULL DEFAULT 5,
  current_round integer NOT NULL DEFAULT 1,
  host_score integer NOT NULL DEFAULT 0,
  guest_score integer NOT NULL DEFAULT 0,
  winner_id uuid REFERENCES users(id) ON DELETE SET NULL,
  seed text NOT NULL,
  started_at timestamptz,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT penalty_sessions_type_check CHECK (type IN ('single_player', 'multiplayer')),
  CONSTRAINT penalty_sessions_status_check CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
  CONSTRAINT penalty_sessions_rounds_check CHECK (max_rounds >= 3 AND max_rounds <= 10),
  CONSTRAINT penalty_sessions_current_round_check CHECK (current_round >= 1),
  CONSTRAINT penalty_sessions_scores_check CHECK (host_score >= 0 AND guest_score >= 0)
);

-- Penalty attempts table
CREATE TABLE IF NOT EXISTS penalty_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES penalty_sessions(id) ON DELETE CASCADE,
  round integer NOT NULL,
  shooter_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goalkeeper_id text NOT NULL,
  shooter_player_id uuid NOT NULL REFERENCES owned_players(id) ON DELETE RESTRICT,
  goalkeeper_player_id text NOT NULL,
  direction text NOT NULL,
  power integer NOT NULL,
  keeper_direction text NOT NULL,
  is_goal boolean NOT NULL,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  seed text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT penalty_attempts_direction_check CHECK (direction IN ('left', 'center', 'right')),
  CONSTRAINT penalty_attempts_keeper_direction_check CHECK (keeper_direction IN ('left', 'center', 'right')),
  CONSTRAINT penalty_attempts_power_check CHECK (power >= 0 AND power <= 100),
  CONSTRAINT penalty_attempts_round_check CHECK (round >= 1)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_penalty_sessions_host_user_id ON penalty_sessions(host_user_id);
CREATE INDEX IF NOT EXISTS idx_penalty_sessions_guest_user_id ON penalty_sessions(guest_user_id);
CREATE INDEX IF NOT EXISTS idx_penalty_sessions_type ON penalty_sessions(type);
CREATE INDEX IF NOT EXISTS idx_penalty_sessions_status ON penalty_sessions(status);
CREATE INDEX IF NOT EXISTS idx_penalty_sessions_started_at ON penalty_sessions(started_at);
CREATE INDEX IF NOT EXISTS idx_penalty_sessions_completed_at ON penalty_sessions(completed_at);
CREATE INDEX IF NOT EXISTS idx_penalty_attempts_session_id ON penalty_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_penalty_attempts_shooter_user_id ON penalty_attempts(shooter_user_id);
CREATE INDEX IF NOT EXISTS idx_penalty_attempts_round ON penalty_attempts(round);
CREATE INDEX IF NOT EXISTS idx_penalty_attempts_attempted_at ON penalty_attempts(attempted_at);

-- Enable RLS
ALTER TABLE penalty_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE penalty_attempts ENABLE ROW LEVEL SECURITY;

-- Policies for penalty_sessions
CREATE POLICY "Users can read own sessions"
  ON penalty_sessions
  FOR SELECT
  TO authenticated
  USING (host_user_id = auth.uid() OR guest_user_id = auth.uid());

CREATE POLICY "Users can create own sessions"
  ON penalty_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (host_user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON penalty_sessions
  FOR UPDATE
  TO authenticated
  USING (host_user_id = auth.uid() OR guest_user_id = auth.uid());

-- Policies for penalty_attempts
CREATE POLICY "Users can read session attempts"
  ON penalty_attempts
  FOR SELECT
  TO authenticated
  USING (session_id IN (
    SELECT id FROM penalty_sessions 
    WHERE host_user_id = auth.uid() OR guest_user_id = auth.uid()
  ));

CREATE POLICY "Users can create attempts in their sessions"
  ON penalty_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (session_id IN (
    SELECT id FROM penalty_sessions 
    WHERE host_user_id = auth.uid() OR guest_user_id = auth.uid()
  ));

-- Triggers
CREATE TRIGGER update_penalty_sessions_updated_at
  BEFORE UPDATE ON penalty_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_penalty_attempts_updated_at
  BEFORE UPDATE ON penalty_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();