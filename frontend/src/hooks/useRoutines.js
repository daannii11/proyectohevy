import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured } from "../lib/supabase.js";
import {
  MAX_ROUTINES,
  createRoutine,
  deleteRoutine,
  fetchRoutines,
} from "../lib/services/routines.js";
import { toErrorMessage } from "../lib/errors.js";

export function useRoutines() {
  const [routines, setRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error(
        "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY."
      );
    }
    return fetchRoutines();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError("");
      try {
        const data = await load();
        if (!cancelled) setRoutines(data);
      } catch (err) {
        if (!cancelled) {
          setError(toErrorMessage(err, "Could not load routines."));
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

  const addRoutine = useCallback(async (name) => {
    const created = await createRoutine(name);
    setRoutines((current) => [...current, created]);
    return created;
  }, []);

  const removeRoutine = useCallback(async (routineId) => {
    const previous = routines;
    setRoutines((current) => current.filter((item) => item.id !== routineId));
    try {
      await deleteRoutine(routineId);
    } catch (err) {
      setRoutines(previous);
      throw err;
    }
  }, [routines]);

  return {
    routines,
    loading,
    error,
    atLimit: routines.length >= MAX_ROUTINES,
    addRoutine,
    removeRoutine,
  };
}
