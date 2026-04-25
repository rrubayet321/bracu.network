'use client';

import React from 'react';

export default function AnimatedHero() {
  return (
    <div className="animated-hero-wrapper">
      <div className="animated-hero-svg-container">
        <svg viewBox="0 0 800 350" preserveAspectRatio="xMidYMid meet" className="animated-hero-svg">
          {/* Base lines */}
          <path d="M 100 60 C 100 180, 400 130, 400 250" fill="none" stroke="#2a2c30" strokeWidth="2" />
          <path d="M 300 60 C 300 180, 400 130, 400 250" fill="none" stroke="#2a2c30" strokeWidth="2" />
          <path d="M 500 60 C 500 180, 400 130, 400 250" fill="none" stroke="#2a2c30" strokeWidth="2" />
          <path d="M 700 60 C 700 180, 400 130, 400 250" fill="none" stroke="#2a2c30" strokeWidth="2" />

          {/* Energy Beams */}
          <path className="energy-beam" d="M 100 60 C 100 180, 400 130, 400 250" fill="none" stroke="#4a6cf7" strokeWidth="3" pathLength="100" strokeDasharray="10 150" strokeLinecap="round" filter="drop-shadow(0 0 6px #4a6cf7)" />
          <path className="energy-beam" d="M 300 60 C 300 180, 400 130, 400 250" fill="none" stroke="#4a6cf7" strokeWidth="3" pathLength="100" strokeDasharray="10 150" strokeLinecap="round" filter="drop-shadow(0 0 6px #4a6cf7)" />
          <path className="energy-beam" d="M 500 60 C 500 180, 400 130, 400 250" fill="none" stroke="#4a6cf7" strokeWidth="3" pathLength="100" strokeDasharray="10 150" strokeLinecap="round" filter="drop-shadow(0 0 6px #4a6cf7)" />
          <path className="energy-beam" d="M 700 60 C 700 180, 400 130, 400 250" fill="none" stroke="#4a6cf7" strokeWidth="3" pathLength="100" strokeDasharray="10 150" strokeLinecap="round" filter="drop-shadow(0 0 6px #4a6cf7)" />

          {/* Top Boxes (Roles) */}
          <foreignObject x="30" y="20" width="140" height="40">
            <div className="role-box">DESIGNERS</div>
          </foreignObject>
          <foreignObject x="230" y="20" width="140" height="40">
            <div className="role-box">ENGINEERS</div>
          </foreignObject>
          <foreignObject x="430" y="20" width="140" height="40">
            <div className="role-box">RESEARCHERS</div>
          </foreignObject>
          <foreignObject x="630" y="20" width="140" height="40">
            <div className="role-box">FOUNDERS</div>
          </foreignObject>

          {/* Main Title Box */}
          <foreignObject x="0" y="240" width="800" height="100">
            <div className="hero-main-title-box">
              <h1 className="hero-title">bracu.network</h1>
            </div>
          </foreignObject>
        </svg>
      </div>

      <div className="hero-text-content">
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
