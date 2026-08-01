import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ICON = path.join(__dirname, '../public/pwa-512x512.png');
const PUBLIC_DIR = path.join(__dirname, '../public');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  if (!fs.existsSync(SOURCE_ICON)) {
    console.error('Source icon not found:', SOURCE_ICON);
    process.exit(1);
  }

  console.log('Generating PWA icons...');

  for (const size of SIZES) {
    // Generate standard icons
    if (size !== 512) {
      await sharp(SOURCE_ICON)
        .resize(size, size)
        .toFile(path.join(PUBLIC_DIR, `pwa-${size}x${size}.png`));
    }
    
    // Generate maskable icons (we'll just use a slightly padded version with background for simplicity)
    await sharp(SOURCE_ICON)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 134, g: 59, b: 255, alpha: 1 } // #863BFF Theme color
      })
      .toFile(path.join(PUBLIC_DIR, `maskable-icon-${size}x${size}.png`));
      
    console.log(`Generated ${size}x${size} icons`);
  }

  // Generate Apple Touch Icon (usually 180x180)
  await sharp(SOURCE_ICON)
    .resize(180, 180)
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon-180x180.png'));
  console.log('Generated Apple Touch Icon 180x180');

  console.log('Icon generation complete!');
}

generateIcons().catch(console.error);
