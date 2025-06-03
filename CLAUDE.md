# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm start` - Start development server (React app runs on http://localhost:3000)
- `npm test` - Run test suite in watch mode
- `npm run build` - Build production bundle
- `npm run eject` - Eject from Create React App (one-way operation)

### Python Data Scripts
- `python survivor_data_generator.py` - Generate tribeData.js from contestant images
- `python survivor_scraper.py` - Scrape Survivor data from external sources
- `python tribe_data_fixer.py` - Fix tribe data inconsistencies

## Architecture

### Project Structure
This is a React application (Create React App) focused on Survivor season rankings and analysis. The main application code is in `/src/` with a single entry point component `SurvivorRankings`.

### Tech Stack
- **Frontend**: React 18 with hooks-based state management
- **Styling**: Tailwind CSS with custom Survivor-themed color palette
- **Icons**: Lucide React
- **Charts**: Recharts for data visualization
- **Data**: JSON files and JavaScript modules for static data

### Data Management
- **No Redux or Context**: Uses local React state (useState) exclusively
- **Data Sources**: Static JSON/JS files in `/src/data/` directory
- **Key Data Files**:
  - `seasonData.js` - Complete dataset of 38 Survivor seasons with 4-category scoring (Strategy, Characters, Story, Iconic Moments)
  - `tiers.js` - 9-tier classification system from "The Pantheon" to "The Bleh"
  - `tribeData.js` - Generated from Python scripts, contains contestant/tribe data
  - `unwatchedSeasons.js` - User's unwatched content tracking

### Component Architecture
- **Main Component**: `SurvivorRankings` handles all state and renders tab-based interface
- **Layout Components**: `/src/components/layout/` - StatsOverview, UnwatchedSeasons
- **Season Components**: `/src/components/seasons/` - TierGroup, SeasonRow, SeasonDetail
- **UI Components**: `/src/components/ui/` - Reusable components like ProgressBar, RadarChart

### Scoring System
Each season scored 1-10 in 4 categories (max 40 points total). Seasons organized into tiers based on total scores with expandable details and comprehensive filtering.

### Performance Patterns
- Uses Intersection Observer hook for scroll-based animations
- Text-only contestant display for improved load times
- Modal-based contestant details with lazy image loading
- Conditional rendering for large datasets

### Python Data Pipeline
Python scripts handle data collection and processing:
- Image-based contestant data generation from filename patterns
- Web scraping for external Survivor data sources
- Data validation and tribe information updates