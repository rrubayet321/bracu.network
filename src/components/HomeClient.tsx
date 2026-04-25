'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import MemberTable from '@/components/MemberTable';
import AnimatedHero from '@/components/AnimatedHero';
import type { Member } from '@/types/member';

const NetworkGraph = dynamic(() => import('@/components/NetworkGraph'), { ssr: false });

interface HomeClientProps {
  members: Member[];
  /** Shown in dev when .env.local is missing real Supabase keys (avoids a hung blank page). */
  showConfigHint?: boolean;
  /** Supabase did not answer in time; page still loads with empty data. */
  showTimeoutHint?: boolean;
}

export default function HomeClient({ members, showConfigHint, showTimeoutHint }: HomeClientProps) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  return (
    <main className="page-wrapper">
      {showTimeoutHint && (
        <div className="login-error" style={{ marginBottom: 24, maxWidth: 640 }} role="status">
          <strong>Database unreachable:</strong> the app could not load members from Supabase in time.
          Check that <code style={{ fontSize: 12 }}>NEXT_PUBLIC_SUPABASE_URL</code> in{' '}
          <code style={{ fontSize: 12 }}>.env.local</code> is correct, your network allows{' '}
          <code style={{ fontSize: 12 }}>*.supabase.co</code>, and you are not blocking outbound HTTPS
          (VPN, firewall, captive portal).
        </div>
      )}
      {showConfigHint && (
        <div
          className="login-error"
          style={{ marginBottom: 24, maxWidth: 640 }}
          role="status"
        >
          <strong>Local setup:</strong> copy <code style={{ fontSize: 12 }}>.env.example</code> to{' '}
          <code style={{ fontSize: 12 }}>.env.local</code> and set your real Supabase URL and anon key
          so the directory can load. The UI works with an empty list until then.
        </div>
      )}
      <header className="hero" style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: 60 }}>
        <AnimatedHero />
      </header>

      <div className="main-grid">
        {/* Left column */}
        <div className="left-col panel-card">
          <MemberTable members={members} onHover={setHoveredSlug} />
        </div>

        {/* Right column */}
        <aside className="right-col">
          <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
            <NetworkGraph members={members} highlightSlug={hoveredSlug} />
          </div>
          <p
            className="text-muted"
            style={{ fontSize: 11, marginTop: 10, textAlign: 'center' }}
          >
            {members.length} member{members.length !== 1 ? 's' : ''} in the
            network
          </p>
        </aside>
      </div>
    </main>
  );
}
