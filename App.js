import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import _ from 'lodash';
import { Search, DollarSign, SortDesc, SortAsc, Grid, List } from 'lucide-react';

const FantasyBaseballDraftTool = () => {
  // State management
  const [playersData, setPlayersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeMainTab, setActiveMainTab] = useState('players');
  const [activeTab, setActiveTab] = useState('hitters');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'dollarValue', direction: 'descending' });
  const [filters, setFilters] = useState({
    positions: 'all',
    team: 'all',
  });
  const [draftedPlayers, setDraftedPlayers] = useState(new Set());
  
  // Draft tracking state
  const [teams, setTeams] = useState(() => {
    // Initialize 12 teams with their budgets and roster spots
    const initialTeams = [];
    for (let i = 1; i <= 12; i++) {
      initialTeams.push({
        id: i,
        name: `Team ${i}`,
        budget: 260,
        rosterSpots: {
          C: { player: null, cost: 0 },
          '1B/DH_1': { player: null, cost: 0 },
          '1B/DH_2': { player: null, cost: 0 },
          '2B': { player: null, cost: 0 },
          'SS': { player: null, cost: 0 },
          'MI': { player: null, cost: 0 },
          '3B': { player: null, cost: 0 },
          '3B/C': { player: null, cost: 0 },
          'OF_1': { player: null, cost: 0 },
          'OF_2': { player: null, cost: 0 },
          'OF_3': { player: null, cost: 0 },
          'OF_4': { player: null, cost: 0 },
          'OF_5': { player: null, cost: 0 },
          'U': { player: null, cost: 0 },
          'P_1': { player: null, cost: 0 },
          'P_2': { player: null, cost: 0 },
          'P_3': { player: null, cost: 0 },
          'P_4': { player: null, cost: 0 },
          'P_5': { player: null, cost: 0 },
          'P_6': { player: null, cost: 0 },
          'P_7': { player: null, cost: 0 },
          'P_8': { player: null, cost: 0 },
          'P_9': { player: null, cost: 0 }
        }
      });
    }
    return initialTeams;
  });
  
  // Track which player is being assigned (for draft sheet)
  const [draftingMode, setDraftingMode] = useState({
    active: false,
    player: null
  });
  
  // Current roster positions array for reference
  const rosterPositions = [
    'C', '1B/DH_1', '1B/DH_2', '2B', 'SS', 'MI', '3B', '3B/C', 
    'OF_1', 'OF_2', 'OF_3', 'OF_4', 'OF_5', 'U',
    'P_1', 'P_2', 'P_3', 'P_4', 'P_5', 'P_6', 'P_7', 'P_8', 'P_9'
  ];

  // League settings
  const leagueSettings = {
    teams: 12,
    budgetPerTeam: 260,
    hittersBudgetPercentage: 0.68,
    pitchersBudgetPercentage: 0.32,
    hitterCategories: ['HR', 'SB', 'RP', 'AVG', 'OBP', 'SLG'],
    pitcherCategories: ['W', 'ERA', 'WHIP', 'SV', 'K']
  };
  
  // Define position groups for the tiers view
  const positionGroups = {
    hitters: ['C', '1B', '2B', '3B', 'SS', 'OF', 'DH'],
    pitchers: ['SP', 'RP']
  };
  
  // Define value tiers
  const valueTiers = [
    { name: 'Elite', min: 40, max: 999 },
    { name: 'Premium', min: 30, max: 39 },
    { name: 'Quality', min: 20, max: 29 },
    { name: 'Solid', min: 15, max: 19 },
    { name: 'Value', min: 10, max: 14 },
    { name: 'Budget', min: 5, max: 9 },
    { name: 'Flier', min: 1, max: 4 }
  ];
  
  // Calculate team metrics for the draft sheet
  const calculateTeamMetrics = (team) => {
    // Count filled spots
    let filledSpots = 0;
    let spentBudget = 0;
    
    Object.values(team.rosterSpots).forEach(spot => {
      if (spot.player) {
        filledSpots++;
        spentBudget += spot.cost;
      }
    });
    
    const remainingSpots = Object.keys(team.rosterSpots).length - filledSpots;
    const remainingBudget = team.budget - spentBudget;
    
    // Calculate average spend available
    const avgSpend = remainingSpots > 0 ? remainingBudget / remainingSpots : 0;
    
    // Calculate max bid (remaining budget minus $1 for each remaining spot after the current one)
    const maxBid = remainingSpots > 0 ? remainingBudget - (remainingSpots - 1) : 0;
    
    return {
      filledSpots,
      remainingSpots,
      spentBudget,
      remainingBudget,
      avgSpend,
      maxBid
    };
  };
  
  // Function to assign a player to a team
  const assignPlayerToTeam = (teamId, positionKey, player, cost) => {
    if (!player || cost <= 0) return;
    
    setTeams(prevTeams => {
      return prevTeams.map(team => {
        if (team.id === teamId) {
          const updatedRosterSpots = {
            ...team.rosterSpots,
            [positionKey]: {
              player: player,
              cost: cost
            }
          };
          
          return {
            ...team,
            rosterSpots: updatedRosterSpots
          };
        }
        return team;
      });
    });
    
    setDraftingMode({
      active: false,
      player: null
    });
  };
  
  // Toggle player selection for drafting
  const togglePlayerDrafting = (player) => {
    setDraftingMode(prev => ({
      active: !prev.active || prev.player?.Player !== player.Player,
      player: prev.player?.Player === player.Player && prev.active ? null : player
    }));
  };
  
  // Helper function to clear a roster spot
  const clearRosterSpot = (teamId, positionKey) => {
    setTeams(prevTeams => {
      return prevTeams.map(team => {
        if (team.id === teamId) {
          const updatedRosterSpots = {
            ...team.rosterSpots,
            [positionKey]: {
              player: null,
              cost: 0
            }
          };
          
          return {
            ...team,
            rosterSpots: updatedRosterSpots
          };
        }
        return team;
      });
    });
  };

  // Calculate z-scores for a specific stat
  const calculateZScores = (players, stat, isNegative = false) => {
    // Filter out any null or undefined values
    const validPlayers = players.filter(player => player[stat] !== null && player[stat] !== undefined);
    
    // Calculate mean
    const values = validPlayers.map(player => player[stat]);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Calculate standard deviation
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Calculate z-score for each player
    return players.map(player => {
      if (player[stat] === null || player[stat] === undefined) {
        return { ...player, [`${stat}_z`]: 0 };
      }
      
      let zScore = (player[stat] - mean) / stdDev;
      
      // Invert negative stats like ERA, WHIP
      if (isNegative) {
        zScore = -zScore;
      }
      
      return { ...player, [`${stat}_z`]: zScore };
    });
  };

  // Load sample data for the preview
  useEffect(() => {
    const loadSampleData = () => {
      try {
        // Sample hitters data
        const sampleHitters = [
          { Player: "Juan Soto", Team: "NYY", Positions: "RF", AB: 582, AVG: 0.282, R: 112, HR: 38, RBI: 103, SB: 12, OBP: 0.410, SLG: 0.524, playerType: "hitter" },
          { Player: "Aaron Judge", Team: "NYY", Positions: "CF,RF", AB: 575, AVG: 0.301, R: 121, HR: 47, RBI: 115, SB: 8, OBP: 0.415, SLG: 0.621, playerType: "hitter" },
          { Player: "Ronald Acuña Jr.", Team: "ATL", Positions: "RF", AB: 588, AVG: 0.318, R: 127, HR: 34, RBI: 86, SB: 63, OBP: 0.392, SLG: 0.567, playerType: "hitter" },
          { Player: "Gunnar Henderson", Team: "BAL", Positions: "SS,3B", AB: 597, AVG: 0.276, R: 109, HR: 37, RBI: 94, SB: 14, OBP: 0.353, SLG: 0.519, playerType: "hitter" },
          { Player: "Bobby Witt Jr.", Team: "KC", Positions: "SS", AB: 612, AVG: 0.292, R: 102, HR: 32, RBI: 96, SB: 34, OBP: 0.349, SLG: 0.522, playerType: "hitter" },
          { Player: "Mookie Betts", Team: "LAD", Positions: "RF,2B", AB: 545, AVG: 0.310, R: 117, HR: 28, RBI: 90, SB: 15, OBP: 0.408, SLG: 0.545, playerType: "hitter" },
          { Player: "Fernando Tatis Jr.", Team: "SD", Positions: "RF", AB: 565, AVG: 0.285, R: 103, HR: 35, RBI: 93, SB: 22, OBP: 0.365, SLG: 0.528, playerType: "hitter" },
          { Player: "Freddie Freeman", Team: "LAD", Positions: "1B", AB: 590, AVG: 0.325, R: 95, HR: 29, RBI: 102, SB: 8, OBP: 0.405, SLG: 0.558, playerType: "hitter" },
          { Player: "Shohei Ohtani", Team: "LAD", Positions: "DH", AB: 520, AVG: 0.297, R: 110, HR: 42, RBI: 105, SB: 18, OBP: 0.388, SLG: 0.594, playerType: "hitter" },
          { Player: "José Ramírez", Team: "CLE", Positions: "3B", AB: 585, AVG: 0.282, R: 98, HR: 33, RBI: 108, SB: 25, OBP: 0.352, SLG: 0.515, playerType: "hitter" },
          { Player: "Yordan Alvarez", Team: "HOU", Positions: "LF,DH", AB: 540, AVG: 0.295, R: 92, HR: 36, RBI: 112, SB: 2, OBP: 0.385, SLG: 0.575, playerType: "hitter" },
          { Player: "Vladimir Guerrero Jr.", Team: "TOR", Positions: "1B", AB: 602, AVG: 0.287, R: 88, HR: 34, RBI: 104, SB: 4, OBP: 0.365, SLG: 0.522, playerType: "hitter" },
          { Player: "Julio Rodríguez", Team: "SEA", Positions: "CF", AB: 578, AVG: 0.275, R: 95, HR: 29, RBI: 85, SB: 30, OBP: 0.342, SLG: 0.492, playerType: "hitter" },
          { Player: "Adley Rutschman", Team: "BAL", Positions: "C,DH", AB: 555, AVG: 0.277, R: 82, HR: 24, RBI: 87, SB: 3, OBP: 0.368, SLG: 0.475, playerType: "hitter" },
          { Player: "Francisco Lindor", Team: "NYM", Positions: "SS", AB: 595, AVG: 0.265, R: 94, HR: 31, RBI: 89, SB: 19, OBP: 0.335, SLG: 0.470, playerType: "hitter" },
          { Player: "Corbin Carroll", Team: "ARI", Positions: "LF,CF", AB: 572, AVG: 0.280, R: 101, HR: 22, RBI: 75, SB: 45, OBP: 0.355, SLG: 0.478, playerType: "hitter" },
          { Player: "Rafael Devers", Team: "BOS", Positions: "3B", AB: 580, AVG: 0.289, R: 91, HR: 35, RBI: 103, SB: 4, OBP: 0.352, SLG: 0.533, playerType: "hitter" },
          { Player: "Trea Turner", Team: "PHI", Positions: "SS", AB: 610, AVG: 0.290, R: 103, HR: 26, RBI: 85, SB: 28, OBP: 0.340, SLG: 0.485, playerType: "hitter" },
          { Player: "Marcus Semien", Team: "TEX", Positions: "2B", AB: 625, AVG: 0.272, R: 108, HR: 28, RBI: 92, SB: 15, OBP: 0.336, SLG: 0.462, playerType: "hitter" },
          { Player: "Bryce Harper", Team: "PHI", Positions: "1B,DH", AB: 535, AVG: 0.293, R: 88, HR: 32, RBI: 99, SB: 12, OBP: 0.398, SLG: 0.545, playerType: "hitter" }
        ];
        
        // Sample pitchers data
        const samplePitchers = [
          { Player: "Gerrit Cole", Team: "NYY", Positions: "SP", IP: 195.2, K: 238, W: 16, SV: 0, ERA: 2.85, WHIP: 0.98, playerType: "pitcher" },
          { Player: "Corbin Burnes", Team: "BAL", Positions: "SP", IP: 202.1, K: 222, W: 14, SV: 0, ERA: 3.05, WHIP: 1.05, playerType: "pitcher" },
          { Player: "Spencer Strider", Team: "ATL", Positions: "SP", IP: 184.0, K: 252, W: 15, SV: 0, ERA: 3.22, WHIP: 1.07, playerType: "pitcher" },
          { Player: "Emmanuel Clase", Team: "CLE", Positions: "RP", IP: 68.1, K: 77, W: 5, SV: 42, ERA: 1.98, WHIP: 0.92, playerType: "pitcher" },
          { Player: "Josh Hader", Team: "HOU", Positions: "RP", IP: 62.0, K: 91, W: 4, SV: 38, ERA: 2.38, WHIP: 0.94, playerType: "pitcher" },
          { Player: "Zack Wheeler", Team: "PHI", Positions: "SP", IP: 198.0, K: 215, W: 15, SV: 0, ERA: 3.12, WHIP: 1.03, playerType: "pitcher" },
          { Player: "Dylan Cease", Team: "SD", Positions: "SP", IP: 187.2, K: 221, W: 13, SV: 0, ERA: 3.40, WHIP: 1.15, playerType: "pitcher" },
          { Player: "Luis Castillo", Team: "SEA", Positions: "SP", IP: 191.1, K: 189, W: 14, SV: 0, ERA: 3.25, WHIP: 1.08, playerType: "pitcher" },
          { Player: "Blake Snell", Team: "SF", Positions: "SP", IP: 172.0, K: 210, W: 12, SV: 0, ERA: 3.38, WHIP: 1.18, playerType: "pitcher" },
          { Player: "Max Fried", Team: "ATL", Positions: "SP", IP: 185.0, K: 176, W: 13, SV: 0, ERA: 3.15, WHIP: 1.10, playerType: "pitcher" },
          { Player: "Devin Williams", Team: "MIL", Positions: "RP", IP: 63.2, K: 92, W: 4, SV: 35, ERA: 2.35, WHIP: 1.02, playerType: "pitcher" },
          { Player: "Camilo Doval", Team: "SF", Positions: "RP", IP: 65.0, K: 74, W: 3, SV: 33, ERA: 2.60, WHIP: 1.05, playerType: "pitcher" },
          { Player: "Cole Ragans", Team: "KC", Positions: "SP", IP: 178.1, K: 192, W: 12, SV: 0, ERA: 3.48, WHIP: 1.14, playerType: "pitcher" },
          { Player: "Shohei Ohtani", Team: "LAD", Positions: "SP", IP: 0.0, K: 0, W: 0, SV: 0, ERA: 0.00, WHIP: 0.00, playerType: "pitcher" }, // Not playing in 2025 as pitcher
          { Player: "Aaron Nola", Team: "PHI", Positions: "SP", IP: 195.0, K: 205, W: 13, SV: 0, ERA: 3.58, WHIP: 1.12, playerType: "pitcher" },
          { Player: "Ryan Helsley", Team: "STL", Positions: "RP", IP: 61.0, K: 75, W: 3, SV: 32, ERA: 2.45, WHIP: 0.98, playerType: "pitcher" },
          { Player: "Tarik Skubal", Team: "DET", Positions: "SP", IP: 182.0, K: 208, W: 13, SV: 0, ERA: 3.20, WHIP: 1.08, playerType: "pitcher" },
          { Player: "Logan Webb", Team: "SF", Positions: "SP", IP: 210.0, K: 178, W: 14, SV: 0, ERA: 3.35, WHIP: 1.13, playerType: "pitcher" },
          { Player: "Tyler Glasnow", Team: "LAD", Positions: "SP", IP: 165.0, K: 218, W: 12, SV: 0, ERA: 3.15, WHIP: 1.06, playerType: "pitcher" },
          { Player: "Jhoan Duran", Team: "MIN", Positions: "RP", IP: 62.0, K: 84, W: 4, SV: 30, ERA: 2.52, WHIP: 1.02, playerType: "pitcher" }
        ];

        // Process hitters
        let hitters = sampleHitters.map(player => {
          // Calculate custom RP stat
          const r = player.R || 0;
          const rbi = player.RBI || 0;
          const hr = player.HR || 0;
          const rp = r + rbi - hr;
          
          return {
            ...player,
            RP: rp
          };
        });
        
        // Calculate z-scores for hitter categories
        hitters = calculateZScores(hitters, 'HR');
        hitters = calculateZScores(hitters, 'SB');
        hitters = calculateZScores(hitters, 'RP');
        hitters = calculateZScores(hitters, 'AVG');
        hitters = calculateZScores(hitters, 'OBP');
        hitters = calculateZScores(hitters, 'SLG');
        
        // Calculate total z-score for each hitter
        hitters = hitters.map(player => {
          const totalZ = 
            (player.HR_z || 0) + 
            (player.SB_z || 0) + 
            (player.RP_z || 0) + 
            (player.AVG_z || 0) + 
            (player.OBP_z || 0) + 
            (player.SLG_z || 0);
          
          return {
            ...player,
            totalZ: totalZ
          };
        });
        
        // Calculate total league budget
        const { teams, budgetPerTeam, hittersBudgetPercentage, pitchersBudgetPercentage } = leagueSettings;
        const totalBudget = teams * budgetPerTeam;
        const hittersBudget = totalBudget * hittersBudgetPercentage;
        const pitchersBudget = totalBudget * pitchersBudgetPercentage;
        
        // Sort hitters by total z-score
        hitters = _.orderBy(hitters, ['totalZ'], ['desc']);
        
        // Get the top hitters (15 per team)
        const rostersizeHitters = 15;
        const valuableHitters = hitters.slice(0, teams * rostersizeHitters);
        const minHitterZ = valuableHitters[valuableHitters.length - 1].totalZ;
        
        // Calculate z-score above replacement for each hitter
        valuableHitters.forEach(player => {
          player.zAboveReplacement = player.totalZ - minHitterZ;
        });
        
        // Calculate the total z-score for all valuable hitters
        const totalHitterZ = valuableHitters.reduce((sum, player) => sum + player.zAboveReplacement, 0);
        
        // Calculate the dollar value per unit of z-score
        const dollarPerHitterZ = hittersBudget / totalHitterZ;
        
        // Process pitchers
        let pitchers = samplePitchers;
        
        // Calculate z-scores for pitcher categories
        pitchers = calculateZScores(pitchers, 'W');
        pitchers = calculateZScores(pitchers, 'K');
        pitchers = calculateZScores(pitchers, 'SV');
        pitchers = calculateZScores(pitchers, 'ERA', true); // Negative stat
        pitchers = calculateZScores(pitchers, 'WHIP', true); // Negative stat
        
        // Calculate total z-score for each pitcher
        pitchers = pitchers.map(player => {
          const totalZ = 
            (player.W_z || 0) + 
            (player.K_z || 0) + 
            (player.SV_z || 0) + 
            (player.ERA_z || 0) + 
            (player.WHIP_z || 0);
          
          return {
            ...player,
            totalZ: totalZ
          };
        });
        
        // Sort pitchers by total z-score
        pitchers = _.orderBy(pitchers, ['totalZ'], ['desc']);
        
        // Get the top pitchers (10 per team)
        const rostersizePitchers = 10;
        const valuablePitchers = pitchers.slice(0, teams * rostersizePitchers);
        const minPitcherZ = valuablePitchers[valuablePitchers.length - 1].totalZ;
        
        // Calculate z-score above replacement for each pitcher
        valuablePitchers.forEach(player => {
          player.zAboveReplacement = player.totalZ - minPitcherZ;
        });
        
        // Calculate the total z-score for all valuable pitchers
        const totalPitcherZ = valuablePitchers.reduce((sum, player) => sum + player.zAboveReplacement, 0);
        
        // Calculate the dollar value per unit of z-score
        const dollarPerPitcherZ = pitchersBudget / totalPitcherZ;
        
        // Calculate final dollar values for all players
        const processedHitters = hitters.map(player => {
          const zAboveReplacement = player.totalZ - minHitterZ;
          let dollarValue = zAboveReplacement > 0 ? zAboveReplacement * dollarPerHitterZ : 1;
          
          // Parse positions into an array for better display
          const positions = player.Positions ? player.Positions.split(',').map(pos => pos.trim()) : [];
          
          // Determine primary position for tiers view
          let primaryPosition = positions[0] || 'Unknown';
          
          // Consolidate outfield positions
          if (['LF', 'CF', 'RF'].includes(primaryPosition)) {
            primaryPosition = 'OF';
          }
          
          return {
            ...player,
            dollarValue: Math.max(1, Math.round(dollarValue)),
            positionArray: positions,
            primaryPosition: primaryPosition
          };
        });
        
        const processedPitchers = pitchers.map(player => {
          const zAboveReplacement = player.totalZ - minPitcherZ;
          let dollarValue = zAboveReplacement > 0 ? zAboveReplacement * dollarPerPitcherZ : 1;
          
          // Parse positions into an array for better display
          const positions = player.Positions ? player.Positions.split(',').map(pos => pos.trim()) : [];
          const primaryPosition = positions[0] || 'Unknown';
          
          return {
            ...player,
            dollarValue: Math.max(1, Math.round(dollarValue)),
            positionArray: positions,
            primaryPosition: primaryPosition
          };
        });
        
        // Combine both datasets
        setPlayersData([...processedHitters, ...processedPitchers]);
        setLoading(false);
      } catch (error) {
        console.error('Error loading sample data:', error);
        setLoading(false);
      }
    };
    
    loadSampleData();
  }, []);

  // Get unique positions and teams for filters
  const uniquePositions = useMemo(() => {
    if (!playersData.length) return [];
    const positions = playersData.flatMap(player => 
      player.Positions ? player.Positions.split(',').map(pos => pos.trim()) : []
    );
    return ['all', ...new Set(positions)].sort();
  }, [playersData]);

  const uniqueTeams = useMemo(() => {
    if (!playersData.length) return [];
    const teams = playersData.map(player => player.Team).filter(Boolean);
    return ['all', ...new Set(teams)].sort();
  }, [playersData]);

  // Filtering logic
  const filteredPlayers = useMemo(() => {
    if (!playersData.length) return [];
    
    return playersData.filter(player => {
      // Filter by player type (hitter/pitcher)
      if (activeTab === 'hitters' && player.playerType !== 'hitter') return false;
      if (activeTab === 'pitchers' && player.playerType !== 'pitcher') return false;
      
      // Filter by search query
      if (searchQuery && !player.Player.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filter by position
      if (filters.positions !== 'all') {
        const playerPositions = (player.Positions || '').split(',').map(pos => pos.trim());
        if (!playerPositions.includes(filters.positions)) {
          return false;
        }
      }
      
      // Filter by team
      if (filters.team !== 'all' && player.Team !== filters.team) {
        return false;
      }
      
      return true;
    });
  }, [playersData, activeTab, searchQuery, filters]);

  // Sorting logic
  const sortedPlayers = useMemo(() => {
    if (!filteredPlayers.length) return [];
    
    let sortedData = [...filteredPlayers];
    
    if (sortConfig.key && sortConfig.direction) {
      sortedData.sort((a, b) => {
        const valueA = a[sortConfig.key] !== undefined ? a[sortConfig.key] : 0;
        const valueB = b[sortConfig.key] !== undefined ? b[sortConfig.key] : 0;
        
        if (sortConfig.direction === 'ascending') {
          return valueA > valueB ? 1 : -1;
        } else {
          return valueA < valueB ? 1 : -1;
        }
      });
    }
    
    return sortedData;
  }, [filteredPlayers, sortConfig]);

  // Group players by position and tier for the tiers view
  const tieredPlayers = useMemo(() => {
    if (!playersData.length) return { hitters: {}, pitchers: {} };
    
    // Filter players by type
    const hitters = playersData.filter(player => player.playerType === 'hitter');
    const pitchers = playersData.filter(player => player.playerType === 'pitcher');
    
    // Initialize result structure
    const result = {
      hitters: {},
      pitchers: {}
    };
    
    // Initialize position categories
    positionGroups.hitters.forEach(pos => {
      result.hitters[pos] = {};
      valueTiers.forEach(tier => {
        result.hitters[pos][tier.name] = [];
      });
    });
    
    positionGroups.pitchers.forEach(pos => {
      result.pitchers[pos] = {};
      valueTiers.forEach(tier => {
        result.pitchers[pos][tier.name] = [];
      });
    });
    
    // Assign hitters to tiers
    hitters.forEach(player => {
      // Get primary position or first position in the array
      let position = player.primaryPosition;
      
      // Skip if position is not in our defined groups
      if (!positionGroups.hitters.includes(position)) return;
      
      // Find appropriate tier
      const tier = valueTiers.find(t => 
        player.dollarValue >= t.min && player.dollarValue <= t.max
      );
      
      if (tier) {
        // Add player to the appropriate position and tier
        result.hitters[position][tier.name].push(player);
      }
    });
    
    // Assign pitchers to tiers
    pitchers.forEach(player => {
      // Get primary position or first position in the array
      let position = player.primaryPosition;
      
      // Skip if position is not in our defined groups
      if (!positionGroups.pitchers.includes(position)) return;
      
      // Find appropriate tier
      const tier = valueTiers.find(t => 
        player.dollarValue >= t.min && player.dollarValue <= t.max
      );
      
      if (tier) {
        // Add player to the appropriate position and tier
        result.pitchers[position][tier.name].push(player);
      }
    });
    
    return result;
  }, [playersData]);

  // Handle sorting
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Handle filter changes
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  // UI Components
  const PositionBadge = ({ positions }) => {
    if (!positions || positions.length === 0) return null;
    
    return (
      <div className="flex flex-wrap gap-1">
        {Array.isArray(positions) ? 
          positions.map((pos, index) => (
            <span 
              key={index} 
              className="inline-block px-2 py-1 text-xs font-bold rounded-md" 
              style={{ 
                backgroundColor: '#005ea2', 
                color: 'white' 
              }}
            >
              {pos}
            </span>
          )) :
          positions.split(',').map((pos, index) => (
            <span 
              key={index} 
              className="inline-block px-2 py-1 text-xs font-bold rounded-md" 
              style={{ 
                backgroundColor: '#005ea2', 
                color: 'white' 
              }}
            >
              {pos.trim()}
            </span>
          ))
        }
      </div>
    );
  };

  const ValueDisplay = ({ value }) => {
    return (
      <div className="flex items-center justify-center font-bold text-lg" style={{ color: '#005ea2' }}>
        <DollarSign size={16} className="mr-1" />
        {value}
      </div>
    );
  };
  
  const PlayerRow = ({ player, index }) => {
    return (
      <tr 
        key={`${player.Player}-${index}`}
        className={`border-b border-gray-100 hover:bg-blue-50 transition-colors ${
          draftingMode.active && draftingMode.player?.Player === player.Player ? 'bg-blue-100' : ''
        }`}
        onClick={() => togglePlayerDrafting(player)}
      >
        {player.playerType === 'hitter' ? (
          <>
            <td className="py-3 px-4 font-medium">{player.Player}</td>
            <td className="py-3 px-4">{player.Team}</td>
            <td className="py-3 px-4">
              <PositionBadge positions={player.positionArray || player.Positions} />
            </td>
            <td className="py-3 px-4">{player.AB}</td>
            <td className="py-3 px-4">{player.AVG?.toFixed(3)}</td>
            <td className="py-3 px-4">{player.R}</td>
            <td className="py-3 px-4">{player.HR}</td>
            <td className="py-3 px-4">{player.RBI}</td>
            <td className="py-3 px-4">{player.SB}</td>
            <td className="py-3 px-4">{player.OBP?.toFixed(3)}</td>
            <td className="py-3 px-4">{player.SLG?.toFixed(3)}</td>
            <td className="py-3 px-4">{player.RP}</td>
            <td className="py-3 px-4 text-center bg-blue-50">
              <ValueDisplay value={player.dollarValue} />
            </td>
          </>
        ) : (
          <>
            <td className="py-3 px-4 font-medium">{player.Player}</td>
            <td className="py-3 px-4">{player.Team}</td>
            <td className="py-3 px-4">
              <PositionBadge positions={player.positionArray || player.Positions} />
            </td>
            <td className="py-3 px-4">{player.IP?.toFixed(1)}</td>
            <td className="py-3 px-4">{player.K}</td>
            <td className="py-3 px-4">{player.W}</td>
            <td className="py-3 px-4">{player.SV}</td>
            <td className="py-3 px-4">{player.ERA?.toFixed(2)}</td>
            <td className="py-3 px-4">{player.WHIP?.toFixed(2)}</td>
            <td className="py-3 px-4 text-center bg-blue-50">
              <ValueDisplay value={player.dollarValue} />
            </td>
          </>
        )}
      </tr>
    );
  };
  
  // DraftSheet component for the draft tracking view
  const DraftSheet = () => {
    const [editingTeam, setEditingTeam] = useState(null);
    const [editingPosition, setEditingPosition] = useState(null);
    const [bidAmount, setBidAmount] = useState(1);
    const [editingTeamName, setEditingTeamName] = useState({
      teamId: null,
      name: ''
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPlayer, setSelectedPlayer] = useState(null);
    
    // Function to start editing a team name
    const startEditingTeamName = (teamId, currentName) => {
      setEditingTeamName({
        teamId,
        name: currentName
      });
    };
    
    // Function to save team name
    const saveTeamName = () => {
      if (editingTeamName.teamId) {
        setTeams(prevTeams => {
          return prevTeams.map(team => {
            if (team.id === editingTeamName.teamId) {
              return {
                ...team,
                name: editingTeamName.name
              };
            }
            return team;
          });
        });
        
        setEditingTeamName({
          teamId: null,
          name: ''
        });
      }
    };
    
    // Start adding a player to a team roster spot
    const startAssigningPlayer = (teamId, positionKey) => {
      // If already editing this position, unselect it
      if (editingTeam === teamId && editingPosition === positionKey) {
        setEditingTeam(null);
        setEditingPosition(null);
        return;
      }
      
      setEditingTeam(teamId);
      setEditingPosition(positionKey);
      
      // If a player is selected, set the bid amount to their dollar value
      if (selectedPlayer) {
        setBidAmount(selectedPlayer.dollarValue);
      } else {
        setBidAmount(1);
      }
    };
    
    // Complete player assignment with current bid
    const completeAssignment = () => {
      if (editingTeam && editingPosition && selectedPlayer) {
        console.log("Assigning player:", selectedPlayer.Player, "to team:", editingTeam, "position:", editingPosition, "cost:", bidAmount);
        
        setTeams(prevTeams => {
          return prevTeams.map(team => {
            if (team.id === editingTeam) {
              const updatedRosterSpots = {
                ...team.rosterSpots,
                [editingPosition]: {
                  player: selectedPlayer,
                  cost: bidAmount
                }
              };
              
              return {
                ...team,
                rosterSpots: updatedRosterSpots
              };
            }
            return team;
          });
        });
        
        // Reset selection states
        setEditingTeam(null);
        setEditingPosition(null);
        setBidAmount(1);
        setSelectedPlayer(null);
      }
    };
    
    // Cancel the assignment
    const cancelAssignment = () => {
      setEditingTeam(null);
      setEditingPosition(null);
      setBidAmount(1);
      setSelectedPlayer(null);
    };
    
    // Helper to get position display name
    const getPositionDisplayName = (posKey) => {
      if (posKey.startsWith('OF_')) {
        return 'OF';
      } else if (posKey.startsWith('1B/DH_')) {
        return '1B/DH';
      } else if (posKey.startsWith('P_')) {
        return 'P';
      } else {
        return posKey;
      }
    };
    
    // Filter players based on search query
    const filteredPlayers = useMemo(() => {
      if (!searchQuery.trim()) return [];
      
      return playersData.filter(player => 
        player.Player.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10); // Limit to 10 results for performance
    }, [searchQuery, playersData]);
    
    // Render each team's column
    const renderTeamColumn = (team) => {
      const metrics = calculateTeamMetrics(team);
      
      return (
        <div key={team.id} className="flex-1 min-w-52 border-r border-gray-200 last:border-r-0">
          {/* Team header */}
          <div className="bg-gray-100 p-3 border-b border-gray-200">
            {editingTeamName.teamId === team.id ? (
              <div className="flex items-center">
                <input
                  type="text"
                  value={editingTeamName.name}
                  onChange={(e) => setEditingTeamName({...editingTeamName, name: e.target.value})}
                  className="flex-1 p-1 border border-gray-300 rounded"
                />
                <button onClick={saveTeamName} className="ml-2 p-1 bg-blue-500 text-white rounded">
                  Save
                </button>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm" style={{ color: '#005ea2' }}>
                  {team.name}
                </h3>
                <button 
                  onClick={() => startEditingTeamName(team.id, team.name)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
          
          {/* Team metrics */}
          <div className="p-2 border-b border-gray-200 bg-blue-50">
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Spent:</span>
                <span className="font-semibold">${metrics.spentBudget}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Remain:</span>
                <span className="font-semibold">${metrics.remainingBudget}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Avg:</span>
                <span className="font-semibold">${Math.floor(metrics.avgSpend)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Max:</span>
                <span className="font-semibold">${Math.floor(metrics.maxBid)}</span>
              </div>
              <div className="col-span-2 flex justify-between mt-1 pt-1 border-t border-blue-200">
                <span className="text-gray-600">Filled:</span>
                <span className="font-semibold">{metrics.filledSpots}/{Object.keys(team.rosterSpots).length}</span>
              </div>
            </div>
          </div>
          
          {/* Roster spots */}
          <div className="divide-y divide-gray-100">
            {Object.entries(team.rosterSpots).map(([key, spot]) => {
              return (
                <div 
                  key={key} 
                  className={`p-2 text-xs hover:bg-blue-50 transition-all ${
                    (editingTeam === team.id && editingPosition === key) ? 'bg-blue-100 ring-2 ring-blue-400' : 
                    spot.player ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold">{getPositionDisplayName(key)}</span>
                    {spot.player && (
                      <button 
                        onClick={() => clearRosterSpot(team.id, key)}
                        className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove player"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  {spot.player ? (
                    <div className="group relative cursor-pointer" onClick={() => startAssigningPlayer(team.id, key)}>
                      <div className="font-medium text-sm">{spot.player.Player}</div>
                      <div className="flex justify-between mt-1">
                        <div className="text-gray-500 text-xs">{spot.player.Team}</div>
                        <div className="font-bold text-xs" style={{ color: '#005ea2' }}>${spot.cost}</div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      onClick={() => startAssigningPlayer(team.id, key)}
                      className={`w-full py-2 border rounded transition-all cursor-pointer ${
                        (editingTeam === team.id && editingPosition === key) 
                          ? 'border-blue-400 bg-white'
                          : 'border-dashed border-gray-300 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {(editingTeam === team.id && editingPosition === key) ? 
                        (selectedPlayer ? 
                          <div className="px-2">
                            <div className="font-medium truncate mb-2">{selectedPlayer.Player}</div>
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                completeAssignment();
                              }}
                              className="flex flex-col gap-2"
                            >
                              <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-2">
                                  <DollarSign size={14} className="text-gray-500" />
                                </span>
                                <input 
                                  type="number" 
                                  min="1" 
                                  max={metrics.maxBid}
                                  value={bidAmount}
                                  onChange={(e) => setBidAmount(Math.min(metrics.maxBid, parseInt(e.target.value) || 1))}
                                  className="w-full p-1.5 pl-6 border border-gray-300 rounded text-center"
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />
                              </div>
                              <div className="flex gap-1">
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    completeAssignment();
                                  }}
                                  className="flex-1 p-1.5 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                  title="Confirm Draft"
                                >
                                  Draft Player
                                </button>
                                <button 
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    cancelAssignment();
                                  }}
                                  className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                  title="Cancel"
                                >
                                  ✗
                                </button>
                              </div>
                            </form>
                          </div>
                          : <div className="text-blue-600 font-medium text-center">Select a player from search above</div>) 
                        : <div className="flex items-center justify-center gap-1 text-xs text-gray-500"><span>Empty</span> <span>(Click to add)</span></div>
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    };
    
    // Player Details Component
    const PlayerDetails = () => {
      if (!selectedPlayer) return null;
      
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-md p-4 mt-4 mb-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 mb-3">
            <div>
              <h3 className="text-lg font-bold">{selectedPlayer.Player}</h3>
              <div className="flex items-center mt-1">
                <span className="text-sm text-gray-600 mr-3">{selectedPlayer.Team}</span>
                <PositionBadge positions={selectedPlayer.positionArray || selectedPlayer.Positions} />
              </div>
            </div>
            <div className="flex flex-col items-end self-end sm:self-start">
              <div className="text-2xl font-bold" style={{ color: '#005ea2' }}>
                ${selectedPlayer.dollarValue}
              </div>
              <span className="text-xs text-gray-500">Estimated Value</span>
            </div>
          </div>
          
          <div className="border-t border-gray-200 pt-3">
            {selectedPlayer.playerType === 'hitter' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-semibold">{selectedPlayer.AVG?.toFixed(3)}</div>
                  <div className="text-xs text-gray-500">AVG</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-semibold">{selectedPlayer.HR}</div>
                  <div className="text-xs text-gray-500">HR</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-semibold">{selectedPlayer.RBI}</div>
                  <div className="text-xs text-gray-500">RBI</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-semibold">{selectedPlayer.SB}</div>
                  <div className="text-xs text-gray-500">SB</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-semibold">{selectedPlayer.R}</div>
                  <div className="text-xs text-gray-500">R</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-semibold">{selectedPlayer.OBP?.toFixed(3)}</div>
                  <div className="text-xs text-gray-500">OBP</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-semibold">{selectedPlayer.SLG?.toFixed(3)}</div>
                  <div className="text-xs text-gray-500">SLG</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-semibold">{selectedPlayer.RP}</div>
                  <div className="text-xs text-gray-500">RP</div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-semibold">{selectedPlayer.ERA?.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">ERA</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-semibold">{selectedPlayer.WHIP?.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">WHIP</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-semibold">{selectedPlayer.K}</div>
                  <div className="text-xs text-gray-500">K</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-semibold">{selectedPlayer.W}</div>
                  <div className="text-xs text-gray-500">W</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-lg font-semibold">{selectedPlayer.SV}</div>
                  <div className="text-xs text-gray-500">SV</div>
                </div>
              </div>
            )}
          </div>
          
          {editingTeam && editingPosition && (
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
                onClick={() => startAssigningPlayer(editingTeam, editingPosition)}
              >
                <DollarSign size={16} /> 
                Use Player (${selectedPlayer.dollarValue})
              </button>
            </div>
          )}
        </div>
      );
    };
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4">
            <h2 className="font-bold text-lg" style={{ color: '#005ea2' }}>
              Fantasy Baseball Draft Tracker
            </h2>
            
            <div className="flex items-center flex-grow max-w-md">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search for player to draft..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
                />
                {searchQuery && (
                  <button 
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchQuery('')}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-end text-sm text-gray-600">
              {editingTeam && editingPosition ? (
                <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full font-medium">
                  Drafting mode active
                </span>
              ) : null}
            </div>
          </div>
          
          {/* Player search results */}
          {searchQuery && filteredPlayers.length > 0 && (
            <div className="border border-gray-200 rounded-lg bg-white mt-3 max-h-72 overflow-y-auto shadow-md">
              {filteredPlayers.map((player) => (
                <div 
                  key={player.Player} 
                  className={`p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 flex justify-between items-center ${
                    selectedPlayer?.Player === player.Player ? "bg-blue-100" : ""
                  }`}
                  onClick={() => setSelectedPlayer(player)}
                >
                  <div className="flex items-center">
                    <span className="font-medium mr-2">{player.Player}</span>
                    <span className="text-gray-500 text-sm">{player.Team}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PositionBadge positions={player.positionArray || player.Positions} />
                    <span className="ml-2 font-bold" style={{ color: '#005ea2' }}>${player.dollarValue}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* No results message */}
          {searchQuery && filteredPlayers.length === 0 && (
            <div className="border border-gray-200 rounded bg-white p-3 mt-3 text-center text-gray-500">
              No players found matching "{searchQuery}"
            </div>
          )}
          
          {/* Selected player details */}
          {selectedPlayer && (
            <PlayerDetails />
          )}
          
          {/* Empty state when no player selected */}
          {editingTeam && editingPosition && !selectedPlayer && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-center">
              <Search size={24} className="mx-auto mb-2 text-blue-500" />
              <h3 className="text-blue-800 font-medium">Search for a player above</h3>
              <p className="text-sm text-blue-600 mt-1">Type a player name to find and draft them</p>
            </div>
          )}
        </div>
        
        <div className="overflow-x-auto" style={{ height: '650px' }}>
          <div className="flex min-w-max">
            {/* For demonstration purposes, we're only showing 4 teams in the preview */}
            {teams.slice(0, 4).map(team => renderTeamColumn(team))}
          </div>
        </div>
      </div>
    );
  };
  
  const TiersView = () => {
    const currentTieredPlayers = activeTab === 'hitters' ? tieredPlayers.hitters : tieredPlayers.pitchers;
    const currentPositions = activeTab === 'hitters' ? positionGroups.hitters : positionGroups.pitchers;
    
    return (
      <div style={{ 
        position: 'relative',
        minWidth: '100%'
      }}>
        <table style={{ 
          width: '100%',
          minWidth: '150%', // Forces horizontal scrolling
          tableLayout: 'fixed',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr className="bg-gray-50">
              <th style={{ 
                padding: '12px',
                border: '1px solid #e5e7eb',
                fontWeight: '600',
                textAlign: 'left',
                minWidth: '120px', 
                width: '120px',
                position: 'sticky',
                left: 0,
                zIndex: 10,
                backgroundColor: '#f9fafb' // Matches bg-gray-50
              }}>
                Tier
              </th>
              {currentPositions.map(position => (
                <th key={position} style={{ 
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  fontWeight: '600',
                  textAlign: 'center',
                  color: '#005ea2', 
                  minWidth: '200px',
                  width: '200px'
                }}>
                  {position}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {valueTiers.map(tier => (
              <tr key={tier.name} style={{ 
                backgroundColor: 'white',
                '&:hover': { backgroundColor: '#eff6ff' } // hover:bg-blue-50 equivalent
              }}>
                <td style={{ 
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  fontWeight: '600',
                  position: 'sticky',
                  left: 0,
                  zIndex: 5,
                  backgroundColor: '#f9fafb', // Matches bg-gray-50
                  boxShadow: '2px 0 5px rgba(0,0,0,0.1)' // Adds shadow for visual separation
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{tier.name}</span>
                    <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>${tier.min}-{tier.max === 999 ? '∞' : tier.max}</span>
                  </div>
                </td>
                {currentPositions.map(position => (
                  <td key={position} style={{ 
                    padding: '12px',
                    border: '1px solid #e5e7eb', 
                    verticalAlign: 'top'
                  }}>
                    {currentTieredPlayers[position] && currentTieredPlayers[position][tier.name] ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {currentTieredPlayers[position][tier.name]
                          .sort((a, b) => b.dollarValue - a.dollarValue)
                          .map((player, idx) => (
                            <div key={idx} style={{ 
                              fontSize: '0.875rem', 
                              padding: '8px', 
                              borderRadius: '0.25rem', 
                              backgroundColor: 'white', 
                              border: '1px solid #f3f4f6',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                              <div style={{ fontWeight: '500' }}>{player.Player}</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>{player.Team}</div>
                                <div style={{ fontWeight: '700', fontSize: '0.75rem', color: '#005ea2' }}>${player.dollarValue}</div>
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>No players</div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const TableHeader = () => {
    const getHeaderCellClass = (key) => {
      const baseClass = "py-3 px-4 text-left font-semibold cursor-pointer hover:bg-gray-50 transition-colors";
      if (sortConfig.key === key) {
        return `${baseClass} text-blue-800`;
      }
      return baseClass;
    };
    
    const getSortIcon = (key) => {
      if (sortConfig.key !== key) return null;
      return sortConfig.direction === 'ascending' ? 
        <SortAsc size={14} className="inline ml-1" /> : 
        <SortDesc size={14} className="inline ml-1" />;
    };

    if (activeTab === 'hitters') {
      return (
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className={getHeaderCellClass('Player')} onClick={() => requestSort('Player')}>
              Player {getSortIcon('Player')}
            </th>
            <th className={getHeaderCellClass('Team')} onClick={() => requestSort('Team')}>
              Team {getSortIcon('Team')}
            </th>
            <th className={getHeaderCellClass('Positions')} onClick={() => requestSort('Positions')}>
              Pos {getSortIcon('Positions')}
            </th>
            <th className={getHeaderCellClass('AB')} onClick={() => requestSort('AB')}>
              AB {getSortIcon('AB')}
            </th>
            <th className={getHeaderCellClass('AVG')} onClick={() => requestSort('AVG')}>
              AVG {getSortIcon('AVG')}
            </th>
            <th className={getHeaderCellClass('R')} onClick={() => requestSort('R')}>
              R {getSortIcon('R')}
            </th>
            <th className={getHeaderCellClass('HR')} onClick={() => requestSort('HR')}>
              HR {getSortIcon('HR')}
            </th>
            <th className={getHeaderCellClass('RBI')} onClick={() => requestSort('RBI')}>
              RBI {getSortIcon('RBI')}
            </th>
            <th className={getHeaderCellClass('SB')} onClick={() => requestSort('SB')}>
              SB {getSortIcon('SB')}
            </th>
            <th className={getHeaderCellClass('OBP')} onClick={() => requestSort('OBP')}>
              OBP {getSortIcon('OBP')}
            </th>
            <th className={getHeaderCellClass('SLG')} onClick={() => requestSort('SLG')}>
              SLG {getSortIcon('SLG')}
            </th>
            <th className={getHeaderCellClass('RP')} onClick={() => requestSort('RP')}>
              RP {getSortIcon('RP')}
            </th>
            <th 
              className={`${getHeaderCellClass('dollarValue')} text-center bg-blue-50`} 
              onClick={() => requestSort('dollarValue')}
            >
              Value {getSortIcon('dollarValue')}
            </th>
          </tr>
        </thead>
      );
    } else {
      return (
        <thead className="border-b border-gray-200 bg-gray-50">
          <tr>
            <th className={getHeaderCellClass('Player')} onClick={() => requestSort('Player')}>
              Player {getSortIcon('Player')}
            </th>
            <th className={getHeaderCellClass('Team')} onClick={() => requestSort('Team')}>
              Team {getSortIcon('Team')}
            </th>
            <th className={getHeaderCellClass('Positions')} onClick={() => requestSort('Positions')}>
              Pos {getSortIcon('Positions')}
            </th>
            <th className={getHeaderCellClass('IP')} onClick={() => requestSort('IP')}>
              IP {getSortIcon('IP')}
            </th>
            <th className={getHeaderCellClass('K')} onClick={() => requestSort('K')}>
              K {getSortIcon('K')}
            </th>
            <th className={getHeaderCellClass('W')} onClick={() => requestSort('W')}>
              W {getSortIcon('W')}
            </th>
            <th className={getHeaderCellClass('SV')} onClick={() => requestSort('SV')}>
              SV {getSortIcon('SV')}
            </th>
            <th className={getHeaderCellClass('ERA')} onClick={() => requestSort('ERA')}>
              ERA {getSortIcon('ERA')}
            </th>
            <th className={getHeaderCellClass('WHIP')} onClick={() => requestSort('WHIP')}>
              WHIP {getSortIcon('WHIP')}
            </th>
            <th 
              className={`${getHeaderCellClass('dollarValue')} text-center bg-blue-50`} 
              onClick={() => requestSort('dollarValue')}
            >
              Value {getSortIcon('dollarValue')}
            </th>
          </tr>
        </thead>
      );
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200 py-4">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold" style={{ color: '#005ea2' }}>Fantasy Baseball Auction Draft Tool</h1>
          <p className="text-gray-600 mt-1">
            12 Teams | ${leagueSettings.budgetPerTeam} Budget | {leagueSettings.hittersBudgetPercentage * 100}% Hitters / {leagueSettings.pitchersBudgetPercentage * 100}% Pitchers
          </p>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Main Tabs (Players vs Tiers vs Draft Sheet) */}
        <div className="flex space-x-2 mb-6">
          <button
            onClick={() => setActiveMainTab('players')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
              activeMainTab === 'players' 
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <List size={18} className="mr-2" /> Players
          </button>
          <button
            onClick={() => setActiveMainTab('tiers')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
              activeMainTab === 'tiers' 
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Grid size={18} className="mr-2" /> Tiers
          </button>
          <button
            onClick={() => setActiveMainTab('draftsheet')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center ${
              activeMainTab === 'draftsheet' 
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <DollarSign size={18} className="mr-2" /> Draft Sheet
          </button>
        </div>
        
        {/* Player Type Tabs - Only show for players and tiers tabs */}
        {activeMainTab !== 'draftsheet' && (
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('hitters')}
              className={`px-6 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === 'hitters' 
                  ? 'bg-white border-t border-l border-r border-gray-200 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Hitters
            </button>
            <button
              onClick={() => setActiveTab('pitchers')}
              className={`px-6 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === 'pitchers' 
                  ? 'bg-white border-t border-l border-r border-gray-200 text-blue-800'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Pitchers
            </button>
          </div>
        )}
        
        {/* Categories Info - Only show for players and tiers tabs */}
        {activeMainTab !== 'draftsheet' && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">League Categories</h3>
            <div className="flex flex-col md:flex-row md:space-x-12">
              <div>
                <p className="text-gray-700"><strong>Hitters:</strong> {leagueSettings.hitterCategories.join(', ')}</p>
              </div>
              <div>
                <p className="text-gray-700"><strong>Pitchers:</strong> {leagueSettings.pitcherCategories.join(', ')}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* PLAYERS TAB CONTENT */}
        {activeMainTab === 'players' && (
          <>
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
              {/* Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search players..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* Position Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <select 
                  value={filters.positions}
                  onChange={(e) => handleFilterChange('positions', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {uniquePositions.map(position => (
                    <option key={position} value={position}>
                      {position === 'all' ? 'All Positions' : position}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Team Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
                <select 
                  value={filters.team}
                  onChange={(e) => handleFilterChange('team', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {uniqueTeams.map(team => (
                    <option key={team} value={team}>
                      {team === 'all' ? 'All Teams' : team}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Player List Table View */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-10 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 mb-2"></div>
                  <p className="text-gray-600">Calculating player values...</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <TableHeader />
                      <tbody>
                        {sortedPlayers.length > 0 ? (
                          sortedPlayers.map((player, index) => (
                            <PlayerRow key={`${player.Player}-${index}`} player={player} index={index} />
                          ))
                        ) : (
                          <tr>
                            <td colSpan={activeTab === 'hitters' ? 13 : 10} className="py-8 text-center text-gray-500">
                              No players found matching your criteria
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Showing {sortedPlayers.length} players
                    </div>
                    <div className="text-sm">
                      <span className="font-medium mr-2" style={{ color: '#005ea2' }}>Tip:</span> 
                      <span className="text-gray-600">Click column headers to sort</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
        
        {/* TIERS TAB CONTENT */}
        {activeMainTab === 'tiers' && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-10 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-800 mb-2"></div>
                <p className="text-gray-600">Organizing players into tiers...</p>
              </div>
            ) : (
              <>
                <div className="p-4 bg-gray-50 border-b border-gray-200">
                  <h2 className="font-bold text-lg" style={{ color: '#005ea2' }}>
                    Position Tiers - {activeTab === 'hitters' ? 'Hitters' : 'Pitchers'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Players organized by position and value tier
                  </p>
                </div>
                
                {/* Fixed height container with always-visible horizontal scrollbar */}
                <div style={{
                  height: '650px',
                  overflowY: 'auto',
                  overflowX: 'scroll', // Always show horizontal scrollbar
                  position: 'relative'
                }}>
                  <TiersView />
                </div>
              </>
            )}
          </div>
        )}
        
        {/* DRAFT SHEET TAB CONTENT */}
        {activeMainTab === 'draftsheet' && (
          <>
            <DraftSheet />
          </>
        )}
      </div>
    </div>
  );
};

export default FantasyBaseballDraftTool;
