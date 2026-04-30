const workouts = require("../data/workouts");

const getWorkouts = (req, res) => {
  res.status(200).json(workouts);
};

module.exports = {
  getWorkouts
};
