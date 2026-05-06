import { pool } from "../db.js";

export const getTest = async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW();");
    res.json({
      ok: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error en GET /api/test:", error.message);
    res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
    });
  }
};

export const getTestData = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM test;");
    res.json({
      ok: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error en GET /api/test-data:", error.message);
    res.status(500).json({
      ok: false,
      message: "Error interno del servidor",
    });
  }
};
