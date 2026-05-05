/**
 * Apply saved theme as soon as script runs.
 * Stored separately from workout data.
 */
(function () {
  "use strict";

  try {
    if (localStorage.getItem("proyectohevy-theme") === "dark") {
      document.body.classList.add("dark");
    }
  } catch (_) {}
})();

/**
 * Architecture (component-style vanilla JS)
 * -----------------------------------------
 * - ExerciseModel / SetRow: plain objects (serializable shape).
 * - createExerciseComponent(model, host): one “component” instance — owns its DOM
 *   subtree, wires events, reads/writes only its `model`. Returns { model, element, mount, unmount }.
 * - createWorkoutApp(root): shell — suggestion datalist, empty state, Map registry keyed by exercise id,
 *   localStorage snapshot (debounced) so the workout survives refresh.
 *
 * SetRow: { id, type: 'normal'|'warmup'|'failed'|'dropset', weight, reps, done }
 * ExerciseModel: { id, name, sets: SetRow[] }
 */
(function () {
  "use strict";

  // --- ids ---------------------------------------------------------------

  let idSeq = 0;
  function uid(prefix) {
    idSeq += 1;
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return prefix + "-" + crypto.randomUUID();
    }
    return prefix + "-" + idSeq + "-" + Date.now().toString(36);
  }

  // --- pure helpers (no component state) ---------------------------------

  function reindexNormalSetLabels(tbody) {
    let normalCount = 0;
    tbody.querySelectorAll("tr").forEach((row) => {
      const setType = row.querySelector(".set-type").value;
      const label = row.querySelector(".set-label");
      label.className = "set-label";

      if (setType === "warmup") {
        label.textContent = "W";
        label.classList.add("warmup");
      } else if (setType === "failed") {
        label.textContent = "F";
        label.classList.add("failed");
      } else if (setType === "dropset") {
        /* Special type: fixed “D” badge; does not consume a normal-set index. */
        label.textContent = "D";
        label.classList.add("dropset");
      } else {
        /* Only true normal sets advance 1…n. */
        normalCount += 1;
        label.textContent = String(normalCount);
        label.classList.add("normal");
      }
    });
  }

  function createEmptySet() {
    return {
      id: uid("set"),
      type: "normal",
      weight: "",
      reps: "",
      done: false,
    };
  }

  function createExerciseModel(initialName) {
    return {
      id: uid("ex"),
      name: initialName != null ? initialName : "",
      sets: [createEmptySet()],
    };
  }

  // --- localStorage snapshot ---------------------------------------------

  const WORKOUT_STORAGE_KEY = "proyectohevy-workout-v1";

  function normalizeSetRow(raw) {
    if (!raw || typeof raw !== "object") return null;
    const type = ["normal", "warmup", "failed", "dropset"].includes(raw.type) ? raw.type : "normal";
    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : uid("set"),
      type,
      weight: raw.weight != null ? String(raw.weight) : "",
      reps: raw.reps != null ? String(raw.reps) : "",
      done: Boolean(raw.done),
    };
  }

  function normalizeExerciseModel(raw) {
    if (!raw || typeof raw !== "object") return null;
    const setsIn = Array.isArray(raw.sets) ? raw.sets : [];
    const sets = setsIn.map(normalizeSetRow).filter(Boolean);
    if (sets.length === 0) {
      sets.push(createEmptySet());
    }
    return {
      id: typeof raw.id === "string" && raw.id ? raw.id : uid("ex"),
      name: raw.name != null ? String(raw.name) : "",
      sets,
    };
  }

  function loadWorkoutSnapshot() {
    try {
      const raw = localStorage.getItem(WORKOUT_STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return null;
      const names = Array.isArray(data.usedExerciseNames)
        ? data.usedExerciseNames.filter((n) => typeof n === "string" && n.trim())
        : [];
      const exercisesRaw = Array.isArray(data.exercises) ? data.exercises : [];
      const exercises = exercisesRaw.map(normalizeExerciseModel).filter(Boolean);
      return {
        usedExerciseNames: [...new Set(names.map((n) => n.trim()))],
        exercises,
      };
    } catch {
      return null;
    }
  }

  /**
   * One exercise block: card DOM + behavior. All set rows close over the same model + tbody.
   *
   * @param {ReturnType<createExerciseModel>} model
   * @param {{
   *   rememberName: (name: string) => void;
   *   removeExerciseById: (exerciseId: string) => void;
   *   schedulePersist: () => void;
   * }} host
   */
  function createExerciseComponent(model, host) {
    const root = document.createElement("section");
    root.className = "exercise-card";
    root.dataset.exerciseId = model.id;
    root.setAttribute("data-exercise-id", model.id);

    const tbody = document.createElement("tbody");

    function syncSetFromRow(row, setId) {
      const set = model.sets.find((s) => s.id === setId);
      if (!set) return;
      set.type = row.querySelector(".set-type").value;
      set.weight = row.querySelector('input[data-field="weight"]').value;
      set.reps = row.querySelector('input[data-field="reps"]').value;
      set.done = row.querySelector(".done-toggle").classList.contains("active");
    }

    function renderSetRow(set) {
      const row = document.createElement("tr");
      if (set.done) row.classList.add("completed");

      row.innerHTML =
        "<td>" +
        '<div class="set-cell">' +
        '<select class="set-type">' +
        '<option value="normal">Normal set</option>' +
        '<option value="warmup">Warm-up set</option>' +
        '<option value="failed">Failed set</option>' +
        '<option value="dropset">Dropset</option>' +
        "</select>" +
        '<span class="set-label normal"></span>' +
        '<button type="button" class="delete-btn" title="Delete row">🗑</button>' +
        "</div>" +
        "</td>" +
        '<td><input type="number" min="0" step="0.5" placeholder="kg" data-field="weight" /></td>' +
        '<td><input type="number" min="0" step="1" placeholder="reps" data-field="reps" /></td>' +
        '<td><button type="button" class="done-toggle" title="Toggle done">✓</button></td>';

      row.querySelector(".set-type").value = set.type;
      row.querySelector('[data-field="weight"]').value = set.weight;
      row.querySelector('[data-field="reps"]').value = set.reps;
      const doneToggle = row.querySelector(".done-toggle");
      if (set.done) doneToggle.classList.add("active");

      row.querySelector(".set-type").addEventListener("change", () => {
        syncSetFromRow(row, set.id);
        reindexNormalSetLabels(tbody);
        host.schedulePersist();
      });

      row.querySelector(".delete-btn").addEventListener("click", () => {
        model.sets = model.sets.filter((s) => s.id !== set.id);
        row.remove();
        reindexNormalSetLabels(tbody);
        host.schedulePersist();
      });

      doneToggle.addEventListener("click", () => {
        doneToggle.classList.toggle("active");
        row.classList.toggle("completed");
        syncSetFromRow(row, set.id);
        host.schedulePersist();
      });

      row.querySelector('[data-field="weight"]').addEventListener("input", () => {
        syncSetFromRow(row, set.id);
        host.schedulePersist();
      });
      row.querySelector('[data-field="reps"]').addEventListener("input", () => {
        syncSetFromRow(row, set.id);
        host.schedulePersist();
      });

      return row;
    }

    function addSet() {
      const set = createEmptySet();
      model.sets.push(set);
      tbody.appendChild(renderSetRow(set));
      reindexNormalSetLabels(tbody);
      host.schedulePersist();
    }

    function buildDom() {
      const header = document.createElement("div");
      header.className = "exercise-card-header";

      const nameWrap = document.createElement("div");
      nameWrap.className = "name-field";
      const nameLabel = document.createElement("label");
      nameLabel.htmlFor = "ex-name-" + model.id;
      nameLabel.textContent = "Exercise name";
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.id = "ex-name-" + model.id;
      nameInput.setAttribute("list", "exercise-name-suggestions");
      nameInput.placeholder = "e.g. Bench press";
      nameInput.value = model.name;
      nameInput.addEventListener("input", () => {
        model.name = nameInput.value;
        host.schedulePersist();
      });
      nameInput.addEventListener("blur", () => {
        host.rememberName(nameInput.value);
      });
      nameWrap.appendChild(nameLabel);
      nameWrap.appendChild(nameInput);

      const actions = document.createElement("div");
      actions.className = "toolbar-actions";
      const removeExBtn = document.createElement("button");
      removeExBtn.type = "button";
      removeExBtn.className = "btn-danger";
      removeExBtn.textContent = "Remove exercise";
      removeExBtn.setAttribute("data-exercise-id", model.id);
      removeExBtn.addEventListener("click", () => {
        host.removeExerciseById(model.id);
      });
      actions.appendChild(removeExBtn);
      header.appendChild(nameWrap);
      header.appendChild(actions);

      const toolbar = document.createElement("div");
      toolbar.className = "toolbar";
      const addSetBtn = document.createElement("button");
      addSetBtn.type = "button";
      addSetBtn.className = "btn-primary";
      addSetBtn.textContent = "+ Add Set";
      addSetBtn.addEventListener("click", addSet);
      toolbar.appendChild(addSetBtn);

      const table = document.createElement("table");
      const thead = document.createElement("thead");
      thead.innerHTML =
        "<tr><th>Set type</th><th>Weight (kg)</th><th>Reps</th><th>Done</th></tr>";
      table.appendChild(thead);
      table.appendChild(tbody);

      const hint = document.createElement("p");
      hint.className = "hint";
      hint.textContent =
        "W = warm-up, D = dropset, F = failed; only normal sets are numbered 1…n within this exercise.";

      root.appendChild(header);
      root.appendChild(toolbar);
      root.appendChild(table);
      root.appendChild(hint);

      model.sets.forEach((set) => {
        tbody.appendChild(renderSetRow(set));
      });
      reindexNormalSetLabels(tbody);
    }

    buildDom();

    return {
      model,
      element: root,
      mount(parent) {
        parent.appendChild(root);
      },
      unmount() {
        root.remove();
      },
    };
  }

  // --- app shell ---------------------------------------------------------

  function createWorkoutApp(mountEl, addBtn, suggestionListEl) {
    /** @type {Map<string, ReturnType<createExerciseComponent>>} */
    const exerciseComponentsById = new Map();

    /** @type {string[]} */
    const usedExerciseNames = [];

    let persistTimer = null;

    function persistWorkout() {
      const exercises = Array.from(exerciseComponentsById.values()).map((c) => c.model);
      const payload = {
        version: 1,
        usedExerciseNames: usedExerciseNames.slice(),
        exercises,
      };
      try {
        localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(payload));
      } catch (_) {
        /* private mode / quota */
      }
    }

    function schedulePersist() {
      if (persistTimer) clearTimeout(persistTimer);
      persistTimer = setTimeout(function () {
        persistTimer = null;
        persistWorkout();
      }, 200);
    }

    function rememberExerciseName(name) {
      const trimmed = (name || "").trim();
      if (!trimmed) return;
      if (!usedExerciseNames.includes(trimmed)) {
        usedExerciseNames.push(trimmed);
        refreshSuggestionDatalist();
      }
      schedulePersist();
    }

    function refreshSuggestionDatalist() {
      suggestionListEl.innerHTML = "";
      usedExerciseNames.forEach((n) => {
        const opt = document.createElement("option");
        opt.value = n;
        suggestionListEl.appendChild(opt);
      });
    }

    function renderEmptyState() {
      mountEl.innerHTML = "";
      const p = document.createElement("p");
      p.className = "exercises-empty";
      p.textContent = 'No exercises yet. Click "Add Exercise" to start.';
      mountEl.appendChild(p);
    }

    function clearEmptyPlaceholder() {
      const empty = mountEl.querySelector(".exercises-empty");
      if (empty) empty.remove();
    }

    function removeExerciseById(exerciseId) {
      const comp = exerciseComponentsById.get(exerciseId);
      if (!comp) return;
      comp.unmount();
      exerciseComponentsById.delete(exerciseId);
      if (exerciseComponentsById.size === 0) renderEmptyState();
      schedulePersist();
    }

    function mountExerciseModel(model) {
      const comp = createExerciseComponent(model, {
        rememberName: rememberExerciseName,
        removeExerciseById,
        schedulePersist,
      });
      exerciseComponentsById.set(model.id, comp);
      clearEmptyPlaceholder();
      comp.mount(mountEl);
    }

    function addExercise(initialName) {
      const model = createExerciseModel(initialName);
      mountExerciseModel(model);
      if (model.name.trim()) rememberExerciseName(model.name);
      schedulePersist();
    }

    function initFromStorage() {
      const snap = loadWorkoutSnapshot();
      if (snap && snap.exercises.length > 0) {
        usedExerciseNames.length = 0;
        snap.usedExerciseNames.forEach(function (n) {
          if (!usedExerciseNames.includes(n)) usedExerciseNames.push(n);
        });
        refreshSuggestionDatalist();
        snap.exercises.forEach(mountExerciseModel);
      } else {
        addExercise("");
      }
    }

    addBtn.addEventListener("click", () => {
      addExercise("");
    });

    refreshSuggestionDatalist();
    initFromStorage();

    return { addExercise };
  }

  createWorkoutApp(
    document.getElementById("exercisesMount"),
    document.getElementById("addExerciseBtn"),
    document.getElementById("exercise-name-suggestions")
  );
})();

/**
 * Theme toggle: `body.dark` switches CSS variables.
 * Preference stored under `proyectohevy-theme`.
 */
(function () {
  "use strict";

  var THEME_KEY = "proyectohevy-theme";
  var btn = document.getElementById("themeToggleBtn");
  if (!btn) return;

  function isDark() {
    return document.body.classList.contains("dark");
  }

  function applyTheme(dark) {
    document.body.classList.toggle("dark", dark);
    try {
      localStorage.setItem(THEME_KEY, dark ? "dark" : "light");
    } catch (_) {}
    btn.setAttribute("aria-pressed", dark ? "true" : "false");
    btn.textContent = dark ? "Light mode" : "Dark mode";
  }

  btn.addEventListener("click", function () {
    applyTheme(!isDark());
  });

  applyTheme(isDark());
})();
