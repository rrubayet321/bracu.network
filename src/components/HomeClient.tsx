'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import MemberTable from '@/components/MemberTable';
import AnimatedHero from '@/components/AnimatedHero';
import type { Member } from '@/types/member';

const NetworkGraph = dynamic(() => import('@/components/NetworkGraph'), { ssr: false });

interface HomeClientProps {
  members: Member[];
}

export default function HomeClient({ members }: HomeClientProps) {
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  return (
    <main className="page-wrapper">
      <div className="main-grid">
        {/* Left column */}
        <div className="left-col">
          <header className="hero" style={{ display: 'flex', justifyContent: 'center' }}>
            <AnimatedHero />
          </header>

          <MemberTable members={members} onHover={setHoveredSlug} />
        </div>

        {/* Right column */}
        <aside className="right-col">
          <NetworkGraph members={members} highlightSlug={hoveredSlug} />

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
