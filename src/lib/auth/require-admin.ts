import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from './admin-allowlist';

/** Server-only: ensure the current user is an allowed admin or redirect. */
export async function requireAdminSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/admin/login');
  if (!isAdminEmail(user.email)) redirect('/');

  return user;
}
