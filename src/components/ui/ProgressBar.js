import React, { useRef } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const ProgressBar = ({ value, maxValue, color, label, showLabel = true, height = 8, animated = true }) => {
  const progressRef = useRef(null);
  const isVisible = useIntersectionObserver(progressRef, { threshold: 0.1 });
  const percentage = (value / maxValue) * 100;

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-sm font-medium">{value}/{maxValue}</span>
        </div>
      )}
      <div 
        ref={progressRef}
        className="w-full bg-gray-200 rounded-full overflow-hidden" 
        style={{ height: `${height}px` }}
      >
        <div 
          className="rounded-full transition-all duration-1000"
          style={{ 
            width: isVisible && animated ? `${percentage}%` : '0%', 
            height: '100%',
            backgroundColor: color,
            transition: 'width 1s ease-out'
          }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;