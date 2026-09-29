/**
 * =====================================================================================
 * VegSense Vegetable Storage & Batch Management Service
 * Production-ready REST client and condition evaluation engine for stored produce.
 * =====================================================================================
 */

const STORAGE_KEY_PREFIX = 'vegsense_active_storage_';
const CACHE_KEY_PREFIX = 'vegsense_storage_cache_';

// Standard Agricultural Storage Reference Presets
export const VEGETABLE_PRESETS = [
  {
    name: 'Tomato',
    variety: 'Roma / Cherry',
    optimalTempMin: 18.0,
    optimalTempMax: 24.0,
    optimalHumidityMin: 65.0,
    optimalHumidityMax: 75.0,
    minimumLight: 100,
    maximumLight: 500,
    lightRequirement: '100–500 lux (Indirect ambient)',
    shelfLifeDays: 14,
    recommendedChamber: 'Chamber #04 (Bay A)',
    description: 'Chilling-sensitive fruit. Do not store below 12°C. High ethylene producer.'
  },
  {
    name: 'Potato',
    variety: 'Russet Burbank',
    optimalTempMin: 12.0,
    optimalTempMax: 16.0,
    optimalHumidityMin: 85.0,
    optimalHumidityMax: 92.0,
    minimumLight: 0,
    maximumLight: 50,
    lightRequirement: '0–50 lux (Total darkness to prevent solanine/greening)',
    shelfLifeDays: 45,
    recommendedChamber: 'Chamber #02 (Root Cellar)',
    description: 'Keep completely dark to prevent chlorophyll and solanine synthesis.'
  },
  {
    name: 'Onion',
    variety: 'Yellow / Red Globe',
    optimalTempMin: 15.0,
    optimalTempMax: 20.0,
    optimalHumidityMin: 55.0,
    optimalHumidityMax: 65.0,
    minimumLight: 0,
    maximumLight: 150,
    lightRequirement: '0–150 lux (Dark dry room to stop sprouting)',
    shelfLifeDays: 60,
    recommendedChamber: 'Chamber #01 (Dry Storage)',
    description: 'Requires low relative humidity and good ventilation to prevent sprouting.'
  },
  {
    name: 'Carrot',
    variety: 'Nantes Sweet',
    optimalTempMin: 16.0,
    optimalTempMax: 22.0,
    optimalHumidityMin: 70.0,
    optimalHumidityMax: 82.0,
    minimumLight: 0,
    maximumLight: 200,
    lightRequirement: '0–200 lux (Dim root cellar storage)',
    shelfLifeDays: 21,
    recommendedChamber: 'Chamber #04 (Bay B)',
    description: 'Sensitive to ethylene gas (induces bitter isocoumarin). Keep isolated from apples.'
  },
  {
    name: 'Bell Pepper',
    variety: 'California Wonder',
    optimalTempMin: 18.0,
    optimalTempMax: 22.0,
    optimalHumidityMin: 70.0,
    optimalHumidityMax: 80.0,
    minimumLight: 80,
    maximumLight: 400,
    lightRequirement: '80–400 lux (Moderate diffuse lighting)',
    shelfLifeDays: 16,
    recommendedChamber: 'Chamber #04 (Bay C)',
    description: 'Prone to moisture loss and shriveling if RH drops below 65%.'
  },
  {
    name: 'Cabbage',
    variety: 'Savoy / Green',
    optimalTempMin: 10.0,
    optimalTempMax: 15.0,
    optimalHumidityMin: 80.0,
    optimalHumidityMax: 90.0,
    minimumLight: 50,
    maximumLight: 300,
    lightRequirement: '50–300 lux (Dim cool air)',
    shelfLifeDays: 28,
    recommendedChamber: 'Chamber #03 (Cool Chamber)',
    description: 'Compact brassica. Maintains good shelf-life under high relative humidity.'
  },
  {
    name: 'Broccoli',
    variety: 'Calabrese',
    optimalTempMin: 4.0,
    optimalTempMax: 8.0,
    optimalHumidityMin: 85.0,
    optimalHumidityMax: 95.0,
    shelfLifeDays: 10,
    recommendedChamber: 'Chamber #05 (Refrigerated)',
    description: 'Highly perishable. Requires cool temperatures to prevent florets yellowing.'
  },
  {
    name: 'Cucumber',
    variety: 'English Long',
    optimalTempMin: 16.0,
    optimalTempMax: 20.0,
    optimalHumidityMin: 75.0,
    optimalHumidityMax: 85.0,
    shelfLifeDays: 12,
    recommendedChamber: 'Chamber #04 (Bay A)',
    description: 'Chilling injury occurs below 10°C (watery soft spots). Monitor closely.'
  }
];

function getAuthHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  const effectiveToken = token || localStorage.getItem('vegsense_jwt_token') || sessionStorage.getItem('vegsense_jwt_token');
  if (effectiveToken) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  }
  return headers;
}

/**
 * Fetches all storage items for a user from database.
 */
export async function fetchStorageItems(userId, token) {
  try {
    const res = await fetch(`/api/storage?userId=${encodeURIComponent(userId || '')}`, {
      method: 'GET',
      headers: getAuthHeaders(token)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.items)) {
        try {
          localStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify(data.items));
        } catch (e) {}
        return data.items;
      }
    }
  } catch (err) {
    console.warn('Network error fetching storage items, loading cache:', err);
  }

  // Fallback to local cache
  try {
    const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (e) {}

  return [];
}

/**
 * Fetches the active storage batch for a user.
 */
export async function fetchActiveStorage(userId, token) {
  try {
    const res = await fetch(`/api/storage/active?userId=${encodeURIComponent(userId || '')}`, {
      method: 'GET',
      headers: getAuthHeaders(token)
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.activeItem) {
        setActiveStorage(userId, data.activeItem);
        return data.activeItem;
      }
    }
  } catch (err) {
    console.warn('Error fetching active storage, using local storage:', err);
  }

  return getActiveStorage(userId);
}

/**
 * Creates a new storage record in the database.
 */
export async function createStorageItem(storageData, token) {
  const res = await fetch('/api/storage', {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify(storageData)
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to create storage record.');
  }

  return data.item;
}

/**
 * Updates an existing storage record in the database.
 */
export async function updateStorageItem(id, storageData, token) {
  const res = await fetch(`/api/storage/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getAuthHeaders(token),
    body: JSON.stringify(storageData)
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to update storage record.');
  }

  return data.item;
}

/**
 * Deletes a storage record from the database.
 */
export async function deleteStorageItem(id, userId, token) {
  const res = await fetch(`/api/storage/${encodeURIComponent(id)}?userId=${encodeURIComponent(userId || '')}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to delete storage record.');
  }

  return data;
}

/**
 * Activates a storage batch to connect it to live device monitoring.
 */
export async function activateStorageBatch(id, userId, token) {
  const res = await fetch(`/api/storage/${encodeURIComponent(id)}/activate`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ userId })
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to activate storage batch.');
  }

  if (data.activeItem) {
    setActiveStorage(userId, data.activeItem);
  }

  return data.activeItem;
}

/**
 * Synchronizes real or demo sensor telemetry with a batch record in the database.
 */
export async function syncBatchTelemetry(id, telemetry, token) {
  try {
    const res = await fetch(`/api/storage/${encodeURIComponent(id)}/sync-telemetry`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(telemetry)
    });
    if (res.ok) {
      const data = await res.json();
      return data.item;
    }
  } catch (e) {
    console.warn('Could not sync telemetry with storage:', e);
  }
  return null;
}

/**
 * Evaluates current atmospheric readings against the vegetable batch optimal parameters.
 */
