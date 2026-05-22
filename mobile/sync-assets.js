/**
 * Copies static game assets from ../static/ into www/assets/
 * Run before every Capacitor sync: npm run sync-assets
 */
const fs = require('fs');
const path = require('path');

const staticDir = path.resolve(__dirname, '..', 'static');
const assetsDir = path.resolve(__dirname, 'www', 'assets');
const soundsDir = path.resolve(assetsDir, 'sounds');

fs.mkdirSync(assetsDir, { recursive: true });
fs.mkdirSync(soundsDir, { recursive: true });

const jsFiles = [
  'n_dimensional_chess.js',
  'infinite_chessboard.js',
  'infinite_chessboard_module.js',
  'keyboard_controller.js',
  'three.min.js',
  'OrbitControls.js',
];

const cssFiles = ['styles.css'];
const soundFiles = ['move.mp3', 'capture.mp3'];

[...jsFiles, ...cssFiles].forEach(file => {
  const src = path.join(staticDir, file);
  const dest = path.join(assetsDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  copied  ${file}`);
  } else {
    console.warn(`  missing ${file} (not found at ${src})`);
  }
});

soundFiles.forEach(file => {
  const src = path.join(staticDir, 'sounds', file);
  const dest = path.join(soundsDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`  copied  sounds/${file}`);
  } else {
    console.warn(`  missing sounds/${file}`);
  }
});

console.log('\nDone. Run: npx cap sync');
