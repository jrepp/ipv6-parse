/**
 * WASM module validation tests
 * Tests the WASM module directly without the Node.js wrapper
 */

const path = require('path');

// Load WASM module
const createIPv6Module = require(path.join(__dirname, '../docs/ipv6-parse.js'));

async function runTests() {
  console.log('WASM Module Validation Tests\n=============================\n');

  let passed = 0;
  let failed = 0;

  try {
    // Initialize WASM module
    console.log('Initializing WASM module...');
    const Module = await createIPv6Module();
    console.log('✓ WASM module initialized\n');

    // Test 1: Check exported functions
    console.log('Test 1: Checking exported functions...');
    const requiredFunctions = [
      'ccall',
      'cwrap',
      'UTF8ToString',
      '_malloc',
      '_free'
    ];

    for (const func of requiredFunctions) {
      if (typeof Module[func] !== 'function') {
        console.error(`✗ Missing function: ${func}`);
        failed++;
      }
    }

    if (failed === 0) {
      console.log('✓ All required functions exported');
      passed++;
    }

    // Test 2: Call ipv6_parse_full
    console.log('\nTest 2: Testing ipv6_parse_full...');
    try {
      const resultSize = 80; // sizeof(ipv6_parse_result_t)
      const resultPtr = Module._malloc(resultSize);

      const success = Module.ccall(
        'ipv6_parse_full',
        'number',
        ['string', 'number'],
        ['2001:db8::1', resultPtr]
      );

      if (success === 1) {
        console.log('✓ ipv6_parse_full succeeded');
        passed++;
      } else {
        console.error('✗ ipv6_parse_full failed');
        failed++;
      }

      Module._free(resultPtr);
    } catch (err) {
      console.error('✗ Error calling ipv6_parse_full:', err.message);
      failed++;
    }

    // Test 3: Call ipv6_compare_str
    console.log('\nTest 3: Testing ipv6_compare_str...');
    try {
      const result = Module.ccall(
        'ipv6_compare_str',
        'number',
        ['string', 'string', 'number'],
        ['::1', '0:0:0:0:0:0:0:1', 0]
      );

      if (result === 0) {
        console.log('✓ ipv6_compare_str succeeded');
        passed++;
      } else {
        console.error('✗ ipv6_compare_str returned:', result);
        failed++;
      }
    } catch (err) {
      console.error('✗ Error calling ipv6_compare_str:', err.message);
      failed++;
    }

    // Test 4: Call ipv6_version
    console.log('\nTest 4: Testing ipv6_version...');
    try {
      const version = Module.ccall('ipv6_version', 'string', [], []);

      if (version && version.includes('wasm')) {
        console.log(`✓ ipv6_version succeeded: ${version}`);
        passed++;
      } else {
        console.error('✗ ipv6_version returned unexpected value:', version);
        failed++;
      }
    } catch (err) {
      console.error('✗ Error calling ipv6_version:', err.message);
      failed++;
    }

    // Test 5: Call ipv6_result_size
    console.log('\nTest 5: Testing ipv6_result_size...');
    try {
      const size = Module.ccall('ipv6_result_size', 'number', [], []);

      // Structure size should be 92 bytes (with padding):
      // - components: 16 bytes (8 * uint16_t)
      // - port: 2 bytes
      // - pad0: 2 bytes (alignment)
      // - mask: 4 bytes
      // - flags: 4 bytes
      // - formatted: 48 bytes
      // - zone: 16 bytes
      if (size === 92) {
        console.log(`✓ ipv6_result_size succeeded: ${size} bytes`);
        passed++;
      } else {
        console.error('✗ ipv6_result_size returned unexpected value:', size, '(expected 92)');
        failed++;
      }
    } catch (err) {
      console.error('✗ Error calling ipv6_result_size:', err.message);
      failed++;
    }

    // Test 6: Parse multiple formats
    console.log('\nTest 6: Testing various address formats...');
    const testAddresses = [
      '::1',
      '2001:db8::1',
      '[::1]:8080',
      'fe80::1%eth0',
      '2001:db8::1/64',
      '::ffff:192.0.2.1'
    ];

    let formatTests = 0;
    for (const addr of testAddresses) {
      const resultPtr = Module._malloc(80);
      const success = Module.ccall(
        'ipv6_parse_full',
        'number',
        ['string', 'number'],
        [addr, resultPtr]
      );

      if (success === 1) {
        formatTests++;
      } else {
        console.error(`  ✗ Failed to parse: ${addr}`);
      }

      Module._free(resultPtr);
    }

    if (formatTests === testAddresses.length) {
      console.log(`✓ All ${testAddresses.length} address formats parsed successfully`);
      passed++;
    } else {
      console.error(`✗ Only ${formatTests}/${testAddresses.length} formats parsed`);
      failed++;
    }

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }

  // Summary
  console.log('\n=============================');
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  console.log('=============================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
