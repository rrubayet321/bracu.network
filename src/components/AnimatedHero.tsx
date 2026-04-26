'use client';

export default function AnimatedHero() {
  return (
    <div className="animated-hero-wrapper">
      <div className="animated-hero-svg-container">
        <svg
          viewBox="0 0 800 220"
          preserveAspectRatio="xMidYMid meet"
          className="animated-hero-svg"
          aria-hidden="true"
        >
          {/* Base lines */}
          <path d="M 100 52 C 100 150, 400 120, 400 200" fill="none" stroke="#2a2c30" strokeWidth="2" />
          <path d="M 300 52 C 300 150, 400 120, 400 200" fill="none" stroke="#2a2c30" strokeWidth="2" />
          <path d="M 500 52 C 500 150, 400 120, 400 200" fill="none" stroke="#2a2c30" strokeWidth="2" />
          <path d="M 700 52 C 700 150, 400 120, 400 200" fill="none" stroke="#2a2c30" strokeWidth="2" />

          {/* Energy Beams */}
          <path className="energy-beam" d="M 100 52 C 100 150, 400 120, 400 200" fill="none" stroke="#5e6ad2" strokeWidth="2" pathLength="100" strokeDasharray="8 150" strokeLinecap="round" filter="drop-shadow(0 0 4px #5e6ad2)" />
          <path className="energy-beam" d="M 300 52 C 300 150, 400 120, 400 200" fill="none" stroke="#5e6ad2" strokeWidth="2" pathLength="100" strokeDasharray="8 150" strokeLinecap="round" filter="drop-shadow(0 0 4px #5e6ad2)" />
          <path className="energy-beam" d="M 500 52 C 500 150, 400 120, 400 200" fill="none" stroke="#5e6ad2" strokeWidth="2" pathLength="100" strokeDasharray="8 150" strokeLinecap="round" filter="drop-shadow(0 0 4px #5e6ad2)" />
          <path className="energy-beam" d="M 700 52 C 700 150, 400 120, 400 200" fill="none" stroke="#5e6ad2" strokeWidth="2" pathLength="100" strokeDasharray="8 150" strokeLinecap="round" filter="drop-shadow(0 0 4px #5e6ad2)" />

          {/* Role boxes — pure SVG (no foreignObject, works on all browsers/mobile) */}
          <rect x="22"  y="10" width="156" height="36" rx="18" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
          <text x="100" y="33" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11" fontFamily="-apple-system,BlinkMacSystemFont,'Inter',sans-serif" fontWeight="500" letterSpacing="0.07em">DESIGNERS</text>

          <rect x="222" y="10" width="156" height="36" rx="18" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
          <text x="300" y="33" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11" fontFamily="-apple-system,BlinkMacSystemFont,'Inter',sans-serif" fontWeight="500" letterSpacing="0.07em">ENGINEERS</text>

          <rect x="422" y="10" width="156" height="36" rx="18" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
          <text x="500" y="33" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11" fontFamily="-apple-system,BlinkMacSystemFont,'Inter',sans-serif" fontWeight="500" letterSpacing="0.07em">RESEARCHERS</text>

          <rect x="622" y="10" width="156" height="36" rx="18" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
          <text x="700" y="33" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11" fontFamily="-apple-system,BlinkMacSystemFont,'Inter',sans-serif" fontWeight="500" letterSpacing="0.07em">FOUNDERS</text>

          {/* Focal glow dot where beams converge */}
          <circle cx="400" cy="200" r="3.5" fill="#5e6ad2" filter="drop-shadow(0 0 6px #5e6ad2)" opacity="0.85" />
        </svg>
      </div>

      {/* Title + text sit OUTSIDE the SVG — scales with CSS, not SVG transforms */}
      <div className="hero-text-content">
        <h1 className="hero-title">bracu.network</h1>
        <p className="hero-description">
          A home for the most ambitious builders, thinkers, and creators from the
          BRAC University community. Connecting us all to build the future together.
        </p>
        <p className="hero-description" style={{ marginTop: 8 }}>
          <span className="pearl-glow">DESIGNERS</span>,{' '}
          <span className="pearl-glow">ENGINEERS</span>,{' '}
          <span className="pearl-glow">RESEARCHERS</span>,{' '}
          <span className="pearl-glow">FOUNDERS</span>{' '}
          — all welcome. Yes, even the business majors.
        </p>
        <p className="hero-cta">
          Are you a BRACUian?{' '}
          <a href="/join">Come join the gang →</a>
        </p>
      </div>
    </div>
  );
}
