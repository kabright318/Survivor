#!/usr/bin/env python3
"""
Survivor Data Generator

This script creates a new tribeData.js file by:
1. Scanning the images/contestants directory for contestant images
2. Extracting contestant information from filenames
3. Organizing contestants by season and tribe
4. Generating a properly formatted JavaScript file

Usage:
  python survivor_data_generator.py [--image-dir PATH] [--output PATH] [--tribe-info PATH]

Options:
  --image-dir PATH     Directory containing contestant images [default: public/images/contestants]
  --output PATH        Path for output tribeData.js file [default: src/data/tribeData.js]
  --tribe-info PATH    Path to JSON file with tribe information [default: tribe_info.json]
"""

import os
import re
import json
import glob
import argparse
from pathlib import Path
from typing import Dict, List, Any, Tuple, Set

# Define tribe colors based on the original file
DEFAULT_COLORS = {
    "Tagi": "forestGreen",
    "Pagong": "warmOrange",
    "Kucha": "seafoamBlue",
    "Ogakor": "cherryRed",
    "Boran": "warmOrange",
    "Samburu": "seafoamBlue",
    "Rotu": "arugalaGreen",
    "Maraamu": "warmOrange",
    "Chuay Gahn": "cherryRed",
    "Sook Jai": "arugalaGreen",
    "Tambaqui": "forestGreen",
    "Jaburu": "blushPink",
    "Drake": "forestGreen",
    "Morgan": "cherryRed",
    "Chapera": "cherryRed",
    "Saboga": "warmOrange",
    "Mogo Mogo": "forestGreen",
    "Lopevi": "cherryRed",
    "Yasur": "warmOrange",
    "Koror": "forestGreen",
    "Ulong": "seafoamBlue",
    "Nakúm": "warmOrange",
    "Yaxhá": "arugalaGreen",
    "Casaya": "cherryRed",
    "La Mina": "seafoamBlue",
    "Bayoneta": "blushPink",
    "Viveros": "forestGreen",
    "Aitutaki": "cherryRed",
    "Rarotonga": "arugalaGreen",
    "Puka Puka": "warmOrange",
    "Manihiki": "seafoamBlue",
    "Moto": "arugalaGreen",
    "Ravu": "cherryRed",
    "Fei Long": "cherryRed",
    "Zhan Hu": "warmOrange",
    "Airai": "cherryRed",
    "Malakal": "arugalaGreen",
    "Fang": "cherryRed",
    "Kota": "arugalaGreen",
    "Jalapao": "cherryRed",
    "Timbira": "blushPink",
    "Foa Foa": "warmOrange",
    "Galu": "seafoamBlue",
    "Heroes": "arugalaGreen",
    "Villains": "cherryRed",
    "Matsing": "seafoamBlue",
    "Tandang": "cherryRed",
    "Kalabaw": "arugalaGreen",
    "Gota": "warmOrange",
    "Bikal": "seafoamBlue",
    "Galang": "warmOrange",
    "Tadhana": "seafoamBlue",
    "Luzon": "forestGreen",
    "Solana": "blushPink",
    "Aparri": "arugalaGreen",
    "Hunahpu": "forestGreen",
    "Coyopa": "warmOrange",
    "Masaya": "seafoamBlue",
    "Escameca": "forestGreen",
    "Nagarote": "warmOrange",
    "Bayon": "arugalaGreen",
    "Ta Keo": "warmOrange",
    "Chan Loh": "arugalaGreen",
    "Gondol": "blushPink",
    "To Tang": "cherryRed",
    "Vanua": "seafoamBlue",
    "Takali": "cherryRed",
    "Nuku": "arugalaGreen",
    "Mana": "cherryRed",
    "Levu": "arugalaGreen",
    "Soko": "blushPink",
    "Yawa": "cherryRed",
    "Naviti": "seafoamBlue",
    "Malolo": "warmOrange",
    "David": "warmOrange",
    "Goliath": "seafoamBlue"
}

