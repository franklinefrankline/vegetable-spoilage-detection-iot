/**
 * Settings Service for VegSense Smart Storage Intelligence
 * Communicates with backend /api/settings, /api/devices, and /api/auth endpoints.
 */

const API_BASE = '/api/settings';

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
 * 1. Fetch user settings
 */
export async function getSettings(token = null) {
  const res = await fetch(API_BASE, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to load settings (${res.status})`);
  }
  return res.json();
}

/**
 * 2. Update user settings
 */
export async function updateSettings(updates, token = null) {
  const res = await fetch(API_BASE, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(updates)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Failed to save settings (${res.status})`);
  }
  return data;
}

/**
 * 3. Fetch storage thresholds & risk weights
 */
export async function getThresholds(token = null) {
  const res = await fetch(`${API_BASE}/thresholds`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to load thresholds (${res.status})`);
  }
  return res.json();
}

/**
 * 4. Update storage thresholds & risk weights
 */
export async function updateThresholds(thresholds, token = null) {
  const res = await fetch(`${API_BASE}/thresholds`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(thresholds)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Failed to update thresholds (${res.status})`);
  }
  return data;
}

/**
 * 5. Fetch notification settings
 */
export async function getNotificationSettings(token = null) {
  const res = await fetch(`${API_BASE}/notifications`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to load notifications');
  }
  return res.json();
}

/**
 * 6. Update notification settings
 */
export async function updateNotificationSettings(notifSettings, token = null) {
  const res = await fetch(`${API_BASE}/notifications`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(notifSettings)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update notification settings');
  }
  return data;
}

/**
 * 7. Fetch appearance settings
 */
export async function getAppearanceSettings(token = null) {
  const res = await fetch(`${API_BASE}/appearance`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to load appearance settings');
  }
  return res.json();
}

/**
 * 8. Update appearance settings
 */
export async function updateAppearanceSettings(appearance, token = null) {
  const res = await fetch(`${API_BASE}/appearance`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(appearance)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update appearance settings');
  }
  return data;
}

/**
 * 9. Reset settings to baseline defaults
 */
export async function resetSettings(token = null) {
  const res = await fetch(`${API_BASE}/reset`, {
    method: 'POST',
    headers: getAuthHeaders(token)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to reset settings');
  }
  return data;
}

/**
 * 10. Reset demo data without touching real records
 */
export async function resetDemoData(token = null) {
  const res = await fetch(`${API_BASE}/reset-demo`, {
    method: 'POST',
    headers: getAuthHeaders(token)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to reset demo data');
  }
  return data;
}

/**
 * 11. Export all user data as JSON file
 */
export async function exportUserData(token = null) {
  const res = await fetch(`${API_BASE}/export`, {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  if (!res.ok) {
    throw new Error('Failed to export user data');
  }
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const dateStr = new Date().toISOString().split('T')[0];
  a.download = `VegSense_User_Data_Export_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
  return true;
}

/**
 * 12. Update profile name
 */
export async function updateProfile({ name }, token = null) {
  const res = await fetch('/api/auth/profile', {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ name })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update profile');
  }
  return data;
}

/**
 * 13. Change account password
 */
export async function changePassword({ currentPassword, newPassword, confirmPassword }, token = null) {
  const res = await fetch('/api/auth/change-password', {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to change password');
  }
  return data;
}

/**
 * 14. Delete user account permanently
 */
export async function deleteAccount({ password, confirmationText }, token = null) {
  const res = await fetch('/api/auth/account', {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ password, confirmationText })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to delete account');
  }
  return data;
}

/**
 * 15. Device endpoints
 */
export async function getDevices(token = null) {
  const res = await fetch('/api/devices', {
    method: 'GET',
    headers: getAuthHeaders(token)
  });
  if (!res.ok) {
    throw new Error('Failed to fetch devices');
  }
  return res.json();
}

export async function addDevice({ deviceName, ipAddress, mode = 'REAL' }, token = null) {
  const res = await fetch('/api/devices', {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ deviceName, ipAddress, mode })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to add device');
  }
  return data;
}

export async function updateDevice(id, updates, token = null) {
  const res = await fetch(`/api/devices/${id}`, {
    method: 'PATCH',
    headers: getAuthHeaders(token),
    body: JSON.stringify(updates)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to update device');
  }
  return data;
}

export async function removeDevice(id, token = null) {
  const res = await fetch(`/api/devices/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to remove device');
  }
  return data;
}

export async function reconnectDevice(id, token = null) {
  const res = await fetch(`/api/devices/${id}/reconnect`, {
    method: 'POST',
    headers: getAuthHeaders(token)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || 'Failed to reconnect device');
  }
  return data;
}
