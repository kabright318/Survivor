import React, { useRef } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { colors } from '../../data/colors';

const RadarChart = ({ scores, animated = true, size = 'md' }) => {
  const chartRef = useRef(null);
  const isVisible = useIntersectionObserver(chartRef, { threshold: 0.1 });
  
  const maxScore = 10;
  const centerX = 50;
  const centerY = 50;
  const baseRadius = 40;
  const radius = baseRadius * (isVisible && animated ? 1 : 0);
  
  // Calculate points for each score
  const strategyAngle = 0;
  const charactersAngle = Math.PI / 2;
  const storyAngle = Math.PI;
  const iconicMomentsAngle = 3 * Math.PI / 2;
  
  const strategyPoint = {
    x: centerX + (radius * scores.strategy / maxScore) * Math.cos(strategyAngle),
    y: centerY + (radius * scores.strategy / maxScore) * Math.sin(strategyAngle)
  };
  
  const charactersPoint = {
    x: centerX + (radius * scores.characters / maxScore) * Math.cos(charactersAngle),
    y: centerY + (radius * scores.characters / maxScore) * Math.sin(charactersAngle)
  };
  
  const storyPoint = {
    x: centerX + (radius * scores.story / maxScore) * Math.cos(storyAngle),
    y: centerY + (radius * scores.story / maxScore) * Math.sin(storyAngle)
  };
  
  const iconicMomentsPoint = {
    x: centerX + (radius * scores.iconicMoments / maxScore) * Math.cos(iconicMomentsAngle),
    y: centerY + (radius * scores.iconicMoments / maxScore) * Math.sin(iconicMomentsAngle)
  };
  
  const points = `${strategyPoint.x},${strategyPoint.y} ${charactersPoint.x},${charactersPoint.y} ${storyPoint.x},${storyPoint.y} ${iconicMomentsPoint.x},${iconicMomentsPoint.y}`;

  const sizes = {
    sm: 'w-24 h-24',
    md: 'w-36 h-36',
    lg: 'w-48 h-48',
    xl: 'w-64 h-64'
  };

  return (
    <div className={`${sizes[size]} ${isVisible ? 'opacity-100' : 'opacity-0'} transition-opacity duration-1000`} ref={chartRef}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Background grid */}
        <circle cx={centerX} cy={centerY} r={baseRadius * 0.2} fill="none" stroke={colors.lightText} strokeWidth="0.5" />
        <circle cx={centerX} cy={centerY} r={baseRadius * 0.4} fill="none" stroke={colors.lightText} strokeWidth="0.5" />
        <circle cx={centerX} cy={centerY} r={baseRadius * 0.6} fill="none" stroke={colors.lightText} strokeWidth="0.5" />
        <circle cx={centerX} cy={centerY} r={baseRadius * 0.8} fill="none" stroke={colors.lightText} strokeWidth="0.5" />
        <circle cx={centerX} cy={centerY} r={baseRadius} fill="none" stroke={colors.lightText} strokeWidth="0.5" />
        
        {/* Axis lines */}
        <line x1={centerX} y1={centerY} x2={centerX + baseRadius} y2={centerY} stroke={colors.lightText} strokeWidth="0.5" />
        <line x1={centerX} y1={centerY} x2={centerX} y2={centerY - baseRadius} stroke={colors.lightText} strokeWidth="0.5" />
        <line x1={centerX} y1={centerY} x2={centerX - baseRadius} y2={centerY} stroke={colors.lightText} strokeWidth="0.5" />
        <line x1={centerX} y1={centerY} x2={centerX} y2={centerY + baseRadius} stroke={colors.lightText} strokeWidth="0.5" />
        
        {/* Score polygon */}
        <polygon 
          points={points} 
          fill={colors.forestGreen} 
          fillOpacity="0.4" 
          stroke={colors.forestGreen} 
          strokeWidth="1.5"
          style={{ transition: 'all 1s ease-out' }}
        />
        
        {/* Axis labels */}
        <text x={centerX + baseRadius + 2} y={centerY} fontSize="6" textAnchor="start" fill={colors.vintageGraphite}>Strategy</text>
        <text x={centerX} y={centerY - baseRadius - 2} fontSize="6" textAnchor="middle" fill={colors.vintageGraphite}>Characters</text>
        <text x={centerX - baseRadius - 2} y={centerY} fontSize="6" textAnchor="end" fill={colors.vintageGraphite}>Story</text>
        <text x={centerX} y={centerY + baseRadius + 6} fontSize="6" textAnchor="middle" fill={colors.vintageGraphite}>Iconic</text>
        
        {/* Score points */}
        <circle cx={strategyPoint.x} cy={strategyPoint.y} r="1.5" fill={colors.forestGreen} />
        <circle cx={charactersPoint.x} cy={charactersPoint.y} r="1.5" fill={colors.forestGreen} />
        <circle cx={storyPoint.x} cy={storyPoint.y} r="1.5" fill={colors.forestGreen} />
        <circle cx={iconicMomentsPoint.x} cy={iconicMomentsPoint.y} r="1.5" fill={colors.forestGreen} />
      </svg>
    </div>
  );
};

export default RadarChart;