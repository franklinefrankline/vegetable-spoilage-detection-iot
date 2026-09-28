import React from 'react';

export function BrandLogo({
  size = 38,
  showText = true,
  showTagline = true,
  textColor = 'var(--text-main)',
  lightText = false,
  className = ''
}) {
  return (
    <div
      className={`brand-logo-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.75rem',
        textDecoration: 'none',
        userSelect: 'none'
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0, transition: 'transform 0.2s ease' }}
      >
        <defs>
          <linearGradient id="vegsenseGrad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--primary, #16a34a)" />
            <stop offset="1" stopColor="var(--primary-hover, #15803d)" />
          </linearGradient>
          <linearGradient id="leafGrad" x1="16" y1="16" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop stopColor="#86efac" />
            <stop offset="1" stopColor="#22c55e" />
          </linearGradient>
        </defs>

        {/* Soft rounded container */}
        <rect
          width="48"
          height="48"
          rx="14"
          fill={lightText ? 'rgba(255, 255, 255, 0.16)' : 'var(--primary-light, #f0fdf4)'}
        />
        <rect
          x="1"
          y="1"
          width="46"
          height="46"
          rx="13"
          stroke={lightText ? 'rgba(255, 255, 255, 0.28)' : 'var(--primary-border, #bbf7d0)'}
          strokeWidth="1.5"
        />

        {/* Leaf Symbol */}
        <path
          d="M24 16C19 16 15 20.5 15 26.5C21 26.5 24 23 24 16Z"
          fill={lightText ? '#86efac' : 'url(#vegsenseGrad)'}
        />
        <path
          d="M24 16C29 16 33 20.5 33 26.5C27 26.5 24 23 24 16Z"
          fill={lightText ? '#bbf7d0' : '#22c55e'}
        />
        <path
          d="M24 20V32"
          stroke={lightText ? '#ffffff' : 'var(--primary-hover, #15803d)'}
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Smart Sensor Node dot */}
        <circle
          cx="24"
          cy="14"
          r="2.5"
          fill={lightText ? '#ffffff' : 'var(--accent-color, #16a34a)'}
        />

        {/* Wireless IoT Broadcast Telemetry Arcs */}
        <path
          d="M16 11C21 7 27 7 32 11"
          stroke={lightText ? 'rgba(255, 255, 255, 0.85)' : 'var(--primary, #16a34a)'}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M19.5 13.5C22.2 11.2 25.8 11.2 28.5 13.5"
          stroke={lightText ? '#86efac' : '#22c55e'}
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>

      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                fontSize: size > 34 ? '1.15rem' : '1rem',
                fontWeight: 800,
                color: lightText ? '#ffffff' : textColor,
                letterSpacing: '-0.03em',
                fontFamily: 'var(--font-family)'
              }}
            >
              VegSense
            </span>
          </div>
          {showTagline && (
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: lightText ? '#bbf7d0' : 'var(--text-muted)',
                letterSpacing: '0.02em',
                marginTop: '0.1rem'
              }}
            >
              Smart Storage Intelligence
            </span>
          )}
        </div>
      )}
    </div>
  );
}
