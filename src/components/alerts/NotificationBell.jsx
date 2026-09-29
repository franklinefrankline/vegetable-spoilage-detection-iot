import React, { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { useAlerts } from '../../context/AlertContext';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const { alerts, unreadCount, markAllAsRead } = useAlerts();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <button
        type="button"
        className={`header-action-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        title="Notifications"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            className="header-notif-dot"
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              minWidth: '16px',
              height: '16px',
              padding: '0 3px',
              borderRadius: '9999px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '0.65rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown
          alerts={alerts}
          unreadCount={unreadCount}
          onClose={() => setIsOpen(false)}
          onMarkAllRead={markAllAsRead}
        />
      )}
    </div>
  );
}
