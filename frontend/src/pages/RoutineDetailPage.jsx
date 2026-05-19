import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import AddExerciseForm from "../components/AddExerciseForm.jsx";
import ExerciseList from "../components/ExerciseList.jsx";
import { useExercises } from "../hooks/useExercises.js";
import { toErrorMessage } from "../lib/errors.js";

function RoutineDetailPage() {
  const { routineId } = useParams();
  const numericRoutineId = Number(routineId);

  const { exercises, loading, error, addExercise, removeExercise } =
    useExercises(numericRoutineId);
  const [actionError, setActionError] = useState("");

  async function handleAddExercise(name) {
    setActionError("");
    try {
      await addExercise(name);
    } catch (err) {
      setActionError(toErrorMessage(err, "Could not add exercise."));
    }
  }

  async function handleDeleteExercise(exerciseId) {
    setActionError("");
    try {
      await removeExercise(exerciseId);
    } catch (err) {
      setActionError(toErrorMessage(err, "Could not delete exercise."));
    }
  }

  const displayError = actionError || error;

  return (
    <section className="routine-detail-page">
      <nav className="breadcrumb">
        <Link to="/">← All routines</Link>
      </nav>

      <header className="page-toolbar">
        <h2>Routine workout</h2>
      </header>

      <AddExerciseForm onAddExercise={handleAddExercise} />

      {loading && <p>Loading exercises...</p>}
      {displayError && <p className="page-error">{displayError}</p>}
      {!loading && !displayError && exercises.length === 0 && (
        <p>No exercises in this routine yet. Add one above.</p>
      )}

      {!loading && exercises.length > 0 && (
        <ExerciseList exercises={exercises} onDeleteExercise={handleDeleteExercise} />
      )}
    </section>
  );
}

export default RoutineDetailPage;
