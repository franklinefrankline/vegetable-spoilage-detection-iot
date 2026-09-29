import React from 'react';
import {
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

export function SpoilageRecommendations({
  recommendations = [],
  classification = 'FRESH'
}) {
  const isFresh = classification === 'FRESH';

  return (
    <div
      className="vegsense-spoilage-recommendations-card"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '12px',
        padding: '1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          backgroundColor: isFresh ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: isFresh ? '#10b981' : '#f59e0b'
        }}>
          <Lightbulb size={18} />
        </div>
        <div>
          <h2 style={{
            fontSize: '1.1rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            margin: '0 0 2px 0',
            letterSpacing: '-0.01em'
          }}>
            Storage Recommendations & Action Items
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
            Prescriptive microclimate interventions to extend shelf life and prevent spoilage
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {recommendations.length > 0 ? (
          recommendations.map((rec, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'var(--bg-card-subtle)',
                border: '1px solid var(--border-light)',
                fontSize: '0.85rem',
                lineHeight: 1.45,
                color: 'var(--text-main)'
              }}
            >
              <div style={{ marginTop: '2px', color: isFresh ? '#10b981' : '#f59e0b', flexShrink: 0 }}>
                {isFresh ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />}
              </div>
              <div style={{ fontWeight: 500 }}>
                {rec}
              </div>
            </div>
          ))
        ) : (
          <div style={{
            padding: '1rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem'
          }}>
            Environmental conditions are currently within the configured monitoring range.
          </div>
        )}
      </div>

      {/* Safety notice (Section 26) */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        marginTop: '1rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border-light)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)'
      }}>
        <Info size={13} />
        <span>
          Risk analysis represents environmental storage quality estimation based on calibrated IoT telemetry.
        </span>
      </div>
    </div>
  );
}
