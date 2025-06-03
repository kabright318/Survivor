#!/usr/bin/env python3
"""
Tribe Data Fixer

This script fixes a corrupted tribeData.js file by:
1. Identifying and parsing the corrupted member objects
2. Reconstructing proper JavaScript object syntax for each tribe member
3. Writing the corrected file

Usage:
  python tribe_data_fixer.py [--input PATH] [--output PATH] [--dry-run]

Options:
  --input PATH       Path to corrupted tribeData.js file [default: src/data/tribeData.js]
  --output PATH      Path for output file [default: src/data/tribeData_fixed.js]
  --dry-run          Don't write the output file, just show what would be fixed
"""

import re
import os
import argparse
import json
from typing import List, Dict, Any

def setup_argparse() -> argparse.Namespace:
    """Set up argument parsing"""
    parser = argparse.ArgumentParser(description="Fix corrupted tribeData.js file")
    parser.add_argument("--input", type=str, default="src/data/tribeData.js",
                        help="Path to corrupted tribeData.js file")
    parser.add_argument("--output", type=str, default="src/data/tribeData_fixed.js",
                        help="Path for output file")
    parser.add_argument("--dry-run", action="store_true",
                        help="Don't write the output file, just show what would be fixed")
    return parser.parse_args()

def extract_contestant_info(text: str) -> List[Dict[str, str]]:
    """
    Extract contestant information from corrupted text
    
    Returns a list of dictionaries with name and image keys
    """
    # Pattern to find contestant objects with name and image
    pattern = r'{\s*name:\s*"([^"]+)",\s*image:\s*"([^"]+)"\s*}'
    
    # Find all matches
    matches = re.findall(pattern, text)
    
    # Convert to list of dictionaries
    contestants = []
    for name, image in matches:
        contestants.append({"name": name, "image": image})
    
    return contestants

def extract_string_names(text: str) -> List[str]:
    """Extract names from quoted strings in a comma-separated list"""
    # Find all quoted strings
    pattern = r'"([^"]+)"'
    
    # Find all matches
    return re.findall(pattern, text)

def fix_tribe_data_file(input_path: str, output_path: str, dry_run: bool = False) -> None:
    """Fix the corrupted tribeData.js file"""
    print(f"Reading file: {input_path}")
    
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Create a backup of the original file
        if not dry_run and input_path == output_path:
            backup_path = f"{input_path}.backup"
            with open(backup_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Created backup of original file at {backup_path}")
        
        # Find all members array declarations
        members_pattern = r'members:\s*\[(.*?)\]'
        
        # Keep track of replacements
        replacements = []
        
        # Find each members array
        for match in re.finditer(members_pattern, content, re.DOTALL):
            members_text = match.group(1)
            
            # Check if this members array is corrupted (contains nested name properties)
            if re.search(r'{\s*name:\s*"[^"]*{\s*name:', members_text):
                # This is a corrupted members array
                print(f"Found corrupted members array.")
                
                # Try to extract contestant info from the array
                contestants = extract_contestant_info(members_text)
                
                # If we couldn't extract any contestants, try to extract string names
                if not contestants:
                    string_names = extract_string_names(members_text)
                    
                    if string_names:
                        print(f"Extracted {len(string_names)} contestant names without images.")
                        # Keep simple string format
                        new_members = ", ".join([f'"{name}"' for name in string_names])
                    else:
                        print(f"Warning: Could not extract contestant information from: {members_text[:100]}...")
                        # Leave this array unchanged
                        continue
                else:
                    print(f"Extracted {len(contestants)} contestant objects with names and images.")
                    # Format as proper JavaScript objects
                    new_members = ",\n          ".join([
                        f'{{ name: "{contestant["name"]}", image: "{contestant["image"]}" }}' 
                        for contestant in contestants
                    ])
                
                # Replace the corrupted members array with the fixed one
                replacements.append((match.start(1), match.end(1), new_members))
        
        # Apply the replacements in reverse order to avoid offset issues
        replacements.sort(reverse=True, key=lambda x: x[0])
        for start, end, replacement in replacements:
            content = content[:start] + replacement + content[end:]
        
        print(f"Fixed {len(replacements)} corrupted members arrays.")
        
        # If we couldn't find any corrupted arrays, try a more aggressive approach
        if not replacements:
            print("No corrupted arrays found with pattern matching. Trying more aggressive approach...")
            
            # Look for tribes entries and rebuild them
            tribe_pattern = r'{\s*name:\s*"([^"]+)",\s*color:\s*colors\.([^,]+),\s*members:\s*\[(.*?)\]\s*}'
            
            tribe_replacements = []
            for match in re.finditer(tribe_pattern, content, re.DOTALL):
                tribe_name = match.group(1)
                tribe_color = match.group(2)
                members_text = match.group(3)
                
                # Check if this members array is corrupted
                if re.search(r'{\s*name:\s*"[^"]*{\s*name:', members_text):
                    print(f"Found corrupted tribe: {tribe_name}")
                    
                    # Try to extract string names from comma-separated list
                    string_names = []
                    for text_chunk in members_text.split('",'):
                        if '"' in text_chunk:
                            name_match = re.search(r'"([^"]+)', text_chunk)
                            if name_match:
                                string_names.append(name_match.group(1))
                    
                    if string_names:
                        print(f"Extracted {len(string_names)} contestant names from {tribe_name}.")
                        
                        # Create a new tribe entry with simple string format
                        new_tribe = (
                            f'{{\n'
                            f'        name: "{tribe_name}",\n'
                            f'        color: colors.{tribe_color},\n'
                            f'        members: [{", ".join([f\'"{name}"\' for name in string_names])}]\n'
                            f'      }}'
                        )
                        
                        tribe_replacements.append((match.start(), match.end(), new_tribe))
            
            # Apply the tribe replacements in reverse order
            tribe_replacements.sort(reverse=True, key=lambda x: x[0])
            for start, end, replacement in tribe_replacements:
                content = content[:start] + replacement + content[end:]
            
            print(f"Fixed {len(tribe_replacements)} corrupted tribes.")
            
            if not tribe_replacements:
                print("Warning: Could not identify and fix any corrupted tribes.")
        
        # Write the corrected content to the output file
        if not dry_run:
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Written fixed file to: {output_path}")
        else:
            print("Dry run - no file written.")
            print("\nPreview of fixed content:")
            print("=" * 40)
            print(content[:500] + "...")
            print("=" * 40)
    
    except Exception as e:
        print(f"Error processing file: {e}")
        import traceback
        traceback.print_exc()

def main():
    """Main entry point"""
    args = setup_argparse()
    
    fix_tribe_data_file(args.input, args.output, args.dry_run)
    
    print("Done!")

if __name__ == "__main__":
    main()
