'use client';

import React from 'react';
import { PenTool, Code, Search, Rocket } from 'lucide-react';

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
            <div className="role-box" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              <PenTool size={16} /> Designers
            </div>
          </foreignObject>
          <foreignObject x="230" y="20" width="140" height="40">
            <div className="role-box" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              <Code size={16} /> Engineers
            </div>
          </foreignObject>
          <foreignObject x="430" y="20" width="140" height="40">
            <div className="role-box" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              <Search size={16} /> Researchers
            </div>
          </foreignObject>
          <foreignObject x="630" y="20" width="140" height="40">
            <div className="role-box" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}>
              <Rocket size={16} /> Founders
            </div>
          </foreignObject>

          {/* Main Title Box */}
          <foreignObject x="200" y="240" width="400" height="100">
            <div className="hero-main-title-box">
              <h1 className="hero-title">bracu.network</h1>
            </div>
          </foreignObject>
        </svg>
      </div>

      <div className="hero-text-content">
        <p className="hero-description">
          BRAC University students and alumni who are out here building
          things, breaking things, and occasionally sleeping.
        </p>
        <p className="hero-description" style={{ marginTop: 8 }}>
          <span style={{ color: '#a78bfa' }}>Designers</span>,{' '}
          <span style={{ color: '#34d399' }}>engineers</span>,{' '}
          <span style={{ color: '#60a5fa' }}>researchers</span>,{' '}
          <span style={{ color: '#f472b6' }}>founders</span>{' '}
          — all welcome. Yes, even the business majors. 👀
        </p>
        <p className="hero-cta">
          Are you a BRACUian?{' '}
          <a href="/join">Come join the gang →</a>
        </p>
      </div>
    </div>
  );
}
