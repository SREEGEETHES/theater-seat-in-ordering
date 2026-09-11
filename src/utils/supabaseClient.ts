import { createClient, SupabaseClient } from '@supabase/supabase-js';

const env = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};

const SUPABASE_URL =
  env.VITE_SUPABASE_URL ||
  'https://tpvwgtkjfysiglyjqdtd.supabase.co';

const SUPABASE_ANON_KEY =
  env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdndndGtqZnlzaWdseWpxZHRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5NDkxNzIsImV4cCI6MjEwNDUyNTE3Mn0.HQsyOxux95X1t00ZrC00pn4jYxtNgCZAlM7gc-YZZTY';

let client: SupabaseClient | null = null;

export function getClientSupabase(): SupabaseClient | null {
  if (!client && SUPABASE_URL && SUPABASE_ANON_KEY) {
    try {
      client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.warn('Could not initialize Supabase client:', e);
    }
  }
  return client;
}
