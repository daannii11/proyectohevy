# proyectohevy

Aplicacion fullstack simple para practicar la comunicacion entre frontend (React) y backend (Express), sin base de datos.

## Estructura

- `backend/`: API con Node.js + Express.
- `FRONTEND/`: cliente en React (Vite).

## Backend (Express)

### Archivos

- `backend/src/server.js`: configura Express, CORS, JSON middleware, monta rutas y levanta el servidor.
- `backend/src/routes/workoutsRoutes.js`: define `GET /workouts`.
- `backend/src/controllers/workoutsController.js`: controlador que devuelve los workouts hardcodeados.
- `backend/src/data/workouts.js`: arreglo en memoria con los workouts y ejercicios.

### Endpoint

- `GET /workouts`: devuelve todos los workouts en JSON.

## Frontend (React)

### Archivos

- `FRONTEND/src/main.jsx`: punto de entrada de React.
- `FRONTEND/src/App.jsx`: hace `fetch` a `http://localhost:3000/workouts`, guarda estado y renderiza workouts + ejercicios.
- `FRONTEND/src/styles.css`: estilos basicos de la interfaz.
- `FRONTEND/index.html`: HTML base con el `div#root`.
- `FRONTEND/vite.config.js`: configuracion de Vite con plugin de React.

## Como ejecutar

### 1) Levantar backend

```bash
cd backend
npm install
npm run dev
```

Servidor en: `http://localhost:3000`

### 2) Levantar frontend

En otra terminal:

```bash
cd FRONTEND
npm install
npm run dev
```

Abre la URL que muestra Vite (normalmente `http://localhost:5173`).

## Notas

- No se usa base de datos.
- Los datos se leen desde un arreglo hardcodeado.