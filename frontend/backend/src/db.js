import dotenv from "dotenv";
import { Pool } from "pg";

dotenv.config();

export const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

const getDbErrorHint = (error) => {
  const message = (error?.message || "").toLowerCase();
  const code = error?.code;

  if (code === "28P01" || message.includes("password authentication failed")) {
    return {
      type: "password",
      detail: "Autenticacion fallida: revisa DB_USER y DB_PASSWORD.",
      suggestion:
        "Verifica la password del usuario 'postgres' en PostgreSQL y actualiza DB_PASSWORD en .env.",
    };
  }

  if (code === "3D000" || message.includes("database") && message.includes("does not exist")) {
    return {
      type: "base de datos",
      detail: "La base de datos configurada no existe.",
      suggestion: "Crea la base de datos indicada en DB_NAME (por ejemplo: mi_app_db).",
    };
  }

  if (code === "28000" || message.includes("role") && message.includes("does not exist")) {
    return {
      type: "usuario",
      detail: "El usuario configurado no existe o no tiene permisos.",
      suggestion: "Verifica DB_USER y los permisos del rol en PostgreSQL.",
    };
  }

  if (message.includes("econnrefused") || code === "ECONNREFUSED") {
    return {
      type: "conexion",
      detail: "No se pudo conectar al servidor PostgreSQL.",
      suggestion: "Asegurate de que PostgreSQL este encendido y revisa DB_HOST/DB_PORT.",
    };
  }

  return {
    type: "desconocido",
    detail: "Error no clasificado en la conexion.",
    suggestion: "Revisa las variables del .env y los logs completos de PostgreSQL.",
  };
};

export const testDbConnection = async () => {
  try {
    const result = await pool.query("SELECT NOW();");
    console.log("DB CHECK -> Conexion exitosa:", result.rows[0].now);
    return { ok: true };
  } catch (error) {
    const info = getDbErrorHint(error);
    console.error(`DB CHECK -> Fallo de ${info.type}: ${info.detail}`);
    console.error("DB CHECK -> Mensaje tecnico:", error.message);
    console.error("DB CHECK -> Sugerencia:", info.suggestion);
    return { ok: false, errorType: info.type, message: error.message };
  }
};
