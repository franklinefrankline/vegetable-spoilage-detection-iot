import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Activity
} from 'lucide-react';

export function EnvironmentalOverview({ summary, latestReading }) {
  // Derive environmental statuses from latest reading or summary
  const temp = latestReading?.temperature ?? summary?.average_temperature;
  const humidity = latestReading?.humidity ?? summary?.average_humidity;
  const gas = latestReading?.gas_level ?? summary?.average_gas;
  const light = latestReading?.light_level ?? summary?.average_light;
  const risk = latestReading?.spoilage_risk ?? summary?.average_spoilage_risk;

  // Temperature status
  let tempStatus = 'NORMAL';
  let tempColor = 'var(--accent-green)';
  if (temp != null) {
    if (temp > 30) {
      tempStatus = 'HIGH';
      tempColor = 'var(--accent-red)';
    } else if (temp > 26 || temp < 10) {
      tempStatus = 'WARNING';
      tempColor = 'var(--accent-amber)';
    }
  } else {
    tempStatus = 'N/A';
    tempColor = 'var(--text-muted)';
  }

  // Humidity status
  let humStatus = 'OPTIMAL';
  let humColor = 'var(--accent-green)';
  if (humidity != null) {
    if (humidity > 85) {
      humStatus = 'HIGH';
      humColor = 'var(--accent-red)';
    } else if (humidity < 60) {
      humStatus = 'LOW';
      humColor = 'var(--accent-amber)';
    }
  } else {
    humStatus = 'N/A';
    humColor = 'var(--text-muted)';
  }

  // Gas/VOC Indicator status
  let gasStatus = 'NORMAL';
  let gasColor = 'var(--accent-green)';
  if (gas != null) {
    if (gas > 550) {
      gasStatus = 'HIGH';
      gasColor = 'var(--accent-red)';
    } else if (gas > 450) {
      gasStatus = 'ELEVATED';
      gasColor = 'var(--accent-amber)';
    }
  } else {
    gasStatus = 'N/A';
    gasColor = 'var(--text-muted)';
  }

  // Light status (thresholds: <100 LOW, 100-500 NORMAL, >500 HIGH)
  let lightStatus = 'NORMAL LIGHT';
  let lightColor = 'var(--accent-green)';
  if (light != null) {
    if (light < 100) {
      lightStatus = 'LOW LIGHT';
      lightColor = 'var(--accent-blue, #3b82f6)';
    } else if (light > 500) {
      lightStatus = 'HIGH LIGHT';
      lightColor = 'var(--accent-amber)';
    }
  } else {
    lightStatus = 'N/A';
    lightColor = 'var(--text-muted)';
  }

  // Spoilage risk classification
  let riskStatus = 'FRESH';
  let riskColor = 'var(--accent-green)';
  if (risk != null) {
    if (risk > 80) {
      riskStatus = 'CRITICAL';
      riskColor = 'var(--accent-red)';
    } else if (risk > 60) {
      riskStatus = 'SPOILAGE RISK';
      riskColor = '#ea580c';
    } else if (risk > 30) {
      riskStatus = 'WARNING';
      riskColor = 'var(--accent-amber)';
    }
  } else {
    riskStatus = 'N/A';
    riskColor = 'var(--text-muted)';
  }

  // Sensor Health / Data Availability (Section 19)
  const getSensorHealth = (unavailCount) => {
    if (unavailCount == null || unavailCount === 0) return { label: 'GOOD', color: 'var(--accent-green)' };
    if (unavailCount <= 3) return { label: 'WARNING', color: 'var(--accent-amber)' };
    return { label: 'UNAVAILABLE', color: 'var(--accent-red)' };
  };

  const tempHealth = getSensorHealth(summary?.sensor_stats?.temperature?.unavailable_readings);
  const humHealth = getSensorHealth(summary?.sensor_stats?.humidity?.unavailable_readings);
  const gasHealth = getSensorHealth(summary?.sensor_stats?.gas?.unavailable_readings);
  const lightHealth = getSensorHealth(summary?.sensor_stats?.light?.unavailable_readings);

  const isRiskElevated = risk != null && risk > 30;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
      {/* Recommended Action Summary Banner (Section 94) */}
      <div
        className="vegsense-card"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: isRiskElevated
            ? 'linear-gradient(90deg, rgba(245, 158, 11, 0.12) 0%, rgba(239, 68, 68, 0.08) 100%)'
            : 'linear-gradient(90deg, rgba(16, 185, 129, 0.08) 0%, rgba(13, 148, 136, 0.05) 100%)',
          borderColor: isRiskElevated ? 'var(--accent-amber)' : 'rgba(16, 185, 129, 0.3)'
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: isRiskElevated ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {isRiskElevated ? (
            <AlertTriangle size={20} color="var(--accent-amber)" />
          ) : (
            <ShieldCheck size={20} color="var(--accent-green)" />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
            OPERATIONAL ASSESSMENT & GUIDANCE
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {isRiskElevated
              ? 'Review recent environmental conditions and active alerts. Atmospheric metrics exceed baseline target thresholds.'
              : 'Recorded environmental conditions are currently within the configured monitoring ranges.'}
          </div>
        </div>
      </div>

      {/* Overview Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}
      >
        {/* Temperature Card */}
        <div className="vegsense-card" style={{ padding: '1rem 1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Temperature
            </span>
            <Thermometer size={16} color="var(--accent-amber)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {temp != null ? `${temp}°C` : 'N/A'}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                backgroundColor: `${tempColor}20`,
                color: tempColor
              }}
            >
              {tempStatus}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Availability:</span>
            <span style={{ fontWeight: 600, color: tempHealth.color }}>{tempHealth.label}</span>
          </div>
        </div>

        {/* Humidity Card */}
        <div className="vegsense-card" style={{ padding: '1rem 1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Humidity
            </span>
            <Droplets size={16} color="var(--accent-blue, #3b82f6)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {humidity != null ? `${humidity}%` : 'N/A'}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                backgroundColor: `${humColor}20`,
                color: humColor
              }}
            >
              {humStatus}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Availability:</span>
            <span style={{ fontWeight: 600, color: humHealth.color }}>{humHealth.label}</span>
          </div>
        </div>

        {/* Gas/VOC Indicator Card */}
        <div className="vegsense-card" style={{ padding: '1rem 1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Gas/VOC Indicator
            </span>
            <Wind size={16} color="var(--text-secondary)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {gas != null ? `${gas}` : 'N/A'}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                backgroundColor: `${gasColor}20`,
                color: gasColor
              }}
            >
              {gasStatus}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Availability:</span>
            <span style={{ fontWeight: 600, color: gasHealth.color }}>{gasHealth.label}</span>
          </div>
        </div>

        {/* Light Card */}
        <div className="vegsense-card" style={{ padding: '1rem 1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Light Level
            </span>
            <Sun size={16} color="var(--accent-amber)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {light != null ? `${light} lx` : 'N/A'}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                backgroundColor: `${lightColor}20`,
                color: lightColor
              }}
            >
              {lightStatus}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Availability:</span>
            <span style={{ fontWeight: 600, color: lightHealth.color }}>{lightHealth.label}</span>
          </div>
        </div>

        {/* Spoilage Risk Overview Card */}
        <div className="vegsense-card" style={{ padding: '1rem 1.15rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Estimated Spoilage Risk
            </span>
            <ShieldCheck size={16} color={riskColor} />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {risk != null ? `${risk}%` : 'N/A'}
            </span>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                backgroundColor: `${riskColor}20`,
                color: riskColor
              }}
            >
              {riskStatus}
            </span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Risk Index:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>Multivariate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
