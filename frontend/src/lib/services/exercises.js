import { assertNoSupabaseError } from "../errors.js";
import { getSupabase } from "../supabase.js";

export async function fetchExercisesByRoutine(routineId) {
  const { data, error } = await getSupabase()
    .from("exercises")
    .select("id, name, routine_id")
    .eq("routine_id", routineId)
    .order("id", { ascending: true });

  assertNoSupabaseError(error, "Failed to fetch exercises");
  return data ?? [];
}

export async function createExercise(routineId, name) {
  const { data, error } = await getSupabase()
    .from("exercises")
    .insert({ name: name.trim(), routine_id: routineId })
    .select("id, name, routine_id")
    .single();

  assertNoSupabaseError(error, "Failed to create exercise");
  return data;
}

export async function deleteExercise(exerciseId) {
  const { error } = await getSupabase().from("exercises").delete().eq("id", exerciseId);
  assertNoSupabaseError(error, "Failed to delete exercise");
}
