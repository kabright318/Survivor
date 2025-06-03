/**
 * Contestant data with season appearances and achievements
 */

import { tribeData } from './tribeData';
import { seasonData } from './seasonData';

// Detailed contestant data for specific players
export const detailedContestantData = {
  "Rob Mariano": {
    name: "Rob Mariano",
    nickname: "Boston Rob",
    overallAchievements: ["4-time player", "Sole Survivor", "Perfect game winner", "Married fellow contestant"]
  },

  "Parvati Shallow": {
    name: "Parvati Shallow", 
    nickname: "Parv",
    overallAchievements: ["4-time player", "Sole Survivor", "Strategic legend", "Black Widow Brigade leader"]
  },

  "Sandra Diaz-Twine": {
    name: "Sandra Diaz-Twine",
    nickname: "The Queen",
    overallAchievements: ["4-time player", "Two-time Sole Survivor", "Only player to win twice", "Queen of Survivor"]
  },

  "Russell Hantz": {
    name: "Russell Hantz",
    nickname: "Russell",
    overallAchievements: ["3-time player", "Two-time finalist", "Never won", "Controversial player"]
  },

  "Tony Vlachos": {
    name: "Tony Vlachos",
    nickname: "Tony", 
    overallAchievements: ["3-time player", "Two-time Sole Survivor", "Police officer", "Chaotic strategist"]
  },

  "Ozzy Lusth": {
    name: "Ozzy Lusth",
    nickname: "Ozzy",
    overallAchievements: ["4-time player", "Challenge legend", "Individual immunity record holder", "Physical threat"]
  }
};

// Helper function to generate image path from contestant name and season
const generateImagePath = (name, seasonNumber) => {
  if (!name || !seasonNumber) return null;
  
  // Convert name to filename format: "John Doe" -> "john_doe.jpg"
  const filename = name
    .toLowerCase()
    .replace(/[^a-z\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    + '.jpg';
  
  return `/images/contestants/season${seasonNumber}/${filename}`;
};

// Create a map of season number to season name
const seasonMap = {};
seasonData.forEach(season => {
  seasonMap[season.number] = season.name;
});

// Extract all season appearances for a contestant from tribe data
const extractSeasonAppearances = (contestantName) => {
  const appearances = [];
  
  // Go through all seasons in tribe data
  Object.keys(tribeData).forEach(seasonNumber => {
    const seasonInfo = tribeData[seasonNumber];
    if (!seasonInfo || !seasonInfo.tribes) return;
    
    // Check each tribe in the season
    seasonInfo.tribes.forEach(tribe => {
      if (!tribe.members) return;
      
      // Check if contestant is in this tribe
      const member = tribe.members.find(member => {
        const memberName = typeof member === 'string' ? member : member.name;
        return memberName === contestantName;
      });
      
      if (member) {
        appearances.push({
          seasonNumber: parseInt(seasonNumber),
          seasonName: seasonMap[parseInt(seasonNumber)] || `Season ${seasonNumber}`,
          tribe: tribe.name,
          image: generateImagePath(contestantName, seasonNumber)
        });
      }
    });
  });
  
  // Sort by season number
  return appearances.sort((a, b) => a.seasonNumber - b.seasonNumber);
};

// Helper function to get contestant by name with season context
export const getContestantByName = (name, currentSeasonNumber = null) => {
  // Get detailed data if available
  const detailedData = detailedContestantData[name] || {};
  
  // Extract all season appearances from tribe data
  const seasonAppearances = extractSeasonAppearances(name);
  
  // Use current season for primary image, or first appearance if no current season
  const primarySeasonNumber = currentSeasonNumber || (seasonAppearances.length > 0 ? seasonAppearances[0].seasonNumber : null);
  
  // Create complete contestant data
  return {
    name: name,
    nickname: detailedData.nickname || null,
    image: primarySeasonNumber ? generateImagePath(name, primarySeasonNumber) : null,
    seasons: seasonAppearances,
    overallAchievements: detailedData.overallAchievements || []
  };
};

// Helper function to get all contestants for a season
export const getContestantsBySeason = (seasonNumber) => {
  const contestants = [];
  const seasonInfo = tribeData[seasonNumber];
  
  if (!seasonInfo || !seasonInfo.tribes) return contestants;
  
  seasonInfo.tribes.forEach(tribe => {
    if (!tribe.members) return;
    
    tribe.members.forEach(member => {
      const memberName = typeof member === 'string' ? member : member.name;
      const contestant = getContestantByName(memberName, seasonNumber);
      contestants.push({
        ...contestant,
        currentSeasonInfo: {
          seasonNumber: seasonNumber,
          seasonName: seasonMap[seasonNumber] || `Season ${seasonNumber}`,
          tribe: tribe.name
        }
      });
    });
  });
  
  return contestants;
};

// For backwards compatibility
export const contestantData = detailedContestantData;