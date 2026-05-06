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

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
