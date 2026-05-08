import ExerciseRow from "./ExerciseRow.jsx";

function ExerciseTable({ exercises }) {
  if (exercises.length === 0) {
    return <p>No exercises found.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        {exercises.map((exercise) => (
          <ExerciseRow key={exercise.id} exercise={exercise} />
        ))}
      </tbody>
    </table>
  );
}

export default ExerciseTable;
