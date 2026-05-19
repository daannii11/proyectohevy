import { useCallback, useEffect, useRef, useState } from "react";
import { toErrorMessage } from "../lib/errors.js";
import {
  createSet,
  deleteSet,
  fetchSetsByExercise,
  updateSet,
} from "../lib/services/sets.js";

const KG_REPS_DEBOUNCE_MS = 400;

export function useSets(exerciseId) {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const setsRef = useRef(sets);
  const debounceTimers = useRef({});

  setsRef.current = sets;

  const clearDebounceTimers = useCallback(() => {
    Object.values(debounceTimers.current).forEach((t) => clearTimeout(t));
    debounceTimers.current = {};
  }, []);

  const reloadSets = useCallback(async () => {
    return fetchSetsByExercise(exerciseId);
  }, [exerciseId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const next = await reloadSets();
        if (!cancelled) setSets(next);
      } catch (err) {
        if (!cancelled) {
          setError(toErrorMessage(err, "Could not load sets."));
          setSets([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      clearDebounceTimers();
    };
  }, [exerciseId, reloadSets, clearDebounceTimers]);

  const scheduleKgRepsPersist = useCallback(
    (setId) => {
      if (debounceTimers.current[setId]) {
        clearTimeout(debounceTimers.current[setId]);
      }

      debounceTimers.current[setId] = setTimeout(async () => {
        delete debounceTimers.current[setId];
        const row = setsRef.current.find((s) => s.id === setId);
        if (!row) return;

        try {
          const updated = await updateSet(setId, { kg: row.kg, reps: row.reps });
          setSets((prev) => prev.map((s) => (s.id === setId ? updated : s)));
        } catch (err) {
          setError(toErrorMessage(err, "Could not save set."));
          try {
            setSets(await reloadSets());
          } catch {
            /* keep last known sets */
          }
        }
      }, KG_REPS_DEBOUNCE_MS);
    },
    [reloadSets]
  );

  const handleUpdateSet = useCallback(
    (setId, field, value) => {
      setSets((prev) =>
        prev.map((s) => (s.id === setId ? { ...s, [field]: value } : s))
      );

      if (field === "kg" || field === "reps") {
        scheduleKgRepsPersist(setId);
        return;
      }

      if (field === "type") {
        void (async () => {
          try {
            const updated = await updateSet(setId, { type: value });
            setSets((prev) => prev.map((s) => (s.id === setId ? updated : s)));
          } catch (err) {
            setError(toErrorMessage(err, "Could not save set type."));
            try {
              setSets(await reloadSets());
            } catch {
              /* ignore */
            }
          }
        })();
      }
    },
    [reloadSets, scheduleKgRepsPersist]
  );

  const handleToggleCompleted = useCallback(
    (setId) => {
      const current = setsRef.current.find((s) => s.id === setId);
      if (!current) return;
      const completed = !current.completed;

      setSets((prev) =>
        prev.map((s) => (s.id === setId ? { ...s, completed } : s))
      );

      void (async () => {
        try {
          const updated = await updateSet(setId, { completed });
          setSets((prev) => prev.map((s) => (s.id === setId ? updated : s)));
        } catch (err) {
          setError(toErrorMessage(err, "Could not update completion."));
          try {
            setSets(await reloadSets());
          } catch {
            /* ignore */
          }
        }
      })();
    },
    [reloadSets]
  );

  const handleAddSet = useCallback(async () => {
    setError("");
    try {
      const created = await createSet(exerciseId);
      setSets((prev) => [...prev, created]);
    } catch (err) {
      setError(toErrorMessage(err, "Could not add set."));
    }
  }, [exerciseId]);

  const handleDeleteSet = useCallback(async (setId) => {
    setError("");
    try {
      await deleteSet(setId);
      setSets((prev) => prev.filter((s) => s.id !== setId));
      if (debounceTimers.current[setId]) {
        clearTimeout(debounceTimers.current[setId]);
        delete debounceTimers.current[setId];
      }
    } catch (err) {
      setError(toErrorMessage(err, "Could not delete set."));
    }
  }, []);

  return {
    sets,
    loading,
    error,
    handleAddSet,
    handleDeleteSet,
    handleUpdateSet,
    handleToggleCompleted,
  };
}
