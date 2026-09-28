import React from 'react';

export function BrandLogo({ size = 38, showText = true, textColor = 'var(--text-main)', lightText = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Soft rounded background badge */}
        <rect width="48" height="48" rx="12" fill={lightText ? 'rgba(255,255,255,0.18)' : '#f0fdf4'} />
        <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" stroke={lightText ? 'rgba(255,255,255,0.3)' : '#bbf7d0'} />
        
        {/* Storage chamber box outline */}
        <rect x="10" y="16" width="28" height="22" rx="4" stroke={lightText ? '#ffffff' : '#16a34a'} strokeWidth="2" strokeDasharray="3 2" />
        
        {/* Leaf / Produce icon */}
        <path
          d="M24 19C20 19 17 22.5 17 27C21 27 24 24 24 19Z"
          fill={lightText ? '#86efac' : '#22c55e'}
        />
        <path
          d="M24 19C28 19 31 22.5 31 27C27 27 24 24 24 19Z"
          fill={lightText ? '#bbf7d0' : '#16a34a'}
        />
        <path
          d="M24 22V31"
          stroke={lightText ? '#ffffff' : '#15803d'}
          strokeWidth="1.75"
          strokeLinecap="round"
        />

        {/* IoT Wireless Signal Arcs */}
        <path
          d="M17 11C21 7.5 27 7.5 31 11"
          stroke={lightText ? '#bbf7d0' : '#16a34a'}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M20.5 13.5C22.5 11.8 25.5 11.8 27.5 13.5"
          stroke={lightText ? '#86efac' : '#22c55e'}
          strokeWidth="1.75"
          strokeLinecap="round"
        />
        <circle cx="24" cy="15.5" r="1.25" fill={lightText ? '#ffffff' : '#15803d'} />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              fontSize: '1.05rem',
              fontWeight: 800,
              color: lightText ? '#ffffff' : textColor,
              letterSpacing: '-0.025em',
              lineHeight: 1.2
            }}
          >
            Intelligent Vegetable Storage
          </span>
          <span
            style={{
              fontSize: '0.725rem',
              color: lightText ? '#bbf7d0' : 'var(--text-muted)',
              fontWeight: 500
            }}
          >
            IoT Spoilage Detection System
          </span>
        </div>
      )}
    </div>
  );
}
