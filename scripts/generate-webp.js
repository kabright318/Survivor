#!/usr/bin/env node

/**
 * Generate WebP versions of contestant images for better performance
 * This script converts existing JPG images to WebP format with high quality
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IMAGES_DIR = path.join(__dirname, '../public/images/contestants');
const QUALITY = 85; // High quality WebP

function findImageFiles(dir) {
  const images = [];
  
  function scanDirectory(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (item.match(/\.(jpg|jpeg|png)$/i)) {
        images.push(fullPath);
      }
    }
  }
  
  scanDirectory(dir);
  return images;
}

function checkFFmpegInstalled() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function convertToWebP(inputPath) {
  const outputPath = inputPath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  
  // Skip if WebP already exists and is newer
  if (fs.existsSync(outputPath)) {
    const inputStat = fs.statSync(inputPath);
    const outputStat = fs.statSync(outputPath);
    if (outputStat.mtime >= inputStat.mtime) {
      console.log(`⏭️  Skipping ${path.basename(inputPath)} (WebP already exists)`);
      return;
    }
  }
  
  try {
    console.log(`🔄 Converting ${path.basename(inputPath)}...`);
    
    if (checkFFmpegInstalled()) {
      // Use FFmpeg for conversion with high quality
      execSync(`ffmpeg -i "${inputPath}" -c:v libwebp -quality ${QUALITY} -preset photo -y "${outputPath}"`, 
        { stdio: 'ignore' });
    } else {
      console.log(`❌ FFmpeg not installed. Install with: sudo apt install ffmpeg`);
      return;
    }
    
    const inputSize = fs.statSync(inputPath).size;
    const outputSize = fs.statSync(outputPath).size;
    const savings = ((inputSize - outputSize) / inputSize * 100).toFixed(1);
    
    console.log(`✅ ${path.basename(outputPath)} (${savings}% smaller)`);
  } catch (error) {
    console.error(`❌ Failed to convert ${inputPath}:`, error.message);
  }
}

function main() {
  console.log('🚀 Starting WebP conversion...\n');
  
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ Images directory not found: ${IMAGES_DIR}`);
    process.exit(1);
  }
  
  const imageFiles = findImageFiles(IMAGES_DIR);
  console.log(`📸 Found ${imageFiles.length} images to process\n`);
  
  let converted = 0;
  let skipped = 0;
  
  for (const imagePath of imageFiles) {
    const webpPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
    
    if (fs.existsSync(webpPath)) {
      const inputStat = fs.statSync(imagePath);
      const outputStat = fs.statSync(webpPath);
      if (outputStat.mtime >= inputStat.mtime) {
        skipped++;
        continue;
      }
    }
    
    convertToWebP(imagePath);
    converted++;
  }
  
  console.log(`\n🎉 Conversion complete!`);
  console.log(`   ✅ Converted: ${converted}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   📊 Total: ${imageFiles.length}`);
}

if (require.main === module) {
  main();
}

module.exports = { convertToWebP, findImageFiles };