import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// Image metadata
export const alt = 'bracu.network';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const supabase = await createClient();
  const { count } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('is_approved', true);

  return new ImageResponse(
    (
      <div
        style={{
          background: '#0A0A0A',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 80,
            fontWeight: 800,
            color: '#F5F5F5',
            letterSpacing: '-0.05em',
            marginBottom: 20,
          }}
        >
          <span style={{ color: '#4A6CF7', marginRight: 16 }}>[B]</span> bracu.network
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#A0A0A0',
            letterSpacing: '-0.02em',
            marginBottom: 40,
          }}
        >
          A webring for BRAC University students and alumni.
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(74, 108, 247, 0.1)',
            border: '2px solid rgba(74, 108, 247, 0.3)',
            borderRadius: 999,
            padding: '12px 32px',
            color: '#4A6CF7',
            fontSize: 24,
            fontWeight: 600,
          }}
        >
          {count ?? 0} members
        </div>
      </div>
    ),
    { ...size }
  );
}
