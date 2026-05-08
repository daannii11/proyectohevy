import SetRow from "./SetRow.jsx";

function getSetLabel(setItem, normalIndex) {
  if (setItem.type === "warmup") return "W";
  if (setItem.type === "failed") return "F";
  if (setItem.type === "dropset") return "D";
  return String(normalIndex);
}

function SetTable({ sets, onDeleteSet, onToggleCompleted, onUpdateSet }) {
  if (sets.length === 0) {
    return <p className="empty-sets">No sets yet. Add your first set.</p>;
  }

  let normalCounter = 0;

  return (
    <table className="set-table">
      <thead>
        <tr>
          <th>Set</th>
          <th>Type</th>
          <th>Kg</th>
          <th>Reps</th>
          <th>Done</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {sets.map((setItem) => {
          if (setItem.type === "normal") {
            normalCounter += 1;
          }

          return (
            <SetRow
              key={setItem.id}
              setItem={setItem}
              setLabel={getSetLabel(setItem, normalCounter)}
              onDeleteSet={onDeleteSet}
              onToggleCompleted={onToggleCompleted}
              onUpdateSet={onUpdateSet}
            />
          );
        })}
      </tbody>
    </table>
  );
}

export default SetTable;
