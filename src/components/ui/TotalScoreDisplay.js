import React, { useRef } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { colors } from '../../data/colors';

const TotalScoreDisplay = ({ score, size = 'md', showLabel = true }) => {
  const maxScore = 40;
  const percentage = (score / maxScore) * 100;
  const dashArray = 283; // Circumference of a circle with r=45
  const dashOffset = dashArray - (dashArray * percentage) / 100;
  
  const scoreRef = useRef(null);
  const isVisible = useIntersectionObserver(scoreRef, { threshold: 0.1 });

  const sizes = {
    sm: 'w-16 h-16 text-xl',
    md: 'w-24 h-24 text-2xl',
    lg: 'w-32 h-32 text-3xl',
    xl: 'w-40 h-40 text-4xl'
  };

  return (
    <div className={`${sizes[size]} relative`} ref={scoreRef}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e6e6e6"
          strokeWidth="8"
        />
        
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={colors.forestGreen}
          strokeWidth="8"
          strokeDasharray={dashArray}
          strokeDashoffset={isVisible ? dashOffset : dashArray}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        
        {showLabel && (
          <text
            x="50"
            y="55"
            textAnchor="middle"
            dominantBaseline="middle"
            fill={colors.text}
            fontSize="18"
            fontWeight="bold"
          >
            {isVisible ? score : 0}/40
          </text>
        )}
      </svg>
    </div>
  );
};

export default TotalScoreDisplay;