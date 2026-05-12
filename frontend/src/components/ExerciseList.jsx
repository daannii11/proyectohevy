import ExerciseCard from "./ExerciseCard.jsx";

function ExerciseList({ exercises, onDeleteExercise }) {
  return (
    <section className="exercise-grid">
      {exercises.map((exercise) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          onDeleteExercise={onDeleteExercise}
        />
      ))}
    </section>
  );
}

export default ExerciseList;
