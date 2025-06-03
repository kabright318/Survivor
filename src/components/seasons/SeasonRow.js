import React from 'react';
import { TrendingUp, Star, Menu, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { colors } from '../../data/colors';

const SeasonRow = ({ season, onClick, isExpanded }) => {
  return (
    <div 
      className="border-b border-gray-200 py-4 px-4 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white mr-4" style={{ backgroundColor: colors.forestGreen }}>
          {season.rank}
        </div>
        
        <div className="flex-1">
          <div className="flex justify-between items-baseline">
            <h3 className="text-lg font-semibold text-gray-800">{season.name}</h3>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <TrendingUp size={16} className="mr-1 text-gray-500" />
                  <span>{season.scores.strategy}</span>
                </div>
                <div className="flex items-center">
                  <Star size={16} className="mr-1 text-gray-500" />
                  <span>{season.scores.characters}</span>
                </div>
                <div className="flex items-center">
                  <Menu size={16} className="mr-1 text-gray-500" />
                  <span>{season.scores.story}</span>
                </div>
                <div className="flex items-center">
                  <Award size={16} className="mr-1 text-gray-500" />
                  <span>{season.scores.iconicMoments}</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="text-xl font-bold px-3 py-1 rounded-lg text-white" style={{ backgroundColor: colors.forestGreen }}>
                  {season.scores.total}
                </div>
                <div className="ml-2">
                  {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </div>
              </div>
            </div>
          </div>
          <div className="text-sm text-gray-500 mt-1">Season {season.number}</div>
        </div>
      </div>
    </div>
  );
};

export default SeasonRow;