/**
 * Pre-test check: Verify WASM module is built before running tests
 */

const fs = require('fs');
const path = require('path');

const wasmPath = path.join(__dirname, '../docs/ipv6-parse.js');
const apiPath = path.join(__dirname, '../docs/ipv6-parse-api.js');

console.log('Checking for WASM build artifacts...\n');

let missing = [];

if (!fs.existsSync(wasmPath)) {
  missing.push('docs/ipv6-parse.js (WASM module)');
}

if (!fs.existsSync(apiPath)) {
  missing.push('docs/ipv6-parse-api.js (API layer)');
}

if (missing.length > 0) {
  console.error('❌ WASM build artifacts not found:\n');
  missing.forEach(file => console.error(`   - ${file}`));
  console.error('\nPlease build the WASM module first:');
  console.error('   npm run build');
  console.error('   OR');
  console.error('   ./build_wasm.sh\n');
  process.exit(1);
}

// Check file sizes to ensure they're not empty
const wasmStats = fs.statSync(wasmPath);
const apiStats = fs.statSync(apiPath);

if (wasmStats.size < 1000) {
  console.error('❌ WASM module file is too small (likely corrupt)');
  console.error(`   Size: ${wasmStats.size} bytes\n`);
  process.exit(1);
}

if (apiStats.size < 100) {
  console.error('❌ API layer file is too small (likely corrupt)');
  console.error(`   Size: ${apiStats.size} bytes\n`);
  process.exit(1);
}

console.log('✓ WASM module found:', wasmPath);
console.log(`  Size: ${(wasmStats.size / 1024).toFixed(2)} KB`);
console.log('✓ API layer found:', apiPath);
console.log(`  Size: ${(apiStats.size / 1024).toFixed(2)} KB`);
console.log('');
