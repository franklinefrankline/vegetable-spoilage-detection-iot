import React, { useState } from 'react';
import { getVegetableImage, getVegetableAlt, VEGETABLE_IMAGES } from '../../utils/vegetableImageMap';

/**
 * VegetableImage
 * Renders high-quality vegetable imagery with automatic fallback,
 * lazy-loading, and accessibility compliance.
 */
export function VegetableImage({
  item,
  vegetableName,
  name,
  className = '',
  style = {},
  aspectRatio = '4 / 3',
  width,
  height,
  borderRadius,
  fallback = VEGETABLE_IMAGES.generic,
  ...props
}) {
  const [hasError, setHasError] = useState(false);
  const target = item || vegetableName || name;
  const src = hasError ? fallback : getVegetableImage(target);
  const alt = getVegetableAlt(target);

  return (
    <div
      className={`vegetable-image-container ${className}`.trim()}
      style={{
        position: 'relative',
        overflow: 'hidden',
        aspectRatio: aspectRatio,
        width: width || '100%',
        height: height || '100%',
        borderRadius: borderRadius || style.borderRadius || '8px',
        backgroundColor: 'var(--bg-subtle, #f1f5f9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setHasError(true)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          transition: 'transform 0.3s ease, filter 0.3s ease'
        }}
        {...props}
      />
    </div>
  );
}

export default VegetableImage;
