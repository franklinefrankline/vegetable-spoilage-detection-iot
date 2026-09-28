/**
 * VegSense Vegetable Storage Service
 * Manages active vegetable storage selection.
 * If no vegetable has been added, returns null.
 */

const STORAGE_KEY_PREFIX = 'vegsense_active_storage_';

export function getActiveStorage(userId = 'default') {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load active storage:', e);
  }
  return null; // Return null so UI shows "No vegetable selected"
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
