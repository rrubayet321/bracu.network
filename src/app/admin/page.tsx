import type { Metadata } from 'next';
import { requireAdminSession } from '@/lib/auth/require-admin';
import { getAdminClient } from '@/lib/supabase/admin-server';
import AdminMemberCard from '@/components/AdminMemberCard';
import { signOut } from './actions';
import type { Member } from '@/types/member';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin — bracu.network',
};

export default async function AdminPage() {
  await requireAdminSession();

  const admin = getAdminClient();

  // Fetch pending (unapproved) members
  const { data: pending } = await admin
    .from('members')
    .select('*')
    .eq('is_approved', false)
    .order('created_at', { ascending: true });

  // Fetch recently approved (last 10) — full select so AdminMemberCard has all fields
  const { data: approved } = await admin
    .from('members')
    .select('*')
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="admin-wrapper">
      {/* Header */}
      <div className="admin-header">
        <div>
          <h1 className="admin-title">bracu.network</h1>
          <p className="text-muted" style={{ fontSize: 13, marginTop: 4 }}>
            Admin dashboard
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {pending && pending.length > 0 && (
            <span className="admin-badge">{pending.length} pending</span>
          )}
          <form action={signOut}>
            <button type="submit" className="btn btn-secondary" id="sign-out-btn">
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* Pending applications */}
      <section>
        <p className="admin-section-title">
          Pending Applications ({pending?.length ?? 0})
        </p>

        {!pending || pending.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 0' }}>
            🎉 No pending applications right now.
          </div>
        ) : (
          (pending as Member[]).map((member) => (
            <AdminMemberCard key={member.id} member={member} />
          ))
        )}
      </section>

      {/* Recently approved */}
      {approved && approved.length > 0 && (
        <section style={{ marginTop: 48 }}>
          <p className="admin-section-title">Recently Approved ({approved.length})</p>
          {(approved as Member[]).map((member) => (
            <AdminMemberCard key={member.id} member={member} isApproved />
          ))}
        </section>
      )}
    </div>
  );
}
