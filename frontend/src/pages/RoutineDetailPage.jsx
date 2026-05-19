import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import AddExerciseForm from "../components/AddExerciseForm.jsx";
import ExerciseList from "../components/ExerciseList.jsx";
import {
  createRoutineExercise,
  deleteExercise,
  fetchRoutineExercises,
} from "../lib/api.js";

function RoutineDetailPage() {
  const { routineId } = useParams();
  const numericRoutineId = Number(routineId);

  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadExercises = useCallback(async () => {
    if (!Number.isInteger(numericRoutineId) || numericRoutineId <= 0) {
      throw new Error("Invalid routine id in URL.");
    }
    return fetchRoutineExercises(numericRoutineId);
  }, [numericRoutineId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await loadExercises();
        if (!cancelled) setExercises(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load exercises.");
          setExercises([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [loadExercises]);

  async function handleAddExercise(name) {
    const created = await createRoutineExercise(numericRoutineId, name);
    setExercises((current) => [...current, created]);
  }

  async function handleDeleteExercise(exerciseId) {
    const previous = exercises;
    setExercises((current) => current.filter((item) => item.id !== exerciseId));

    try {
      await deleteExercise(exerciseId);
    } catch (err) {
      setExercises(previous);
      setError(err instanceof Error ? err.message : "Could not delete exercise.");
    }
  }

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
      {error && <p className="page-error">{error}</p>}
      {!loading && !error && exercises.length === 0 && (
        <p>No exercises in this routine yet. Add one above.</p>
      )}

      {!loading && exercises.length > 0 && (
        <ExerciseList exercises={exercises} onDeleteExercise={handleDeleteExercise} />
      )}
    </section>
  );
}

export default RoutineDetailPage;
