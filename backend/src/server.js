const express = require("express");
const cors = require("cors");
const workoutsRoutes = require("./routes/workoutsRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(workoutsRoutes);

app.get("/", (req, res) => {
  res.send("Backend running. Use GET /workouts");
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
