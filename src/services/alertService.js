/**
 * VegSense Centralized Alerts Service (Part 7)
 * Handles communication with /api/alerts endpoints, user isolation, and local fallback.
 */

const LOCAL_ALERTS_KEY = 'vegsense_persisted_alerts';

function getAuthHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  const effectiveToken =
    token ||
    localStorage.getItem('vegsense_jwt_token') ||
    sessionStorage.getItem('vegsense_jwt_token');
  if (effectiveToken) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  }
  return headers;
}

/**
 * Retrieves alerts for the authenticated user with filters, sorting, and pagination
 */
export async function getAlerts({
  status = null,
  severity = null,
  type = null,
  search = null,
  sort = 'newest',
  page = 1,
  limit = 50,
  token = null
} = {}) {
  const params = new URLSearchParams();
  if (status && status !== 'all') params.append('status', status);
  if (severity && severity !== 'all') params.append('severity', severity);
  if (type && type !== 'all') params.append('type', type);
  if (search && search.trim()) params.append('search', search.trim());
  if (sort) params.append('sort', sort);
  if (page) params.append('page', String(page));
  if (limit) params.append('limit', String(limit));

  try {
    const res = await fetch(`/api/alerts?${params.toString()}`, {
      method: 'GET',
      headers: getAuthHeaders(token)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.alerts)) {
        try {
          localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(data.alerts.slice(0, 50)));
        } catch (e) {}
        return data;
      }
    }
  } catch (err) {
    console.warn('[alertService] Network error fetching alerts, reading cache:', err.message);
  }

  // Fallback to local cache
  try {
    const cached = JSON.parse(localStorage.getItem(LOCAL_ALERTS_KEY) || '[]');
    let filtered = [...cached];
    if (status && status !== 'all') {
      filtered = filtered.filter((a) => (status === 'unread' ? !a.is_read : a.status?.toLowerCase() === status.toLowerCase()));
    }
    if (severity && severity !== 'all') {
      filtered = filtered.filter((a) => a.severity?.toLowerCase() === severity.toLowerCase());
    }
    return {
      success: true,
      alerts: filtered,
      pagination: { total: filtered.length, page: 1, limit: 50, totalPages: 1 }
    };
  } catch (e) {
    return { success: true, alerts: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 0 } };
  }
}

/**
 * Retrieves unread count for global notification bell
 */
export async function getUnreadCount(token = null) {
  try {
    const res = await fetch('/api/alerts/unread-count', {
      method: 'GET',
      headers: getAuthHeaders(token)
    });
    if (res.ok) {
      const data = await res.json();
      return data.unread_count ?? 0;
    }
  } catch (err) {
    console.warn('[alertService] Unread count fetch failed:', err.message);
  }
  return 0;
}

/**
 * Retrieves alert overview summary
 */
export async function getAlertSummary(token = null) {
  try {
    const res = await fetch('/api/alerts/summary', {
      method: 'GET',
      headers: getAuthHeaders(token)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[alertService] Summary fetch failed:', err.message);
  }
  return { total: 0, active: 0, unread: 0, critical: 0, high: 0, warning: 0, info: 0, resolved: 0 };
}

/**
 * Retrieves single alert details by ID
 */
export async function getAlertById(id, token = null) {
  try {
    const res = await fetch(`/api/alerts/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: getAuthHeaders(token)
    });
    if (res.ok) {
      const data = await res.json();
      return data.alert || null;
    }
  } catch (err) {
    console.warn('[alertService] Alert details fetch error:', err.message);
  }
  return null;
}

/**
 * Marks single alert as read
 */
export async function markAlertRead(id, token = null) {
  try {
    const res = await fetch(`/api/alerts/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(token)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[alertService] Mark read error:', err.message);
  }
  return { success: false };
}

/**
 * Marks all alerts as read
 */
export async function markAllAlertsRead(token = null) {
  try {
    const res = await fetch('/api/alerts/read-all', {
      method: 'PATCH',
      headers: getAuthHeaders(token)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[alertService] Mark all read error:', err.message);
  }
  return { success: false };
}

/**
 * Resolves an active alert
 */
export async function resolveAlert(id, token = null) {
  try {
    const res = await fetch(`/api/alerts/${encodeURIComponent(id)}/resolve`, {
      method: 'PATCH',
      headers: getAuthHeaders(token)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[alertService] Resolve alert error:', err.message);
  }
  return { success: false };
}

/**
 * Retrieves active alerts only
 */
export async function getActiveAlerts(token = null) {
  const result = await getAlerts({ status: 'active', limit: 20, token });
  return result?.alerts || [];
}

/**
 * Retrieves critical alerts only
 */
export async function getCriticalAlerts(token = null) {
  const result = await getAlerts({ status: 'active', severity: 'critical', limit: 10, token });
  return result?.alerts || [];
}

/**
 * Primary Alert Engine Evaluation endpoint
 */
export async function evaluateAlerts({
  deviceId,
  sensorData,
  spoilageData,
  deviceStatus,
  storageBatches,
  configuredThresholds,
  previousState,
  token = null
}) {
  try {
    const res = await fetch('/api/alerts/evaluate', {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({
        deviceId: deviceId || 'ESP32-DEMO-001',
        sensorData: sensorData || {},
        spoilageData: spoilageData || {},
        deviceStatus: deviceStatus || 'connected',
        storageBatches: storageBatches || [],
        configuredThresholds: configuredThresholds || {},
        previousState: previousState || {}
      })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[alertService] Evaluation request error:', err.message);
  }
  return { success: false };
}