export function calculateVegetableCondition(vegetable, currentTemp, currentHumidity, currentGas, currentRisk, currentLight = 420) {
  if (!vegetable) {
    return {
      status: 'UNKNOWN',
      badgeClass: 'status-unknown',
      color: '#64748b',
      tempStatus: 'Normal',
      tempDiff: 0,
      humidityStatus: 'Normal',
      humidityDiff: 0,
      lightStatus: 'Normal',
      lightDeviation: 0,
      lightRisk: 10,
      preservationScore: 85,
      advisory: 'Select or register a vegetable batch to evaluate preservation conditions.'
    };
  }

  const optTempMin = Number(vegetable.optimal_temp_min ?? vegetable.optimalTempMin ?? 18);
  const optTempMax = Number(vegetable.optimal_temp_max ?? vegetable.optimalTempMax ?? 24);
  const optHumMin = Number(vegetable.optimal_humidity_min ?? vegetable.optimalHumidityMin ?? 65);
  const optHumMax = Number(vegetable.optimal_humidity_max ?? vegetable.optimalHumidityMax ?? 75);
  const minLight = Number(vegetable.minimum_light ?? vegetable.minimumLight ?? 100);
  const maxLight = Number(vegetable.maximum_light ?? vegetable.maximumLight ?? 500);

  const t = Number(currentTemp ?? 28.5);
  const h = Number(currentHumidity ?? 72);
  const gas = Number(currentGas ?? 420);
  const risk = Number(currentRisk ?? 18);
  const light = currentLight !== null && currentLight !== undefined ? Number(currentLight) : 420;

  let tempDeviation = 0;
  let tempStatus = 'Optimal';
  if (t > optTempMax) {
    tempDeviation = Number((t - optTempMax).toFixed(1));
    tempStatus = `Elevated (+${tempDeviation}°C)`;
  } else if (t < optTempMin) {
    tempDeviation = Number((optTempMin - t).toFixed(1));
    tempStatus = `Below Min (-${tempDeviation}°C)`;
  }

  let humDeviation = 0;
  let humStatus = 'Optimal';
  if (h > optHumMax) {
    humDeviation = Math.round(h - optHumMax);
    humStatus = `High (+${humDeviation}% RH)`;
  } else if (h < optHumMin) {
    humDeviation = Math.round(optHumMin - h);
    humStatus = `Dry (-${humDeviation}% RH)`;
  }

  // Section 3 & 4 & 22: Vegetable-specific light evaluation
  let lightDeviation = 0;
  let lightStatus = 'Optimal';
  let lightRisk = 10;
  if (light > maxLight) {
    lightDeviation = Math.round(light - maxLight);
    lightStatus = `High Light (+${lightDeviation} lux)`;
    lightRisk = Math.min(85, Math.round(45 + (lightDeviation / 300) * 35));
  } else if (light < minLight) {
    lightDeviation = Math.round(minLight - light);
    lightStatus = `Low Light (-${lightDeviation} lux)`;
    lightRisk = Math.max(30, Math.min(60, Math.round(40 + (lightDeviation / Math.max(1, minLight)) * 20)));
  }

  // Calculate status
  let status = 'FRESH';
  let badgeClass = 'status-fresh';
  let color = '#10b981';
  let advisory = 'Environmental conditions are well preserved within safe physiological thresholds.';

  if (risk >= 50 || gas >= 650 || Math.abs(tempDeviation) >= 10 || Math.abs(humDeviation) >= 25 || lightRisk >= 75) {
    status = 'SPOILAGE RISK';
    badgeClass = 'status-spoilage';
    color = '#ef4444';
    advisory = 'High spoilage risk detected! Inspect produce immediately for soft rot or excessive light greening.';
  } else if (risk >= 25 || gas >= 450 || tempDeviation >= 5 || humDeviation >= 15 || lightRisk > 35) {
    status = 'WARNING';
    badgeClass = 'status-warning';
    color = '#f59e0b';
    advisory = `Atmospheric departure detected (Temp: ${tempStatus}, Light: ${lightStatus}). Environmental adjustment recommended.`;
  }

  const score = Math.max(10, Math.min(100, Math.round(100 - risk * 0.5 - tempDeviation * 3 - humDeviation * 1.5 - (lightRisk > 20 ? (lightRisk - 20) * 0.4 : 0))));

  return {
    status,
    badgeClass,
    color,
    tempStatus,
    tempDeviation,
    humStatus,
    humDeviation,
    lightStatus,
    lightDeviation,
    lightRisk,
    preservationScore: score,
    advisory
  };
}

// Local Storage helpers for UI state
export function getActiveStorage(userId = 'default') {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load active storage:', e);
  }
  return null;
}

export function setActiveStorage(userId = 'default', storageData) {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(storageData));
  } catch (e) {
    console.warn('Failed to save active storage:', e);
  }
}

export function clearActiveStorage(userId = 'default') {
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
  } catch (e) {
    console.warn('Failed to clear active storage:', e);
  }
}
