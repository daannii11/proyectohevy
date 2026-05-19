import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let client = null;

/**
 * createClient expects the project URL only:
 *   https://YOUR_REF.supabase.co
 * NOT the REST endpoint (…/rest/v1) — that causes
 * "Invalid path specified in request URL".
 */
export function normalizeSupabaseUrl(url) {
  if (typeof url !== "string") return "";
  let normalized = url.trim();
  normalized = normalized.replace(/\/+$/, "");
  normalized = normalized.replace(/\/rest\/v1$/i, "");
  return normalized;
}

const supabaseUrl = normalizeSupabaseUrl(rawUrl);

export function isSupabaseConfigured() {
  return Boolean(
    supabaseUrl !== "" &&
      typeof supabaseAnonKey === "string" &&
      supabaseAnonKey.trim() !== ""
  );
}

/** Lazy client — avoids crashing the app when env vars are missing at import time. */
export function getSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel and redeploy."
    );
  }

  if (!client) {
    client = createClient(supabaseUrl, supabaseAnonKey.trim());
  }

  return client;
}
