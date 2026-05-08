function getTypeClass(type) {
  if (type === "warmup") return "set-label set-label-w";
  if (type === "failed") return "set-label set-label-f";
  if (type === "dropset") return "set-label set-label-d";
  return "set-label";
}

function SetRow({ setItem, setLabel, onDeleteSet, onToggleCompleted, onUpdateSet }) {
  return (
    <tr className={setItem.completed ? "row-completed" : ""}>
      <td>
        <span className={getTypeClass(setItem.type)}>{setLabel}</span>
      </td>

      <td>
        <select
          value={setItem.type}
          onChange={(event) => onUpdateSet(setItem.id, "type", event.target.value)}
        >
          <option value="warmup">Warm-up (W)</option>
          <option value="normal">Normal</option>
          <option value="failed">Failed (F)</option>
          <option value="dropset">Dropset (D)</option>
        </select>
      </td>

      <td>
        <input
          type="number"
          min="0"
          step="0.5"
          value={setItem.kg}
          onChange={(event) => onUpdateSet(setItem.id, "kg", event.target.value)}
          placeholder="0"
        />
      </td>

      <td>
        <input
          type="number"
          min="0"
          step="1"
          value={setItem.reps}
          onChange={(event) => onUpdateSet(setItem.id, "reps", event.target.value)}
          placeholder="0"
        />
      </td>

      <td>
        <input
          type="checkbox"
          checked={setItem.completed}
          onChange={() => onToggleCompleted(setItem.id)}
        />
      </td>

      <td>
        <button
          type="button"
          className="danger-button"
          onClick={() => onDeleteSet(setItem.id)}
        >
          Delete
        </button>
      </td>
    </tr>
  );
}

export default SetRow;
