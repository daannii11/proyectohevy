# Backend Node.js + Express + PostgreSQL

## 1) Pasos para ejecutar el backend

1. Instala dependencias:

```bash
npm install
```

2. Crea el archivo `.env` basado en `.env.example`:

```bash
cp .env.example .env
```

En Windows PowerShell puedes usar:

```powershell
Copy-Item .env.example .env
```

3. Ejecuta el servidor:

```bash
npm run dev
```

## 2) Configurar PostgreSQL local (pgAdmin)

1. Crea una base de datos llamada:

`mi_app_db`

2. Ejecuta este SQL:

```sql
CREATE TABLE test (
  id SERIAL PRIMARY KEY,
  name TEXT
);

INSERT INTO test (name) VALUES ('hola mundo');
```

## 3) URLs de prueba

- http://localhost:3000/api/test
- http://localhost:3000/api/test-data

## 4) Posibles errores y soluciones

- **Error de conexión a DB**: revisa que PostgreSQL esté encendido y que `DB_HOST` y `DB_PORT` sean correctos.
- **Password incorrecta**: valida `DB_PASSWORD` en tu `.env`.
- **Base de datos no existe**: crea `mi_app_db` en pgAdmin y vuelve a intentar.
