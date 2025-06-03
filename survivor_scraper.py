#!/usr/bin/env python3
"""
survivor_scraper_improved.py - Extract Survivor contestants with tribes and colors

This script scrapes the Wikipedia page for Survivor contestants and extracts:
- Contestant names
- Original/starting tribes
- Tribe colors (when available)

Output: survivor_contestants.csv and survivor_contestants.json
"""

import re
import os
import sys
import csv
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup, Tag, NavigableString

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

# Constants
MAIN_URL = "https://en.wikipedia.org/wiki/List_of_Survivor_(American_TV_series)_contestants"
SEASON_PREFIX = "https://en.wikipedia.org/wiki/Survivor:_"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}
OUTPUT_DIR = Path("output")
CSV_FILE = OUTPUT_DIR / "survivor_contestants.csv"
JSON_FILE = OUTPUT_DIR / "survivor_contestants.json"

# Regex patterns
FOOTNOTE_PATTERN = re.compile(r"\[\d+\]|\[note \d+\]|\[citation needed\]|\[.*?\]")
COLOR_PATTERN = re.compile(r"background(?:-color)?:\s*([^;]+)", re.IGNORECASE)
SEASON_NUM_PATTERN = re.compile(r"(?:season|s)\s*(\d+)|^(?:survivor)?\s*(\d+)\s*$|(\d+)[^\d]*$", re.IGNORECASE)
SEASON_TITLE_PATTERN = re.compile(r"Survivor(?::\s*|\s+)([^(]+)", re.IGNORECASE)


def clean_text(text: str) -> str:
    """Clean text by removing footnotes and extra whitespace."""
    if not text:
        return ""
    
    # Remove footnotes and normalize whitespace
    text = FOOTNOTE_PATTERN.sub("", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_background_color(element: Tag) -> Optional[str]:
    """Extract the background color from an element or its children."""
    if not element:
        return None
    
    # First check the element itself
    if style := element.get("style", ""):
        if match := COLOR_PATTERN.search(style):
            return match.group(1).strip()
    
    # Then check child elements with background colors
    for child in element.find_all(["span", "div"]):
        if style := child.get("style", ""):
            if match := COLOR_PATTERN.search(style):
                return match.group(1).strip()
    
    # Check if the class contains color information
    classes = element.get("class", [])
    if classes:
        for cls in classes:
            if cls.lower() in ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'black', 'cyan', 'magenta', 'brown', 'grey', 'gray', 'teal', 'maroon']:
                return cls.lower()
    
    return None


def extract_season_number(text: str) -> Optional[int]:
    """Extract the season number from a string."""
    if not text:
        return None
    
    if match := SEASON_NUM_PATTERN.search(text):
        # Get the first non-None group
        for group in match.groups():
            if group:
                return int(group)
    
    return None


def extract_season_title(text: str) -> Optional[str]:
    """Extract the season title (e.g., 'Borneo', 'Heroes vs. Villains')."""
    if not text:
        return None
    
    if match := SEASON_TITLE_PATTERN.search(text):
        return match.group(1).strip()
    
    return None


def identify_columns(header_row: Tag) -> Dict[str, int]:
    """Identify the columns based on header text."""
    columns = {}
    cells = header_row.find_all(["th", "td"])
    
    for idx, cell in enumerate(cells):
        text = clean_text(cell.get_text()).lower()
        
        # Name/contestant column
        if any(keyword in text for keyword in ["name", "contestant", "player", "castaway"]):
            columns["name"] = idx
        
        # Tribe column
        elif any(keyword in text for keyword in ["tribe", "original", "starting"]):
            columns["tribe"] = idx
        
        # Season column
        elif any(keyword in text for keyword in ["season", "appeared", "competed"]):
            columns["season"] = idx
            
        # Finish/placing column (might contain season number)
        elif "finish" in text or "place" in text:
            columns["finish"] = idx
    
    return columns


def find_header_row(table: Tag) -> Tuple[Optional[Tag], Dict[str, int]]:
    """Find the header row and column mapping in a table."""
    rows = table.find_all("tr")
    
    for row in rows:
        cells = row.find_all(["th", "td"])
        if not cells:
            continue
        
        # Skip rows without enough cells
        if len(cells) < 2:
            continue
        
        # Get column mapping
        columns = identify_columns(row)
        
        # If we found at least name column and either tribe or season, this is our header
        if "name" in columns and ("tribe" in columns or "season" in columns):
            return row, columns
    
    return None, {}


