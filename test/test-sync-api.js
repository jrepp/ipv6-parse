/**
 * Sync API Tests
 *
 * Tests that verify the synchronous API works correctly after initialization.
 */

const { createParser, getParser, getAPI } = require('../index.js');

async function runTests() {
  console.log('Sync API Tests\n==============\n');

  let passed = 0;
  let failed = 0;

  try {
    // Test 1: createParser returns sync methods
    console.log('Test 1: createParser() returns parser with sync methods');
    const { parser, IPv6ParseError } = await createParser();

    const addr = parser.parse('2001:db8::1');
    if (addr.formatted === '2001:db8::1') {
      console.log('✓ parser.parse() works synchronously');
      passed++;
    } else {
      console.error('✗ parser.parse() returned incorrect result');
      failed++;
    }

    // Test 2: Verify sync operations don't return promises
    console.log('\nTest 2: Sync operations return values, not promises');
    const result = parser.parse('::1');
    if (!(result instanceof Promise)) {
      console.log('✓ parser.parse() returns value (not promise)');
      passed++;
    } else {
      console.error('✗ parser.parse() incorrectly returns promise');
      failed++;
    }

    // Test 3: All parser methods are sync
    console.log('\nTest 3: All parser methods are synchronous');
    const valid = parser.isValid('::1');
    const tried = parser.tryParse('invalid');
    const version = parser.getVersion();
    const equal = parser.equals('::1', '0:0:0:0:0:0:0:1');

    if (
      typeof valid === 'boolean' &&
      tried === null &&
      typeof version === 'string' &&
      typeof equal === 'boolean'
    ) {
      console.log('✓ All parser methods return sync values');
      passed++;
    } else {
      console.error('✗ Some parser methods returned incorrect types');
      failed++;
    }

    // Test 4: getParser() returns sync parser
    console.log('\nTest 4: getParser() returns initialized parser');
    const parser2 = getParser();
    const addr2 = parser2.parse('fe80::1');
    if (addr2.formatted === 'fe80::1') {
      console.log('✓ getParser() works correctly');
      passed++;
    } else {
      console.error('✗ getParser() returned incorrect result');
      failed++;
    }

    // Test 5: getAPI() returns sync functional API
    console.log('\nTest 5: getAPI() returns sync functional API');
    const ipv6Sync = getAPI();
    const addr3 = ipv6Sync.parse('192.168.1.1');
    if (addr3.formatted === '192.168.1.1') {
      console.log('✓ getAPI() works correctly');
      passed++;
    } else {
      console.error('✗ getAPI() returned incorrect result');
      failed++;
    }

    // Test 6: Performance - sync operations should be fast
    console.log('\nTest 6: Sync operations performance');
    const iterations = 10000;
    const start = Date.now();

    for (let i = 0; i < iterations; i++) {
      parser.parse('2001:db8::1');
    }

    const duration = Date.now() - start;
    const opsPerSec = Math.floor(iterations / (duration / 1000));

    console.log(`  ${iterations} parses in ${duration}ms`);
    console.log(`  ${opsPerSec.toLocaleString()} ops/sec`);

    if (opsPerSec > 50000) {
      console.log('✓ Sync operations are performant');
      passed++;
    } else {
      console.error('✗ Sync operations are slower than expected');
      failed++;
    }

    // Test 7: Error handling in sync mode
    console.log('\nTest 7: Error handling in sync mode');
    try {
      parser.parse('invalid');
      console.error('✗ Should have thrown IPv6ParseError');
      failed++;
    } catch (err) {
      if (err instanceof IPv6ParseError && err.input === 'invalid') {
        console.log('✓ Sync error handling works correctly');
        passed++;
      } else {
        console.error('✗ Wrong error type or details');
        failed++;
      }
    }

    // Test 8: tryParse in sync mode
    console.log('\nTest 8: tryParse() in sync mode');
    const nullResult = parser.tryParse('definitely not valid');
    const validResult = parser.tryParse('::1');

    if (nullResult === null && validResult !== null && validResult.formatted === '::1') {
      console.log('✓ tryParse() works correctly in sync mode');
      passed++;
    } else {
      console.error('✗ tryParse() returned incorrect results');
      failed++;
    }

    // Test 9: Complex address parsing in sync mode
    console.log('\nTest 9: Complex address parsing in sync mode');
    const complex = parser.parse('[2001:db8::1/64%eth0]:443');

    if (
      complex.formatted === '[2001:db8::1/64%eth0]:443' &&  // Full round-trip format
      complex.mask === 64 &&
      complex.zone === 'eth0' &&
      complex.port === 443 &&
      complex.components[0] === 0x2001 &&
      complex.components[1] === 0x0db8
    ) {
      console.log('✓ Complex address parsing works in sync mode');
      passed++;
    } else {
      console.error('✗ Complex address parsing failed');
      console.error('  Expected: [2001:db8::1/64%eth0]:443, mask=64, zone=eth0, port=443');
      console.error(`  Got: ${complex.formatted}, mask=${complex.mask}, zone=${complex.zone}, port=${complex.port}`);
      failed++;
    }

    // Test 10: getParser() throws if not initialized
    console.log('\nTest 10: getParser() throws if called before init');
    // This requires a fresh require without initialization
    // We'll skip this test in the current context since we're already initialized
    console.log('⊘ Skipped (already initialized in this context)');

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }

  // Summary
  console.log('\n==============');
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  console.log('==============\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
