import { Link } from "react-router-dom";

function formatDate(isoString) {
  if (!isoString) return "";
  return new Date(isoString).toLocaleDateString();
}

function RoutineCard({ routine, onDelete }) {
  return (
    <article className="routine-card">
      <div className="routine-card-body">
        <h2>
          <Link to={`/routines/${routine.id}`} className="routine-link">
            {routine.name}
          </Link>
        </h2>
        <p className="routine-meta">Created {formatDate(routine.created_at)}</p>
      </div>
      <div className="routine-card-actions">
        <Link to={`/routines/${routine.id}`} className="primary-button">
          Open workout
        </Link>
        <button type="button" className="danger-button" onClick={() => onDelete(routine.id)}>
          Delete
        </button>
      </div>
    </article>
  );
}

export default RoutineCard;