def get_season_info_from_url(url: str) -> Dict[str, Any]:
    """Get additional season info by scraping the season's Wikipedia page."""
    logger.info(f"Fetching season info from {url}")
    try:
        response = requests.get(url, headers=HEADERS, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Find info box
        info_box = soup.find("table", class_="infobox")
        if not info_box:
            return {}
        
        # Extract season info
        season_info = {}
        
        # Try to get tribes and colors from infobox
        rows = info_box.find_all("tr")
        for row in rows:
            header = row.find(["th"])
            if not header:
                continue
                
            header_text = clean_text(header.get_text()).lower()
            
            # Look for tribe information
            if "tribe" in header_text:
                tribes = []
                cells = row.find_all("td")
                if not cells:
                    continue
                    
                for cell in cells:
                    tribe_name = clean_text(cell.get_text())
                    tribe_color = extract_background_color(cell)
                    if tribe_name:
                        tribes.append({
                            "name": tribe_name,
                            "color": tribe_color
                        })
                
                if tribes:
                    season_info["tribes"] = tribes
        
        return season_info
    
    except Exception as e:
        logger.warning(f"Failed to get season info from {url}: {e}")
        return {}


def process_contestant_table(table: Tag, season_info: Dict[str, Any] = None) -> List[Dict[str, Any]]:
    """Process a table containing contestant information."""
    header_row, columns = find_header_row(table)
    if not header_row or not columns:
        logger.debug("No valid header row found in table")
        return []
    
    # We need at minimum contestant name
    if "name" not in columns:
        logger.debug(f"Missing required name column in table. Found: {columns.keys()}")
        return []
    
    contestants = []
    rows = table.find_all("tr")
    header_index = rows.index(header_row)
    
    # Get tribe information from season_info if available
    tribes_info = {}
    if season_info and "tribes" in season_info:
        for tribe in season_info["tribes"]:
            tribes_info[tribe["name"].lower()] = tribe["color"]
    
    # Process data rows (skip header)
    for row in rows[header_index + 1:]:
        cells = row.find_all(["th", "td"])
        
        # Skip rows that don't have enough cells for name
        if len(cells) <= columns["name"]:
            continue
        
        # Extract contestant name
        name_cell = cells[columns["name"]]
        name = clean_text(name_cell.get_text())
        if not name:
            continue  # Skip empty names
        
        # Initialize tribe data
        tribe_name = ""
        tribe_color = None
        
        # Extract tribe information if column exists
        if "tribe" in columns and len(cells) > columns["tribe"]:
            tribe_cell = cells[columns["tribe"]]
            tribe_name = clean_text(tribe_cell.get_text())
            tribe_color = extract_background_color(tribe_cell)
            
            # If we couldn't get color from cell style, try from our tribes_info dictionary
            if not tribe_color and tribe_name.lower() in tribes_info:
                tribe_color = tribes_info[tribe_name.lower()]
        
        # Extract season information (if available)
        season_name = ""
        season_number = None
        
        if "season" in columns and len(cells) > columns["season"]:
            season_cell = cells[columns["season"]]
            season_name = clean_text(season_cell.get_text())
            season_number = extract_season_number(season_name)
        elif "finish" in columns and len(cells) > columns["finish"]:
            # Sometimes finish column contains season information
            finish_cell = cells[columns["finish"]]
            finish_text = clean_text(finish_cell.get_text())
            if season_num := extract_season_number(finish_text):
                season_number = season_num
        
        # Create contestant record
        contestant = {
            "contestant": name,
            "original_tribe": tribe_name,
            "tribe_color": tribe_color,
            "season_name": season_name,
            "season_number": season_number
        }
        
        # Add any additional information from season_info
        if season_info:
            if "location" in season_info:
                contestant["location"] = season_info["location"]
            if "season_title" in season_info:
                contestant["season_title"] = season_info["season_title"]
        
        contestants.append(contestant)
    
    return contestants


def scrape_season_links(soup: BeautifulSoup) -> Dict[str, str]:
    """Extract links to individual season pages."""
    season_links = {}
    
    # Look for links to season pages
    paragraphs = soup.find_all(["p", "li"])
    for p in paragraphs:
        links = p.find_all("a")
        for link in links:
            href = link.get("href", "")
            text = clean_text(link.get_text())
            
            # Check if this looks like a season link
            if "survivor" in href.lower() and ":" in href:
                if season_num := extract_season_number(text):
                    full_url = urljoin("https://en.wikipedia.org", href)
                    season_links[str(season_num)] = full_url
    
    return season_links


def scrape_survivor_contestants() -> List[Dict[str, Any]]:
    """Scrape Survivor contestants from Wikipedia."""
    # Fetch the main contestants page
    logger.info(f"Fetching data from {MAIN_URL}")
    response = requests.get(MAIN_URL, headers=HEADERS)
    response.raise_for_status()
    
    # Parse HTML
    soup = BeautifulSoup(response.text, "html.parser")
    
    # Get links to individual season pages
    season_links = scrape_season_links(soup)
    logger.info(f"Found {len(season_links)} season links")
    
    # Find all tables on the main page
    tables = soup.find_all("table", class_=["wikitable", "sortable"])
    logger.info(f"Found {len(tables)} tables on the main page")
    
    if not tables:
        # Fallback to any table if no wikitable found
        tables = soup.find_all("table")
        logger.info(f"Fallback: Found {len(tables)} tables without class filters")
    
    all_contestants = []
    
    # Process each table from the main page
    for i, table in enumerate(tables):
        logger.info(f"Processing table {i+1}/{len(tables)}")
        contestants = process_contestant_table(table)
        
        if contestants:
            logger.info(f"Found {len(contestants)} contestants in table {i+1}")
            all_contestants.extend(contestants)
        else:
            logger.debug(f"No contestants found in table {i+1}")
    
    # If we have very few contestants, try scraping individual season pages
    if len(all_contestants) < 50 and season_links:
        logger.info("Not enough contestants found, trying individual season pages")
        
        # Limit to first 10 seasons for testing
        for season_num, season_url in list(season_links.items())[:10]:
            try:
                # Get season info
                season_info = get_season_info_from_url(season_url)
                
                # Fetch the season page
                response = requests.get(season_url, headers=HEADERS)
                response.raise_for_status()
                
                # Parse HTML
                season_soup = BeautifulSoup(response.text, "html.parser")
                
                # Find all tables
                season_tables = season_soup.find_all("table", class_=["wikitable", "sortable"])
                if not season_tables:
                    season_tables = season_soup.find_all("table")
                
                logger.info(f"Found {len(season_tables)} tables on Season {season_num} page")
                
                # Process each table
                for j, season_table in enumerate(season_tables):
                    season_contestants = process_contestant_table(season_table, season_info)
                    
                    if season_contestants:
                        # Add season number to all contestants
                        for contestant in season_contestants:
                            if not contestant.get("season_number"):
                                contestant["season_number"] = int(season_num)
                        
                        logger.info(f"Found {len(season_contestants)} contestants in Season {season_num}, table {j+1}")
                        all_contestants.extend(season_contestants)
            
            except Exception as e:
                logger.warning(f"Error processing Season {season_num}: {e}")
    
    # Remove duplicates (based on name and season)
    unique_contestants = {}
    for contestant in all_contestants:
        key = (contestant["contestant"], contestant.get("season_number"))
        if key not in unique_contestants or (not unique_contestants[key].get("original_tribe") and contestant.get("original_tribe")):
            unique_contestants[key] = contestant
    
    return list(unique_contestants.values())


def save_data(contestants: List[Dict[str, Any]]) -> Tuple[str, str]:
    """Save contestant data to CSV and JSON files."""
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(exist_ok=True, parents=True)
    
    # Sort contestants by season number and name - handle None values properly
    def sort_key(contestant):
        # Convert None values to a large number (999) for season_number
        season_num = contestant.get("season_number")
        if season_num is None:
            season_num = 999
        return (season_num, contestant.get("contestant", ""))
    
    # Sort using the safe sort key
    sorted_contestants = sorted(contestants, key=sort_key)
    
    # Try to save to default location
    try:
        # Save CSV
        with open(CSV_FILE, 'w', newline='', encoding='utf-8') as f:
            if not sorted_contestants:
                f.write("No contestants found")
            else:
                # Define field order to make CSV more readable
                fieldnames = [
                    "contestant", "season_number", "season_name", "season_title",
                    "original_tribe", "tribe_color", "location"
                ]
                # Filter to only include fields that exist in our data
                fieldnames = [field for field in fieldnames if any(field in contestant for contestant in sorted_contestants)]
                
                writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
                writer.writeheader()
                writer.writerows(sorted_contestants)
        
        # Save JSON
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(sorted_contestants, f, indent=2, ensure_ascii=False)
        
        return str(CSV_FILE), str(JSON_FILE)
    
    except (PermissionError, OSError) as e:
        logger.warning(f"Could not save to output directory: {e}")
        
        # Try saving to current directory instead
        alt_csv = Path("survivor_contestants.csv")
        alt_json = Path("survivor_contestants.json")
        
        try:
            # Save CSV
            with open(alt_csv, 'w', newline='', encoding='utf-8') as f:
                if not sorted_contestants:
                    f.write("No contestants found")
                else:
                    # Define field order to make CSV more readable
                    fieldnames = [
                        "contestant", "season_number", "season_name", "season_title",
                        "original_tribe", "tribe_color", "location"
                    ]
                    # Filter to only include fields that exist in our data
                    fieldnames = [field for field in fieldnames if any(field in contestant for contestant in sorted_contestants)]
                    
                    writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
                    writer.writeheader()
                    writer.writerows(sorted_contestants)
            
            # Save JSON
            with open(alt_json, 'w', encoding='utf-8') as f:
                json.dump(sorted_contestants, f, indent=2, ensure_ascii=False)
            
            return str(alt_csv), str(alt_json)
        
        except (PermissionError, OSError) as e2:
            logger.error(f"Also failed to save to current directory: {e2}")
            return "Failed to save", "Failed to save"


def analyze_tribe_colors(contestants: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Analyze tribe colors in the data."""
    tribe_colors = {}
    
    # Count occurrences of each tribe color
    for contestant in contestants:
        tribe = contestant.get("original_tribe")
        color = contestant.get("tribe_color")
        
        if tribe and color:
            if tribe not in tribe_colors:
                tribe_colors[tribe] = {"color": color, "count": 1}
            else:
                tribe_colors[tribe]["count"] += 1
    
    # Sort by count
    sorted_tribes = sorted(
        tribe_colors.items(),
        key=lambda x: x[1]["count"],
        reverse=True
    )
    
    return {"tribes": sorted_tribes, "total_tribes": len(tribe_colors)}


def main():
    """Main function."""
    try:
        # Scrape contestants
        contestants = scrape_survivor_contestants()
        
        if not contestants:
            logger.error("No contestants found. Wikipedia layout may have changed.")
            return
        
        # Save data
        csv_path, json_path = save_data(contestants)
        
        # Analyze tribe colors
        tribe_analysis = analyze_tribe_colors(contestants)
        
        # Report results
        logger.info(f"Successfully scraped {len(contestants)} contestants")
        print(f"✓ Saved {len(contestants)} contestants to:")
        print(f"  - CSV: {csv_path}")
        print(f"  - JSON: {json_path}")
        
        # Print some examples
        print("\nSample data (first 5 entries):")
        for i, contestant in enumerate(sorted(contestants, key=lambda x: x.get("season_number", 999))[:5]):
            season_info = f"S{contestant.get('season_number', '?')}"
            print(f"{i+1}. {contestant['contestant']} ({season_info}) - Tribe: {contestant.get('original_tribe', 'Unknown')} - Color: {contestant.get('tribe_color', 'Unknown')}")
        
        # Print tribe color stats
        print(f"\nFound {tribe_analysis['total_tribes']} unique tribes with colors")
        print("Top 5 tribes by contestant count:")
        for i, (tribe, info) in enumerate(tribe_analysis["tribes"][:5]):
            print(f"{i+1}. {tribe}: {info['color']} ({info['count']} contestants)")
    
    except Exception as e:
        logger.exception(f"Error: {e}")
        print(f"Error: {e}")


if __name__ == "__main__":
    main()