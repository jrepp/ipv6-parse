/**
 * Basic Node.js test for ipv6-parse NPM package
 */

const ipv6 = require('../index.js');

async function runTests() {
  console.log('IPv6-Parse Node.js Tests\n========================\n');

  let passed = 0;
  let failed = 0;

  // Test 1: Basic IPv6 parsing
  try {
    const addr = await ipv6.parse('2001:db8::1');
    console.assert(addr.formatted === '2001:db8::1', 'Test 1 failed: formatted address mismatch');
    console.assert(addr.components[0] === 0x2001, 'Test 1 failed: component mismatch');
    console.log('✓ Test 1: Basic IPv6 parsing');
    passed++;
  } catch (err) {
    console.error('✗ Test 1 failed:', err.message);
    failed++;
  }

  // Test 2: IPv6 with port
  try {
    const addr = await ipv6.parse('[::1]:8080');
    console.assert(addr.port === 8080, 'Test 2 failed: port mismatch');
    console.assert(addr.hasPort === true, 'Test 2 failed: hasPort mismatch');
    console.log('✓ Test 2: IPv6 with port');
    passed++;
  } catch (err) {
    console.error('✗ Test 2 failed:', err.message);
    failed++;
  }

  // Test 3: IPv6 with CIDR
  try {
    const addr = await ipv6.parse('2001:db8::1/64');
    console.assert(addr.mask === 64, 'Test 3 failed: mask mismatch');
    console.assert(addr.hasMask === true, 'Test 3 failed: hasMask mismatch');
    console.log('✓ Test 3: IPv6 with CIDR');
    passed++;
  } catch (err) {
    console.error('✗ Test 3 failed:', err.message);
    failed++;
  }

  // Test 4: Validation
  try {
    const valid = await ipv6.isValid('2001:db8::1');
    const invalid = await ipv6.isValid('invalid');
    console.assert(valid === true, 'Test 4 failed: valid check failed');
    console.assert(invalid === false, 'Test 4 failed: invalid check failed');
    console.log('✓ Test 4: Validation');
    passed++;
  } catch (err) {
    console.error('✗ Test 4 failed:', err.message);
    failed++;
  }

  // Test 5: Try parse (null on error)
  try {
    const result = await ipv6.tryParse('invalid');
    console.assert(result === null, 'Test 5 failed: should return null');
    console.log('✓ Test 5: Try parse with invalid input');
    passed++;
  } catch (err) {
    console.error('✗ Test 5 failed:', err.message);
    failed++;
  }

  // Test 6: Comparison
  try {
    const equal = await ipv6.equals('::1', '0:0:0:0:0:0:0:1');
    console.assert(equal === true, 'Test 6 failed: addresses should be equal');
    console.log('✓ Test 6: Address comparison');
    passed++;
  } catch (err) {
    console.error('✗ Test 6 failed:', err.message);
    failed++;
  }

  // Test 7: Comparison with options
  try {
    const equal = await ipv6.equals('[::1]:80', '[::1]:443', { ignorePort: true });
    console.assert(equal === true, 'Test 7 failed: should be equal ignoring port');
    console.log('✓ Test 7: Comparison with ignore options');
    passed++;
  } catch (err) {
    console.error('✗ Test 7 failed:', err.message);
    failed++;
  }

  // Test 8: Version
  try {
    const version = await ipv6.getVersion();
    console.assert(typeof version === 'string', 'Test 8 failed: version should be string');
    console.assert(version.includes('wasm'), 'Test 8 failed: version should include "wasm"');
    console.log(`✓ Test 8: Get version (${version})`);
    passed++;
  } catch (err) {
    console.error('✗ Test 8 failed:', err.message);
    failed++;
  }

  // Summary
  console.log('\n========================');
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  console.log('========================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
