import { useState } from "react";
import CreateRoutineModal from "../components/CreateRoutineModal.jsx";
import RoutineCard from "../components/RoutineCard.jsx";
import { MAX_ROUTINES } from "../lib/services/routines.js";
import { useRoutines } from "../hooks/useRoutines.js";
import { toErrorMessage } from "../lib/errors.js";

function RoutinesPage() {
  const { routines, loading, error, atLimit, addRoutine, removeRoutine } = useRoutines();
  const [actionError, setActionError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  async function handleCreate(name) {
    setActionError("");
    await addRoutine(name);
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

    setActionError("");
    try {
      await removeRoutine(routineId);
    } catch (err) {
      setActionError(toErrorMessage(err, "Could not delete routine."));
    }
  }

  const displayError = actionError || error;

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
      {displayError && <p className="page-error">{displayError}</p>}

      {!loading && !displayError && routines.length === 0 && (
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
