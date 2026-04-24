import { isSupabaseConfigured } from '@/lib/supabase/config';
import { fetchApprovedMembersForHome } from '@/lib/data/fetch-approved-members';
import HomeClient from '@/components/HomeClient';

// ISR: revalidate every 60 seconds as safety net.
// Actual cache busting on approve happens via revalidatePath('/') in admin actions.
export const revalidate = 60;

export default async function HomePage() {
  const { members, timedOut } = await fetchApprovedMembersForHome();

  if (process.env.NODE_ENV === 'development' && !isSupabaseConfigured()) {
    console.warn(
      '[bracu.network] Add real NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (see .env.example). Skipping database so the page can load.'
    );
  }

  return (
    <HomeClient
      members={members}
      showConfigHint={!isSupabaseConfigured() && process.env.NODE_ENV === 'development'}
      showTimeoutHint={timedOut}
    />
  );
}