# Default tribe prefixes/nicknames for tribes with variant names
TRIBE_PREFIXES = {
    "Luzon": "Luzon (Brains)",
    "Solana": "Solana (Beauty)",
    "Aparri": "Aparri (Brawn)",
    "Masaya": "Masaya (White Collar)",
    "Escameca": "Escameca (Blue Collar)",
    "Nagarote": "Nagarote (No Collar)",
    "Chan Loh": "Chan Loh (Brains)",
    "Gondol": "Gondol (Beauty)",
    "To Tang": "To Tang (Brawn)",
    "Vanua": "Vanua (Millennials)",
    "Takali": "Takali (Gen X)",
    "Levu": "Levu (Heroes)",
    "Soko": "Soko (Healers)",
    "Yawa": "Yawa (Hustlers)"
}

# Default season mapping - this is hardcoded for known seasons
# The key is the season number, the value is a list of tribes
DEFAULT_SEASON_TRIBES = {
    1: ["Tagi", "Pagong"],
    2: ["Kucha", "Ogakor"],
    3: ["Boran", "Samburu"],
    4: ["Rotu", "Maraamu"],
    5: ["Chuay Gahn", "Sook Jai"],
    6: ["Tambaqui", "Jaburu"],
    7: ["Drake", "Morgan"],
    8: ["Chapera", "Saboga", "Mogo Mogo"],
    9: ["Lopevi", "Yasur"],
    10: ["Koror", "Ulong"],
    11: ["Nakúm", "Yaxhá"],
    12: ["Casaya", "La Mina", "Bayoneta", "Viveros"],
    13: ["Aitutaki", "Rarotonga", "Puka Puka", "Manihiki"],
    14: ["Moto", "Ravu"],
    15: ["Fei Long", "Zhan Hu"],
    16: ["Airai", "Malakal"],
    17: ["Fang", "Kota"],
    18: ["Jalapao", "Timbira"],
    19: ["Foa Foa", "Galu"],
    20: ["Heroes", "Villains"],
    25: ["Matsing", "Tandang", "Kalabaw"],
    26: ["Gota", "Bikal"],
    27: ["Galang", "Tadhana"],
    28: ["Luzon", "Solana", "Aparri"],
    29: ["Hunahpu", "Coyopa"],
    30: ["Masaya", "Escameca", "Nagarote"],
    31: ["Bayon", "Ta Keo"],
    32: ["Chan Loh", "Gondol", "To Tang"],
    33: ["Vanua", "Takali"],
    34: ["Nuku", "Mana"],
    35: ["Levu", "Soko", "Yawa"],
    36: ["Naviti", "Malolo"],
    37: ["David", "Goliath"]
}

def setup_argparse() -> argparse.Namespace:
    """Set up argument parsing"""
    parser = argparse.ArgumentParser(description="Generate tribeData.js file from contestant images")
    parser.add_argument("--image-dir", type=str, default="public/images/contestants",
                        help="Directory containing contestant images")
    parser.add_argument("--output", type=str, default="src/data/tribeData.js",
                        help="Path for output tribeData.js file")
    parser.add_argument("--tribe-info", type=str, default="tribe_info.json",
                        help="Path to JSON file with tribe information (optional)")
    
    return parser.parse_args()

def format_name(filename: str) -> str:
    """
    Format a filename into a proper name
    Example: 'richard_hatch.jpg' -> 'Richard Hatch'
    """
    # Remove extension
    base_name = os.path.splitext(filename)[0]
    
    # Replace underscores with spaces and capitalize each word
    proper_name = " ".join(word.capitalize() for word in base_name.split('_'))
    
    # Special handling for suffixes and abbreviations
    proper_name = proper_name.replace(" Jr", " Jr.")
    proper_name = proper_name.replace(" Ii", " II")
    proper_name = proper_name.replace(" Iii", " III")
    proper_name = proper_name.replace(" Iv", " IV")
    
    return proper_name

