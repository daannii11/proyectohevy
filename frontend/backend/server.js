// Load environment variables from .env
import "dotenv/config";
import express from "express";
import pg from "pg";

const { Pool } = pg;
const app = express();

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

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
