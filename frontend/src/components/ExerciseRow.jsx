function ExerciseRow({ exercise }) {
  return (
    <tr>
      <td>{exercise.id}</td>
      <td>{exercise.name}</td>
    </tr>
  );
}

export default ExerciseRow;
