#!/usr/bin/env python3
"""
Tribe Data Image Updater

This script updates the tribeData.js file by:
1. Finding image files in the public/images/contestants directory
2. Converting string entries to object entries with name and image properties
3. Updating contestant names based on image filenames (e.g., richard_hatch.jpg -> Richard Hatch)

Usage:
  python tribe_data_image_updater.py [--image-dir PATH] [--tribe-data PATH] [--dry-run]

Options:
  --image-dir PATH     Directory containing contestant images [default: public/images/contestants]
  --tribe-data PATH    Path to tribeData.js file [default: src/data/tribeData.js]
  --dry-run            Don't actually write changes, just report what would be done
"""

import os
import re
import glob
import json
import argparse
from pathlib import Path
import logging
from typing import Dict, List, Any, Tuple, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("tribe_data_updater.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("tribe_data_updater")

# Default paths
DEFAULT_IMAGE_DIR = "public/images/contestants"
DEFAULT_TRIBE_DATA_PATH = "src/data/tribeData.js"


def setup_argparse() -> argparse.Namespace:
    """Set up argument parsing"""
    parser = argparse.ArgumentParser(description="Update tribeData.js with contestant images and full names")
    parser.add_argument("--image-dir", type=str, default=DEFAULT_IMAGE_DIR,
                        help=f"Directory containing contestant images [default: {DEFAULT_IMAGE_DIR}]")
    parser.add_argument("--tribe-data", type=str, default=DEFAULT_TRIBE_DATA_PATH,
                        help=f"Path to tribeData.js file [default: {DEFAULT_TRIBE_DATA_PATH}]")
    parser.add_argument("--dry-run", action="store_true",
                        help="Don't actually write changes, just report what would be done")
    return parser.parse_args()


def scan_image_files(image_dir: str) -> Dict[int, Dict[str, Dict[str, str]]]:
    """
    Scan the image directory for contestant images and return name->path mappings
    
    Returns a dictionary mapping season numbers to contestant mappings
    {
        1: {
            "richard": {
                "proper_name": "Richard Hatch",
                "path": "/images/contestants/season1/richard_hatch.jpg"
            },
            ...
        },
        ...
    }
    """
    mappings = {}
    
    # Create a pattern to match season directories
    season_pattern = re.compile(r'season(\d+)')
    
    # Find all season directories
    for season_dir in glob.glob(os.path.join(image_dir, "season*")):
        # Extract season number
        season_match = season_pattern.search(season_dir)
        if not season_match:
            logger.warning(f"Could not extract season number from directory: {season_dir}")
            continue
            
        season_num = int(season_match.group(1))
        mappings[season_num] = {}
        
        # Find all image files in this season directory
        for image_path in glob.glob(os.path.join(season_dir, "*.jpg")):
            # Extract the base filename without extension
            filename = os.path.basename(image_path)
            base_name = os.path.splitext(filename)[0]
            
            # Convert filename to proper name (replace underscores with spaces, capitalize words)
            proper_name = " ".join(word.capitalize() for word in base_name.split('_'))
            
            # Special handling for common name patterns
            proper_name = proper_name.replace(" Jr", " Jr.")
            proper_name = proper_name.replace(" Ii", " II")
            proper_name = proper_name.replace(" Iii", " III")
            proper_name = proper_name.replace(" Iv", " IV")
            
            # Create lookup key (lowercase without special chars for easier matching)
            lookup_key = re.sub(r'[^a-z0-9]', '', base_name.lower())
            
            # Convert the image path to the format used in React (without "public" prefix)
            react_path = f"/images/contestants/season{season_num}/{filename}"
            
            # Store the mapping
            mappings[season_num][lookup_key] = {
                "proper_name": proper_name,
                "path": react_path
            }
            
            # Also store with just the first name as key for partial matching
            first_name_key = base_name.split('_')[0] if '_' in base_name else base_name
            first_name_key = first_name_key.lower()
            
            if first_name_key != lookup_key:
                mappings[season_num][first_name_key] = {
                    "proper_name": proper_name,
                    "path": react_path
                }
    
    # Log what we found
    total_images = sum(len(mappings) for season, mappings in mappings.items())
    logger.info(f"Found {total_images} contestant images across {len(mappings)} seasons")
    
    return mappings


def update_tribe_data(tribe_data_path: str, image_mappings: Dict[int, Dict[str, Dict[str, str]]], dry_run: bool = False) -> None:
    """Update the tribeData.js file with proper contestant names and image paths"""
    try:
        # Read the tribeData.js file
        with open(tribe_data_path, 'r', encoding='utf-8') as f:
            original_content = f.read()
        
        # Create a working copy of the content
        content = original_content
        
        # Create a backup of the original file
        if not dry_run:
            backup_path = f"{tribe_data_path}.backup"
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(original_content)
            logger.info(f"Created backup of original file at {backup_path}")
        
        # Track the number of updates made
        name_updates = 0
        image_updates = 0
        
        # Compile the regular expression for a season block only once
        season_block_pattern = re.compile(r'(\d+):\s*{[^}]*tribes:\s*\[[^\]]*\]', re.DOTALL)
        
        # Find all season blocks in the content
        for season_match in season_block_pattern.finditer(content):
            season_text = season_match.group(0)
            season_num = int(season_match.group(1))
            
            # Skip if we don't have image mappings for this season
            if season_num not in image_mappings:
                logger.warning(f"No image mappings found for season {season_num}, skipping")
                continue
            
            # Find all tribe blocks within this season
            tribe_block_pattern = re.compile(r'{[^{]*name:\s*"([^"]+)"[^{]*members:\s*\[(.*?)\]', re.DOTALL)
            for tribe_match in tribe_block_pattern.finditer(season_text):
                tribe_name = tribe_match.group(1)
                members_text = tribe_match.group(2)
                
                # Find the start position of the members list in the content
                members_start = season_match.start() + tribe_match.start(2)
                members_end = season_match.start() + tribe_match.end(2)
                
                # Find all member entries in this tribe
                updated_members = members_text
                
                # First handle string entries (e.g., "Richard")
                string_member_pattern = re.compile(r'"([^"]+)"')
                for member_match in string_member_pattern.finditer(members_text):
                    member_name = member_match.group(1)
                    
                    # Skip entries that are already objects
                    if '{ name:' in member_match.group(0):
                        continue
                    
                    # Create lookup keys
                    simple_key = re.sub(r'[^a-z0-9]', '', member_name.lower())
                    
                    # Look for matches in our image mappings
                    image_info = None
                    if simple_key in image_mappings[season_num]:
                        image_info = image_mappings[season_num][simple_key]
                    
                    # If we found a match, update the entry
                    if image_info:
                        # Create a replacement object entry
                        replacement = f'{{ name: "{image_info["proper_name"]}", image: "{image_info["path"]}" }}'
                        
                        # Replace the string entry with the object entry in our working copy
                        start_pos = member_match.start()
                        end_pos = member_match.end()
                        
                        # Special handling for trailing commas
                        if members_text[end_pos:end_pos+1] == ',':
                            replacement += ','
                        
                        updated_members = updated_members[:start_pos] + replacement + updated_members[end_pos:]
                        
                        logger.info(f"Season {season_num}, Tribe {tribe_name}: "
                                   f"'{member_name}' -> '{image_info['proper_name']}' with image")
                        
                        name_updates += 1
                        image_updates += 1
                
                # Now handle members that are already objects but may need name or image updates
                object_member_pattern = re.compile(r'{[^}]*name:\s*"([^"]+)"[^}]*}')
                for member_match in object_member_pattern.finditer(updated_members):
                    object_text = member_match.group(0)
                    member_name = member_match.group(1)
                    
                    # Check if this object already has an image property
                    has_image = 'image:' in object_text
                    
                    # Create lookup keys
                    simple_key = re.sub(r'[^a-z0-9]', '', member_name.lower())
                    
                    # Look for matches in our image mappings
                    image_info = None
                    if simple_key in image_mappings[season_num]:
                        image_info = image_mappings[season_num][simple_key]
                    elif member_name.split(' ')[0].lower() in image_mappings[season_num]:
                        # Try matching by first name
                        first_name_key = member_name.split(' ')[0].lower()
                        image_info = image_mappings[season_num][first_name_key]
                    
                    # If we found a match, update the entry
                    if image_info:
                        # Prepare replacements
                        replacements = []
                        
                        # Check if we need to update the name
                        if member_name != image_info["proper_name"]:
                            name_pattern = re.compile(fr'name:\s*"{re.escape(member_name)}"')
                            name_replacement = f'name: "{image_info["proper_name"]}"'
                            
                            name_match = name_pattern.search(object_text)
                            if name_match:
                                replacements.append((name_match.start(), name_match.end(), name_replacement))
                                name_updates += 1
                        
                        # Check if we need to add or update the image property
                        if not has_image:
                            # Add image property after name
                            name_pattern = re.compile(fr'name:\s*"[^"]+"')
                            name_match = name_pattern.search(object_text)
                            
                            if name_match:
                                # Add after the name property
                                insert_pos = name_match.end()
                                
                                # Check if there's already a comma after the name
                                if object_text[insert_pos:insert_pos+1] != ',':
                                    image_insertion = f', image: "{image_info["path"]}"'
                                else:
                                    image_insertion = f' image: "{image_info["path"]}",'
                                
                                replacements.append((insert_pos, insert_pos, image_insertion))
                                image_updates += 1
                        
                        # Apply the replacements to this object
                        if replacements:
                            # Sort replacements in reverse order to avoid position shifts
                            replacements.sort(reverse=True, key=lambda x: x[0])
                            
                            new_object_text = object_text
                            for start, end, replacement in replacements:
                                new_object_text = new_object_text[:start] + replacement + new_object_text[end:]
                            
                            # Replace the old object text with the new one
                            start_pos = member_match.start()
                            end_pos = member_match.end()
                            updated_members = updated_members[:start_pos] + new_object_text + updated_members[end_pos:]
                            
                            logger.info(f"Season {season_num}, Tribe {tribe_name}: Updated {member_name} object")
                
                # Now update the full content with our modified members section
                content = content[:members_start] + updated_members + content[members_end:]
        
        # Write the updated content back to the file
        if not dry_run and (name_updates > 0 or image_updates > 0):
            with open(tribe_data_path, 'w', encoding='utf-8') as f:
                f.write(content)
            logger.info(f"Updated {name_updates} contestant names and {image_updates} image paths in {tribe_data_path}")
        elif dry_run:
            logger.info(f"Dry run: Would update {name_updates} contestant names and {image_updates} image paths")
        else:
            logger.info("No changes needed")
    
    except Exception as e:
        logger.error(f"Error updating tribe data: {e}")
        import traceback
        logger.error(traceback.format_exc())


def main():
    """Main entry point"""
    args = setup_argparse()
    
    # Scan image files to extract proper names and paths
    image_mappings = scan_image_files(args.image_dir)
    
    # Update tribeData.js with proper names and image paths
    update_tribe_data(args.tribe_data, image_mappings, args.dry_run)
    
    logger.info("Done!")


if __name__ == "__main__":
    main()