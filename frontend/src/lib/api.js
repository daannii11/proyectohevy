import { getApiBase } from "../config/api.js";

const API_BASE = getApiBase();

export const MAX_ROUTINES = 5;

export async function parseJsonResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function getErrorMessage(data, fallback) {
  if (data && typeof data.message === "string") return data.message;
  return fallback;
}

export async function fetchRoutines() {
  const response = await fetch(`${API_BASE}/routines`);
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, `Request failed (${response.status})`));
  }
  return Array.isArray(data) ? data : [];
}

export async function createRoutine(name) {
  const response = await fetch(`${API_BASE}/routines`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, `Create failed (${response.status})`));
  }
  return data;
}

export async function deleteRoutine(routineId) {
  const response = await fetch(`${API_BASE}/routines/${routineId}`, {
    method: "DELETE",
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, `Delete failed (${response.status})`));
  }
}

export async function fetchRoutineExercises(routineId) {
  const response = await fetch(`${API_BASE}/routines/${routineId}/exercises`);
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, `Request failed (${response.status})`));
  }
  return Array.isArray(data) ? data : [];
}

export async function createRoutineExercise(routineId, name) {
  const response = await fetch(`${API_BASE}/routines/${routineId}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, `Create failed (${response.status})`));
  }
  return data;
}

export async function deleteExercise(exerciseId) {
  const response = await fetch(`${API_BASE}/exercises/${exerciseId}`, {
    method: "DELETE",
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(getErrorMessage(data, `Delete failed (${response.status})`));
  }
}
