import { assertNoSupabaseError } from "../errors.js";
import { getSupabase } from "../supabase.js";

export const MAX_ROUTINES = 5;

export async function fetchRoutines() {
  const { data, error } = await getSupabase()
    .from("routines")
    .select("id, name, created_at")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  assertNoSupabaseError(error, "Failed to fetch routines");
  return data ?? [];
}

export async function countRoutines() {
  const { count, error } = await getSupabase()
    .from("routines")
    .select("*", { count: "exact", head: true });

  assertNoSupabaseError(error, "Failed to count routines");
  return count ?? 0;
}

export async function createRoutine(name) {
  const total = await countRoutines();
  if (total >= MAX_ROUTINES) {
    throw new Error(`Maximum of ${MAX_ROUTINES} routines allowed`);
  }

  const { data, error } = await getSupabase()
    .from("routines")
    .insert({ name: name.trim() })
    .select("id, name, created_at")
    .single();

  assertNoSupabaseError(error, "Failed to create routine");
  return data;
}

export async function deleteRoutine(routineId) {
  const { error } = await getSupabase().from("routines").delete().eq("id", routineId);
  assertNoSupabaseError(error, "Failed to delete routine");
}
