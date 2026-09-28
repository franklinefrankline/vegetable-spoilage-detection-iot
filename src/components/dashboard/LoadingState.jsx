import React from 'react';
import { Cpu, Wifi, Activity } from 'lucide-react';
import { BrandLogo } from '../BrandLogo';

export function LoadingState({
  stage = 'Connecting to ESP32...',
  displayIp = '192.168.1.105'
}) {
  return (
    <div className="dashboard-loading-fullscreen">
      <div className="dashboard-loading-card">
        <BrandLogo size={46} showText={false} />

        <div className="loading-orbit-animation">
          <div className="orbit-core">
            <Cpu size={28} color="var(--primary)" />
          </div>
          <div className="orbit-ring" />
        </div>

        <h3 className="loading-stage-text">{stage}</h3>

        <p className="loading-subtext">
          Establishing real HTTP telemetry stream with ESP32 gateway at <code>{displayIp}</code>
        </p>

        <div className="loading-steps-pills">
          <div className={`step-pill ${stage.includes('Connecting') ? 'active' : 'done'}`}>
            <span className="step-num">1</span>
            <span>Verify /status</span>
          </div>
          <div className={`step-pill ${stage.includes('Reading') ? 'active' : stage.includes('active') ? 'done' : ''}`}>
            <span className="step-num">2</span>
            <span>Read /api/data</span>
          </div>
          <div className={`step-pill ${stage.includes('active') ? 'active' : ''}`}>
            <span className="step-num">3</span>
            <span>Stream Live</span>
          </div>
        </div>
      </div>
    </div>
  );
}
export default LoadingState;
