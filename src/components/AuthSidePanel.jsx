import React from 'react';
import { BrandLogo } from './BrandLogo';
import { Cpu, Gauge, Wind, Tv, CheckCircle2 } from 'lucide-react';

export function AuthSidePanel() {
  return (
    <div className="auth-left-panel">
      <div>
        <div className="brand-header">
          <BrandLogo size={42} showText={false} lightText={true} />
          <div>
            <h1 className="brand-title">Intelligent Vegetable Storage</h1>
            <p className="brand-tagline">IoT Spoilage Detection System</p>
          </div>
        </div>

        <div className="left-panel-content">
          <h2 className="project-full-title">
            Smart IoT monitoring for early vegetable spoilage detection.
          </h2>
          <p className="project-description">
            Continuous atmospheric monitoring using integrated ESP32 hardware telemetry, analyzing temperature, relative humidity, and volatile gas emission thresholds.
          </p>

          <div className="iot-visual-card">
            <div className="iot-spec-title">
              <Cpu size={14} />
              Hardware Telemetry Nodes
            </div>
            
            <div className="iot-badges-grid">
              <div className="iot-badge">
                <Gauge size={14} color="#86efac" />
                <span>DHT22 Temp & RH</span>
              </div>
              <div className="iot-badge">
                <Wind size={14} color="#86efac" />
                <span>MQ-135 Gas Sensor</span>
              </div>
              <div className="iot-badge">
                <Tv size={14} color="#86efac" />
                <span>0.96" OLED I2C</span>
              </div>
              <div className="iot-badge">
                <Cpu size={14} color="#86efac" />
                <span>ESP32 Wi-Fi Unit</span>
              </div>
            </div>

            <div className="iot-led-pills">
              <span>LED Status:</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span className="led-indicator led-green"></span> Fresh
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span className="led-indicator led-yellow"></span> Warning
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span className="led-indicator led-red"></span> Spoilage
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="left-panel-footer">
        <span>Physical Prototype Ready</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <CheckCircle2 size={13} color="#86efac" /> Part 1: Auth Module
        </span>
      </div>
    </div>
  );
}
