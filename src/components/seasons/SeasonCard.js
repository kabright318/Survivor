import React, { useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { colors } from '../../data/colors';
import ScoreIcon from '../ui/ScoreIcon';
import TotalScoreDisplay from '../ui/TotalScoreDisplay';

const SeasonCard = ({ season, onClick, isExpanded }) => {
  const cardRef = useRef(null);
  const isVisible = useIntersectionObserver(cardRef, { threshold: 0.1 });
  
  return (
    <div 
      ref={cardRef}
      className={`rounded-xl overflow-hidden shadow-lg transition-all duration-500 transform cursor-pointer ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ 
        backgroundColor: colors.input,
        borderTop: `4px solid ${colors.forestGreen}`
      }}
      onClick={onClick}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-800">{season.name}</h3>
            <p className="text-sm text-gray-500">Season {season.number}</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white" style={{ backgroundColor: colors.forestGreen }}>
              <span className="text-xl">{season.rank}</span>
            </div>
            <div className="text-xs mt-1 font-medium">Rank #{season.rank}</div>
          </div>
        </div>
        
        <div className="flex justify-between mb-4">
          <ScoreIcon score={season.scores.strategy} category="strategy" color={colors.forestGreen} />
          <ScoreIcon score={season.scores.characters} category="characters" color={colors.arugalaGreen} />
          <ScoreIcon score={season.scores.story} category="story" color={colors.warmOrange} />
          <ScoreIcon score={season.scores.iconicMoments} category="iconicMoments" color={colors.seafoamBlue} />
        </div>
        
        <div className="mt-4 flex justify-between items-center">
          <TotalScoreDisplay score={season.scores.total} size="sm" showLabel={false} />
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-800">{season.scores.total}</div>
            <div className="text-xs text-gray-500">TOTAL SCORE</div>
          </div>
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100">
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonCard;