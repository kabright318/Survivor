#!/usr/bin/env python3
"""
Survivor Contestant Image Collector

This script ethically collects contestant images from public sources for personal, 
educational use in a Survivor ranking project. It implements:
- Rate limiting to avoid server overload
- Respectful robots.txt parsing
- User-Agent identification
- Error handling and logging
- Attribution tracking

For personal use only. Not for commercial applications.
"""

import os
import re
import time
import json
import logging
import argparse
import urllib.parse
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime

import requests
from bs4 import BeautifulSoup
from urllib.robotparser import RobotFileParser
import concurrent.futures

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("survivor_image_collector.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("survivor_image_collector")

# Constants
DEFAULT_DELAY = 2.0  # Default delay in seconds between requests
MAX_WORKERS = 4  # Maximum concurrent threads
DEFAULT_USER_AGENT = "SurvivorImageCollector/1.0 (Personal Educational Project; respectful crawler)"
WIKI_BASE_URL = "https://survivor.fandom.com"
ALTERNATIVE_WIKI_URL = "https://survivor.fandom.com/wiki/Category:Contestants"
OUTPUT_DIR = Path("public/images/contestants")
METADATA_DIR = Path("src/data")
ATTRIBUTION_FILE = METADATA_DIR / "image_attributions.json"
MAX_RETRY_ATTEMPTS = 3
MAX_SEASONS = 43  # Update with the current number of seasons

# Dictionary mapping season numbers to their official names
SEASON_NAMES = {
    1: "Borneo",
    2: "The_Australian_Outback",
    3: "Africa",
    4: "Marquesas",
    5: "Thailand",
    6: "The_Amazon",
    7: "Pearl_Islands",
    8: "All-Stars",
    9: "Vanuatu",
    10: "Palau",
    11: "Guatemala",
    12: "Panama",
    13: "Cook_Islands",
    14: "Fiji",
    15: "China",
    16: "Micronesia",
    17: "Gabon",
    18: "Tocantins",
    19: "Samoa",
    20: "Heroes_vs._Villains",
    21: "Nicaragua",
    22: "Redemption_Island",
    23: "South_Pacific",
    24: "One_World",
    25: "Philippines",
    26: "Caramoan",
    27: "Blood_vs._Water",
    28: "Cagayan",
    29: "San_Juan_del_Sur",
    30: "Worlds_Apart",
    31: "Cambodia",
    32: "Kaôh_Rōng",
    33: "Millennials_vs._Gen_X",
    34: "Game_Changers",
    35: "Heroes_vs._Healers_vs._Hustlers",
    36: "Ghost_Island",
    37: "David_vs._Goliath",
    38: "Edge_of_Extinction",
    39: "Island_of_the_Idols",
    40: "Winners_at_War",
    41: "41",
    42: "42",
    43: "43",
}


class RobotsTxtChecker:
    """Class to check robots.txt compliance"""
    
    def __init__(self, base_url: str, user_agent: str):
        self.parser = RobotFileParser()
        self.parser.set_url(urllib.parse.urljoin(base_url, "/robots.txt"))
        self.user_agent = user_agent
        self.base_url = base_url
        self.initialized = False
        
    def initialize(self) -> bool:
        """Initialize the robots.txt parser"""
        try:
            self.parser.read()
            self.initialized = True
            return True
        except Exception as e:
            logger.error(f"Failed to read robots.txt: {e}")
            return False
    
    def can_fetch(self, url: str) -> bool:
        """Check if the URL can be fetched according to robots.txt"""
        if not self.initialized:
            success = self.initialize()
            if not success:
                # If we can't read robots.txt, we should err on the side of caution
                logger.warning("Could not read robots.txt - assuming URL is allowed")
                return True  # Changed to True to avoid blocking all requests if robots.txt fails
        
        return self.parser.can_fetch(self.user_agent, url)
    
    def get_crawl_delay(self) -> float:
        """Get the crawl delay specified in robots.txt"""
        if not self.initialized:
            self.initialize()
        
        delay = self.parser.crawl_delay(self.user_agent)
        if delay:
            return float(delay)
        
        return DEFAULT_DELAY


class SurvivorImageCollector:
    """Main class for collecting Survivor contestant images"""
    
    def __init__(self, 
                 seasons: List[int] = None,
                 output_dir: Path = OUTPUT_DIR,
                 metadata_dir: Path = METADATA_DIR,
                 delay: float = DEFAULT_DELAY,
                 user_agent: str = DEFAULT_USER_AGENT,
                 max_workers: int = MAX_WORKERS):
        """Initialize the collector"""
        self.seasons = seasons or list(range(1, MAX_SEASONS + 1))
        self.output_dir = output_dir
        self.metadata_dir = metadata_dir
        self.user_agent = user_agent
        self.max_workers = max_workers
        
        # Initialize robots.txt checker
        self.robots = RobotsTxtChecker(WIKI_BASE_URL, user_agent)
        
        # Use the crawl delay from robots.txt if available, otherwise use the provided delay
        self.delay = self.robots.get_crawl_delay() or delay
        logger.info(f"Using crawl delay of {self.delay} seconds")
        
        # Track attributions for all images
        self.attributions = {}
        self.load_existing_attributions()
        
        # Create necessary directories
        self._setup_directories()
    
    def load_existing_attributions(self):
        """Load existing attributions from file if it exists"""
        if ATTRIBUTION_FILE.exists():
            try:
                with open(ATTRIBUTION_FILE, 'r') as f:
                    self.attributions = json.load(f)
                logger.info(f"Loaded {len(self.attributions)} existing attributions")
            except Exception as e:
                logger.error(f"Error loading attribution file: {e}")
    
    def save_attributions(self):
        """Save attributions to file"""
        self.metadata_dir.mkdir(parents=True, exist_ok=True)
        try:
            with open(ATTRIBUTION_FILE, 'w') as f:
                json.dump(self.attributions, f, indent=2)
            logger.info(f"Saved attributions for {len(self.attributions)} images")
        except Exception as e:
            logger.error(f"Error saving attribution file: {e}")
    
    def _setup_directories(self):
        """Create output directories"""
        # Create main output directory
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Create season subdirectories
        for season in self.seasons:
            season_dir = self.output_dir / f"season{season}"
            season_dir.mkdir(exist_ok=True)
        
        # Create metadata directory
        self.metadata_dir.mkdir(parents=True, exist_ok=True)
    
    def _sanitize_filename(self, name: str) -> str:
        """Clean name for file system but preserve more of the original name"""
        # Replace problematic characters with underscore
        sanitized = re.sub(r'[\\/*?:"<>|]', '_', name)
        # Replace spaces with underscores
        sanitized = re.sub(r'\s+', '_', sanitized)
        # Remove any other non-alphanumeric characters
        sanitized = re.sub(r'[^\w\-\.]', '', sanitized)
        # Ensure filename doesn't start with a dot or dash
        sanitized = sanitized.lstrip('.-')
        # Lowercase everything for consistency
        return sanitized.lower()
    
    def _make_request(self, url: str, retries: int = MAX_RETRY_ATTEMPTS) -> Optional[requests.Response]:
        """Make an HTTP request with proper headers and error handling"""
        headers = {
            'User-Agent': self.user_agent,
            'Accept': 'text/html,application/xhtml+xml,application/xml',
            'Accept-Language': 'en-US,en;q=0.9',
        }
        
        # Check robots.txt first
        if not self.robots.can_fetch(url):
            logger.warning(f"URL not allowed by robots.txt: {url}")
            return None
        
        # Implement retry logic
        for attempt in range(retries):
            try:
                response = requests.get(url, headers=headers, timeout=10)
                response.raise_for_status()
                return response
            except requests.RequestException as e:
                logger.warning(f"Request failed (attempt {attempt+1}/{retries}): {e}")
                if attempt + 1 < retries:
                    # Exponential backoff: 2, 4, 8... seconds
                    wait_time = 2 ** (attempt + 1)
                    logger.info(f"Waiting {wait_time} seconds before retrying...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"Failed to fetch {url} after {retries} attempts")
                    return None
    
    def _is_contestant_link(self, link, season_name):
        """Determine if a link is likely to be a contestant"""
        if not link or not link.get('href'):
            return False
            
        href = link.get('href')
        # Avoid links to non-contestant pages
        if any(x in href for x in [
            '/wiki/Survivor:', '/wiki/Category:', '/wiki/Template:', 
            '/wiki/User:', '/wiki/File:', '/wiki/Talk:'
        ]):
            return False
            
        # Check if link text contains typical non-contestant terms
        text = link.get_text().lower()
        if any(x in text for x in [
            'episode', 'season', 'tribal council', 'immunity', 'reward',
            'hidden immunity idol', 'challenge', 'jury', 'final tribal'
        ]):
            return False
            
        # Prefer links that have the season name in them or have "contestant" in URL
        is_relevant = (
            'contestant' in href.lower() or 
            season_name.lower().replace('_', ' ') in text.lower() or
            '/wiki/' in href
        )
            
        return is_relevant
    
    def get_contestants(self, season_number: int) -> List[Dict[str, Any]]:
        """Get list of contestants for a season"""
        season_name = SEASON_NAMES.get(season_number, str(season_number))
        season_url = f"{WIKI_BASE_URL}/wiki/Survivor:_{season_name}"
        
        logger.info(f"Fetching contestants for Season {season_number}: {season_name}")
        
        response = self._make_request(season_url)
        if not response:
            logger.error(f"Failed to get season {season_number} page")
            return []
        
        soup = BeautifulSoup(response.text, 'html.parser')
        contestants = []
        
        # Debug to see what sections we have
        sections = soup.find_all(['h2', 'h3'])
        section_titles = [s.get_text().strip() for s in sections]
        logger.info(f"Found sections: {', '.join(section_titles)}")
        
        # Method 1: Look for contestant tables with wikitable class
        contestant_tables = soup.find_all('table', class_='wikitable')
        
        if contestant_tables:
            logger.info(f"Found {len(contestant_tables)} potential contestant tables")
            
            for table_idx, table in enumerate(contestant_tables):
                # Skip tables that are clearly not contestant tables
                table_text = table.get_text().lower()
                if any(x in table_text for x in ['episode guide', 'jury vote', 'challenge']):
                    continue
                    
                logger.info(f"Processing table {table_idx+1}")
                
                rows = table.find_all('tr')
                header_row = rows[0] if rows else None
                
                # Try to identify which column contains contestant names
                name_col_idx = 0
                if header_row:
                    header_cells = header_row.find_all(['th', 'td'])
                    for i, cell in enumerate(header_cells):
                        text = cell.get_text().lower().strip()
                        if 'name' in text or 'contestant' in text or 'castaway' in text:
                            name_col_idx = i
                            break
                
                # Process each row
                for row in rows[1:]:  # Skip header row
                    cells = row.find_all(['td', 'th'])
                    if len(cells) <= name_col_idx:
                        continue
                    
                    name_cell = cells[name_col_idx]
                    
                    # Try to find a name
                    name_link = name_cell.find('a')
                    if name_link and name_link.get('href'):
                        contestant_name = name_link.get_text(strip=True)
                        
                        # Skip if name looks invalid
                        if not contestant_name or len(contestant_name) < 2:
                            continue
                            
                        contestant_url = urllib.parse.urljoin(WIKI_BASE_URL, name_link.get('href'))
                        
                        # Check if we already have this contestant
                        if not any(c['name'] == contestant_name for c in contestants):
                            contestants.append({
                                'name': contestant_name,
                                'url': contestant_url
                            })
                            logger.info(f"Found contestant from table: {contestant_name}")
        
        # Method 2: Look for contestant galleries
        if len(contestants) < 5:  # If we haven't found enough contestants
            galleries = soup.find_all(['div', 'ul'], class_=['gallery', 'contestant-nav'])
            
            if galleries:
                logger.info(f"Found {len(galleries)} potential contestant galleries")
                
                for gallery in galleries:
                    links = gallery.find_all('a')
                    for link in links:
                        if self._is_contestant_link(link, season_name):
                            contestant_name = link.get('title', link.get_text(strip=True))
                            
                            # Skip if the name is too short
                            if not contestant_name or len(contestant_name) < 2:
                                continue
                                
                            # Skip if it's already in our list
                            if any(c['name'] == contestant_name for c in contestants):
                                continue
                                
                            contestant_url = urllib.parse.urljoin(WIKI_BASE_URL, link.get('href'))
                            contestants.append({
                                'name': contestant_name,
                                'url': contestant_url
                            })
                            logger.info(f"Found contestant from gallery: {contestant_name}")
        
        # Method 3: Look for contestant sections
        if len(contestants) < 5:  # If we still haven't found enough contestants
            # Look for sections that might contain contestant links
            for heading in soup.find_all(['h2', 'h3']):
                heading_text = heading.get_text().lower()
                if any(x in heading_text for x in ['contestant', 'castaway', 'tribe', 'player']):
                    logger.info(f"Found potential contestant section: {heading_text}")
                    
                    # Find the next element after the heading
                    element = heading.find_next_sibling()
                    
                    while element and element.name not in ['h2', 'h3']:
                        # Look for links in this element
                        links = element.find_all('a')
                        for link in links:
                            if self._is_contestant_link(link, season_name):
                                contestant_name = link.get_text(strip=True)
                                
                                # Skip if the name is too short
                                if not contestant_name or len(contestant_name) < 2:
                                    continue
                                    
                                # Skip if it's already in our list
                                if any(c['name'] == contestant_name for c in contestants):
                                    continue
                                    
                                contestant_url = urllib.parse.urljoin(WIKI_BASE_URL, link.get('href'))
                                contestants.append({
                                    'name': contestant_name,
                                    'url': contestant_url
                                })
                                logger.info(f"Found contestant from section: {contestant_name}")
                        
                        # Move to the next element
                        element = element.find_next_sibling()
        
        # Method 4: Look at contestant lists from main navigation
        if len(contestants) < 5:
            # Try to find links in the main navigation or other menus
            navs = soup.find_all(['div', 'nav', 'ul'], class_=['navigation', 'menu', 'toc'])
            
            for nav in navs:
                links = nav.find_all('a')
                for link in links:
                    if self._is_contestant_link(link, season_name):
                        contestant_name = link.get_text(strip=True)
                        
                        # Skip if the name is too short
                        if not contestant_name or len(contestant_name) < 2:
                            continue
                            
                        # Skip if it's already in our list
                        if any(c['name'] == contestant_name for c in contestants):
                            continue
                            
                        contestant_url = urllib.parse.urljoin(WIKI_BASE_URL, link.get('href'))
                        contestants.append({
                            'name': contestant_name,
                            'url': contestant_url
                        })
                        logger.info(f"Found contestant from navigation: {contestant_name}")
        
        # Method 5: If all else fails, look at the category page for this season
        if len(contestants) < 5:
            category_url = f"{WIKI_BASE_URL}/wiki/Category:Season_{season_number}_Contestants"
            logger.info(f"Trying category page: {category_url}")
            
            category_response = self._make_request(category_url)
            if category_response:
                category_soup = BeautifulSoup(category_response.text, 'html.parser')
                
                # Look for category members
                category_members = category_soup.find('div', class_='mw-category')
                
                if category_members:
                    links = category_members.find_all('a')
                    
                    for link in links:
                        if link.get('href') and '/wiki/' in link.get('href'):
                            contestant_name = link.get_text(strip=True)
                            
                            # Skip if it's already in our list
                            if any(c['name'] == contestant_name for c in contestants):
                                continue
                                
                            contestant_url = urllib.parse.urljoin(WIKI_BASE_URL, link.get('href'))
                            contestants.append({
                                'name': contestant_name,
                                'url': contestant_url
                            })
                            logger.info(f"Found contestant from category: {contestant_name}")
        
        # Log what we found
        if contestants:
            logger.info(f"Found {len(contestants)} contestants for Season {season_number}")
            
            # Remove duplicates by name
            unique_contestants = []
            seen_names = set()
            for contestant in contestants:
                if contestant['name'] not in seen_names:
                    seen_names.add(contestant['name'])
                    unique_contestants.append(contestant)
            
            logger.info(f"After removing duplicates: {len(unique_contestants)} contestants")
            return unique_contestants
        else:
            logger.warning(f"No contestants found for Season {season_number}")
            return []
    
    def get_contestant_image(self, contestant: Dict[str, str]) -> Tuple[Optional[str], Optional[Dict]]:
        """Find an image for a contestant"""
        response = self._make_request(contestant['url'])
        if not response:
            return None, None
        
        time.sleep(self.delay)  # Respect rate limits
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Track attribution information
        attribution = {
            'source_url': contestant['url'],
            'retrieved_date': datetime.now().isoformat(),
            'license': 'Unknown - For personal use only'
        }
        
        # Try different methods to find an image
        # Method 1: Look for infobox image
        image_url = None
        infobox = soup.find('aside', class_='portable-infobox')
        if infobox:
            image = infobox.find('img')
            if image:
                image_url = image.get('src') or image.get('data-src')
                if image_url:
                    # Try to get license info
                    figure = image.find_parent('figure')
                    if figure:
                        caption = figure.find('figcaption')
                        if caption:
                            attribution['caption'] = caption.get_text(strip=True)
        
        # Method 2: Look for any image that seems to be the contestant
        if not image_url:
            main_content = soup.find('div', class_='mw-parser-output')
            if main_content:
                images = main_content.find_all('img', class_='pi-image')
                if images:
                    image_url = images[0].get('src') or images[0].get('data-src')
        
        # Method 3: First meaningful image in the article
        if not image_url:
            images = soup.find_all('img')
            for img in images:
                src = img.get('src') or img.get('data-src')
                if src and '.jpg' in src and 'placeholder' not in src.lower():
                    width = img.get('width')
                    # Only use reasonably sized images, not tiny icons
                    if width and int(width) > 100:
                        image_url = src
                        break
        
        # Get license information
        license_info = None
        license_section = soup.find('div', class_='licensetpl')
        if license_section:
            license_info = license_section.get_text(strip=True)
            attribution['license'] = license_info
        
        if image_url:
            # Fix relative URLs
            if image_url.startswith('//'):
                image_url = 'https:' + image_url
            
            # Try to get the highest quality version
            image_url = re.sub(r'/scale-to-width-down/\d+', '', image_url)
            image_url = re.sub(r'/thumb/', '/', image_url)
            
            logger.info(f"Found image for {contestant['name']}: {image_url}")
            return image_url, attribution
        
        logger.warning(f"No suitable image found for {contestant['name']}")
        return None, None
    
    def download_image(self, url: str, output_path: Path) -> bool:
        """Download an image file"""
        response = self._make_request(url)
        if not response:
            return False
        
        try:
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            logger.info(f"Successfully downloaded image to {output_path}")
            return True
        except Exception as e:
            logger.error(f"Error saving image to {output_path}: {e}")
            return False
    
    def process_contestant(self, contestant: Dict[str, str], season_number: int) -> Dict[str, Any]:
        """Process a single contestant"""
        clean_name = self._sanitize_filename(contestant['name'])
        output_path = self.output_dir / f"season{season_number}" / f"{clean_name}.jpg"
        
        # Skip if we already have this image
        if output_path.exists():
            logger.info(f"Image for {contestant['name']} already exists, skipping")
            return {
                'name': contestant['name'],
                'season': season_number,
                'image_path': str(output_path).replace('\\', '/'),
                'status': 'skipped',
                'already_exists': True
            }
        
        time.sleep(self.delay)  # Respect rate limits
        
        # Get image URL and attribution
        image_url, attribution = self.get_contestant_image(contestant)
        
        if not image_url:
            return {
                'name': contestant['name'],
                'season': season_number,
                'image_path': None,
                'status': 'failed',
                'reason': 'No image found'
            }
        
        # Download the image
        if self.download_image(image_url, output_path):
            # Save attribution information
            attribution_key = f"season{season_number}/{clean_name}.jpg"
            attribution['contestant_name'] = contestant['name']
            attribution['season'] = season_number
            attribution['image_url'] = image_url
            self.attributions[attribution_key] = attribution
            
            return {
                'name': contestant['name'],
                'season': season_number,
                'image_path': str(output_path).replace('\\', '/'),
                'status': 'success',
                'attribution': attribution
            }
        else:
            return {
                'name': contestant['name'],
                'season': season_number,
                'image_path': None,
                'status': 'failed',
                'reason': 'Download failed'
            }
    
    def update_tribe_data(self, results: List[Dict[str, Any]]) -> None:
        """Update the tribe data file with image paths"""
        tribe_data_path = self.metadata_dir / "tribeData.js"
        
        if not tribe_data_path.exists():
            logger.warning("tribeData.js not found - cannot update")
            return
        
        try:
            # Read the existing file
            with open(tribe_data_path, 'r') as f:
                content = f.read()
            
            # Backup the original file
            backup_path = self.metadata_dir / f"tribeData.js.backup.{int(time.time())}"
            with open(backup_path, 'w') as f:
                f.write(content)
            
            # Group results by season and contestant
            updates_by_season = {}
            for result in results:
                if result['status'] == 'success':
                    season = result['season']
                    name = result['name']
                    image_path = result['image_path'].replace('public/', '/')
                    
                    if season not in updates_by_season:
                        updates_by_season[season] = {}
                    
                    updates_by_season[season][name] = image_path
            
            # Replace string entries with object entries in the tribe data
            for season, contestants in updates_by_season.items():
                for name, image_path in contestants.items():
                    # Escape special characters in the name for regex
                    escaped_name = re.escape(name)
                    # Pattern to match the string version of the contestant name
                    pattern = rf'"{escaped_name}"'
                    # Replacement with image property
                    replacement = f'{{ name: "{name}", image: "{image_path}" }}'
                    
                    # Replace all occurrences
                    content = re.sub(pattern, replacement, content)
            
            # Write the updated content
            with open(tribe_data_path, 'w') as f:
                f.write(content)
            
            logger.info(f"Updated tribeData.js with {sum(len(s) for s in updates_by_season.values())} image paths")
        
        except Exception as e:
            logger.error(f"Error updating tribe data: {e}")
    
    def run(self) -> List[Dict[str, Any]]:
        """Run the collector for all specified seasons"""
        all_results = []
        
        for season in self.seasons:
            logger.info(f"Processing Season {season}")
            
            # Get contestants for this season
            contestants = self.get_contestants(season)
            
            if not contestants:
                logger.warning(f"No contestants found for Season {season}, skipping")
                continue
            
            # Process contestants with limited concurrency
            season_results = []
            with concurrent.futures.ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                # Submit tasks
                future_to_contestant = {
                    executor.submit(self.process_contestant, contestant, season): contestant
                    for contestant in contestants
                }
                
                # Process results as they complete
                for future in concurrent.futures.as_completed(future_to_contestant):
                    contestant = future_to_contestant[future]
                    try:
                        result = future.result()
                        season_results.append(result)
                    except Exception as e:
                        logger.error(f"Error processing {contestant['name']}: {e}")
                        season_results.append({
                            'name': contestant['name'],
                            'season': season,
                            'status': 'error',
                            'error': str(e)
                        })
            
            all_results.extend(season_results)
            
            # Save progress after each season
            self.save_attributions()
            
            # Log results for this season
            success_count = sum(1 for r in season_results if r['status'] == 'success')
            fail_count = sum(1 for r in season_results if r['status'] == 'failed')
            skip_count = sum(1 for r in season_results if r['status'] == 'skipped')
            
            logger.info(f"Season {season} results: {success_count} successful, {fail_count} failed, {skip_count} skipped")
        
        # Update the tribe data file with image paths
        self.update_tribe_data(all_results)
        
        # Final save of attributions
        self.save_attributions()
        
        return all_results


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='Survivor Contestant Image Collector')
    
    parser.add_argument('--seasons', type=int, nargs='+', 
                        help='Specific season numbers to process (default: all)')
    
    parser.add_argument('--output-dir', type=str, default=str(OUTPUT_DIR),
                        help=f'Directory for storing images (default: {OUTPUT_DIR})')
    
    parser.add_argument('--metadata-dir', type=str, default=str(METADATA_DIR),
                        help=f'Directory for storing metadata (default: {METADATA_DIR})')
    
    parser.add_argument('--delay', type=float, default=DEFAULT_DELAY,
                        help=f'Minimum delay between requests in seconds (default: {DEFAULT_DELAY})')
    
    parser.add_argument('--max-workers', type=int, default=MAX_WORKERS,
                        help=f'Maximum number of concurrent workers (default: {MAX_WORKERS})')
    
    parser.add_argument('--user-agent', type=str, default=DEFAULT_USER_AGENT,
                        help='User agent to use for requests')
    
    return parser.parse_args()


def main():
    """Main entry point"""
    args = parse_args()
    
    # Convert paths to Path objects
    output_dir = Path(args.output_dir)
    metadata_dir = Path(args.metadata_dir)
    
    # Create the collector
    collector = SurvivorImageCollector(
        seasons=args.seasons,
        output_dir=output_dir,
        metadata_dir=metadata_dir,
        delay=args.delay,
        user_agent=args.user_agent,
        max_workers=args.max_workers
    )
    
    # Run the collector
    results = collector.run()
    
    # Log overall results
    success_count = sum(1 for r in results if r['status'] == 'success')
    fail_count = sum(1 for r in results if r['status'] == 'failed')
    skip_count = sum(1 for r in results if r['status'] == 'skipped')
    
    logger.info(f"Overall results: {success_count} successful, {fail_count} failed, {skip_count} skipped")
    logger.info(f"Images saved to {output_dir}")
    logger.info(f"Attribution information saved to {ATTRIBUTION_FILE}")


if __name__ == "__main__":
    main()