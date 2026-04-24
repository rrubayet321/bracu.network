/**
 * True when public Supabase env vars look real (not empty / not .env.example placeholders).
 * Use before calling createClient() in routes that must render without hanging on bad URLs.
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return false;
  if (url.includes('xxxxx') || /your[_ ]?anon/i.test(key)) return false;
  return true;
}
