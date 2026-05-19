import { useCallback, useEffect, useState } from "react";
import { toErrorMessage } from "../lib/errors.js";
import { isSupabaseConfigured } from "../lib/supabase.js";
import {
  createExercise,
  deleteExercise,
  fetchExercisesByRoutine,
} from "../lib/services/exercises.js";

export function useExercises(routineId) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error(
        "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
    }
    if (!Number.isInteger(routineId) || routineId <= 0) {
      throw new Error("Invalid routine id in URL.");
    }
    return fetchExercisesByRoutine(routineId);
  }, [routineId]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const data = await load();
        if (!cancelled) setExercises(data);
      } catch (err) {
        if (!cancelled) {
          setError(toErrorMessage(err, "Could not load exercises."));
          setExercises([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const addExercise = useCallback(
    async (name) => {
      const created = await createExercise(routineId, name);
      setExercises((current) => [...current, created]);
      return created;
    },
    [routineId]
  );

  const removeExercise = useCallback(
    async (exerciseId) => {
      const previous = exercises;
      setExercises((current) => current.filter((item) => item.id !== exerciseId));
      try {
        await deleteExercise(exerciseId);
      } catch (err) {
        setExercises(previous);
        throw err;
      }
    },
    [exercises]
  );

  return {
    exercises,
    loading,
    error,
    addExercise,
    removeExercise,
  };
}
