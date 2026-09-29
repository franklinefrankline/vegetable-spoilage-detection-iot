import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDevice } from '../context/DeviceContext';
import { useAlerts } from '../context/AlertContext';
import { useAppearance } from '../context/AppearanceContext';
import { useToast } from '../context/ToastContext';
import { useNavigate } from '../router/Router';

import {
  getSettings,
  updateSettings,
  getThresholds,
  updateThresholds as apiUpdateThresholds,
  getNotificationSettings,
  updateNotificationSettings as apiUpdateNotificationSettings,
  getAppearanceSettings,
  updateAppearanceSettings as apiUpdateAppearanceSettings,
  resetSettings as apiResetSettings,
  resetDemoData as apiResetDemoData,
  exportUserData as apiExportUserData,
  updateProfile as apiUpdateProfile,
  changePassword as apiChangePassword,
  deleteAccount as apiDeleteAccount,
  getDevices as apiGetDevices,
  addDevice as apiAddDevice,
  removeDevice as apiRemoveDevice,
  reconnectDevice as apiReconnectDevice
} from '../services/settingsService';

import { SettingsSidebar } from '../components/settings/SettingsSidebar';
import { ProfileSettings } from '../components/settings/ProfileSettings';
import { AccountSettings } from '../components/settings/AccountSettings';
import { DeviceManagement } from '../components/settings/DeviceManagement';
import { SensorSettings } from '../components/settings/SensorSettings';
import { ThresholdSettings } from '../components/settings/ThresholdSettings';
import { SpoilageSettings } from '../components/settings/SpoilageSettings';
import { AlertSettings } from '../components/settings/AlertSettings';
import { NotificationSettings } from '../components/settings/NotificationSettings';
import { AppearanceSettings } from '../components/settings/AppearanceSettings';
import { DemoModeSettings } from '../components/settings/DemoModeSettings';
import { DataPrivacySettings } from '../components/settings/DataPrivacySettings';
import { SecuritySettings } from '../components/settings/SecuritySettings';
import { DangerZone } from '../components/settings/DangerZone';
import { SettingsSkeleton } from '../components/settings/SettingsSkeleton';
import { SettingsError } from '../components/settings/SettingsError';

