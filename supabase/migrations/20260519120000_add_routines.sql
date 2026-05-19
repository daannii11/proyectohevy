-- Routines → exercises → sets hierarchy
CREATE TABLE IF NOT EXISTS routines (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link existing exercises to routines (safe when table is empty)
ALTER TABLE exercises
  ADD COLUMN IF NOT EXISTS routine_id INTEGER;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM exercises
    WHERE routine_id IS NULL
  ) THEN
    INSERT INTO routines (name)
    SELECT 'General'
    WHERE NOT EXISTS (SELECT 1 FROM routines);

    UPDATE exercises e
    SET routine_id = (SELECT id FROM routines ORDER BY id ASC LIMIT 1)
    WHERE e.routine_id IS NULL;
  END IF;
END $$;

ALTER TABLE exercises
  DROP CONSTRAINT IF EXISTS exercises_routine_id_fkey;

ALTER TABLE exercises
  ADD CONSTRAINT exercises_routine_id_fkey
  FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE;

ALTER TABLE exercises
  ALTER COLUMN routine_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_exercises_routine_id ON exercises (routine_id);

-- Enforce max 5 routines per database (single-user app; tighten with user_id later)
CREATE OR REPLACE FUNCTION enforce_max_routines()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM routines) > 5 THEN
    RAISE EXCEPTION 'Maximum of 5 routines allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_max_routines ON routines;

CREATE TRIGGER trg_enforce_max_routines
AFTER INSERT ON routines
FOR EACH ROW
EXECUTE FUNCTION enforce_max_routines();
