import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import { testDbConnection } from "./db.js";
import testRoutes from "./routes/test.routes.js";

dotenv.config();

console.log("ENV CHECK -> DB_USER:", process.env.DB_USER || "(vacio)");
console.log("ENV CHECK -> DB_HOST:", process.env.DB_HOST || "(vacio)");
console.log("ENV CHECK -> DB_NAME:", process.env.DB_NAME || "(vacio)");
console.log("ENV CHECK -> DB_PORT:", process.env.DB_PORT || "(vacio)");
console.log(
  "ENV CHECK -> DB_PASSWORD:",
  process.env.DB_PASSWORD ? "configurada (oculta)" : "NO configurada"
);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.use("/api", testRoutes);

app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Backend funcionando",
  });
});

app.use((err, req, res, next) => {
  console.error("Error no controlado:", err);
  res.status(500).json({
    ok: false,
    message: "Error interno del servidor",
  });
});

app.listen(PORT, () => {
  console.log(`Servidor backend corriendo en http://localhost:${PORT}`);
  // Diagnostico inicial de DB sin detener el servidor en caso de fallo.
  testDbConnection();
});
