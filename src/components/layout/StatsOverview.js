import React from 'react';
import { BarChart2, TrendingUp, Award } from 'lucide-react';
import { colors } from '../../data/colors';
import { tiers } from '../../data/tiers';
import { seasonData } from '../../data/seasonData';
import ProgressBar from '../ui/ProgressBar';
import TotalScoreDisplay from '../ui/TotalScoreDisplay';

const StatsOverview = () => {
  // Calculate tier distribution
  const tierCounts = {};
  tiers.forEach(tier => {
    tierCounts[tier] = seasonData.filter(season => season.tier === tier).length;
  });
  
  // Calculate average scores
  const avgStrategy = (seasonData.reduce((sum, season) => sum + season.scores.strategy, 0) / seasonData.length).toFixed(1);
  const avgCharacters = (seasonData.reduce((sum, season) => sum + season.scores.characters, 0) / seasonData.length).toFixed(1);
  const avgStory = (seasonData.reduce((sum, season) => sum + season.scores.story, 0) / seasonData.length).toFixed(1);
  const avgIconicMoments = (seasonData.reduce((sum, season) => sum + season.scores.iconicMoments, 0) / seasonData.length).toFixed(1);
  const avgTotal = (seasonData.reduce((sum, season) => sum + season.scores.total, 0) / seasonData.length).toFixed(1);
  
  // Find max and min scores
  const maxTotal = Math.max(...seasonData.map(season => season.scores.total));
  const minTotal = Math.min(...seasonData.map(season => season.scores.total));
  const maxSeason = seasonData.find(season => season.scores.total === maxTotal);
  const minSeason = seasonData.find(season => season.scores.total === minTotal);
  
  // Find highest in each category
  const highestStrategy = seasonData.reduce((prev, current) => 
    (prev.scores.strategy > current.scores.strategy) ? prev : current
  );
  
  const highestCharacters = seasonData.reduce((prev, current) => 
    (prev.scores.characters > current.scores.characters) ? prev : current
  );
  
  const highestStory = seasonData.reduce((prev, current) => 
    (prev.scores.story > current.scores.story) ? prev : current
  );
  
  const highestIconicMoments = seasonData.reduce((prev, current) => 
    (prev.scores.iconicMoments > current.scores.iconicMoments) ? prev : current
  );
  
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Season Rankings Statistics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
            <BarChart2 size={20} className="mr-2" />
            Overall Distribution
          </h3>
          
          <div className="space-y-3">
            {tiers.map(tier => (
              <div key={tier} className="flex items-center">
                <div className="w-32 text-sm font-medium truncate">{tier}</div>
                <div className="flex-1 ml-2">
                  <div className="bg-gray-200 h-8 rounded-lg overflow-hidden relative">
                    <div 
                      className="h-full rounded-lg transition-all duration-1000"
                      style={{ 
                        width: `${(tierCounts[tier] / seasonData.length) * 100}%`,
                        backgroundColor: colors.forestGreen
                      }}
                    >
                      <div className="absolute inset-0 flex items-center px-3 text-sm text-white font-medium">
                        {tierCounts[tier]} seasons
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
              <Award size={20} className="mr-2" />
              Category Leaders
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-sm text-gray-500 mb-1">Best Strategy</div>
                <div className="text-lg font-semibold text-gray-800">{highestStrategy.name}</div>
                <div className="text-xl font-bold text-gray-700 mt-1">{highestStrategy.scores.strategy}/10</div>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-sm text-gray-500 mb-1">Best Characters</div>
                <div className="text-lg font-semibold text-gray-800">{highestCharacters.name}</div>
                <div className="text-xl font-bold text-gray-700 mt-1">{highestCharacters.scores.characters}/10</div>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-sm text-gray-500 mb-1">Best Story</div>
                <div className="text-lg font-semibold text-gray-800">{highestStory.name}</div>
                <div className="text-xl font-bold text-gray-700 mt-1">{highestStory.scores.story}/10</div>
              </div>
              
              <div className="p-4 rounded-lg bg-gray-50">
                <div className="text-sm text-gray-500 mb-1">Best Iconic Moments</div>
                <div className="text-lg font-semibold text-gray-800">{highestIconicMoments.name}</div>
                <div className="text-xl font-bold text-gray-700 mt-1">{highestIconicMoments.scores.iconicMoments}/10</div>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
            <TrendingUp size={20} className="mr-2" />
            Average Scores
          </h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-sm text-gray-500 mb-1">Strategy</div>
              <div className="text-3xl font-bold text-gray-800">{avgStrategy}</div>
              <div className="mt-2">
                <ProgressBar value={avgStrategy} maxValue={10} color={colors.forestGreen} label="" showLabel={false} />
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-sm text-gray-500 mb-1">Characters</div>
              <div className="text-3xl font-bold text-gray-800">{avgCharacters}</div>
              <div className="mt-2">
                <ProgressBar value={avgCharacters} maxValue={10} color={colors.arugalaGreen} label="" showLabel={false} />
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-sm text-gray-500 mb-1">Story</div>
              <div className="text-3xl font-bold text-gray-800">{avgStory}</div>
              <div className="mt-2">
                <ProgressBar value={avgStory} maxValue={10} color={colors.warmOrange} label="" showLabel={false} />
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-sm text-gray-500 mb-1">Iconic Moments</div>
              <div className="text-3xl font-bold text-gray-800">{avgIconicMoments}</div>
              <div className="mt-2">
                <ProgressBar value={avgIconicMoments} maxValue={10} color={colors.seafoamBlue} label="" showLabel={false} />
              </div>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-gray-50 mb-6">
            <div className="text-sm text-gray-500 mb-1">Average Total Score</div>
            <div className="text-4xl font-bold text-gray-800">{avgTotal}/40</div>
            <div className="mt-2">
              <ProgressBar value={avgTotal} maxValue={40} color={colors.primary} label="" showLabel={false} height={12} />
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 border-l-4 border-green-500">
              <div className="text-sm text-gray-500 mb-1">Highest Rated Season</div>
              <div className="text-lg font-semibold text-gray-800">{maxSeason.name}</div>
              <div className="flex items-center mt-2">
                <TotalScoreDisplay score={maxSeason.scores.total} size="sm" showLabel={false} />
                <div className="ml-3">
                  <div className="text-2xl font-bold text-gray-700">{maxSeason.scores.total}/40</div>
                  <div className="text-xs text-gray-500">TOTAL SCORE</div>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-gray-50 border-l-4 border-red-500">
              <div className="text-sm text-gray-500 mb-1">Lowest Rated Season</div>
              <div className="text-lg font-semibold text-gray-800">{minSeason.name}</div>
              <div className="flex items-center mt-2">
                <TotalScoreDisplay score={minSeason.scores.total} size="sm" showLabel={false} />
                <div className="ml-3">
                  <div className="text-2xl font-bold text-gray-700">{minSeason.scores.total}/40</div>
                  <div className="text-xs text-gray-500">TOTAL SCORE</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsOverview;