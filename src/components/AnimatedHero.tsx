'use client';

import { useSyncExternalStore } from 'react';

// ─── Ring geometry ────────────────────────────────────────────────────────────
const CX  = 250;   // SVG centre-x (viewBox 0 0 500 290)
const CY  = 143;   // SVG centre-y
const R   = 108;   // ring radius
const DUR = '8s';  // one full orbit

function nodePos(deg: number): [number, number] {
  // 0° = top, clockwise
  const rad = ((deg - 90) * Math.PI) / 180;
  return [
    parseFloat((CX + R * Math.cos(rad)).toFixed(2)),
    parseFloat((CY + R * Math.sin(rad)).toFixed(2)),
  ];
}

// Motion path: full clockwise circle starting from the top node
const [sx, sy] = nodePos(0);
const RING_PATH = `M ${sx},${sy} a ${R},${R} 0 1,1 0.001,0`;

// [angle°, label | null, pulse-arrival delay (s)]
const RING_NODES: Array<[number, string | null, number]> = [
  [0,   'DESIGNERS',   0],
  [45,  null,          1],
  [90,  'ENGINEERS',   2],
  [135, null,          3],
  [180, 'RESEARCHERS', 4],
  [225, null,          5],
  [270, 'FOUNDERS',    6],
  [315, null,          7],
];

function labelAnchor(deg: number): { dx: number; dy: number; textAnchor: 'start' | 'middle' | 'end' } {
  if (deg === 0)   return { dx: 0,   dy: -16, textAnchor: 'middle' };
  if (deg === 90)  return { dx: 16,  dy:   4, textAnchor: 'start'  };
  if (deg === 180) return { dx: 0,   dy:  20, textAnchor: 'middle' };
  if (deg === 270) return { dx: -16, dy:   4, textAnchor: 'end'    };
  return { dx: 0, dy: 0, textAnchor: 'middle' };
}

// ─── Chord definitions ────────────────────────────────────────────────────────
// Each chord fires once per 8-second cycle at a different phase.
// keyTimes format: [invisible, fade-in-start, fade-in-end, fade-out-start, fade-out-end, invisible]
const CHORDS = [
  // DESIGNERS (top) ↔ RESEARCHERS (bottom) — fires early in the cycle (~0.3–1.8s)
  {
    from: 0,
    to:   4,
    values:   '0;0;0.4;0.4;0;0',
    keyTimes: '0;0.03;0.07;0.22;0.26;1',
  },
  // ENGINEERS (right) ↔ FOUNDERS (left) — fires mid-cycle (~4.3–5.8s)
  {
    from: 2,
    to:   6,
    values:   '0;0;0.4;0.4;0;0',
    keyTimes: '0;0.53;0.57;0.72;0.76;1',
  },
];

// ─── Reduced-motion subscription ─────────────────────────────────────────────
// useSyncExternalStore is the correct way to subscribe to external state
// (matchMedia) without triggering the react-hooks/set-state-in-effect lint rule.
function subscribePrefersReducedMotion(callback: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', callback);
  return () => mq.removeEventListener('change', callback);
}
const getPrefersReducedMotion  = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const getPrefersReducedMotionServer = () => false; // server has no preference

// ─── Component ────────────────────────────────────────────────────────────────
export default function AnimatedHero() {
  const reduced = useSyncExternalStore(
    subscribePrefersReducedMotion,
    getPrefersReducedMotion,
    getPrefersReducedMotionServer,
  );

  return (
    <div className="animated-hero-wrapper">
      <div className="animated-hero-svg-container">
        <svg
          viewBox="0 0 500 290"
          preserveAspectRatio="xMidYMid meet"
          className="animated-hero-svg"
          aria-hidden="true"
        >
          <defs>
            {/* Motion path for the orbiting pulse */}
            <path id="ringMotionPath" d={RING_PATH} />

            {/* Glow for the orbiting pulse dot */}
            <filter id="pulseGlow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Subtle glow for labeled nodes */}
            <filter id="nodeGlow" x="-150%" y="-150%" width="400%" height="400%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* ── Base ring circle ───────────────────────────────────────────── */}
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="1"
          />

          {/* ── Chord lines (cross-discipline connections) ─────────────────── */}
          {CHORDS.map(({ from, to, values, keyTimes }, ci) => {
            const [x1, y1] = nodePos(RING_NODES[from][0]);
            const [x2, y2] = nodePos(RING_NODES[to][0]);
            return (
              <line
                key={ci}
                className={`chord chord-${ci + 1}`}
                x1={x1} y1={y1}
                x2={x2} y2={y2}
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="0.6"
              >
                {!reduced && (
                  <animate
                    attributeName="opacity"
                    values={values}
                    keyTimes={keyTimes}
                    dur={DUR}
                    repeatCount="indefinite"
                  />
                )}
              </line>
            );
          })}

          {/* ── Ring nodes ─────────────────────────────────────────────────── */}
          {RING_NODES.map(([deg, label, delay], i) => {
            const [x, y] = nodePos(deg);
            const isLabeled = label !== null;
            const baseR = isLabeled ? 4.5 : 3;
            return (
              <circle
                key={i}
                cx={x} cy={y}
                r={baseR}
                fill={isLabeled ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.2)'}
                filter={isLabeled ? 'url(#nodeGlow)' : undefined}
              >
                {/* Flash when the orbiting pulse passes */}
                {!reduced && isLabeled && (
                  <animate
                    attributeName="r"
                    values={`${baseR};${baseR + 2.5};${baseR};${baseR}`}
                    keyTimes="0;0.03;0.07;1"
                    dur={DUR}
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                  />
                )}
                {!reduced && !isLabeled && (
                  <animate
                    attributeName="r"
                    values={`${baseR};${baseR + 1.5};${baseR};${baseR}`}
                    keyTimes="0;0.03;0.07;1"
                    dur={DUR}
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                  />
                )}
              </circle>
            );
          })}

          {/* ── Role labels ────────────────────────────────────────────────── */}
          {RING_NODES.map(([deg, label], i) => {
            if (!label) return null;
            const [nx, ny] = nodePos(deg);
            const { dx, dy, textAnchor } = labelAnchor(deg);
            return (
              <text
                key={`lbl-${i}`}
                className="ring-label"
                x={nx + dx}
                y={ny + dy}
                textAnchor={textAnchor}
                fill="rgba(255,255,255,0.38)"
                fontSize="11"
                fontFamily="-apple-system,BlinkMacSystemFont,'Inter',sans-serif"
                fontWeight="500"
                letterSpacing="0.09em"
              >
                {label}
              </text>
            );
          })}

          {/* ── Orbiting pulse dot ─────────────────────────────────────────── */}
          {!reduced ? (
            <circle r="3.5" fill="rgba(255,255,255,0.88)" opacity="1" filter="url(#pulseGlow)">
              <animateMotion dur={DUR} repeatCount="indefinite">
                <mpath href="#ringMotionPath" />
              </animateMotion>
            </circle>
          ) : (
            // Static dot at the top (DESIGNERS) when reduced-motion is on
            <circle cx={sx} cy={sy} r="3.5" fill="rgba(255,255,255,0.88)" opacity="1" filter="url(#pulseGlow)" />
          )}
        </svg>
      </div>

      {/* Title + copy below the ring */}
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
