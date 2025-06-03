import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadOptimizedImage, getOptimizedImageSrc, getImageEnhancements } from '../../utils/imageOptimization';

/**
 * OptimizedContestantImage - A component for displaying high-quality contestant images
 * with progressive loading, modern format support, and performance optimization
 * 
 * @param {Object} props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for the image
 * @param {Function} props.onError - Error handler function
 * @param {Function} props.onLoad - Load handler function
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Additional inline styles
 * @param {boolean} props.priority - Whether this image should load immediately
 */
const OptimizedContestantImage = ({ 
  src, 
  alt, 
  onError, 
  onLoad, 
  className = "", 
  style = {},
  priority = false,
  ...rest 
}) => {
  const [imageSrc, setImageSrc] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);
  
  const loadImage = useCallback(async () => {
    if (!src) return;
    
    setIsLoading(true);
    setHasError(false);
    
    try {
      // Get optimized image sources based on browser support
      const sources = getOptimizedImageSrc(src, priority);
      
      // Try to load the best available format
      const result = await loadOptimizedImage(sources, src);
      
      setImageSrc(result.src);
      setIsLoading(false);
      
      if (onLoad) onLoad();
      
    } catch (error) {
      console.warn(`Failed to load image ${src}:`, error.message);
      setHasError(true);
      setIsLoading(false);
      
      if (onError) onError();
    }
  }, [src, priority, onLoad, onError]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const currentImg = imgRef.current;
    
    if (priority) {
      // Load immediately for priority images
      loadImage();
      return;
    }
    
    if (!currentImg) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' } // Start loading when within 50px of viewport
    );
    
    observerRef.current.observe(currentImg);
    
    return () => {
      if (observerRef.current && currentImg) {
        observerRef.current.unobserve(currentImg);
      }
    };
  }, [priority, loadImage]);
  
  // Combine provided styles with optimizations
  const imageEnhancements = getImageEnhancements(hasError);
  const combinedStyles = {
    objectPosition: 'center 20%', // Focus on faces
    ...imageEnhancements,
    ...style
  };
  
  if (hasError) {
    // Fallback for failed images
    return (
      <div 
        ref={imgRef}
        className={`w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 ${className}`}
        style={style}
      >
        <div className="text-center">
          <div className="text-sm font-medium">{alt?.split(' ').map(n => n[0]).join('') || '?'}</div>
        </div>
      </div>
    );
  }
  
  return (
    <div ref={imgRef} className="w-full h-full relative">
      {/* Loading placeholder */}
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`} />
      )}
      
      {/* Main image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt || "Contestant"}
          className={`w-full h-full object-cover optimized-image image-enhanced transition-all duration-500 ${
            isLoading ? 'opacity-0 scale-105' : 'opacity-100 scale-100'
          } ${className}`}
          style={combinedStyles}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
          {...rest}
        />
      )}
    </div>
  );
};

export default OptimizedContestantImage;