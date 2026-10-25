/**
 * VegSense Centralized API Client
 * - Normalizes Base URL without duplicate /api segments
 * - Reads import.meta.env.VITE_API_URL (defaults cleanly to /api)
 * - Attaches stored JWT tokens automatically
 * - Handles JSON responses, errors, timeouts, and multipart uploads
 */

const TOKEN_KEY = 'veg_storage_auth_token';
const ALT_TOKEN_KEY = 'vegsense_jwt_token';

/**
 * Returns the resolved API base URL (normalized to end with /api without trailing slashes).
 */
export function getApiBaseUrl() {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';
  const trimmed = envUrl.trim().replace(/\/+$/, '');

  if (!trimmed) {
    return '/api';
  }

  if (trimmed.endsWith('/api')) {
    return trimmed;
  }

  return `${trimmed}/api`;
}

/**
 * Constructs a fully qualified API URL guaranteed to avoid duplicate /api segments.
 * Examples:
 * buildApiUrl('/auth/register') -> 'https://vegitables.vercel.app/api/auth/register'
 * buildApiUrl('/api/auth/register') -> 'https://vegitables.vercel.app/api/auth/register'
 * buildApiUrl('health') -> 'https://vegitables.vercel.app/api/health'
 */
export function buildApiUrl(path = '') {
  const base = getApiBaseUrl();
  let cleanPath = String(path || '').trim();

  // Strip query string for path segment inspection
  const qIndex = cleanPath.indexOf('?');
  let pathPart = qIndex >= 0 ? cleanPath.slice(0, qIndex) : cleanPath;
  const queryPart = qIndex >= 0 ? cleanPath.slice(qIndex) : '';

  // Strip duplicate leading /api
  if (pathPart.startsWith('/api/')) {
    pathPart = pathPart.slice(4);
  } else if (pathPart === '/api') {
    pathPart = '';
  }

  if (!pathPart.startsWith('/') && pathPart.length > 0) {
    pathPart = `/${pathPart}`;
  }

  return `${base}${pathPart}${queryPart}`;
}

/**
 * Helper to get the active stored auth token
 */
export function getStoredToken() {
  try {
    return (
      localStorage.getItem(TOKEN_KEY) ||
      sessionStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem(ALT_TOKEN_KEY) ||
      sessionStorage.getItem(ALT_TOKEN_KEY) ||
      null
    );
  } catch (e) {
    return null;
  }
}

/**
 * Custom error class for API responses
 */
export class ApiError extends Error {
  constructor(message, status = 500, code = 'API_ERROR', details = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/**
 * Core HTTP request handler
 */
async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    body = null,
    headers = {},
    token = null,
    timeoutMs = 15000,
    credentials = 'include',
    ...restOptions
  } = options;

  const url = buildApiUrl(endpoint);

  const requestHeaders = { ...headers };

  // Set Authorization header
  const effectiveToken = token || getStoredToken();
  if (effectiveToken && !requestHeaders['Authorization']) {
    requestHeaders['Authorization'] = `Bearer ${effectiveToken}`;
  }

  // Handle body & Content-Type
  let requestBody = body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  if (body && !isFormData && typeof body === 'object') {
    requestHeaders['Content-Type'] = 'application/json';
    requestBody = JSON.stringify(body);
  } else if (!isFormData && !requestHeaders['Content-Type'] && method !== 'GET') {
    requestHeaders['Content-Type'] = 'application/json';
  }

  // Timeout controller
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      credentials,
      signal: controller.signal,
      ...restOptions
    });

    clearTimeout(timeoutId);

    // Try parsing JSON or text
    let responseData = null;
    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      try {
        responseData = await res.json();
      } catch (parseErr) {
        responseData = null;
      }
    } else {
      try {
        responseData = await res.text();
      } catch (textErr) {
        responseData = null;
      }
    }

    if (!res.ok) {
      let errorMessage = 'Request failed. Please check your connection and try again.';
      let errorCode = 'REQUEST_FAILED';

      if (responseData && typeof responseData === 'object') {
        errorMessage = responseData.message || responseData.error || errorMessage;
        errorCode = responseData.code || responseData.error || errorCode;
      } else if (typeof responseData === 'string' && responseData.length < 200 && responseData.length > 0) {
        errorMessage = responseData;
      } else {
        if (res.status === 401) errorMessage = 'Authentication required or session expired.';
        else if (res.status === 403) errorMessage = 'You do not have permission to access this resource.';
        else if (res.status === 404) errorMessage = 'The requested endpoint was not found.';
        else if (res.status === 409) errorMessage = 'A conflicting record already exists.';
        else if (res.status >= 500) errorMessage = 'Internal server error. Please try again later.';
      }

      throw new ApiError(errorMessage, res.status, errorCode, responseData);
    }

    return responseData;
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your network and try again.', 408, 'TIMEOUT');
    }

    if (err instanceof ApiError) {
      throw err;
    }

    throw new ApiError(err.message || 'Network error communicating with server.', 0, 'NETWORK_ERROR');
  }
}

export const apiClient = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, bodyOrOptions = null, options = {}) => {
    if (bodyOrOptions && (bodyOrOptions.headers || bodyOrOptions.timeoutMs !== undefined)) {
      return request(endpoint, { ...bodyOrOptions, method: 'DELETE' });
    }
    return request(endpoint, { ...options, method: 'DELETE', body: bodyOrOptions });
  },
  upload: (endpoint, formData, options = {}) => request(endpoint, { ...options, method: 'POST', body: formData }),
  buildUrl: buildApiUrl,
  getBaseUrl: getApiBaseUrl,
  getStoredToken
};

export default apiClient;
