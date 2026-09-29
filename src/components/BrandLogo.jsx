import React from 'react';
import { VegSenseLogo } from './branding/VegSenseLogo';

/**
 * Backward-compatible BrandLogo wrapper
 * Maps legacy props (size, showText, showTagline) to the Official VegSenseLogo
 */
export function BrandLogo({
  size = 38,
  showText = true,
  showTagline = true,
  className = '',
  style = {}
}) {
  let variant = 'full';
  let resolvedMaxWidth = '180px';

  if (!showText) {
    variant = 'mark';
    resolvedMaxWidth = `${size || 38}px`;
  } else if (!showTagline) {
    variant = 'compact';
    resolvedMaxWidth = `${Math.max(120, size * 3.8)}px`;
  } else {
    variant = 'full';
    resolvedMaxWidth = `${Math.max(150, size * 4.2)}px`;
  }

  return (
    <VegSenseLogo
      variant={variant}
      size={variant === 'mark' ? size : undefined}
      maxWidth={variant === 'mark' ? undefined : resolvedMaxWidth}
      className={className}
      style={style}
    />
  );
}

export default BrandLogo;
