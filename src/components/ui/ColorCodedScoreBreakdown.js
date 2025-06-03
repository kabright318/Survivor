import React, { useRef } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { colors } from '../../data/colors';

const ColorCodedScoreBreakdown = ({ scores, size = 'md' }) => {
  const containerRef = useRef(null);
  const isVisible = useIntersectionObserver(containerRef, { threshold: 0.1 });
  
  // Size configurations
  const sizes = {
    sm: { barHeight: 12, fontSize: 'text-sm', totalSize: 'text-3xl', gap: 'gap-3' },
    md: { barHeight: 16, fontSize: 'text-base', totalSize: 'text-4xl', gap: 'gap-4' },
    lg: { barHeight: 20, fontSize: 'text-lg', totalSize: 'text-5xl', gap: 'gap-5' }
  };
  
  const dims = sizes[size] || sizes.md;
  
  // Color mapping function based on score value
  const getScoreColor = (score) => {
    if (score <= 3) return '#E63946'; // Cherry red for bad scores (1-3)
    if (score <= 7) return '#F9C74F'; // Dijon mustard for average scores (4-7)
    return '#2C5E1A';                 // Forest green for excellent scores (8-10)
  };
  
  // Get color for total score (out of 40)
  const getTotalScoreColor = (total) => {
    if (total <= 15) return '#E63946';  // Cherry red for bad scores (1-15)
    if (total <= 29) return '#F9C74F';  // Dijon mustard for average scores (16-29)
    return '#2C5E1A';                   // Forest green for excellent scores (30-40)
  };
  
  // Category definitions - keep it simple and professional
  const categories = [
    { key: 'strategy', label: 'Strategy' },
    { key: 'characters', label: 'Characters' },
    { key: 'story', label: 'Story' },
    { key: 'iconicMoments', label: 'Iconic Moments' }
  ];
  
  const totalColor = getTotalScoreColor(scores.total);
  
  return (
    <div 
      ref={containerRef}
      className={`w-full bg-white rounded-xl p-5 ${dims.gap}`}
      style={{ 
        opacity: isVisible ? 1 : 0, 
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out'
      }}
    >
      {/* Total Score Display */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center justify-between">
        <div>
          <div className="text-gray-500 font-medium">TOTAL SCORE</div>
          <div className={`${dims.totalSize} font-bold`} style={{ color: totalColor }}>
            {scores.total}
            <span className="text-gray-400 text-lg font-normal">/40</span>
          </div>
        </div>
        
        {/* Circular Total Score Visualization */}
        <div className="relative h-20 w-20">
          <svg viewBox="0 0 36 36" className="w-full h-full">
            {/* Background Circle */}
            <circle 
              cx="18" cy="18" r="15.9" 
              fill="none" 
              stroke="#e6e6e6" 
              strokeWidth="2"
            />
            
            {/* Score Circle */}
            <circle 
              cx="18" cy="18" r="15.9" 
              fill="none" 
              stroke={totalColor} 
              strokeWidth="2"
              strokeDasharray={100}
              strokeDashoffset={100 - ((scores.total / 40) * 100)}
              strokeLinecap="round"
              transform="rotate(-90 18 18)"
              style={{ 
                transition: 'stroke-dashoffset 1s ease-in-out',
                strokeDashoffset: isVisible ? 100 - ((scores.total / 40) * 100) : 100
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-500">
            out of 40
          </div>
        </div>
      </div>
      
      {/* Category Scores */}
      <div className="space-y-4">
        {categories.map((category, index) => {
          const score = scores[category.key];
          const percentage = (score / 10) * 100;
          const scoreColor = getScoreColor(score);
          
          return (
            <div key={category.key} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <div className={`${dims.fontSize} font-medium text-gray-700`}>{category.label}</div>
                <div className="flex items-center">
                  <div 
                    className="font-bold mr-1" 
                    style={{ 
                      color: scoreColor,
                      fontSize: parseInt(dims.fontSize.split('-')[1]) * 1.2 + 'px'
                    }}
                  >
                    {score}
                  </div>
                  <span className="text-gray-400 text-sm">/10</span>
                </div>
              </div>
              
              {/* Score Bar */}
              <div className="relative w-full overflow-hidden rounded-full bg-gray-100" style={{ height: dims.barHeight }}>
                <div 
                  className="rounded-full h-full"
                  style={{ 
                    width: isVisible ? `${percentage}%` : '0%',
                    backgroundColor: scoreColor,
                    transition: `width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.15}s`
                  }}
                ></div>
                
                {/* Voting Tribal Marks */}
                <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none flex items-center px-1">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="flex-1 flex justify-center"
                    >
                      {i < score && (
                        <div 
                          className="w-1 h-1 bg-white rounded-full opacity-80"
                          style={{ 
                            boxShadow: '0 0 2px rgba(255,255,255,0.8)',
                            opacity: isVisible ? 0.8 : 0,
                            transform: isVisible ? 'scale(1)' : 'scale(0)',
                            transition: `opacity 0.3s ease-out ${0.8 + (i * 0.03)}s, transform 0.3s ease-out ${0.8 + (i * 0.03)}s`
                          }}
                        ></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Score Scale */}
              <div className="flex justify-between mt-1 px-1">
                <div className="text-xs text-gray-400">0</div>
                <div className="text-xs text-gray-400">5</div>
                <div className="text-xs text-gray-400">10</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Rating Legend */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex justify-between">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: '#E63946' }}></div>
            <div className="text-xs text-gray-500">Poor (1-3)</div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: '#F9C74F' }}></div>
            <div className="text-xs text-gray-500">Average (4-7)</div>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: '#2C5E1A' }}></div>
            <div className="text-xs text-gray-500">Excellent (8-10)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorCodedScoreBreakdown;