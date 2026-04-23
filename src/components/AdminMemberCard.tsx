'use client';

import { useTransition } from 'react';
import Image from 'next/image';
import { approveMember, rejectMember } from '@/app/admin/actions';
import type { Member } from '@/types/member';
import { Check, X, Loader2 } from 'lucide-react';

interface AdminMemberCardProps {
  member: Member;
}

function getInitials(name: string) {
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminMemberCard({ member }: AdminMemberCardProps) {
  const [approvePending, startApprove] = useTransition();
  const [rejectPending, startReject] = useTransition();

  return (
    <div className="admin-card" id={`admin-card-${member.slug}`}>
      {/* Photo */}
      <div>
        {member.profile_pic ? (
          <Image
            src={member.profile_pic}
            alt={member.name}
            width={80}
            height={80}
            className="admin-card-photo"
          />
        ) : (
          <div className="admin-card-photo-fallback">{getInitials(member.name)}</div>
        )}
      </div>

      {/* Info */}
      <div className="admin-card-info">
        <div className="admin-card-name">{member.name}</div>
        {member.department && (
          <div className="admin-card-meta">{member.department}</div>
        )}
        {member.batch && (
          <div className="admin-card-meta">{member.batch}</div>
        )}
        <a
          href={member.website}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-card-website"
        >
          {member.website}
        </a>
        {member.bracu_email && (
          <div className="admin-card-meta" style={{ marginTop: 4, color: 'var(--accent)' }}>
            BRACU Email: {member.bracu_email}
          </div>
        )}
        {member.email && (
          <div className="admin-card-meta">
            Personal: {member.email}
          </div>
        )}
        {member.roles?.length > 0 && (
          <div className="admin-card-meta" style={{ marginTop: 4 }}>
            {member.roles.join(', ')}
          </div>
        )}
        <div className="admin-card-timestamp">
          Submitted {formatDate(member.created_at)}
        </div>
      </div>

      {/* Actions */}
      <div className="admin-card-actions">
        <button
          className="btn btn-success"
          disabled={approvePending || rejectPending}
          id={`approve-btn-${member.slug}`}
          onClick={() =>
            startApprove(async () => {
              await approveMember(member.id);
            })
          }
        >
          {approvePending ? <Loader2 size={14} /> : <Check size={14} />}
          Approve
        </button>

        <button
          className="btn btn-danger"
          disabled={approvePending || rejectPending}
          id={`reject-btn-${member.slug}`}
          onClick={() =>
            startReject(async () => {
              await rejectMember(member.id);
            })
          }
        >
          {rejectPending ? <Loader2 size={14} /> : <X size={14} />}
          Reject
        </button>
      </div>
    </div>
  );
}
