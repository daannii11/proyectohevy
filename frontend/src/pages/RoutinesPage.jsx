import { useEffect, useState } from "react";
import CreateRoutineModal from "../components/CreateRoutineModal.jsx";
import RoutineCard from "../components/RoutineCard.jsx";
import {
  MAX_ROUTINES,
  createRoutine,
  deleteRoutine,
  fetchRoutines,
} from "../lib/api.js";

function RoutinesPage() {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await fetchRoutines();
        if (!cancelled) setRoutines(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load routines.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const atLimit = routines.length >= MAX_ROUTINES;

  async function handleCreate(name) {
    const created = await createRoutine(name);
    setRoutines((current) => [...current, created]);
  }

  async function handleDelete(routineId) {
    const routine = routines.find((item) => item.id === routineId);
    if (
      !window.confirm(
        `Delete "${routine?.name ?? "this routine"}"? All exercises and sets inside it will be removed.`
      )
    ) {
      return;
    }

    const previous = routines;
    setRoutines((current) => current.filter((item) => item.id !== routineId));

    try {
      await deleteRoutine(routineId);
    } catch (err) {
      setRoutines(previous);
      setError(err instanceof Error ? err.message : "Could not delete routine.");
    }
  }

  return (
    <section className="routines-page">
      <header className="page-toolbar">
        <div>
          <h2>My routines</h2>
          <p className="page-subtitle">
            {routines.length} / {MAX_ROUTINES} routines
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          disabled={atLimit}
          onClick={() => setIsModalOpen(true)}
        >
          Create routine
        </button>
      </header>

      {atLimit && (
        <p className="info-banner">You reached the maximum of {MAX_ROUTINES} routines.</p>
      )}

      {loading && <p>Loading routines...</p>}
      {error && <p className="page-error">{error}</p>}

      {!loading && !error && routines.length === 0 && (
        <p>No routines yet. Create your first one to start tracking workouts.</p>
      )}

      {!loading && routines.length > 0 && (
        <div className="routine-grid">
          {routines.map((routine) => (
            <RoutineCard key={routine.id} routine={routine} onDelete={handleDelete} />
          ))}
        </div>
      )}

      <CreateRoutineModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />

    </section>
  );
}

export default RoutinesPage;
