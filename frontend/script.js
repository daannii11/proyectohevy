const setsBody = document.getElementById("setsBody");
const addRowBtn = document.getElementById("addRowBtn");

// Creates a new row with all controls and events.
function createRow() {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td>
      <div class="set-cell">
        <select class="set-type">
          <option value="normal">Normal set</option>
          <option value="warmup">Warm-up set</option>
          <option value="failed">Failed set</option>
        </select>
        <span class="set-label normal"></span>
        <button type="button" class="delete-btn" title="Delete row">🗑</button>
      </div>
    </td>
    <td><input type="number" min="0" step="0.5" placeholder="kg"></td>
    <td><input type="number" min="0" step="1" placeholder="reps"></td>
    <td><button type="button" class="done-toggle" title="Toggle done">✓</button></td>
  `;

  const setTypeSelect = row.querySelector(".set-type");
  const deleteBtn = row.querySelector(".delete-btn");
  const doneToggle = row.querySelector(".done-toggle");

  // Any type change can affect normal-set numbering.
  setTypeSelect.addEventListener("change", updateAllSetLabels);

  // Remove row and re-index normal sets.
  deleteBtn.addEventListener("click", () => {
    row.remove();
    updateAllSetLabels();
  });

  // Toggle completion style freely on/off.
  doneToggle.addEventListener("click", () => {
    doneToggle.classList.toggle("active");
    row.classList.toggle("completed");
  });

  setsBody.appendChild(row);
  updateAllSetLabels();
}

// Recomputes all labels so normal sets are always 1..N.
function updateAllSetLabels() {
  let normalCount = 0;
  const rows = setsBody.querySelectorAll("tr");

  rows.forEach((row) => {
    const setType = row.querySelector(".set-type").value;
    const label = row.querySelector(".set-label");
    label.className = "set-label";

    if (setType === "warmup") {
      label.textContent = "W";
      label.classList.add("warmup");
    } else if (setType === "failed") {
      label.textContent = "F";
      label.classList.add("failed");
    } else {
      normalCount += 1;
      label.textContent = String(normalCount);
      label.classList.add("normal");
    }
  });
}

addRowBtn.addEventListener("click", createRow);

// Start with one row so it's immediately usable.
createRow();