def scan_image_directory(image_dir: str) -> Dict[int, List[Dict[str, str]]]:
    """
    Scan the images directory to find all contestant images
    
    Returns a dictionary mapping season numbers to lists of contestant dictionaries
    """
    contestants_by_season = {}
    
    # Create a pattern to match season directories
    season_pattern = re.compile(r'season(\d+)')
    
    # Find all season directories
    for season_dir in glob.glob(os.path.join(image_dir, "season*")):
        # Extract season number
        season_match = season_pattern.search(season_dir)
        if not season_match:
            print(f"Warning: Could not extract season number from directory: {season_dir}")
            continue
            
        season_num = int(season_match.group(1))
        contestants_by_season[season_num] = []
        
        # Find all image files in this season directory
        for image_path in glob.glob(os.path.join(season_dir, "*.jpg")):
            # Extract the filename
            filename = os.path.basename(image_path)
            
            # Format the name
            proper_name = format_name(filename)
            
            # Convert the image path to the format used in React
            react_path = f"/images/contestants/season{season_num}/{filename}"
            
            # Add to the list of contestants for this season
            contestants_by_season[season_num].append({
                "name": proper_name,
                "image": react_path,
                "first_name": proper_name.split(" ")[0].lower()  # Store first name for matching
            })
    
    # Print summary
    total_contestants = sum(len(contestants) for season, contestants in contestants_by_season.items())
    print(f"Found {total_contestants} contestant images across {len(contestants_by_season)} seasons")
    
    return contestants_by_season

def assign_contestants_to_tribes(
    contestants: List[Dict[str, str]], 
    season: int, 
    tribe_info: Dict[Any, Any] = None
) -> Dict[str, List[Dict[str, str]]]:
    """
    Assign contestants to tribes based on their known tribe assignments
    
    If tribe_info is provided, uses that information, otherwise uses hardcoded defaults
    
    Returns a dictionary mapping tribe names to lists of contestant dictionaries
    """
    tribes = {}
    
    # If we don't have any tribe info, use the default mapping
    if tribe_info is None or season not in tribe_info:
        # Initialize tribes for this season
        for tribe_name in DEFAULT_SEASON_TRIBES.get(season, []):
            tribes[tribe_name] = []
            
        # For now, put all contestants in the first tribe
        # In a real implementation, you'd need tribe membership data
        if tribes:
            first_tribe = list(tribes.keys())[0]
            tribes[first_tribe] = contestants
    else:
        # Use the provided tribe info
        season_info = tribe_info[str(season)]
        
        # Create a mapping of contestant names to their tribe
        contestant_tribes = {}
        for tribe_name, members in season_info.items():
            for member in members:
                contestant_tribes[member.lower()] = tribe_name
        
        # Initialize tribes
        unique_tribes = set(contestant_tribes.values())
        for tribe in unique_tribes:
            tribes[tribe] = []
        
        # Assign contestants to tribes based on name matching
        for contestant in contestants:
            assigned = False
            
            # Check for exact match
            full_name_lower = contestant["name"].lower()
            if full_name_lower in contestant_tribes:
                tribe_name = contestant_tribes[full_name_lower]
                tribes[tribe_name].append(contestant)
                assigned = True
            else:
                # Check for first name match (as fallback)
                first_name = contestant["first_name"]
                matching_members = [
                    member for member in contestant_tribes
                    if member.split()[0].lower() == first_name
                ]
                
                if len(matching_members) == 1:
                    # Single match found
                    tribe_name = contestant_tribes[matching_members[0]]
                    tribes[tribe_name].append(contestant)
                    assigned = True
            
            # If still not assigned, put in the first tribe
            if not assigned and tribes:
                first_tribe = list(tribes.keys())[0]
                tribes[first_tribe].append(contestant)
                print(f"Warning: Could not determine tribe for {contestant['name']} (Season {season}). "
                      f"Assigned to {first_tribe}.")
    
    return tribes

def load_tribe_info(file_path: str) -> Dict[Any, Any]:
    """Load tribe information from a JSON file"""
    if not os.path.exists(file_path):
        print(f"Warning: Tribe info file {file_path} not found. Using default tribe assignments.")
        return {}
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading tribe info: {e}")
        return {}

