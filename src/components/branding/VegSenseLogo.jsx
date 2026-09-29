import React from 'react';
import wordmarkLogo from '../../assets/vegsense-wordmark.png';
import compactLogo from '../../assets/vegsense-logo-compact.png';
import markLogo from '../../assets/vegsense-mark.png';

/**
 * Official VegSense Brand Logo Component
 * 
 * Variants:
 * - 'mark': Symbol only (House + Wi-Fi + V + Leaf) from vegsense-mark.png
 * - 'full' / 'wordmark': Complete official logo (Symbol + Wordmark + Tagline) from vegsense-wordmark.png
 * - 'compact': Compact official logo
 * 
 * Respects strict official brand guidelines:
 * - Direct image asset rendering (no CSS/SVG recreation)
 * - Responsive sizing (object-fit: contain)
 * - Accessible alt text
 * - Theme-agnostic pure branding
 */
export function VegSenseLogo({
  variant = 'full',
  size,
  width,
  maxWidth,
  height,
  className = '',
  style = {},
  priority = true,
  alt
}) {
  // Determine asset source
  let src = wordmarkLogo;
  let defaultAlt = 'VegSense - Smart Storage Intelligence';
  let defaultMaxWidth = '260px';

  if (variant === 'mark') {
    src = markLogo;
    defaultAlt = 'VegSense';
    defaultMaxWidth = size ? `${size}px` : '42px';
  } else if (variant === 'compact') {
    src = compactLogo;
    defaultAlt = 'VegSense - Smart Storage Intelligence';
    defaultMaxWidth = size ? `${size}px` : '160px';
  } else {
    // variant === 'full' || variant === 'wordmark'
    src = wordmarkLogo;
    defaultAlt = 'VegSense - Smart Storage Intelligence';
    defaultMaxWidth = size ? `${size}px` : '260px';
  }

  // Sizing resolution
  const resolvedMaxWidth = maxWidth || (width ? undefined : defaultMaxWidth);
  const resolvedWidth = width || (size ? `${size}px` : '100%');
  const resolvedHeight = height || (variant === 'mark' && size ? `${size}px` : 'auto');

  const containerStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 0,
    verticalAlign: 'middle',
    maxWidth: resolvedMaxWidth,
    width: resolvedWidth,
    flexShrink: 0,
    ...style
  };

  const imageStyles = {
    width: '100%',
    height: resolvedHeight,
    maxWidth: '100%',
    objectFit: 'contain',
    display: 'block',
    userSelect: 'none',
    pointerEvents: 'none'
  };

  return (
    <div
      className={`vegsense-official-logo vegsense-logo-${variant} ${className}`}
      style={containerStyles}
      data-logo-variant={variant}
    >
      <img
        src={src}
        alt={alt || defaultAlt}
        width={variant === 'mark' ? (size || 42) : undefined}
        height={variant === 'mark' ? (size || 42) : undefined}
        loading={priority ? 'eager' : 'lazy'}
        decoding="sync"
        style={imageStyles}
      />
    </div>
  );
}

export default VegSenseLogo;
