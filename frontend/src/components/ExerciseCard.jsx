import AddSetButton from "./AddSetButton.jsx";
import SetTable from "./SetTable.jsx";
import { useSets } from "../hooks/useSets.js";

function ExerciseCard({ exercise, onDeleteExercise }) {
  const {
    sets,
    loading,
    error,
    handleAddSet,
    handleDeleteSet,
    handleUpdateSet,
    handleToggleCompleted,
  } = useSets(exercise.id);

  function handleDeleteExercise() {
    if (
      !window.confirm(
        `Remove "${exercise.name}" from this routine? All sets will be deleted from the database.`
      )
    ) {
      return;
    }
    onDeleteExercise(exercise.id);
  }

  return (
    <article className="exercise-card">
      <header className="exercise-card-header">
        <h3>{exercise.name}</h3>
        <button
          type="button"
          className="danger-button"
          onClick={handleDeleteExercise}
        >
          Delete exercise
        </button>
      </header>

      {loading && <p className="sets-loading">Loading sets...</p>}
      {error && <p className="sets-error">{error}</p>}

      {!loading && (
        <>
          <SetTable
            sets={sets}
            onDeleteSet={handleDeleteSet}
            onToggleCompleted={handleToggleCompleted}
            onUpdateSet={handleUpdateSet}
          />
          <AddSetButton onAddSet={handleAddSet} />
        </>
      )}
    </article>
  );
}

export default ExerciseCard;
