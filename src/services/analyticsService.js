/**
 * Unified Analytics Service for VegSense Smart Storage Intelligence
 * Communicates with backend /api/analytics endpoints using authenticated JWT sessions.
 */

const API_BASE = '/api/analytics';

function getAuthHeaders(token = null) {
  const headers = { 'Content-Type': 'application/json' };
  const activeToken =
    token ||
    localStorage.getItem('veg_storage_auth_token') ||
    sessionStorage.getItem('veg_storage_auth_token');

  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }
  return headers;
}

function buildQueryString(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all' && value !== 'All') {
      query.append(key, value);
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : '';
}

/**
 * 1. Fetches high-level analytics summary (metrics, min/max, risk distribution, alert counts)
 */
export async function getAnalyticsSummary(params = {}, token = null) {
  const qs = buildQueryString(params);
  const res = await fetch(`${API_BASE}/summary${qs}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  if (!res.ok) {
    throw new Error(`Analytics summary request failed: ${res.status}`);
  }
  return await res.json();
}

/**
 * 2. Fetches sensor timeseries with server-side aggregation for charts
 */
export async function getSensorTimeseries(params = {}, token = null) {
  const qs = buildQueryString(params);
  const res = await fetch(`${API_BASE}/sensors${qs}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  if (!res.ok) {
    throw new Error(`Sensor timeseries request failed: ${res.status}`);
  }
  return await res.json();
}

export const getSensorHistory = getSensorTimeseries;

/**
 * 3. Fetches metric-specific history
 */
export async function getTemperatureHistory(params = {}, token = null) {
  const qs = buildQueryString(params);
  const res = await fetch(`${API_BASE}/temperature${qs}`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to fetch temperature history');
  return await res.json();
}

export async function getHumidityHistory(params = {}, token = null) {
  const qs = buildQueryString(params);
  const res = await fetch(`${API_BASE}/humidity${qs}`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to fetch humidity history');
  return await res.json();
}

export async function getGasHistory(params = {}, token = null) {
  const qs = buildQueryString(params);
  const res = await fetch(`${API_BASE}/gas${qs}`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to fetch Gas/VOC history');
  return await res.json();
}

export async function getLightHistory(params = {}, token = null) {
  const qs = buildQueryString(params);
  const res = await fetch(`${API_BASE}/light${qs}`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to fetch light history');
  return await res.json();
}

export async function getSpoilageHistory(params = {}, token = null) {
  const qs = buildQueryString(params);
  const res = await fetch(`${API_BASE}/spoilage${qs}`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to fetch spoilage history');
  return await res.json();
}

/**
 * 4. Fetches alert analytics (counts, category breakdowns, severity, resolution duration)
 */
export async function getAlertAnalytics(params = {}, token = null) {
  const qs = buildQueryString(params);
  const res = await fetch(`${API_BASE}/alerts${qs}`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to fetch alert analytics');
  return await res.json();
}

/**
 * 5. Fetches storage analytics (batches, vegetable counts, quantities, risk distribution)
 */
export async function getStorageAnalytics(token = null) {
  const res = await fetch(`${API_BASE}/storage`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to fetch storage analytics');
  return await res.json();
}

/**
 * 6. Fetches specific batch history & risk timeline
 */
export async function getBatchAnalytics(batchId, token = null) {
  const res = await fetch(`${API_BASE}/batch/${encodeURIComponent(batchId)}`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to fetch batch analytics');
  return await res.json();
}

/**
 * 7. Fetches Period Comparison analytics (Current Period vs Previous Period)
 */
export async function getComparisonAnalytics(params = {}, token = null) {
  const qs = buildQueryString(params);
  const res = await fetch(`${API_BASE}/comparison${qs}`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to fetch period comparison');
  return await res.json();
}

/**
 * 8. Resets demo history and seeds fresh baseline (demo mode only)
 */
export async function resetDemoHistory(token = null) {
  const res = await fetch(`${API_BASE}/reset-demo`, {
    method: 'POST',
    headers: getAuthHeaders(token)
  });
  if (!res.ok) throw new Error('Failed to reset demo history');
  return await res.json();
}
