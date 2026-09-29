import React from 'react';
import {
  User,
  ShieldCheck,
  Cpu,
  Sliders,
  Thermometer,
  Activity,
  BellRing,
  Bell,
  Palette,
  PlayCircle,
  Database,
  Lock,
  AlertTriangle,
  Search,
  X
} from 'lucide-react';

export const SETTINGS_SECTIONS = [
  { id: 'profile', label: 'Profile Settings', icon: User, category: 'Personal' },
  { id: 'account', label: 'Account & Persistence', icon: ShieldCheck, category: 'Personal' },
  { id: 'device', label: 'Device Management', icon: Cpu, category: 'Hardware' },
  { id: 'sensors', label: 'Sensor Configuration', icon: Sliders, category: 'Hardware' },
  { id: 'thresholds', label: 'Storage Thresholds', icon: Thermometer, category: 'Atmosphere' },
  { id: 'spoilage', label: 'Spoilage Risk Engine', icon: Activity, category: 'Atmosphere' },
  { id: 'alerts', label: 'Alert Subscriptions', icon: BellRing, category: 'Monitoring' },
  { id: 'notifications', label: 'Notification Channels', icon: Bell, category: 'Monitoring' },
  { id: 'appearance', label: 'Appearance & Themes', icon: Palette, category: 'Interface' },
  { id: 'demo', label: 'Demo Mode & Simulation', icon: PlayCircle, category: 'System' },
  { id: 'data', label: 'Data & Privacy', icon: Database, category: 'System' },
  { id: 'security', label: 'Security & Password', icon: Lock, category: 'Security' },
  { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, category: 'Security', danger: true }
];

export function SettingsSidebar({
  activeSection,
  onSelectSection,
  searchQuery,
  onSearchChange,
  isMobile
}) {
  const filteredSections = SETTINGS_SECTIONS.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.label.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        width: isMobile ? '100%' : '260px',
        flexShrink: 0
      }}
    >
      {/* Quick Search */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '0.85rem',
            color: 'var(--text-secondary)',
            pointerEvents: 'none'
          }}
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search settings..."
          style={{
            width: '100%',
            padding: '0.6rem 2.2rem 0.6rem 2.2rem',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-surface)',
            color: 'var(--text-main)',
            fontSize: '0.85rem',
            outline: 'none',
            transition: 'border-color 0.15s ease'
          }}
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            aria-label="Clear search"
            style={{
              position: 'absolute',
              right: '0.6rem',
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              padding: '0.2rem'
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav
        style={{
          display: 'flex',
          flexDirection: isMobile ? 'row' : 'column',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          gap: '0.35rem',
          background: 'var(--bg-surface)',
          padding: '0.6rem',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          maxHeight: isMobile ? 'none' : 'calc(100vh - 220px)',
          overflowY: 'auto'
        }}
      >
        {filteredSections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => onSelectSection(sec.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                width: isMobile ? 'auto' : '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                border: 'none',
                background: isActive
                  ? 'var(--primary-light, rgba(27, 77, 46, 0.12))'
                  : 'transparent',
                color: isActive
                  ? 'var(--primary-color, #1b4d2e)'
                  : sec.danger
                  ? '#dc2626'
                  : 'var(--text-main)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.86rem',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                borderLeft: !isMobile && isActive
                  ? '3px solid var(--primary-color, #1b4d2e)'
                  : '3px solid transparent'
              }}
            >
              <Icon
                size={18}
                style={{
                  color: isActive
                    ? 'var(--primary-color, #1b4d2e)'
                    : sec.danger
                    ? '#dc2626'
                    : 'var(--text-secondary)',
                  flexShrink: 0
                }}
              />
              <span style={{ whiteSpace: isMobile ? 'nowrap' : 'normal' }}>{sec.label}</span>
            </button>
          );
        })}

        {filteredSections.length === 0 && (
          <div
            style={{
              padding: '1rem 0.5rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '0.82rem'
            }}
          >
            No settings match "{searchQuery}"
          </div>
        )}
      </nav>
    </div>
  );
}
