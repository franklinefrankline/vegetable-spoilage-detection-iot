import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, ExternalLink, RefreshCw, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { isHttpsContext } from '../../services/deviceService';

export function DebugPanel({
  targetIp = '192.168.1.105',
  connectionStatus = 'Idle', // 'Connected' | 'Failed' | 'Checking...' | 'Idle'
  lastResponse = null,
  lastError = null,
  onTestEndpoint
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'response' | 'error'
  const isHttps = isHttpsContext();

  const cleanIp = (targetIp || '192.168.1.105').trim();
  const statusUrl = `http://${cleanIp}/status`;
  const dataUrl = `http://${cleanIp}/api/data`;

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'Connected':
        return (
          <span className="debug-badge success">
            <CheckCircle2 size={12} />
            <span>Connected</span>
          </span>
        );
      case 'Failed':
        return (
          <span className="debug-badge danger">
            <XCircle size={12} />
            <span>Failed</span>
          </span>
        );
      case 'Checking...':
      case 'Connecting...':
        return (
          <span className="debug-badge info">
            <RefreshCw size={12} className="spin" />
            <span>Checking...</span>
          </span>
        );
      default:
        return (
          <span className="debug-badge neutral">
            <span>Idle</span>
          </span>
        );
    }
  };

  return (
    <div className="debug-panel-wrapper">
      <button
        type="button"
        className="debug-panel-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <div className="debug-toggle-left">
          <Terminal size={15} />
          <span className="debug-toggle-title">Developer Debug Mode</span>
          {getStatusBadge()}
        </div>
        <div className="debug-toggle-right">
          <span className="debug-toggle-hint">Section 19 Diagnostics</span>
          {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isOpen && (
        <div className="debug-panel-content">
          {/* Environment Warning if on HTTPS */}
          {isHttps && (
            <div className="debug-env-notice">
              <AlertCircle size={15} />
              <div>
                <strong>HTTPS / Cloud Context Detected</strong>
                <p>
                  Browsers enforce Mixed Content blocking: secure HTTPS origins cannot directly access
                  private network HTTP endpoints ({statusUrl}). For local ESP32 hardware testing, run
                  the frontend locally at <code>http://localhost:5173</code>.
                </p>
              </div>
            </div>
          )}

          {/* Key-Value Diagnostics Table */}
          <div className="debug-grid">
            <div className="debug-row">
              <span className="debug-key">Target IP:</span>
              <span className="debug-val-code">{cleanIp}</span>
            </div>

            <div className="debug-row">
              <span className="debug-key">Status URL:</span>
              <div className="debug-url-row">
                <span className="debug-val-code">{statusUrl}</span>
                <a
                  href={statusUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="debug-link-btn"
                  title="Open in new tab to test direct access"
                >
                  <ExternalLink size={12} />
                  <span>Open</span>
                </a>
              </div>
            </div>

            <div className="debug-row">
              <span className="debug-key">Data URL:</span>
              <div className="debug-url-row">
                <span className="debug-val-code">{dataUrl}</span>
                <a
                  href={dataUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="debug-link-btn"
                  title="Open in new tab to test sensor JSON"
                >
                  <ExternalLink size={12} />
                  <span>Open</span>
                </a>
              </div>
            </div>

            <div className="debug-row">
              <span className="debug-key">Connection:</span>
              <span className="debug-val-text">{connectionStatus}</span>
            </div>

            <div className="debug-row">
              <span className="debug-key">Frontend Mode:</span>
              <span className="debug-val-text">
                {isHttps ? 'Production / Cloud Mode (Vercel)' : 'Local ESP32 Mode (localhost:5173)'}
              </span>
            </div>
          </div>

          {/* Quick Manual Test Buttons */}
          {onTestEndpoint && (
            <div className="debug-quick-tests">
              <span className="debug-quick-label">Endpoint Probes:</span>
              <button
                type="button"
                className="debug-action-pill"
                onClick={() => onTestEndpoint('status')}
              >
                Test GET /status
              </button>
              <button
                type="button"
                className="debug-action-pill"
                onClick={() => onTestEndpoint('data')}
              >
                Test GET /api/data
              </button>
            </div>
          )}

          {/* Response & Error Inspector */}
          <div className="debug-inspector">
            <div className="debug-tabs">
              <button
                type="button"
                className={`debug-tab ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Last Response
              </button>
              <button
                type="button"
                className={`debug-tab ${activeTab === 'error' ? 'active' : ''}`}
                onClick={() => setActiveTab('error')}
              >
                Last Error {lastError ? '(!)' : ''}
              </button>
            </div>

            <div className="debug-tab-body">
              {activeTab === 'overview' && (
                <pre className="debug-code-box">
                  {lastResponse
                    ? JSON.stringify(lastResponse, null, 2)
                    : '// No response recorded yet. Enter IP and click "Connect Device" or "Test GET /status".'}
                </pre>
              )}

              {activeTab === 'error' && (
                <pre className={`debug-code-box ${lastError ? 'error-text' : ''}`}>
                  {lastError
                    ? typeof lastError === 'string'
                      ? lastError
                      : JSON.stringify(lastError, null, 2)
                    : '// No errors recorded.'}
                </pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DebugPanel;
