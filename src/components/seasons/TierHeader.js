import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { colors } from '../../data/colors';
import { tierImages, fallbackTierImage } from '../../data/tierImages';
import { tierDescriptions } from '../../data/tierDescriptions';

const TierHeader = ({ tier, seasonCount, isCollapsed, toggleCollapsed }) => {
  const [imageError, setImageError] = useState(false);
  
  const tierImagePath = tierImages[tier] || fallbackTierImage;
  
  const handleImageError = () => {
    setImageError(true);
  };
  
  return (
    <div className="rounded-t-xl overflow-hidden">
      {/* Accent Bar */}
      <div className="h-2" style={{ backgroundColor: colors.forestGreen }}></div>
      
      {/* Main Header */}
      <div 
        className="flex items-center justify-between p-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggleCollapsed}
      >
        <div className="flex items-center space-x-4">
          {/* Tier Image */}
          {!imageError && (
            <div className="flex-shrink-0 relative group">
              <img 
                src={tierImagePath} 
                alt={`${tier} icon`} 
                className="w-16 h-16 object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                onError={handleImageError}
                style={{ filter: 'drop-shadow(0px 2px 3px rgba(0, 0, 0, 0.1))' }}
              />
            </div>
          )}
          
          <div className="flex-1 max-w-3xl">
            <h2 className="text-xl font-bold text-gray-800">{tier}</h2>
            <p className="text-sm text-gray-500 mt-1">{tierDescriptions[tier]}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-4">
          <div className="text-sm font-medium text-gray-500">{seasonCount} seasons</div>
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TierHeader;