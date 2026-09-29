/**
 * Centralized Spoilage Thresholds and Agricultural Storage Profiles
 * Used across frontend and backend for environmental risk estimation.
 */

export const DEFAULT_SPOILAGE_WEIGHTS = {
  temperature: 0.30,
  humidity: 0.25,
  gas: 0.25,
  light: 0.10,
  storageAge: 0.10
};

export const VEGETABLE_STORAGE_PROFILES = {
  tomato: {
    id: 'tomato',
    name: 'Tomato',
    variety: 'Roma / Cherry',
    tempOptimalMin: 18.0,
    tempOptimalMax: 24.0,
    tempWarningMax: 30.0,
    humidityOptimalMin: 65.0,
    humidityOptimalMax: 75.0,
    humidityWarningMax: 82.0,
    gasNormalMax: 440,
    gasWarningMax: 550,
    lightMin: 100,
    lightMax: 500,
    shelfLifeDays: 14,
    description: 'Chilling-sensitive fruit. Susceptible to mold at >80% RH and softening at >28°C.'
  },
  potato: {
    id: 'potato',
    name: 'Potato',
    variety: 'Russet',
    tempOptimalMin: 12.0,
    tempOptimalMax: 16.0,
    tempWarningMax: 22.0,
    humidityOptimalMin: 80.0,
    humidityOptimalMax: 90.0,
    humidityWarningMax: 95.0,
    gasNormalMax: 420,
    gasWarningMax: 520,
    lightMin: 0,
    lightMax: 50,
    shelfLifeDays: 45,
    description: 'Requires total dark storage to prevent toxic solanine greening and sprouting.'
  },
  onion: {
    id: 'onion',
    name: 'Onion',
    variety: 'Red & Yellow',
    tempOptimalMin: 15.0,
    tempOptimalMax: 20.0,
    tempWarningMax: 26.0,
    humidityOptimalMin: 55.0,
    humidityOptimalMax: 65.0,
    humidityWarningMax: 75.0,
    gasNormalMax: 430,
    gasWarningMax: 540,
    lightMin: 50,
    lightMax: 200,
    shelfLifeDays: 30,
    description: 'Prefers cool, well-ventilated dry conditions. High humidity promotes neck rot.'
  },
  carrot: {
    id: 'carrot',
    name: 'Carrot',
    variety: 'Nantes',
    tempOptimalMin: 18.0,
    tempOptimalMax: 22.0,
    tempWarningMax: 28.0,
    humidityOptimalMin: 68.0,
    humidityOptimalMax: 78.0,
    humidityWarningMax: 85.0,
    gasNormalMax: 430,
    gasWarningMax: 530,
    lightMin: 50,
    lightMax: 300,
    shelfLifeDays: 21,
    description: 'Sensitive to ethylene and moisture loss. Maintains crispness in moderate humidity.'
  },
  cabbage: {
    id: 'cabbage',
    name: 'Cabbage',
    variety: 'Savoy Green',
    tempOptimalMin: 10.0,
    tempOptimalMax: 15.0,
    tempWarningMax: 24.0,
    humidityOptimalMin: 70.0,
    humidityOptimalMax: 80.0,
    humidityWarningMax: 88.0,
    gasNormalMax: 440,
    gasWarningMax: 560,
    lightMin: 80,
    lightMax: 350,
    shelfLifeDays: 14,
    description: 'Leafy brassica. Excessive heat causes leaf yellowing and rapid transpiration.'
  },
  general: {
    id: 'general',
    name: 'General Produce',
    variety: 'Standard Bay',
    tempOptimalMin: 15.0,
    tempOptimalMax: 25.0,
    tempWarningMax: 30.0,
    humidityOptimalMin: 60.0,
    humidityOptimalMax: 78.0,
    humidityWarningMax: 85.0,
    gasNormalMax: 450,
    gasWarningMax: 580,
    lightMin: 100,
    lightMax: 500,
    shelfLifeDays: 14,
    description: 'Standard storage parameters for commercial vegetable preservation bays.'
  }
};

/**
 * Finds matching vegetable profile by name
 */
export function getVegetableProfile(vegName) {
  if (!vegName || typeof vegName !== 'string') {
    return VEGETABLE_STORAGE_PROFILES.general;
  }
  const key = vegName.trim().toLowerCase();
  for (const [k, prof] of Object.entries(VEGETABLE_STORAGE_PROFILES)) {
    if (key.includes(k) || prof.name.toLowerCase().includes(key)) {
      return prof;
    }
  }
  return VEGETABLE_STORAGE_PROFILES.general;
}
