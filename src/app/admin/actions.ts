'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAdminClient } from '@/lib/supabase/admin-server';
import { createClient } from '@/lib/supabase/server';

/** Shared auth guard — returns user or throws if not authenticated / not an allowed admin. */
async function requireAdmin(): Promise<{ id: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const allowed = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!allowed.includes((user.email ?? '').toLowerCase())) {
    throw new Error('Not authorized');
  }

  return user;
}

export async function approveMember(id: string) {
  try { await requireAdmin(); } catch { return { error: 'Not authenticated' }; }

  const admin = getAdminClient();
  const { error } = await admin
    .from('members')
    .update({ is_approved: true })
    .eq('id', id);

  if (error) {
    console.error('Approve error:', error);
    return { error: 'Failed to approve member' };
  }

  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}

export async function rejectMember(id: string) {
  try { await requireAdmin(); } catch { return { error: 'Not authenticated' }; }

  const admin = getAdminClient();
  const { error } = await admin
    .from('members')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Reject error:', error);
    return { error: 'Failed to reject member' };
  }

  revalidatePath('/admin');
  return { success: true };
}

export async function removeMember(id: string) {
  try { await requireAdmin(); } catch { return { error: 'Not authenticated' }; }

  const admin = getAdminClient();
  const { error } = await admin
    .from('members')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Remove error:', error);
    return { error: 'Failed to remove member' };
  }

  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}

export async function setMemberType(id: string, type: 'student' | 'alumni') {
  try { await requireAdmin(); } catch { return { error: 'Not authenticated' }; }

  const admin = getAdminClient();
  const { error } = await admin
    .from('members')
    .update({ member_type: type })
    .eq('id', id);

  if (error) {
    console.error('setMemberType error:', error);
    return { error: 'Failed to update member type' };
  }

  revalidatePath('/');
  revalidatePath('/admin');
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
