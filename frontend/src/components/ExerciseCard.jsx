import AddSetButton from "./AddSetButton.jsx";
import SetTable from "./SetTable.jsx";
import { useSets } from "../hooks/useSets.js";

function ExerciseCard({ exercise }) {
  const {
    sets,
    loading,
    error,
    handleAddSet,
    handleDeleteSet,
    handleUpdateSet,
    handleToggleCompleted,
  } = useSets(exercise.id);

  return (
    <article className="exercise-card">
      <h2>{exercise.name}</h2>

      {loading && <p className="sets-loading">Loading sets…</p>}
      {error && <p className="sets-error">{error}</p>}

      {!loading && (
        <SetTable
          sets={sets}
          onDeleteSet={handleDeleteSet}
          onToggleCompleted={handleToggleCompleted}
          onUpdateSet={handleUpdateSet}
        />
      )}

      <AddSetButton onAddSet={handleAddSet} />
    </article>
  );
}

export default ExerciseCard;
