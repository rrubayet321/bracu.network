import type { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin-server';
import AdminMemberCard from '@/components/AdminMemberCard';
import { signOut, removeMemberFormAction } from './actions';
import type { Member } from '@/types/member';

export const metadata: Metadata = {
  title: 'Admin — bracu.network',
};

export default async function AdminPage() {
  const admin = getAdminClient();

  // Fetch pending (unapproved) members
  const { data: pending } = await admin
    .from('members')
    .select('*')
    .eq('is_approved', false)
    .order('created_at', { ascending: true });

  // Fetch recently approved (last 10)
  const { data: approved } = await admin
    .from('members')
    .select('id, slug, name, website, department, batch, created_at')
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
          <p className="admin-section-title">Recently Approved</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {approved.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                  fontSize: 13,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {m.name}
                  </span>
                  <a
                    href={m.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent)', fontSize: 12 }}
                  >
                    {m.website}
                  </a>
                </div>
                <form action={removeMemberFormAction}>
                  <input type="hidden" name="id" value={m.id} />
                  <button 
                    type="submit" 
                    style={{ 
                      background: 'transparent', 
                      border: '1px solid var(--border)', 
                      color: 'var(--text-muted)', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: 12,
                      cursor: 'pointer' 
                    }}
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
