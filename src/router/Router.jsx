import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const RouterContext = createContext(null);

export function RouterProvider({ children }) {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/login');
  const [searchParams, setSearchParams] = useState(new URLSearchParams(window.location.search));
  const { isAuthenticated, loading } = useAuth();

  const navigate = useCallback((to) => {
    let path = to;
    let search = '';
    if (to.includes('?')) {
      const parts = to.split('?');
      path = parts[0];
      search = '?' + parts[1];
    }

    if (window.location.pathname !== path || window.location.search !== search) {
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

  // Protected and Public Route Guards
  useEffect(() => {
    if (loading) return;

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

    if (!isAuthenticated && isProtected) {
      navigate('/login');
    } else if (!isAuthenticated && currentPath === '/') {
      navigate('/login');
    } else if (isAuthenticated && currentPath === '/') {
      navigate('/dashboard');
    }
  }, [currentPath, isAuthenticated, loading, navigate]);

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