def generate_tribe_data_js(
    contestants_by_season: Dict[int, List[Dict[str, str]]], 
    output_path: str,
    tribe_info: Dict[Any, Any] = None
) -> None:
    """Generate the tribeData.js file"""
    
    # Start building the file content
    content = [
        "import { colors } from './colors';",
        "",
        "// Define the tribe data structure for all Survivor seasons",
        "export const tribeData = {"
    ]
    
    # Sort seasons numerically
    for season in sorted(contestants_by_season.keys()):
        # Skip seasons without contestants
        if not contestants_by_season[season]:
            continue
        
        # Assign contestants to tribes
        tribes_with_contestants = assign_contestants_to_tribes(
            contestants_by_season[season], season, tribe_info
        )
        
        # Skip seasons without assigned tribes
        if not tribes_with_contestants:
            continue
        
        # Add season header
        content.append(f"  {season}: {{ // Season {season}")
        content.append("    tribes: [")
        
        # Add tribes
        for tribe_name, tribe_contestants in tribes_with_contestants.items():
            # Get proper tribe name with prefix if it exists
            display_name = TRIBE_PREFIXES.get(tribe_name, tribe_name)
            
            # Get tribe color
            tribe_color = DEFAULT_COLORS.get(tribe_name, "forestGreen")
            
            # Add tribe definition
            content.append(f"      {{")
            content.append(f'        name: "{display_name}",')
            content.append(f"        color: colors.{tribe_color},")
            
            # Add tribe members
            content.append("        members: [")
            
            # Format members as objects with name and image
            for contestant in tribe_contestants:
                content.append(f'          {{ name: "{contestant["name"]}", image: "{contestant["image"]}" }},')
            
            # Close members array
            content.append("        ]")
            content.append("      },")
        
        # Close tribes array and season object
        content.append("    ]")
        content.append("  },")
    
    # Close the tribeData object
    content.append("};")
    
    # Add helper functions
    content.extend([
        "",
        "// Helper function to get tribes for a specific season",
        "export const getTribesBySeason = (seasonNumber) => {",
        "  return tribeData[seasonNumber] ? tribeData[seasonNumber].tribes : [];",
        "};",
        "",
        "// Helper function to get all tribe members for a season",
        "export const getAllTribeMembersBySeason = (seasonNumber) => {",
        "  const tribes = getTribesBySeason(seasonNumber);",
        "  const allMembers = [];",
        "  ",
        "  tribes.forEach(tribe => {",
        "    tribe.members.forEach(member => {",
        "      allMembers.push({",
        "        name: member.name,",
        "        image: member.image,",
        "        tribe: tribe.name,",
        "        tribeColor: tribe.color",
        "      });",
        "    });",
        "  });",
        "  ",
        "  return allMembers;",
        "};"
    ])
    
    # Create the directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Write the file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(content))
    
    print(f"Generated tribeData.js file at: {output_path}")
    print(f"Included {len(contestants_by_season)} seasons")

def generate_tribe_info_template(
    contestants_by_season: Dict[int, List[Dict[str, str]]], 
    output_path: str
) -> None:
    """
    Generate a template tribe_info.json file based on the contestants we found
    This can be manually edited to assign contestants to the correct tribes
    """
    tribe_info = {}
    
    for season, contestants in contestants_by_season.items():
        # Get tribes for this season
        tribes = DEFAULT_SEASON_TRIBES.get(season, [])
        
        # If we don't have tribes for this season, create some placeholder tribes
        if not tribes:
            tribes = ["Tribe1", "Tribe2"]
        
        # Create an entry for this season
        season_info = {}
        for tribe in tribes:
            season_info[tribe] = []
        
        # For the template, we'll just put all contestants in the first tribe
        if tribes:
            first_tribe = tribes[0]
            season_info[first_tribe] = [contestant["name"] for contestant in contestants]
        
        tribe_info[str(season)] = season_info
    
    # Write the file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(tribe_info, f, indent=2)
    
    print(f"Generated tribe info template at: {output_path}")
    print("You can edit this file to assign contestants to the correct tribes,")
    print("then run the script again with --tribe-info argument.")

def main():
    """Main entry point"""
    args = setup_argparse()
    
    # Scan the image directory to find all contestant images
    contestants_by_season = scan_image_directory(args.image_dir)
    
    # Check if we found any contestants
    if not contestants_by_season:
        print("Error: No contestant images found. Check the image directory path.")
        return
    
    # Load tribe info if provided
    tribe_info = None
    if os.path.exists(args.tribe_info):
        tribe_info = load_tribe_info(args.tribe_info)
    else:
        # Generate a template tribe_info.json file
        template_path = "tribe_info_template.json"
        generate_tribe_info_template(contestants_by_season, template_path)
    
    # Generate the tribeData.js file
    generate_tribe_data_js(contestants_by_season, args.output, tribe_info)
    
    print("\nDone!")

if __name__ == "__main__":
    main()
