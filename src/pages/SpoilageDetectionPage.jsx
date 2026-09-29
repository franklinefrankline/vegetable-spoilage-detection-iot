import React from 'react';
import { Spoilage } from './Spoilage';

/**
 * SpoilageDetectionPage serves as the dedicated route wrapper for /spoilage and /spoilage-detection.
 * Delegates directly to the comprehensive Part 6 Spoilage component.
 */
export function SpoilageDetectionPage() {
  return <Spoilage />;
}

export default SpoilageDetectionPage;
