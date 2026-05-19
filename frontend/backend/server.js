// Load environment variables from .env
import "dotenv/config";
import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;

function createPool() {
  if (process.env.DATABASE_URL) {
    return new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.DB_SSL === "false"
          ? false
          : { rejectUnauthorized: false },
    });
  }

  return new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
  });
}

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
      if (isLocalhost) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

// Root route to avoid "Cannot GET /"
app.get("/", (req, res) => {
  res.status(200).json({
    ok: true,
    message: "Workout Tracker API is running",
  });
});

const pool = createPool();

const MAX_ROUTINES = 5;

/** Creates routines / sets tables if missing (aligned with supabase/migrations). */
async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS routines (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exercises (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL
    );
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'exercises' AND column_name = 'routine_id'
      ) THEN
        ALTER TABLE exercises ADD COLUMN routine_id INTEGER;
      END IF;
    END $$;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'exercises_routine_id_fkey'
      ) THEN
        ALTER TABLE exercises
          ADD CONSTRAINT exercises_routine_id_fkey
          FOREIGN KEY (routine_id) REFERENCES routines (id) ON DELETE CASCADE;
      END IF;
    END $$;
  `);

  await pool.query(`
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
  `);
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_sets_exercise_id ON sets (exercise_id);`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_sets_exercise_created ON sets (exercise_id, created_at);`
  );
  await pool.query(
    `CREATE INDEX IF NOT EXISTS idx_exercises_routine_id ON exercises (routine_id);`
  );
}

function parsePositiveInt(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

async function routineExists(routineId) {
  const { rows } = await pool.query("SELECT 1 FROM routines WHERE id = $1", [routineId]);
  return rows.length > 0;
}

async function countRoutines() {
  const { rows } = await pool.query("SELECT COUNT(*)::int AS count FROM routines");
  return rows[0].count;
}

// List all routines
app.get("/routines", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, created_at FROM routines ORDER BY created_at ASC, id ASC"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching routines:", error);
    res.status(500).json({ ok: false, message: "Failed to fetch routines" });
  }
});

// Create a routine (max 5)
app.post("/routines", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ ok: false, message: "Field 'name' is required" });
    }

    const total = await countRoutines();
    if (total >= MAX_ROUTINES) {
      return res.status(409).json({
        ok: false,
        message: `Maximum of ${MAX_ROUTINES} routines allowed`,
      });
    }

    const result = await pool.query(
      "INSERT INTO routines (name) VALUES ($1) RETURNING id, name, created_at",
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating routine:", error);
    res.status(500).json({ ok: false, message: "Failed to create routine" });
  }
});

// Delete a routine (cascades to exercises and sets)
app.delete("/routines/:id", async (req, res) => {
  try {
    const id = parsePositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ ok: false, message: "Invalid routine id" });
    }

    const result = await pool.query("DELETE FROM routines WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, message: "Routine not found" });
    }

    res.status(200).json({ ok: true, message: "Routine deleted successfully" });
  } catch (error) {
    console.error("Error deleting routine:", error);
    res.status(500).json({ ok: false, message: "Failed to delete routine" });
  }
});

// Exercises for one routine
app.get("/routines/:routineId/exercises", async (req, res) => {
  try {
    const routineId = parsePositiveInt(req.params.routineId);
    if (!routineId) {
      return res.status(400).json({ ok: false, message: "Invalid routine id" });
    }

    if (!(await routineExists(routineId))) {
      return res.status(404).json({ ok: false, message: "Routine not found" });
    }

    const { rows } = await pool.query(
      "SELECT id, name, routine_id FROM exercises WHERE routine_id = $1 ORDER BY id ASC",
      [routineId]
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching routine exercises:", error);
    res.status(500).json({ ok: false, message: "Failed to fetch exercises" });
  }
});

// Create exercise inside a routine
app.post("/routines/:routineId/exercises", async (req, res) => {
  try {
    const routineId = parsePositiveInt(req.params.routineId);
    if (!routineId) {
      return res.status(400).json({ ok: false, message: "Invalid routine id" });
    }

    if (!(await routineExists(routineId))) {
      return res.status(404).json({ ok: false, message: "Routine not found" });
    }

    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ ok: false, message: "Field 'name' is required" });
    }

    const result = await pool.query(
      "INSERT INTO exercises (name, routine_id) VALUES ($1, $2) RETURNING id, name, routine_id",
      [name.trim(), routineId]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating exercise:", error);
    res.status(500).json({ ok: false, message: "Failed to create exercise" });
  }
});

// Health/test endpoint to verify API + DB connection
app.get("/test", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS now");
    res.status(200).json({
      ok: true,
      now: result.rows[0].now,
    });
  } catch (error) {
    console.error("Error running /test query:", error);
    res.status(500).json({
      ok: false,
      message: "Database query failed",
    });
  }
});

// Legacy: list all exercises (prefer /routines/:id/exercises)
app.get("/exercises", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, name, routine_id FROM exercises ORDER BY id ASC"
    );
    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching exercises:", error);
    res.status(500).json({ ok: false, message: "Failed to fetch exercises" });
  }
});

// Update an exercise by id
app.put("/exercises/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        message: "Invalid exercise id",
      });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        ok: false,
        message: "Field 'name' is required",
      });
    }

    const result = await pool.query(
      "UPDATE exercises SET name = $1 WHERE id = $2 RETURNING id, name",
      [name.trim(), id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Exercise not found",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating exercise:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to update exercise",
    });
  }
});

const SET_TYPES = new Set(["warmup", "normal", "failed", "dropset"]);

function parseOptionalKg(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function parseOptionalReps(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = parseInt(String(value), 10);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

async function exerciseExists(exerciseId) {
  const { rows } = await pool.query("SELECT 1 FROM exercises WHERE id = $1", [exerciseId]);
  return rows.length > 0;
}

// List sets for one exercise
app.get("/exercises/:id/sets", async (req, res) => {
  try {
    const exerciseId = Number(req.params.id);
    if (!Number.isInteger(exerciseId) || exerciseId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "Invalid exercise id",
      });
    }

    if (!(await exerciseExists(exerciseId))) {
      return res.status(404).json({
        ok: false,
        message: "Exercise not found",
      });
    }

    const { rows } = await pool.query(
      `SELECT id, exercise_id, type, kg, reps, completed, created_at
       FROM sets
       WHERE exercise_id = $1
       ORDER BY created_at ASC, id ASC`,
      [exerciseId]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error("Error fetching sets:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to fetch sets",
    });
  }
});

// Create a new set for an exercise
app.post("/exercises/:id/sets", async (req, res) => {
  try {
    const exerciseId = Number(req.params.id);
    if (!Number.isInteger(exerciseId) || exerciseId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "Invalid exercise id",
      });
    }

    if (!(await exerciseExists(exerciseId))) {
      return res.status(404).json({
        ok: false,
        message: "Exercise not found",
      });
    }

    const body = req.body || {};
    let type = typeof body.type === "string" ? body.type : "normal";
    if (!SET_TYPES.has(type)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid set type",
      });
    }

    const kg = parseOptionalKg(body.kg);
    const reps = parseOptionalReps(body.reps);
    const completed = typeof body.completed === "boolean" ? body.completed : false;

    const { rows } = await pool.query(
      `INSERT INTO sets (exercise_id, type, kg, reps, completed)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, exercise_id, type, kg, reps, completed, created_at`,
      [exerciseId, type, kg ?? null, reps ?? null, completed]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error creating set:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to create set",
    });
  }
});

// Update a set by id
app.put("/sets/:id", async (req, res) => {
  try {
    const setId = Number(req.params.id);
    if (!Number.isInteger(setId) || setId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "Invalid set id",
      });
    }

    const body = req.body || {};
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (body.type !== undefined) {
      if (typeof body.type !== "string" || !SET_TYPES.has(body.type)) {
        return res.status(400).json({
          ok: false,
          message: "Invalid set type",
        });
      }
      updates.push(`type = $${paramIndex++}`);
      values.push(body.type);
    }

    if (body.kg !== undefined) {
      const kg = parseOptionalKg(body.kg);
      updates.push(`kg = $${paramIndex++}`);
      values.push(kg);
    }

    if (body.reps !== undefined) {
      const reps = parseOptionalReps(body.reps);
      updates.push(`reps = $${paramIndex++}`);
      values.push(reps);
    }

    if (body.completed !== undefined) {
      if (typeof body.completed !== "boolean") {
        return res.status(400).json({
          ok: false,
          message: "Field 'completed' must be a boolean",
        });
      }
      updates.push(`completed = $${paramIndex++}`);
      values.push(body.completed);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        ok: false,
        message: "No valid fields to update",
      });
    }

    values.push(setId);
    const result = await pool.query(
      `UPDATE sets SET ${updates.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING id, exercise_id, type, kg, reps, completed, created_at`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Set not found",
      });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating set:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to update set",
    });
  }
});

// Delete a set by id
app.delete("/sets/:id", async (req, res) => {
  try {
    const setId = Number(req.params.id);
    if (!Number.isInteger(setId) || setId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "Invalid set id",
      });
    }

    const result = await pool.query("DELETE FROM sets WHERE id = $1", [setId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Set not found",
      });
    }

    res.status(200).json({
      ok: true,
      message: "Set deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting set:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to delete set",
    });
  }
});

// Delete an exercise by id
app.delete("/exercises/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        message: "Invalid exercise id",
      });
    }

    const result = await pool.query("DELETE FROM exercises WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        message: "Exercise not found",
      });
    }

    res.status(200).json({
      ok: true,
      message: "Exercise deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting exercise:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to delete exercise",
    });
  }
});

const PORT = Number(process.env.PORT) || 3000;

async function start() {
  try {
    await ensureSchema();
    console.log("DB: routines, exercises, and sets are ready.");
  } catch (err) {
    console.error("DB: could not create sets table:", err.message);
  }

  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

start();
