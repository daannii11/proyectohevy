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

function ExerciseCard({ exercise }) {
  const [sets, setSets] = useState([createSet(1)]);
  const [nextSetId, setNextSetId] = useState(2);

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
      <h2>{exercise.name}</h2>
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
