import { useCallback, useEffect, useRef, useState } from "react";

import { getApiBase } from "../config/api.js";

const API_BASE = getApiBase();

const KG_REPS_DEBOUNCE_MS = 400;

function mapRowToClient(row) {
  return {
    id: row.id,
    type: row.type,
    kg: row.kg == null ? "" : String(row.kg),
    reps: row.reps == null ? "" : String(row.reps),
    completed: Boolean(row.completed),
  };
}

async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

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

  const fetchSets = useCallback(async () => {
    const response = await fetch(`${API_BASE}/exercises/${exerciseId}/sets`);
    const data = await parseJsonResponse(response);
    if (!response.ok) {
      const message =
        data && typeof data.message === "string" ? data.message : `Request failed (${response.status})`;
      throw new Error(message);
    }
    return Array.isArray(data) ? data.map(mapRowToClient) : [];
  }, [exerciseId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const next = await fetchSets();
        if (!cancelled) setSets(next);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load sets.");
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
  }, [exerciseId, fetchSets, clearDebounceTimers]);

  const putSet = useCallback(async (setId, body) => {
    const response = await fetch(`${API_BASE}/sets/${setId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await parseJsonResponse(response);
    if (!response.ok) {
      const message =
        data && typeof data.message === "string" ? data.message : `Update failed (${response.status})`;
      throw new Error(message);
    }
    return mapRowToClient(data);
  }, []);

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
          const updated = await putSet(setId, { kg: row.kg, reps: row.reps });
          setSets((prev) => prev.map((s) => (s.id === setId ? updated : s)));
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not save set.");
          try {
            const fresh = await fetchSets();
            setSets(fresh);
          } catch {
            /* keep last known sets */
          }
        }
      }, KG_REPS_DEBOUNCE_MS);
    },
    [putSet, fetchSets]
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
            const updated = await putSet(setId, { type: value });
            setSets((prev) => prev.map((s) => (s.id === setId ? updated : s)));
          } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save set type.");
            try {
              setSets(await fetchSets());
            } catch {
              /* ignore */
            }
          }
        })();
      }
    },
    [putSet, fetchSets, scheduleKgRepsPersist]
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
          const updated = await putSet(setId, { completed });
          setSets((prev) => prev.map((s) => (s.id === setId ? updated : s)));
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not update completion.");
          try {
            setSets(await fetchSets());
          } catch {
            /* ignore */
          }
        }
      })();
    },
    [putSet, fetchSets]
  );

  const handleAddSet = useCallback(async () => {
    setError("");
    try {
      const response = await fetch(`${API_BASE}/exercises/${exerciseId}/sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "normal",
          kg: null,
          reps: null,
          completed: false,
        }),
      });
      const data = await parseJsonResponse(response);
      if (!response.ok) {
        const message =
          data && typeof data.message === "string" ? data.message : `Create failed (${response.status})`;
        throw new Error(message);
      }
      setSets((prev) => [...prev, mapRowToClient(data)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add set.");
    }
  }, [exerciseId]);

  const handleDeleteSet = useCallback(
    async (setId) => {
      setError("");
      try {
        const response = await fetch(`${API_BASE}/sets/${setId}`, { method: "DELETE" });
        const data = await parseJsonResponse(response);
        if (!response.ok) {
          const message =
            data && typeof data.message === "string" ? data.message : `Delete failed (${response.status})`;
          throw new Error(message);
        }
        setSets((prev) => prev.filter((s) => s.id !== setId));
        if (debounceTimers.current[setId]) {
          clearTimeout(debounceTimers.current[setId]);
          delete debounceTimers.current[setId];
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not delete set.");
      }
    },
    []
  );

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
