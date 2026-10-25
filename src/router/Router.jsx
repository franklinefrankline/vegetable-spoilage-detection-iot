import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/login');
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  const { isAuthenticated, isInitializing, loading, getStoredToken } = useAuth();

  const navigate = useCallback((to, options = {}) => {
    let path = to;
    let search = '';
    if (to.includes('?')) {
      const parts = to.split('?');
      path = parts[0];
      search = '?' + parts[1];
    }

    if (options && options.replace) {
      window.history.replaceState({}, '', to);
    } else if (window.location.pathname !== path || window.location.search !== search) {
      window.history.pushState({}, '', to);
    }

    setCurrentPath(path);
    setSearchParams(new URLSearchParams(search));
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
      setSearchParams(new URLSearchParams(window.location.search));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Protected and Public Route Guards (Requirement 3 & 18)
  useEffect(() => {
    const checking = isInitializing ?? loading;
    // 1. Wait until authentication state is initialized before evaluating protected routes
    if (checking) return;

    const protectedRoutes = [
      '/dashboard',
      '/connect-device',
      '/vegetable-storage',
      '/storage',
      '/sensors',
      '/live-sensors',
      '/spoilage',
      '/spoilage-detection',
      '/alerts',
      '/analytics',
      '/history',
      '/reports',
      '/settings',
      '/admin'
    ];

    const isProtected = protectedRoutes.some((route) => currentPath === route || currentPath.startsWith(route + '/'));

    // Check stored token to guard against race condition during immediate navigation
    const hasToken = Boolean(getStoredToken && getStoredToken());
    const isAuthed = isAuthenticated || hasToken;

    if (!isAuthed && isProtected) {
      navigate('/login', { replace: true });
    } else if (!isAuthed && currentPath === '/') {
      navigate('/login', { replace: true });
    } else if (isAuthed && currentPath === '/') {
      navigate('/dashboard', { replace: true });
    }
  }, [currentPath, isAuthenticated, isInitializing, loading, navigate, getStoredToken]);

  return (
    <RouterContext.Provider value={{ currentPath, searchParams, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}

export function useNavigate() {
  const { navigate } = useRouter();
  return navigate;
}

export function useLocation() {
  const { currentPath, searchParams } = useRouter();
  return { pathname: currentPath, search: '?' + searchParams.toString(), searchParams };
}

export function Link({ href, children, className = '', ...props }) {
  const { navigate } = useRouter();

  const handleClick = (e) => {
    // If opening in new tab or external link, don't intercept
    if (e.metaKey || e.ctrlKey || href.startsWith('http://') || href.startsWith('https://')) {
      return;
    }
    e.preventDefault();
    navigate(href);
  };

  return (
    <a href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}
