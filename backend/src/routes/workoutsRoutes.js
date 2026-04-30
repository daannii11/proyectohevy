const express = require("express");
const { getWorkouts } = require("../controllers/workoutsController");

const router = express.Router();

router.get("/workouts", getWorkouts);

module.exports = router;
