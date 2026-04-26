import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { withTimeout } from '@/lib/with-timeout';
import type { Member } from '@/types/member';

const SELECT =
  'id, slug, name, member_type, website, department, batch, roles, interests, profile_pic, instagram, twitter, linkedin, github, connections, created_at, updated_at, is_approved' as const;

/** Avoid hanging SSR when Supabase is misconfigured, blocked, or very slow. */
const QUERY_TIMEOUT_MS = 12_000;

export type FetchMembersOutcome =
  | { members: Member[]; timedOut: false }
  | { members: Member[]; timedOut: true };

export async function fetchApprovedMembersForHome(): Promise<FetchMembersOutcome> {
  if (!isSupabaseConfigured()) {
    return { members: [], timedOut: false };
  }

  const supabase = await createClient();
  const query = supabase
    .from('members')
    .select(SELECT)
    .eq('is_approved', true)
    .order('created_at', { ascending: true });

  try {
    const { data, error } = await withTimeout(
      query,
      QUERY_TIMEOUT_MS,
      () => {
        console.error(
          `[bracu.network] Supabase home query did not complete within ${QUERY_TIMEOUT_MS}ms. Check NEXT_PUBLIC_SUPABASE_URL, network, and VPN/firewall.`
        );
      }
    );
    if (error) {
      console.error('Failed to fetch members:', error.message);
    }
    return { members: (data ?? []) as Member[], timedOut: false };
  } catch (e) {
    if (e instanceof Error && e.message === '__TIMEOUT__') {
      return { members: [], timedOut: true };
    }
    throw e;
  }
}
