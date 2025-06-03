import React, { useState, useEffect, useRef } from 'react';

const AnimatedNumber = ({ value, duration = 1000 }) => {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef(null);
  const animationRef = useRef(null);

  const animate = (timestamp) => {
    if (!startTime.current) {
      startTime.current = timestamp;
    }

    const elapsed = timestamp - startTime.current;
    const progress = Math.min(elapsed / duration, 1);
    
    setDisplayValue(Math.floor(progress * value));

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    startTime.current = null;
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value]);

  return <span>{displayValue}</span>;
};

export default AnimatedNumber;