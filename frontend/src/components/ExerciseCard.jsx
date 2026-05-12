import { useState } from "react";
import AddSetButton from "./AddSetButton.jsx";
import SetTable from "./SetTable.jsx";

function createSet(id) {
  return {
    id,
    type: "normal",
    kg: "",
    reps: "",
    completed: false,
  };
}

function ExerciseCard({ exercise, onDeleteExercise }) {
  const [sets, setSets] = useState([createSet(1)]);
  const [nextSetId, setNextSetId] = useState(2);

  function handleDeleteExercise() {
    if (
      !window.confirm(
        `Remove "${exercise.name}" from this workout? All sets on this card will be deleted from the database.`
      )
    ) {
      return;
    }
    onDeleteExercise(exercise.id);
  }

  function handleAddSet() {
    setSets((currentSets) => [...currentSets, createSet(nextSetId)]);
    setNextSetId((currentId) => currentId + 1);
  }

  function handleDeleteSet(setId) {
    setSets((currentSets) => currentSets.filter((setItem) => setItem.id !== setId));
  }

  function handleUpdateSet(setId, field, value) {
    setSets((currentSets) =>
      currentSets.map((setItem) => {
        if (setItem.id !== setId) return setItem;
        return { ...setItem, [field]: value };
      })
    );
  }

  function handleToggleCompleted(setId) {
    setSets((currentSets) =>
      currentSets.map((setItem) => {
        if (setItem.id !== setId) return setItem;
        return { ...setItem, completed: !setItem.completed };
      })
    );
  }

  return (
    <article className="exercise-card">
      <header className="exercise-card-header">
        <h2>{exercise.name}</h2>
        <button
          type="button"
          className="danger-button"
          onClick={handleDeleteExercise}
        >
          Delete exercise
        </button>
      </header>
      <SetTable
        sets={sets}
        onDeleteSet={handleDeleteSet}
        onToggleCompleted={handleToggleCompleted}
        onUpdateSet={handleUpdateSet}
      />
      <AddSetButton onAddSet={handleAddSet} />
    </article>
  );
}

export default ExerciseCard;
