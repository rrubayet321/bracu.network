import 'server-only'; // Build error if accidentally imported in a Client Component
import { createClient } from '@supabase/supabase-js';

/**
 * Returns a Supabase client with service_role key.
 * Bypasses ALL RLS policies.
 *
 * NEVER import this in Client Components.
 * NEVER expose the returned client to the browser.
 * Call inside Server Actions and Route Handlers ONLY.
 */
export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only secret — never exposed to browser
  );
}
