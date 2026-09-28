import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { RouterProvider, useLocation } from './router/Router';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ConnectDevicePage } from './pages/ConnectDevicePage';
import { BrandLogo } from './components/BrandLogo';

function AppContent() {
  const { loading } = useAuth();
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
          gap: '1.25rem'
        }}
      >
        <BrandLogo size={48} showText={false} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
          <span className="spinner spinner-dark"></span>
          <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>Initializing system security...</span>
        </div>
      </div>
    );
  }

  // Route switcher
  switch (pathname) {
    case '/register':
      return <RegisterPage />;
    case '/forgot-password':
      return <ForgotPasswordPage />;
    case '/reset-password':
      return <ResetPasswordPage />;
    case '/connect-device':
    case '/dashboard':
    case '/sensors':
    case '/alerts':
    case '/reports':
    case '/settings':
      return <ConnectDevicePage />;
    case '/login':
    default:
      return <LoginPage />;
  }
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider>
          <AppContent />
        </RouterProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
