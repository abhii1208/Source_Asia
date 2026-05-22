import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

type PublicSupabaseEnv = {
  url: string;
  publishableKey: string;
};

function getPublicSupabaseEnv(): PublicSupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) {
    return null;
  }

  return { url, publishableKey };
}

let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClientError(): string | null {
  if (getPublicSupabaseEnv()) {
    return null;
  }
  return "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) in .env.local.";
}

export function createSupabaseBrowserClient(): SupabaseClient | null {
  if (browserClient) {
    return browserClient;
  }

  const env = getPublicSupabaseEnv();
  if (!env) {
    return null;
  }

  const { url, publishableKey } = env;
  browserClient = createBrowserClient(url, publishableKey);
  return browserClient;
}
