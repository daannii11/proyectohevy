const API_URL = "http://localhost:3000/exercises";

const statusEl = document.getElementById("status");
const tbodyEl = document.getElementById("exercisesBody");

function renderExercises(exercises) {
  tbodyEl.innerHTML = "";

  if (exercises.length === 0) {
    statusEl.textContent = "No exercises found.";
    return;
  }

  for (const exercise of exercises) {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${exercise.id}</td>
      <td>${exercise.name}</td>
    `;

    tbodyEl.appendChild(row);
  }

  statusEl.textContent = `Loaded ${exercises.length} exercises.`;
}

async function loadExercises() {
  console.log("1) Starting request to:", API_URL);

  try {
    // Step 1: send GET request to backend
    const response = await fetch(API_URL);
    console.log("2) Raw response:", response);

    // Step 2: validate HTTP status
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    // Step 3: parse JSON body
    const exercises = await response.json();
    console.log("3) Parsed exercises:", exercises);

    // Step 4: render data in the table
    renderExercises(exercises);
  } catch (error) {
    console.error("Fetch error:", error);
    statusEl.textContent = "Error loading exercises. Check console logs.";
  }
}

loadExercises();
