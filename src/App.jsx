import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppearanceProvider } from './context/AppearanceContext';
import { DeviceProvider, useDevice } from './context/DeviceContext';
import { RouterProvider, useLocation } from './router/Router';

// Public Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

// Protected Shell & Pages
import { AppShell } from './components/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ConnectDevicePage } from './pages/ConnectDevicePage';
import { VegetableStoragePage } from './pages/VegetableStoragePage';
import { LiveSensorsPage } from './pages/LiveSensorsPage';
import { SpoilageDetectionPage } from './pages/SpoilageDetectionPage';
import { AlertsPage } from './pages/AlertsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { VegSenseLogo } from './components/branding/VegSenseLogo';

function AppContent() {
  const { loading, isAuthenticated } = useAuth();
  const { isConnected, hasSavedDevice } = useDevice();
  const { pathname } = useLocation();

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-page)',
          gap: '1.5rem',
          padding: '2rem'
        }}
      >
        <div className="vegsense-loading-logo">
          <VegSenseLogo variant="full" maxWidth="240px" priority={true} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--text-main)' }}>
            <span className="spinner spinner-dark" />
            <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>Loading VegSense...</span>
          </div>
          <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.02em' }}>
            Smart Storage Intelligence
          </span>
        </div>
      </div>
    );
  }

  // Public Unauthenticated Pages
  switch (pathname) {
    case '/register':
      return <RegisterPage />;
    case '/forgot-password':
      return <ForgotPasswordPage />;
    case '/reset-password':
      return <ResetPasswordPage />;
    case '/login':
      return <LoginPage />;
    default:
      break;
  }

  // If not authenticated, default to LoginPage
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Authenticated user without any device must connect first (except device-independent routes like /connect-device, /storage, /settings)
  if (!hasSavedDevice && !isConnected && pathname !== '/connect-device' && pathname !== '/settings' && pathname !== '/storage' && pathname !== '/vegetable-storage') {
    return (
      <AppShell>
        <ConnectDevicePage />
      </AppShell>
    );
  }

  // Protected Pages wrapped in unified AppShell
  const renderProtectedPage = () => {
    switch (pathname) {
      case '/connect-device':
        return <ConnectDevicePage />;
      case '/vegetable-storage':
      case '/storage':
        return <VegetableStoragePage />;
      case '/sensors':
      case '/live-sensors':
        return <LiveSensorsPage />;
      case '/spoilage':
      case '/spoilage-detection':
        return <SpoilageDetectionPage />;
      case '/alerts':
        return <AlertsPage />;
      case '/analytics':
      case '/history':
        return <AnalyticsPage />;
      case '/reports':
        return <ReportsPage />;
      case '/settings':
        return <SettingsPage />;
      case '/dashboard':
      default:
        return <DashboardPage />;
    }
  };

  return <AppShell>{renderProtectedPage()}</AppShell>;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppearanceProvider>
          <DeviceProvider>
            <RouterProvider>
              <AppContent />
            </RouterProvider>
          </DeviceProvider>
        </AppearanceProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
