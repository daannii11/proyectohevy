const workouts = [
  {
    id: 1,
    name: "Full Body Beginner",
    exercises: [
      { name: "Squat", sets: 3, reps: 12 },
      { name: "Push-up", sets: 3, reps: 10 },
      { name: "Plank", sets: 3, reps: 30 }
    ]
  },
  {
    id: 2,
    name: "Upper Body Strength",
    exercises: [
      { name: "Bench Press", sets: 4, reps: 8 },
      { name: "Pull-up", sets: 4, reps: 6 },
      { name: "Shoulder Press", sets: 3, reps: 10 }
    ]
  },
  {
    id: 3,
    name: "Leg Day",
    exercises: [
      { name: "Deadlift", sets: 4, reps: 5 },
      { name: "Lunges", sets: 3, reps: 12 },
      { name: "Calf Raises", sets: 4, reps: 15 }
    ]
  }
];

module.exports = workouts;
