import React from 'react';
import { TrendingUp, Star, Menu, Award, Info } from 'lucide-react';

const ScoreIcon = ({ score, category, color }) => {
  const maxScore = 10;
  const percentage = (score / maxScore) * 100;
  
  let icon;
  switch(category) {
    case 'strategy':
      icon = <TrendingUp size={20} />;
      break;
    case 'characters':
      icon = <Star size={20} />;
      break;
    case 'story':
      icon = <Menu size={20} />;
      break;
    case 'iconicMoments':
      icon = <Award size={20} />;
      break;
    default:
      icon = <Info size={20} />;
  }
  
  return (
    <div className="flex items-center">
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg viewBox="0 0 36 36" className="w-full h-full">
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="#e6e6e6"
            strokeWidth="3"
          />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={94.2}
            strokeDashoffset={94.2 - (94.2 * percentage) / 100}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-gray-700">
          {icon}
        </div>
      </div>
      <div className="ml-2 font-bold text-lg">{score}</div>
    </div>
  );
};

export default ScoreIcon;