/**
 * Icon Generator Script for PWA
 * 
 * This script generates all required icon sizes from a source image.
 * 
 * Usage:
 * 1. Place your app icon image in frontend/public/ as 'app-icon.png' (or update SOURCE_IMAGE below)
 * 2. Install sharp: npm install sharp --save-dev
 * 3. Run: node generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const SOURCE_IMAGE = path.join(__dirname, 'public', 'app-icon.png');
const OUTPUT_DIR = path.join(__dirname, 'public');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Error: sharp package not found.');
  console.log('📦 Please install it first: npm install sharp --save-dev');
  process.exit(1);
}

// Check if source image exists
if (!fs.existsSync(SOURCE_IMAGE)) {
  console.error(`❌ Source image not found: ${SOURCE_IMAGE}`);
  console.log('📝 Please place your app icon image at: frontend/public/app-icon.png');
  console.log('   Or update SOURCE_IMAGE in generate-icons.js');
  process.exit(1);
}

// Generate icons
async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');
  console.log(`📸 Source: ${SOURCE_IMAGE}`);
  console.log(`📁 Output: ${OUTPUT_DIR}\n`);

  try {
    for (const size of SIZES) {
      const outputPath = path.join(OUTPUT_DIR, `icon-${size}.png`);
      
      await sharp(SOURCE_IMAGE)
        .resize(size, size, {
          fit: 'cover',
          background: { r: 11, g: 11, b: 21, alpha: 1 } // brand-dark color
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generated: icon-${size}.png (${size}x${size})`);
    }
    
    console.log('\n✨ All icons generated successfully!');
    console.log('📱 Your PWA is ready to use.');
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
}

// Run the generator
generateIcons();

