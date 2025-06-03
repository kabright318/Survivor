/**
 * Client-side image optimization utilities
 * Handles modern format detection and quality enhancement
 */

// Check browser support for modern image formats
export const getBrowserSupport = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return {
    webp: canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
    avif: canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0
  };
};

// Generate optimized image sources based on browser support
export const getOptimizedImageSrc = (originalSrc, priority = false) => {
  if (!originalSrc) return null;
  
  const support = getBrowserSupport();
  const basePath = originalSrc.replace(/\.[^/.]+$/, '');
  
  // Create a prioritized list of formats to try
  const sources = [];
  
  if (support.avif) {
    sources.push(`${basePath}.avif`);
  }
  
  if (support.webp) {
    sources.push(`${basePath}.webp`);
  }
  
  // Always include original as fallback
  sources.push(originalSrc);
  
  return sources;
};

// Create a promise-based image loader
export const loadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      // Check image quality
      const quality = {
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
        isHighRes: img.naturalWidth >= 200 && img.naturalHeight >= 200
      };
      
      resolve({ img, quality, src });
    };
    
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

// Try multiple image sources and return the first successful one
export const loadOptimizedImage = async (sources, fallbackSrc) => {
  const sourcesToTry = Array.isArray(sources) ? sources : [sources];
  
  for (const src of sourcesToTry) {
    try {
      const result = await loadImage(src);
      if (result.quality.isHighRes) {
        return result;
      }
    } catch (error) {
      // Continue to next source
      continue;
    }
  }
  
  // If all optimized sources fail, try the fallback
  if (fallbackSrc && !sourcesToTry.includes(fallbackSrc)) {
    try {
      return await loadImage(fallbackSrc);
    } catch (error) {
      throw new Error('All image sources failed to load');
    }
  }
  
  throw new Error('No valid image sources found');
};

// Apply image enhancement filters
export const getImageEnhancements = (hasError = false) => {
  if (hasError) return {};
  
  return {
    filter: 'contrast(1.05) saturate(1.1) brightness(1.02)',
    imageRendering: 'high-quality',
    imageSharp: 'crisp-edges'
  };
};

// Preload critical images
export const preloadImage = (src, priority = 'low') => {
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  link.fetchPriority = priority;
  document.head.appendChild(link);
  
  return link;
};

// Create responsive image srcset for different screen densities
export const createSrcSet = (baseSrc, formats = ['webp', 'jpg']) => {
  const basePath = baseSrc.replace(/\.[^/.]+$/, '');
  const extension = baseSrc.split('.').pop();
  
  const srcSet = formats.map(format => {
    const src = format === extension ? baseSrc : `${basePath}.${format}`;
    return `${src} 1x, ${src} 2x`; // Could be enhanced with actual 2x images
  }).join(', ');
  
  return srcSet;
};