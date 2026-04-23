'use server';

import { revalidatePath } from 'next/cache';
import { getAdminClient } from '@/lib/supabase/admin-server';
import { createClient } from '@/lib/supabase/server';

export async function approveMember(id: string) {
  const admin = getAdminClient();

  const { error } = await admin
    .from('members')
    .update({ is_approved: true })
    .eq('id', id);

  if (error) {
    console.error('Approve error:', error);
    return { error: 'Failed to approve member' };
  }

  // Immediately bust ISR cache — member appears on homepage without waiting 60s
  revalidatePath('/');
  revalidatePath('/admin');

  return { success: true };
}

export async function rejectMember(id: string) {
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
