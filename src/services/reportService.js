/**
 * Report Service for VegSense Smart Storage Intelligence
 * Communicates with backend /api/reports endpoints using authenticated JWT sessions.
 */

const API_BASE = '/api/reports';

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

/**
 * 1. Fetch historical reports list
 */
export async function getReports(token = null) {
  const res = await fetch(API_BASE, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch reports: ${res.status}`);
  }
  const data = await res.json();
  return data.reports || [];
}

/**
 * 2. Fetch specific report details
 */
export async function getReport(reportId, token = null) {
  const res = await fetch(`${API_BASE}/${reportId}`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch report details: ${res.status}`);
  }
  const data = await res.json();
  return data.report;
}

/**
 * 3. Generate instant preview dataset without writing PDF
 */
export async function previewReport(filters = {}, token = null) {
  const res = await fetch(`${API_BASE}/preview`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(filters)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to generate report preview: ${res.status}`);
  }
  const data = await res.json();
  return data.preview;
}

/**
 * 4. Generate authoritative PDF and persist metadata
 */
export async function generateReport(filters = {}, token = null) {
  const res = await fetch(`${API_BASE}/generate`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(filters)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to generate report: ${res.status}`);
  }
  const data = await res.json();
  return data.report;
}

/**
 * 5. Download generated report PDF file
 */
export async function downloadReport(reportId, fileName = 'VegSense_Report.pdf', token = null) {
  const res = await fetch(`${API_BASE}/${reportId}/download`, {
    method: 'GET',
    headers: {
      Authorization: (getAuthHeaders(token))['Authorization'] || ''
    }
  });

  if (!res.ok) {
    throw new Error(`Failed to download report PDF: ${res.status}`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  return true;
}

/**
 * 6. Delete report record
 */
export async function deleteReport(reportId, token = null) {
  const res = await fetch(`${API_BASE}/${reportId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token)
  });
  if (!res.ok) {
    throw new Error(`Failed to delete report: ${res.status}`);
  }
  const data = await res.json();
  return data.success;
}
