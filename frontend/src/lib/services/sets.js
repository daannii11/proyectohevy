import { assertNoSupabaseError } from "../errors.js";
import { getSupabase } from "../supabase.js";

const SET_TYPES = new Set(["warmup", "normal", "failed", "dropset"]);

function parseOptionalKg(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

function parseOptionalReps(value) {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = parseInt(String(value), 10);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

export function mapSetRowToClient(row) {
  return {
    id: row.id,
    type: row.type,
    kg: row.kg == null ? "" : String(row.kg),
    reps: row.reps == null ? "" : String(row.reps),
    completed: Boolean(row.completed),
  };
}

export async function fetchSetsByExercise(exerciseId) {
  const { data, error } = await getSupabase()
    .from("sets")
    .select("id, exercise_id, type, kg, reps, completed, created_at")
    .eq("exercise_id", exerciseId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  assertNoSupabaseError(error, "Failed to fetch sets");
  return (data ?? []).map(mapSetRowToClient);
}

export async function createSet(exerciseId) {
  const { data, error } = await getSupabase()
    .from("sets")
    .insert({
      exercise_id: exerciseId,
      type: "normal",
      kg: null,
      reps: null,
      completed: false,
    })
    .select("id, exercise_id, type, kg, reps, completed, created_at")
    .single();

  assertNoSupabaseError(error, "Failed to create set");
  return mapSetRowToClient(data);
}

export async function updateSet(setId, fields) {
  const payload = {};

  if (fields.type !== undefined) {
    if (!SET_TYPES.has(fields.type)) {
      throw new Error("Invalid set type");
    }
    payload.type = fields.type;
  }

  if (fields.kg !== undefined) payload.kg = parseOptionalKg(fields.kg);
  if (fields.reps !== undefined) payload.reps = parseOptionalReps(fields.reps);
  if (fields.completed !== undefined) payload.completed = fields.completed;

  const { data, error } = await getSupabase()
    .from("sets")
    .update(payload)
    .eq("id", setId)
    .select("id, exercise_id, type, kg, reps, completed, created_at")
    .single();

  assertNoSupabaseError(error, "Failed to update set");
  return mapSetRowToClient(data);
}

export async function deleteSet(setId) {
  const { error } = await getSupabase().from("sets").delete().eq("id", setId);
  assertNoSupabaseError(error, "Failed to delete set");
}