export function Settings() {
  const { currentUser, token, logout } = useAuth();
  const {
    device,
    connectDevice,
    connectDemoDevice,
    disconnectDevice,
    reconnectDevice,
    updateThresholds: contextUpdateThresholds
  } = useDevice();
  const {
    preferences,
    updatePreferences,
    alertThresholds,
    updateAlertThresholds: contextUpdateAlertThresholds
  } = useAlerts();
  const {
    settings: appearanceSettings,
    setTheme,
    setAccent,
    setCardStyle,
    setFontSize,
    resetToDefault: contextResetAppearance
  } = useAppearance();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Page layout and navigation states
  const [activeSection, setActiveSection] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Data states
  const [settingsData, setSettingsData] = useState(null);
  const [devicesList, setDevicesList] = useState([]);
  const [dataCounts, setDataCounts] = useState({
    readings: 120,
    spoilage: 48,
    alerts: 12,
    reports: 3,
    batches: 6
  });

  // Loading & action states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isResettingDemo, setIsResettingDemo] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isConnectingDevice, setIsConnectingDevice] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch initial settings & devices from backend
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [settingsRes, devicesRes] = await Promise.all([
        getSettings(token).catch((err) => {
          console.warn('Backend settings query fallback:', err);
          return { success: true, settings: {} };
        }),
        apiGetDevices(token).catch((err) => {
          console.warn('Backend devices query fallback:', err);
          return { success: true, devices: [] };
        })
      ]);

      const s = settingsRes.settings || {};
      setSettingsData(s);

      // Note: Appearance is synchronized centrally by AppearanceContext
      const devs = devicesRes.devices || [];
      setDevicesList(devs);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setError(err.message || 'Unable to load settings from server.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers for settings updates
  const handleSaveGeneral = async (updates) => {
    setIsSaving(true);
    try {
      const res = await updateSettings(updates, token);
      setSettingsData(res.settings);
      addToast(res.message || 'Settings saved successfully.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveThresholds = async (thresholdUpdates) => {
    setIsSaving(true);
    try {
      const res = await apiUpdateThresholds(thresholdUpdates, token);
      setSettingsData(res.settings);

      // Propagate thresholds to Device and Alert contexts
      if (contextUpdateThresholds) {
        contextUpdateThresholds({
          maxTemp: thresholdUpdates.temperature_warning_threshold,
          maxHumidity: thresholdUpdates.humidity_high_threshold,
          maxGas: thresholdUpdates.gas_elevated_threshold,
          minLight: thresholdUpdates.light_low_threshold,
          maxLight: thresholdUpdates.light_high_threshold
        });
      }
      if (contextUpdateAlertThresholds) {
        contextUpdateAlertThresholds({
          tempWarningMax: thresholdUpdates.temperature_warning_threshold,
          tempHighMax: thresholdUpdates.temperature_high_threshold,
          humidityMax: thresholdUpdates.humidity_high_threshold,
          gasElevatedMax: thresholdUpdates.gas_elevated_threshold,
          lightMin: thresholdUpdates.light_low_threshold,
          lightMax: thresholdUpdates.light_high_threshold
        });
      }

      addToast('Storage thresholds and risk boundaries updated successfully.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update thresholds.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotifications = async (notifUpdates) => {
    setIsSaving(true);
    try {
      const res = await apiUpdateNotificationSettings(notifUpdates, token);
      setSettingsData(res.settings);

      if (updatePreferences) {
        updatePreferences({
          browserNotifications: Boolean(notifUpdates.browser_notifications_enabled)
        });
      }
      addToast('Notification channels saved.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save notifications.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAppearance = async (appUpdates) => {
    setIsSaving(true);
    try {
      const res = await apiUpdateAppearanceSettings(appUpdates, token);
      setSettingsData(res.settings);
      addToast('Appearance preferences saved.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to save appearance.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateProfile = async ({ name }) => {
    setIsSaving(true);
    try {
      const res = await apiUpdateProfile({ name }, token);
      if (currentUser) {
        currentUser.name = res.user.name;
      }
      addToast('Profile updated successfully.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (pwdData) => {
    setIsChangingPassword(true);
    try {
      const res = await apiChangePassword(pwdData, token);
      addToast(res.message || 'Password changed successfully.', 'success');
    } catch (err) {
      addToast(err.message || 'Failed to change password.', 'error');
      throw err;
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async (payload) => {
    setIsDeletingAccount(true);
    try {
      await apiDeleteAccount(payload, token);
      addToast('Account permanently deleted. Signing out...', 'info');
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 1500);
    } catch (err) {
      addToast(err.message || 'Failed to delete account.', 'error');
      setIsDeletingAccount(false);
      throw err;
    }
  };

  const handleConnectRealDevice = async ({ deviceName, ipAddress }) => {
    setIsConnectingDevice(true);
    try {
      const res = await apiAddDevice({ deviceName, ipAddress, mode: 'REAL' }, token);
      // Connect in device context
      await connectDevice(ipAddress, deviceName);
      await loadData();
      addToast(res.message || `ESP32 (${ipAddress}) bound successfully.`, 'success');
    } catch (err) {
      addToast(err.message || 'Could not connect to ESP32 device.', 'error');
      throw err;
    } finally {
      setIsConnectingDevice(false);
    }
  };

  const handleSwitchToDemo = async () => {
    try {
      connectDemoDevice();
      addToast('Switched to Demo Mode (ESP32-DEMO-001).', 'info');
      await loadData();
    } catch (err) {
      addToast('Could not switch to Demo Mode.', 'error');
    }
  };

  const handleReconnectDevice = async (dev) => {
    try {
      if (dev.mode === 'DEMO' || dev.isDemo) {
        connectDemoDevice();
        addToast('Demo gateway re-synchronized.', 'success');
        return;
      }
      const res = await apiReconnectDevice(dev.id || dev.deviceId, token);
      if (res.status === 'connected') {
        await reconnectDevice();
        addToast(`ESP32 (${dev.ip_address || dev.ip}) is online and streaming.`, 'success');
      } else {
        addToast(`ESP32 (${dev.ip_address || dev.ip}) is offline or unreachable.`, 'warning');
      }
      await loadData();
    } catch (err) {
      addToast('Reconnect attempt timed out or failed.', 'error');
    }
  };

  const handleRemoveDevice = async (dev) => {
    try {
      await apiRemoveDevice(dev.id || dev.deviceId, token);
      disconnectDevice();
      await loadData();
      addToast('Device disconnected from active monitoring. Telemetry history preserved.', 'info');
    } catch (err) {
      addToast('Could not remove device.', 'error');
    }
  };

  const handleResetDemo = async () => {
    setIsResettingDemo(true);
    try {
      const res = await apiResetDemoData(token);
      addToast(res.message || 'Demo mode telemetry reset. Real data preserved.', 'success');
    } catch (err) {
      addToast('Failed to reset demo data.', 'error');
    } finally {
      setIsResettingDemo(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      await apiExportUserData(token);
      addToast('User data archive downloaded successfully.', 'success');
    } catch (err) {
      addToast('Could not export user data.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearLocalPreferences = () => {
    try {
      localStorage.removeItem('vegsense_appearance_settings');
      localStorage.removeItem('vegsense_alert_prefs');
      localStorage.removeItem('vegsense_alert_thresholds');
      contextResetAppearance();
      addToast('Local browser preferences cleared.', 'info');
    } catch (e) {
      addToast('Could not clear local preferences.', 'error');
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        maxWidth: '1200px',
        margin: '0 auto',
        padding: isMobile ? '1rem' : '1.5rem',
        minHeight: '100vh',
        boxSizing: 'border-box'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <h1
          style={{
            margin: 0,
            fontSize: isMobile ? '1.5rem' : '1.85rem',
            fontWeight: 800,
            color: 'var(--text-main)',
            letterSpacing: '-0.02em'
          }}
        >
          Settings & Device Management
        </h1>
        <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          Manage your authenticated identity, ESP32 microcontrollers, sensor thresholds, alert rules, and visual theme.
        </p>
      </div>

      {loading ? (
        <SettingsSkeleton />
      ) : error ? (
        <SettingsError message={error} onRetry={loadData} />
      ) : (
        /* Main Layout: Desktop Sidebar + Content */
        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '1.5rem',
            alignItems: 'flex-start',
            width: '100%'
          }}
        >
          {/* Navigation Sidebar */}
          <SettingsSidebar
            activeSection={activeSection}
            onSelectSection={setActiveSection}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isMobile={isMobile}
          />

          {/* Dynamic Content Panel */}
          <div
            style={{
              flex: 1,
              width: '100%',
              minWidth: 0
            }}
          >
            {activeSection === 'profile' && (
              <ProfileSettings
                user={currentUser}
                onUpdateProfile={handleUpdateProfile}
                isSaving={isSaving}
              />
            )}

            {activeSection === 'account' && (
              <AccountSettings
                user={currentUser}
                onLogout={() => { logout(); navigate('/login'); }}
                onNavigateToDanger={() => setActiveSection('danger')}
              />
            )}

            {activeSection === 'device' && (
              <DeviceManagement
                devices={devicesList}
                activeDevice={device}
                onConnectRealDevice={handleConnectRealDevice}
                onSwitchToDemo={handleSwitchToDemo}
                onReconnectDevice={handleReconnectDevice}
                onRemoveDevice={handleRemoveDevice}
                isConnecting={isConnectingDevice}
              />
            )}

            {activeSection === 'sensors' && (
              <SensorSettings
                settings={settingsData}
                onSave={handleSaveGeneral}
                isSaving={isSaving}
              />
            )}

            {activeSection === 'thresholds' && (
              <ThresholdSettings
                settings={settingsData}
                onSave={handleSaveThresholds}
                isSaving={isSaving}
              />
            )}

            {activeSection === 'spoilage' && (
              <SpoilageSettings
                settings={settingsData}
                onSave={handleSaveThresholds}
                isSaving={isSaving}
              />
            )}

            {activeSection === 'alerts' && (
              <AlertSettings
                settings={settingsData}
                onSave={handleSaveGeneral}
                isSaving={isSaving}
              />
            )}

            {activeSection === 'notifications' && (
              <NotificationSettings
                settings={settingsData}
                onSave={handleSaveNotifications}
                isSaving={isSaving}
              />
            )}

            {activeSection === 'appearance' && (
              <AppearanceSettings
                currentTheme={appearanceSettings.theme}
                currentAccent={appearanceSettings.accent}
                cardStyle={appearanceSettings.cardStyle}
                fontSize={appearanceSettings.fontSize}
                onThemeChange={(th) => setTheme(th)}
                onAccentChange={(ac) => setAccent(ac)}
                onCardStyleChange={(cs) => setCardStyle(cs)}
                onFontSizeChange={(fs) => setFontSize(fs)}
                onResetDefaults={contextResetAppearance}
                onSave={handleSaveAppearance}
                isSaving={isSaving}
              />
            )}

            {activeSection === 'demo' && (
              <DemoModeSettings
                isDemo={Boolean(device?.isDemo || device?.mode === 'DEMO' || device?.deviceName?.includes('DEMO'))}
                onToggleMode={
                  Boolean(device?.isDemo || device?.mode === 'DEMO' || device?.deviceName?.includes('DEMO'))
                    ? () => setActiveSection('device')
                    : handleSwitchToDemo
                }
                onResetDemo={handleResetDemo}
                isResetting={isResettingDemo}
              />
            )}

            {activeSection === 'data' && (
              <DataPrivacySettings
                dataCounts={dataCounts}
                onExportData={handleExportData}
                onClearLocalPreferences={handleClearLocalPreferences}
                isExporting={isExporting}
              />
            )}

            {activeSection === 'security' && (
              <SecuritySettings
                onChangePassword={handleChangePassword}
                onLogout={() => { logout(); navigate('/login'); }}
                isChangingPassword={isChangingPassword}
              />
            )}

            {activeSection === 'danger' && (
              <DangerZone
                onDeleteAccount={handleDeleteAccount}
                isDeleting={isDeletingAccount}
                userEmail={currentUser?.email}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default Settings;
