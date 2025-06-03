import React, { useState, useEffect, useRef } from 'react';
import { Search, Filter, ArrowUpDown, X } from 'lucide-react';
import { colors } from '../../data/colors';
import { tiers } from '../../data/tiers';

const FilterControls = ({ 
  searchTerm, 
  setSearchTerm, 
  filterTier, 
  setFilterTier,
  sortOption,
  setSortOption,
  sortDirection,
  setSortDirection,
  filteredSeasonCount,
  totalSeasonCount
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const searchInputRef = useRef(null);
  
  // Check for mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setShowFilters(true);
      }
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);
  
  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);
  
  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setFilterTier('All');
    setSortOption('rank');
    setSortDirection('asc');
    
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  // Toggle sort direction
  const toggleSortDirection = () => {
    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
  };
  
  return (
    <div className="bg-white rounded-xl shadow-lg mb-6 overflow-hidden">
      {/* Search bar - always visible */}
      <div className="p-4 border-b border-gray-100">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          
          <input
            ref={searchInputRef}
            type="text"
            className="block w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-forestGreen focus:border-forestGreen transition-colors"
            placeholder="Search seasons by name, number, or tier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          {searchTerm && (
            <button 
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              onClick={() => setSearchTerm('')}
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        <div className="flex justify-between items-center mt-2">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium text-gray-700">{filteredSeasonCount}</span> of <span className="font-medium text-gray-700">{totalSeasonCount}</span> seasons
          </div>
          
          {isMobile && (
            <button 
              className="text-sm font-medium text-forestGreen hover:text-arugalaGreen flex items-center"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} className="mr-1" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          )}
          
          {(searchTerm || filterTier !== 'All' || sortOption !== 'rank' || sortDirection !== 'asc') && (
            <button 
              className="text-sm font-medium text-cherryRed hover:text-red-700 flex items-center"
              onClick={clearFilters}
            >
              <X size={16} className="mr-1" />
              Clear Filters
            </button>
          )}
        </div>
      </div>
      
      {/* Advanced filters - toggleable on mobile */}
      {showFilters && (
        <div className="p-4 bg-buttermilkCream">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tier filter */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Tier</label>
              <div className="relative">
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-forestGreen focus:border-forestGreen appearance-none transition-colors"
                >
                  <option value="All">All Tiers</option>
                  {tiers.map((tier) => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Sort option */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Sort By</label>
              <div className="relative">
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-forestGreen focus:border-forestGreen appearance-none transition-colors"
                >
                  <option value="rank">Rank</option>
                  <option value="score">Total Score</option>
                  <option value="name">Season Name</option>
                  <option value="season">Season Number</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Sort direction */}
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Order</label>
              <button
                onClick={toggleSortDirection}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-forestGreen focus:border-forestGreen transition-colors"
              >
                <span>{sortDirection === 'asc' ? 'Ascending' : 'Descending'}</span>
                <ArrowUpDown size={18} className={`${sortDirection === 'asc' ? 'text-forestGreen' : 'text-cherryRed'}`} />
              </button>
            </div>
          </div>
          
          {/* Statistics summary */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-xs text-gray-500">Highest Rated</div>
                <div className="font-semibold text-gray-800">Heroes vs. Villains</div>
                <div className="text-xs text-forestGreen font-medium">39/40</div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-xs text-gray-500">Average Score</div>
                <div className="font-semibold text-gray-800">25.5/40</div>
                <div className="text-xs text-gray-600 font-medium">Across all seasons</div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-xs text-gray-500">Top Tier</div>
                <div className="font-semibold text-gray-800">The Pantheon</div>
                <div className="text-xs text-gray-600 font-medium">4 seasons</div>
              </div>
              
              <div className="bg-white p-3 rounded-lg shadow-sm">
                <div className="text-xs text-gray-500">Unwatched</div>
                <div className="font-semibold text-gray-800">8 Seasons</div>
                <div className="text-xs text-gray-600 font-medium">Yet to be ranked</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterControls;