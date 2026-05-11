// Load environment variables from .env
import "dotenv/config";
import express from "express";
import cors from "cors";
import pg from "pg";

const { Pool } = pg;
const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow tools without Origin header (curl, Postman, server-to-server).
      if (!origin) return callback(null, true);

      // Allow any localhost/127.0.0.1 port in development.
      const isLocalhost = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
      if (isLocalhost) return callback(null, true);

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

// PostgreSQL connection pool using environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

/** Creates `sets` + indexes if missing (same DDL as schema.sql). */
async function ensureSetsSchema() {
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
}

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

// Get all exercises
app.get("/exercises", async (req, res) => {
  try {
    // 1) Read all rows from PostgreSQL, ordered by id.
    const { rows } = await pool.query(
      "SELECT id, name FROM exercises ORDER BY id ASC"
    );

    // 2) Return the list as JSON.
    res.status(200).json(rows);
  } catch (error) {
    // 3) Log the error and send a safe server error response.
    console.error("Error fetching exercises:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to fetch exercises",
    });
  }
});

// Create a new exercise
app.post("/exercises", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        ok: false,
        message: "Field 'name' is required",
      });
    }

    const result = await pool.query(
      "INSERT INTO exercises (name) VALUES ($1) RETURNING id, name",
      [name.trim()]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating exercise:", error);
    res.status(500).json({
      ok: false,
      message: "Failed to create exercise",
    });
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
    await ensureSetsSchema();
    console.log("DB: sets table is ready.");
  } catch (err) {
    console.error("DB: could not create sets table:", err.message);
  }

  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}

start();
