import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Menu, Search, Filter, BarChart2, List, X, Clock } from 'lucide-react';
import { colors } from '../data/colors';
import { tiers } from '../data/tiers';
import { seasonData } from '../data/seasonData';
import { filterAndSortSeasons } from '../utils/filters';
import TierGroup from './seasons/TierGroup';
import StatsOverview from './layout/StatsOverview';
import UnwatchedSeasons from './layout/UnwatchedSeasons';

/**
 * Main SurvivorRankings component
 * Handles the overall page layout and state
 */
const SurvivorRankings = () => {
  // State
  const [expandedSeasons, setExpandedSeasons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState('All');
  const [sortOption, setSortOption] = useState('rank'); // 'rank', 'score', 'name', 'season'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc', 'desc'
  const [activeTab, setActiveTab] = useState('seasons');
  
  // Handle expanding/collapsing seasons
  const toggleExpanded = (rank) => {
    if (expandedSeasons.includes(rank)) {
      setExpandedSeasons(expandedSeasons.filter(r => r !== rank));
    } else {
      setExpandedSeasons([...expandedSeasons, rank]);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterTier('All');
    setSortOption('rank');
    setSortDirection('asc');
  };
  
  // Get filtered and sorted seasons
  const filteredSeasons = filterAndSortSeasons(
    seasonData, 
    searchTerm, 
    filterTier, 
    sortOption, 
    sortDirection
  );
  
  // Group filtered seasons by tier
  const filteredGroupedSeasons = tiers.map(tier => {
    return {
      tier,
      seasons: filteredSeasons.filter(season => season.tier === tier)
    };
  });
  
  // Check if filtering is active
  const isFiltering = searchTerm !== '' || filterTier !== 'All' || sortOption !== 'rank' || sortDirection !== 'asc';
  
  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      {/* Hero Banner - Simplified with forest green background */}
      <div className="py-6" style={{ backgroundColor: colors.forestGreen }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold">Survivor Season Rankings</h1>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <div className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto">
          <div className="flex">
            <button 
              className={`px-6 py-4 text-gray-700 font-medium flex items-center ${activeTab === 'seasons' ? 'border-b-2 border-forestGreen text-forestGreen' : ''}`}
              onClick={() => setActiveTab('seasons')}
            >
              <List size={18} className="mr-2" />
              Season Rankings
            </button>
            <button 
              className={`px-6 py-4 text-gray-700 font-medium flex items-center ${activeTab === 'stats' ? 'border-b-2 border-forestGreen text-forestGreen' : ''}`}
              onClick={() => setActiveTab('stats')}
            >
              <BarChart2 size={18} className="mr-2" />
              Stats & Analysis
            </button>
            <button 
              className={`px-6 py-4 text-gray-700 font-medium flex items-center ${activeTab === 'unwatched' ? 'border-b-2 border-forestGreen text-forestGreen' : ''}`}
              onClick={() => setActiveTab('unwatched')}
            >
              <Clock size={18} className="mr-2" />
              Unwatched Seasons
            </button>
          </div>
        </div>
      </div>
      
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Seasons Tab */}
        {activeTab === 'seasons' && (
          <>
            {/* Controls */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>Season Rankings</h2>
                <p className="text-gray-600">38 seasons ranked from best to worst</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Search seasons..." 
                    className="border border-gray-200 rounded-lg py-3 pl-10 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-forestGreen focus:border-transparent"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                {/* Tier Filter */}
                <div className="relative">
                  <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <select 
                    className="border border-gray-200 rounded-lg py-3 pl-10 pr-4 w-full appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-forestGreen focus:border-transparent"
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value)}
                  >
                    <option value="All">All Tiers</option>
                    {tiers.map(tier => (
                      <option key={tier} value={tier}>{tier}</option>
                    ))}
                  </select>
                </div>
                
                {/* Sort */}
                <div className="relative">
                  <Filter size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <select 
                    className="border border-gray-200 rounded-lg py-3 pl-10 pr-4 w-full appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-forestGreen focus:border-transparent"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                  >
                    <option value="rank">Sort by Rank</option>
                    <option value="score">Sort by Total Score</option>
                    <option value="name">Sort by Name</option>
                    <option value="season">Sort by Season Number</option>
                  </select>
                </div>
                
                {/* Sort Direction */}
                <div className="flex space-x-2">
                  <button
                    className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center transition-colors ${sortDirection === 'asc' ? 'bg-forestGreen text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
                    onClick={() => setSortDirection('asc')}
                  >
                    Ascending
                  </button>
                  <button
                    className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center transition-colors ${sortDirection === 'desc' ? 'bg-forestGreen text-white' : 'bg-white border border-gray-200 text-gray-700'}`}
                    onClick={() => setSortDirection('desc')}
                  >
                    Descending
                  </button>
                </div>
              </div>
              
              {isFiltering && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{filteredSeasons.length}</span> seasons found
                    {searchTerm && <span> matching "<span className="font-medium">{searchTerm}</span>"</span>}
                    {filterTier !== 'All' && <span> in <span className="font-medium">{filterTier}</span> tier</span>}
                  </div>
                  <button
                    className="text-sm text-red-500 font-medium flex items-center"
                    onClick={clearFilters}
                  >
                    <X size={14} className="mr-1" />
                    Clear filters
                  </button>
                </div>
              )}
            </div>
            
            {/* Season List/Grid */}
            {filteredSeasons.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-2xl font-bold text-gray-400 mb-2">No seasons found</div>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                {isFiltering ? (
                  <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div>
                      {filteredSeasons.map(season => (
                        <TierGroup 
                          key={`filtered-${season.tier}-${season.rank}`}
                          tierGroup={{ tier: season.tier, seasons: [season] }}
                          expandedSeasons={expandedSeasons}
                          toggleExpanded={toggleExpanded}
                          isFiltering={true}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  filteredGroupedSeasons.map(tierGroup => (
                    <TierGroup 
                      key={tierGroup.tier}
                      tierGroup={tierGroup}
                      expandedSeasons={expandedSeasons}
                      toggleExpanded={toggleExpanded}
                      isFiltering={isFiltering}
                    />
                  ))
                )}
              </>
            )}
          </>
        )}
        
        {/* Stats Tab */}
        {activeTab === 'stats' && <StatsOverview />}
        
        {/* Unwatched Seasons Tab */}
        {activeTab === 'unwatched' && <UnwatchedSeasons />}
      </main>
      
      <footer className="py-8 px-4 bg-forestGreen text-center text-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-lg font-medium mb-2">Survivor Season Rankings</div>
          <p className="text-sm text-gray-100">Created by a dedicated Survivor fan. Data is subjective and based on personal opinions.</p>
          <p className="text-sm mt-4">&copy; 2025 Survivor Rankings</p>
        </div>
      </footer>
    </div>
  );
};

export default SurvivorRankings;