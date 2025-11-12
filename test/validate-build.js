/**
 * Build output validation script
 * Validates that all necessary files are present and properly formatted
 */

const fs = require('fs');
const path = require('path');

console.log('Build Output Validation\n========================\n');

let errors = 0;
let warnings = 0;

// Required files
const requiredFiles = [
  'docs/ipv6-parse.js',
  'docs/ipv6-parse-api.js',
  'docs/ipv6-parse-api.d.ts',
  'docs/index.html',
  'docs/README.md',
  'index.js',
  'index.d.ts',
  'package.json',
  'README.md',
  'README_WASM.md',
  'README_NPM.md'
];

console.log('Checking required files...');
for (const file of requiredFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`  ✓ ${file} (${sizeKB} KB)`);
  } else {
    console.error(`  ✗ Missing: ${file}`);
    errors++;
  }
}

// Check WASM module contents
console.log('\nValidating WASM module...');
const wasmPath = path.join(__dirname, '../docs/ipv6-parse.js');
if (fs.existsSync(wasmPath)) {
  const content = fs.readFileSync(wasmPath, 'utf8');

  // Check for Emscripten exports
  const requiredExports = [
    'createIPv6Module',
    'UTF8ToString',
    'ccall'
  ];

  for (const exp of requiredExports) {
    if (content.includes(exp)) {
      console.log(`  ✓ Export: ${exp}`);
    } else {
      console.error(`  ✗ Missing export: ${exp}`);
      errors++;
    }
  }

  // Check for WASM functions
  const requiredFunctions = [
    'ipv6_parse_full',
    'ipv6_compare_str',
    'ipv6_version',
    'ipv6_result_size'
  ];

  for (const func of requiredFunctions) {
    if (content.includes(func)) {
      console.log(`  ✓ Function: ${func}`);
    } else {
      console.error(`  ✗ Missing function: ${func}`);
      errors++;
    }
  }
} else {
  console.error('  ✗ WASM module not found');
  errors++;
}

// Check API layer
console.log('\nValidating API layer...');
const apiPath = path.join(__dirname, '../docs/ipv6-parse-api.js');
if (fs.existsSync(apiPath)) {
  const content = fs.readFileSync(apiPath, 'utf8');

  const requiredClasses = [
    'class IPv6Parser',
    'class IPv6Address',
    'class IPv6ParseError'
  ];

  for (const cls of requiredClasses) {
    if (content.includes(cls)) {
      console.log(`  ✓ ${cls}`);
    } else {
      console.error(`  ✗ Missing: ${cls}`);
      errors++;
    }
  }

  const requiredMethods = [
    'parse(',
    'tryParse(',
    'isValid(',
    'equals(',
    'getVersion('
  ];

  for (const method of requiredMethods) {
    if (content.includes(method)) {
      console.log(`  ✓ Method: ${method}`);
    } else {
      console.error(`  ✗ Missing method: ${method}`);
      errors++;
    }
  }
} else {
  console.error('  ✗ API layer not found');
  errors++;
}

// Check TypeScript definitions
console.log('\nValidating TypeScript definitions...');
const dtsFiles = [
  'docs/ipv6-parse-api.d.ts',
  'index.d.ts'
];

for (const file of dtsFiles) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');

    const requiredTypes = [
      'interface IPv6Address',
      'class IPv6ParseError',
      'interface ComparisonOptions'
    ];

    let fileErrors = 0;
    for (const type of requiredTypes) {
      if (content.includes(type)) {
        console.log(`  ✓ ${file}: ${type}`);
      } else {
        console.error(`  ✗ ${file}: Missing ${type}`);
        fileErrors++;
      }
    }

    if (fileErrors === 0) {
      console.log(`  ✓ ${file} is valid`);
    } else {
      errors += fileErrors;
    }
  } else {
    console.error(`  ✗ ${file} not found`);
    errors++;
  }
}

// Check package.json
console.log('\nValidating package.json...');
const pkgPath = path.join(__dirname, '../package.json');
if (fs.existsSync(pkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  const requiredFields = ['name', 'version', 'main', 'types', 'scripts'];
  for (const field of requiredFields) {
    if (pkg[field]) {
      console.log(`  ✓ Field: ${field}`);
    } else {
      console.error(`  ✗ Missing field: ${field}`);
      errors++;
    }
  }

  // Check scripts
  const requiredScripts = ['test', 'build', 'lint'];
  for (const script of requiredScripts) {
    if (pkg.scripts && pkg.scripts[script]) {
      console.log(`  ✓ Script: ${script}`);
    } else {
      console.error(`  ✗ Missing script: ${script}`);
      errors++;
    }
  }

  // Check files array
  if (pkg.files && Array.isArray(pkg.files)) {
    console.log(`  ✓ Files array: ${pkg.files.length} entries`);
  } else {
    console.error('  ✗ Missing or invalid files array');
    errors++;
  }
} else {
  console.error('  ✗ package.json not found');
  errors++;
}

// Check demo page
console.log('\nValidating demo page...');
const demoPath = path.join(__dirname, '../docs/index.html');
if (fs.existsSync(demoPath)) {
  const content = fs.readFileSync(demoPath, 'utf8');

  const requiredElements = [
    'ipv6-parse.js',
    'ipv6-parse-api.js',
    'IPv6Parser',
    '<input',
    '<button'
  ];

  for (const elem of requiredElements) {
    if (content.includes(elem)) {
      console.log(`  ✓ Contains: ${elem}`);
    } else {
      console.error(`  ✗ Missing: ${elem}`);
      warnings++;
    }
  }
} else {
  console.error('  ✗ demo page not found');
  warnings++;
}

// Summary
console.log('\n========================');
if (errors === 0 && warnings === 0) {
  console.log('✓ Build validation passed!');
  console.log('All required files and components are present.');
} else {
  console.log(`Errors: ${errors}`);
  console.log(`Warnings: ${warnings}`);
  if (errors > 0) {
    console.log('\n✗ Build validation failed!');
  } else {
    console.log('\n⚠ Build validation passed with warnings');
  }
}
console.log('========================\n');

process.exit(errors > 0 ? 1 : 0);
