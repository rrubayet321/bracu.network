import { createClient } from '@/lib/supabase/server';
import HomeClient from '@/components/HomeClient';
import type { Member } from '@/types/member';

// ISR: revalidate every 60 seconds as safety net.
// Actual cache busting on approve happens via revalidatePath('/') in admin actions.
export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('members')
    .select(
      'id, slug, name, website, department, batch, roles, interests, profile_pic, instagram, twitter, linkedin, github, connections, created_at, updated_at, is_approved'
    )
    .eq('is_approved', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to fetch members:', error.message);
  }

  const members: Member[] = (data ?? []) as Member[];

  return <HomeClient members={members} />;
}
