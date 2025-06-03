import React from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

/**
 * ContestantImage component
 * 
 * A specialized component for displaying contestant images with proper sizing and loading
 * 
 * @param {Object} props Component props
 * @param {string} props.src Image source URL
 * @param {string} props.alt Alternative text for the image
 * @param {string} props.size Size variant ('sm', 'md', 'lg')
 * @param {string} props.className Additional CSS classes
 * @param {Object} props.style Additional inline styles
 */
const ContestantImage = ({ 
  src, 
  alt, 
  size = 'md', 
  className = '', 
  style = {},
  ...rest 
}) => {
  const imgRef = React.useRef(null);
  const isVisible = useIntersectionObserver(imgRef, { threshold: 0.1 });
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState(false);

  // Size classes mapping
  const sizes = {
    xs: 'w-8 h-8',
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  };

  // Handle image load event
  const handleLoad = () => {
    setLoaded(true);
  };

  // Handle image error event
  const handleError = () => {
    setError(true);
  };

  return (
    <div 
      ref={imgRef}
      className={`relative overflow-hidden rounded-full bg-gray-100 ${sizes[size]} ${className}`}
      style={{
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        ...style
      }}
    >
      {isVisible && !error ? (
        <img
          src={src}
          alt={alt || 'Contestant'}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ objectPosition: 'center 20%' }} // Position to focus on face instead of torso
          onLoad={handleLoad}
          onError={handleError}
          {...rest}
        />
      ) : null}
      
      {/* Placeholder or fallback */}
      {(!loaded || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
          <span className="text-gray-400 text-xs">
            {error ? 'Image not found' : 'Loading...'}
          </span>
        </div>
      )}
    </div>
  );
};

export default ContestantImage;
