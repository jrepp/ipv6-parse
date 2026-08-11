/**
 * JavaScript API layer validation tests
 * Tests the high-level API (IPv6Parser, IPv6Address classes)
 */

const fs = require('fs');
const path = require('path');

// Load WASM module and API
const createIPv6Module = require(path.join(__dirname, '../docs/ipv6-parse.js'));

// Load API layer code
const apiCode = fs.readFileSync(
  path.join(__dirname, '../docs/ipv6-parse-api.js'),
  'utf8'
);

async function runTests() {
  console.log('JavaScript API Layer Tests\n===========================\n');

  let passed = 0;
  let failed = 0;

  try {
    // Initialize WASM module
    console.log('Initializing WASM module and API layer...');
    const wasmModule = await createIPv6Module();

    // Execute API layer code in context
    const context = { module: { exports: {} }, Module: wasmModule };
    const apiFunc = new Function('module', 'Module', apiCode + '\nreturn module.exports;');
    const api = apiFunc(context.module, wasmModule);

    const { IPv6Parser, IPv6Address, IPv6ParseError } = api;
    const parser = new IPv6Parser(wasmModule);

    console.log('✓ API layer initialized\n');

    // Test 1: Check class exports
    console.log('Test 1: Checking exported classes...');
    if (typeof IPv6Parser === 'function' &&
        typeof IPv6Address === 'function' &&
        typeof IPv6ParseError === 'function') {
      console.log('✓ All classes exported correctly');
      passed++;
    } else {
      console.error('✗ Missing class exports');
      failed++;
    }

    // Test 2: Parse basic address
    console.log('\nTest 2: Testing parser.parse()...');
    try {
      const addr = parser.parse('2001:db8::1');
      if (addr.formatted === '2001:db8::1' &&
          addr.components[0] === 0x2001 &&
          addr.components[1] === 0x0db8) {
        console.log('✓ Basic parsing works');
        passed++;
      } else {
        console.error('✗ Parsed data mismatch');
        failed++;
      }
    } catch (err) {
      console.error('✗ Parse failed:', err.message);
      failed++;
    }

    // Test 3: Parse with port
    console.log('\nTest 3: Testing port parsing...');
    try {
      const addr = parser.parse('[::1]:8080');
      if (addr.port === 8080 && addr.hasPort === true) {
        console.log('✓ Port parsing works');
        passed++;
      } else {
        console.error('✗ Port data mismatch');
        failed++;
      }
    } catch (err) {
      console.error('✗ Port parse failed:', err.message);
      failed++;
    }

    // Test 4: Parse with CIDR
    console.log('\nTest 4: Testing CIDR mask parsing...');
    try {
      const addr = parser.parse('2001:db8::1/64');
      if (addr.mask === 64 && addr.hasMask === true) {
        console.log('✓ CIDR mask parsing works');
        passed++;
      } else {
        console.error('✗ CIDR mask mismatch');
        failed++;
      }
    } catch (err) {
      console.error('✗ CIDR parse failed:', err.message);
      failed++;
    }

    // Test 5: Parse with zone ID
    console.log('\nTest 5: Testing zone ID parsing...');
    try {
      const addr = parser.parse('fe80::1%eth0');
      if (addr.zone === 'eth0') {
        console.log('✓ Zone ID parsing works');
        passed++;
      } else {
        console.error('✗ Zone ID mismatch');
        failed++;
      }
    } catch (err) {
      console.error('✗ Zone parse failed:', err.message);
      failed++;
    }

    // Test 6: Error handling
    console.log('\nTest 6: Testing error handling...');
    try {
      parser.parse('invalid-address');
      console.error('✗ Should have thrown error');
      failed++;
    } catch (err) {
      if (err instanceof IPv6ParseError) {
        console.log('✓ Error handling works');
        passed++;
      } else {
        console.error('✗ Wrong error type:', err.constructor.name);
        failed++;
      }
    }

    // Test 7: tryParse (null on error)
    console.log('\nTest 7: Testing tryParse()...');
    const result = parser.tryParse('invalid-address');
    if (result === null) {
      console.log('✓ tryParse returns null on error');
      passed++;
    } else {
      console.error('✗ tryParse should return null');
      failed++;
    }

    // Test 8: isValid
    console.log('\nTest 8: Testing isValid()...');
    const valid = parser.isValid('2001:db8::1');
    const invalid = parser.isValid('invalid');
    if (valid === true && invalid === false) {
      console.log('✓ isValid works correctly');
      passed++;
    } else {
      console.error('✗ isValid returned wrong values');
      failed++;
    }

    // Test 9: equals
    console.log('\nTest 9: Testing equals()...');
    const equal = parser.equals('::1', '0:0:0:0:0:0:0:1');
    if (equal === true) {
      console.log('✓ equals works correctly');
      passed++;
    } else {
      console.error('✗ equals returned false for equal addresses');
      failed++;
    }

    // Test 10: equals with ignorePort
    console.log('\nTest 10: Testing equals() with ignorePort...');
    const equalIgnorePort = parser.equals('[::1]:80', '[::1]:443', { ignorePort: true });
    if (equalIgnorePort === true) {
      console.log('✓ equals with ignorePort works');
      passed++;
    } else {
      console.error('✗ equals should ignore port');
      failed++;
    }

    // Test 11: IPv6Address methods
    console.log('\nTest 11: Testing IPv6Address methods...');
    try {
      const addr = parser.parse('2001:db8::1');
      const json = addr.toJSON();
      const str = addr.toString();
      const hex = addr.getComponentHex(0);

      if (typeof json === 'object' &&
          str === '2001:db8::1' &&
          hex === '2001') {
        console.log('✓ IPv6Address methods work');
        passed++;
      } else {
        console.error('✗ IPv6Address methods returned unexpected values');
        failed++;
      }
    } catch (err) {
      console.error('✗ IPv6Address methods failed:', err.message);
      failed++;
    }

    // Test 12: Immutability
    console.log('\nTest 12: Testing IPv6Address immutability...');
    try {
      const addr = parser.parse('2001:db8::1');
      const originalFormatted = addr.formatted;

      try {
        addr.formatted = 'modified';
      } catch {
        // Expected to fail in strict mode
      }

      if (addr.formatted === originalFormatted) {
        console.log('✓ IPv6Address is immutable');
        passed++;
      } else {
        console.error('✗ IPv6Address should be immutable');
        failed++;
      }
    } catch (err) {
      console.error('✗ Immutability test failed:', err.message);
      failed++;
    }

    // Test 13: getVersion
    console.log('\nTest 13: Testing getVersion()...');
    try {
      const version = parser.getVersion();
      if (version && version.includes('wasm')) {
        console.log(`✓ getVersion works: ${version}`);
        passed++;
      } else {
        console.error('✗ getVersion returned unexpected value');
        failed++;
      }
    } catch (err) {
      console.error('✗ getVersion failed:', err.message);
      failed++;
    }

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }

  // Summary
  console.log('\n===========================');
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  console.log('===========================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
