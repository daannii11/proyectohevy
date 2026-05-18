-- Initial schema for proyectohevy (exercises + sets)
CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sets (
  id SERIAL PRIMARY KEY,
  exercise_id INTEGER NOT NULL REFERENCES exercises (id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'normal'
    CHECK (type IN ('warmup', 'normal', 'failed', 'dropset')),
  kg NUMERIC(10, 2),
  reps INTEGER,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sets_exercise_id ON sets (exercise_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise_created ON sets (exercise_id, created_at);
