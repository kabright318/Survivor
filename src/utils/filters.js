// Utility functions for filtering and sorting seasons

/**
 * Filter and sort seasons based on search, filter, and sort criteria
 * @param {Array} seasonData - Array of season objects
 * @param {String} searchTerm - Text to search for in season name, tier, or number
 * @param {String} filterTier - Filter to specific tier or 'All'
 * @param {String} sortOption - Sort by 'rank', 'score', 'name', or 'season'
 * @param {String} sortDirection - Sort 'asc' or 'desc'
 * @returns {Array} - Filtered and sorted array of seasons
 */
export const filterAndSortSeasons = (seasonData, searchTerm, filterTier, sortOption, sortDirection) => {
  let filteredSeasons = [...seasonData];
  
  // Apply search filter
  if (searchTerm) {
    const lowercaseSearch = searchTerm.toLowerCase();
    filteredSeasons = filteredSeasons.filter(season => 
      season.name.toLowerCase().includes(lowercaseSearch) || 
      season.tier.toLowerCase().includes(lowercaseSearch) ||
      season.number.toString().includes(lowercaseSearch)
    );
  }
  
  // Apply tier filter
  if (filterTier !== 'All') {
    filteredSeasons = filteredSeasons.filter(season => season.tier === filterTier);
  }
  
  // Apply sorting
  filteredSeasons.sort((a, b) => {
    let comparison = 0;
    
    switch (sortOption) {
      case 'rank':
        comparison = a.rank - b.rank;
        break;
      case 'score':
        comparison = a.scores.total - b.scores.total;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'season':
        comparison = a.number - b.number;
        break;
      default:
        comparison = a.rank - b.rank;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });
  
  return filteredSeasons;
};