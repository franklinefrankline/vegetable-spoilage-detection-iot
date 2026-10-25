/**
 * Centralized Vegetable Image Mapping System
 * Dynamically resolves high-quality images based on vegetable name/type.
 * Robust normalization ensures matches for plurals, varieties, and case variations.
 */

export const VEGETABLE_IMAGES = {
  tomato: '/images/vegetables/tomato.jpg',
  potato: '/images/vegetables/potato.jpg',
  onion: '/images/vegetables/onion.jpg',
  carrot: '/images/vegetables/carrot.jpg',
  cabbage: '/images/vegetables/cabbage.jpg',
  bell_pepper: '/images/vegetables/bell_pepper.jpg',
  generic: '/images/vegetables/generic_vegetable.jpg'
};

export const DEVICE_IMAGES = {
  esp32: '/images/device/esp32_device.jpg'
};

/**
 * Normalizes input string and extracts primary vegetable identifier
 * @param {string} input - Raw vegetable name, batch title, or variety
 * @returns {string} Normalized key matching VEGETABLE_IMAGES or 'generic'
 */
export function normalizeVegetableKey(input) {
  if (!input || typeof input !== 'string') return 'generic';
  
  const clean = input.toLowerCase().trim();

  if (clean.includes('tomato')) return 'tomato';
  if (clean.includes('potato')) return 'potato';
  if (clean.includes('onion') || clean.includes('shallot')) return 'onion';
  if (clean.includes('carrot')) return 'carrot';
  if (clean.includes('cabbage') || clean.includes('brassica')) return 'cabbage';
  if (clean.includes('pepper') || clean.includes('capsicum') || clean.includes('chili')) return 'bell_pepper';

  return 'generic';
}

/**
 * Returns the image URL for a given vegetable name or batch object
 * @param {string|object} item - Vegetable name or storage batch object
 * @returns {string} URL to high-resolution asset
 */
export function getVegetableImage(item) {
  if (!item) return VEGETABLE_IMAGES.generic;

  let rawName = '';
  if (typeof item === 'string') {
    rawName = item;
  } else if (typeof item === 'object') {
    rawName = item.vegetable_name || item.name || item.vegetable || item.vegetable_type || '';
  }

  const key = normalizeVegetableKey(rawName);
  return VEGETABLE_IMAGES[key] || VEGETABLE_IMAGES.generic;
}

/**
 * Generates descriptive, accessible alt text for vegetable imagery
 * @param {string|object} item - Vegetable name or storage batch
 * @returns {string} Human-friendly alt description
 */
export function getVegetableAlt(item) {
  let name = 'Vegetable';
  let variety = '';

  if (typeof item === 'string' && item.trim()) {
    name = item.trim();
  } else if (typeof item === 'object' && item) {
    name = item.vegetable_name || item.name || item.vegetable || item.vegetable_type || 'Vegetable';
    variety = item.variety ? ` (${item.variety})` : '';
  }

  // Capitalize nicely
  const formatted = name.charAt(0).toUpperCase() + name.slice(1);
  return `Fresh ${formatted}${variety} storage batch`;
}

export default {
  getVegetableImage,
  getVegetableAlt,
  normalizeVegetableKey,
  VEGETABLE_IMAGES,
  DEVICE_IMAGES
};
