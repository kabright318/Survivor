import React, { useState, useRef } from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import SeasonRow from './SeasonRow';
import SeasonDetail from './SeasonDetail';
import TierHeader from './TierHeader';

const TierGroup = ({ tierGroup, expandedSeasons, toggleExpanded, isFiltering }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const groupRef = useRef(null);
  const isVisible = useIntersectionObserver(groupRef, { threshold: 0.1 });

  if (tierGroup.seasons.length === 0) return null;

  const toggleCollapsed = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div 
      ref={groupRef}
      className={`mb-8 transition-all duration-500 shadow-lg rounded-xl overflow-hidden ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
    >
      {!isFiltering && (
        <TierHeader 
          tier={tierGroup.tier}
          seasonCount={tierGroup.seasons.length}
          isCollapsed={isCollapsed}
          toggleCollapsed={toggleCollapsed}
        />
      )}
      
      {!isCollapsed && (
        <div className="bg-white">
          {tierGroup.seasons.map(season => (
            <div key={season.rank}>
              <SeasonRow 
                season={season} 
                isExpanded={expandedSeasons.includes(season.rank)}
                onClick={() => toggleExpanded(season.rank)}
              />
              {expandedSeasons.includes(season.rank) && (
                <SeasonDetail 
                  season={season} 
                  onClose={() => toggleExpanded(season.rank)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TierGroup;