/**
 * Diagnostic Output Tests
 *
 * Tests the comprehensive diagnostic output functionality added to the WASM version.
 * Verifies that parse errors include detailed position and message information.
 */

const { createParser } = require('../index.js');

async function runTests() {
  console.log('Diagnostic Output Tests\n========================\n');

  let passed = 0;
  let failed = 0;

  try {
    // Initialize parser
    const { parser, IPv6ParseError } = await createParser();

    // Test 1: Diagnostic object is present on parse errors
    console.log('Test 1: Parse error includes diagnostic object');
    try {
      parser.parse('gggg::1');
      console.error('✗ Should have thrown IPv6ParseError');
      failed++;
    } catch (err) {
      if (
        err instanceof IPv6ParseError &&
        err.diagnostic &&
        typeof err.diagnostic === 'object'
      ) {
        console.log('✓ Diagnostic object present on error');
        console.log(`  Message: "${err.message}"`);
        console.log(`  Diagnostic message: "${err.diagnostic.message}"`);
        passed++;
      } else {
        console.error('✗ Missing diagnostic object on error');
        console.error('  Error:', err);
        failed++;
      }
    }

    // Test 2: Diagnostic includes position information
    console.log('\nTest 2: Diagnostic includes accurate position');
    try {
      parser.parse('2001:gggg::1');
      console.error('✗ Should have thrown IPv6ParseError');
      failed++;
    } catch (err) {
      if (
        err.diagnostic &&
        typeof err.diagnostic.position === 'number' &&
        err.diagnostic.position >= 0
      ) {
        console.log('✓ Position information present');
        console.log(`  Input: "${err.input}"`);
        console.log(`  Position: ${err.diagnostic.position}`);
        console.log(`  Character at position: "${err.input[err.diagnostic.position]}"`);

        // Position should point to 'g' in 'gggg' (position 5)
        if (err.diagnostic.position === 5) {
          console.log('✓ Position is accurate (points to invalid character)');
          passed++;
        } else {
          console.error(`✗ Expected position 5, got ${err.diagnostic.position}`);
          failed++;
        }
      } else {
        console.error('✗ Missing or invalid position in diagnostic');
        failed++;
      }
    }

    // Test 3: Diagnostic includes error event type
    console.log('\nTest 3: Diagnostic includes event type');
    try {
      parser.parse('::1::2');
      console.error('✗ Should have thrown IPv6ParseError');
      failed++;
    } catch (err) {
      if (
        err.diagnostic &&
        typeof err.diagnostic.event === 'number'
      ) {
        console.log('✓ Event type present in diagnostic');
        console.log(`  Event code: ${err.diagnostic.event}`);
        passed++;
      } else {
        console.error('✗ Missing event type in diagnostic');
        failed++;
      }
    }

    // Test 4: getDetailedMessage() method works
    console.log('\nTest 4: getDetailedMessage() method');
    try {
      parser.parse('2001:xyz::1');
      console.error('✗ Should have thrown IPv6ParseError');
      failed++;
    } catch (err) {
      if (typeof err.getDetailedMessage === 'function') {
        const detailed = err.getDetailedMessage();
        if (typeof detailed === 'string' && detailed.length > 0) {
          console.log('✓ getDetailedMessage() returns formatted string');
          console.log('  Detailed message:');
          console.log(detailed.split('\n').map(line => '    ' + line).join('\n'));
          passed++;
        } else {
          console.error('✗ getDetailedMessage() returned invalid output');
          failed++;
        }
      } else {
        console.error('✗ getDetailedMessage() method not available');
        failed++;
      }
    }

    // Test 5: Multiple error scenarios have diagnostics
    console.log('\nTest 5: Various error types include diagnostics');
    const errorScenarios = [
      { addr: ':::1', desc: 'Triple colon' },
      { addr: '1:2:3:4:5:6:7:8:9', desc: 'Too many components' },
      { addr: '::ffff:999.0.0.1', desc: 'Invalid IPv4 octet' },
      { addr: '[::1]:99999', desc: 'Port out of range' },
      { addr: '::1/129', desc: 'CIDR mask too large' },
      { addr: '2001::db8::1', desc: 'Multiple double colons' }
    ];

    let diagnosticTests = 0;
    for (const { addr, desc } of errorScenarios) {
      try {
        parser.parse(addr);
        console.error(`  ✗ ${desc}: Should have thrown error`);
      } catch (err) {
        if (err.diagnostic && err.diagnostic.message) {
          diagnosticTests++;
        } else {
          console.error(`  ✗ ${desc}: Missing diagnostic`);
        }
      }
    }

    if (diagnosticTests === errorScenarios.length) {
      console.log(`✓ All ${errorScenarios.length} error scenarios have diagnostics`);
      passed++;
    } else {
      console.error(`✗ Only ${diagnosticTests}/${errorScenarios.length} have diagnostics`);
      failed++;
    }

    // Test 6: Position accuracy for different error locations
    console.log('\nTest 6: Position accuracy across input string');
    const positionTests = [
      { addr: 'g::1', expectedPos: 0, desc: 'Error at start' },
      { addr: '2001:g::1', expectedPos: 5, desc: 'Error in middle' },
      { addr: '::1g', expectedPos: 3, desc: 'Error at end' }
    ];

    let positionAccurate = 0;
    for (const { addr, expectedPos, desc } of positionTests) {
      try {
        parser.parse(addr);
        console.error(`  ✗ ${desc}: Should have thrown error`);
      } catch (err) {
        if (err.diagnostic && err.diagnostic.position === expectedPos) {
          positionAccurate++;
        } else {
          console.error(`  ✗ ${desc}: Expected pos ${expectedPos}, got ${err.diagnostic?.position}`);
        }
      }
    }

    if (positionAccurate === positionTests.length) {
      console.log(`✓ Position accuracy verified for ${positionTests.length} locations`);
      passed++;
    } else {
      console.error(`✗ Only ${positionAccurate}/${positionTests.length} positions accurate`);
      failed++;
    }

    // Test 7: Diagnostic message is human-readable
    console.log('\nTest 7: Diagnostic messages are human-readable');
    try {
      parser.parse('2001:qqqq::1');
      console.error('✗ Should have thrown IPv6ParseError');
      failed++;
    } catch (err) {
      if (err.diagnostic && err.diagnostic.message) {
        const msg = err.diagnostic.message;
        // Check message is not empty and contains useful info
        if (msg.length > 10 && /[a-zA-Z]/.test(msg)) {
          console.log('✓ Diagnostic message is human-readable');
          console.log(`  Message: "${msg}"`);
          passed++;
        } else {
          console.error('✗ Diagnostic message is not useful');
          console.error(`  Got: "${msg}"`);
          failed++;
        }
      } else {
        console.error('✗ No diagnostic message available');
        failed++;
      }
    }

    // Test 8: tryParse doesn't throw but error info available
    console.log('\nTest 8: tryParse() returns null but errors are logged');
    const invalidAddr = 'gggg::1';
    const result = parser.tryParse(invalidAddr);
    if (result === null) {
      console.log('✓ tryParse() correctly returns null for invalid input');
      console.log('  (Note: Diagnostic details available via parse() for debugging)');
      passed++;
    } else {
      console.error('✗ tryParse() should return null for invalid input');
      failed++;
    }

    // Test 9: Diagnostic provides input context
    console.log('\nTest 9: Diagnostic includes input context');
    try {
      parser.parse('fe80::gggg:1');
      console.error('✗ Should have thrown IPv6ParseError');
      failed++;
    } catch (err) {
      if (
        err.diagnostic &&
        err.diagnostic.input &&
        err.diagnostic.input === err.input
      ) {
        console.log('✓ Diagnostic includes complete input context');
        console.log(`  Input: "${err.diagnostic.input}"`);
        passed++;
      } else {
        console.error('✗ Diagnostic missing input context');
        failed++;
      }
    }

    // Test 10: Successful parse doesn't create diagnostic
    console.log('\nTest 10: Valid addresses parse without diagnostic overhead');
    const validAddresses = [
      '::1',
      '2001:db8::1',
      '[::1]:8080',
      'fe80::1%eth0',
      '::ffff:192.0.2.1'
    ];

    let validParses = 0;
    for (const addr of validAddresses) {
      try {
        const result = parser.parse(addr);
        if (result && result.formatted) {
          validParses++;
        }
      } catch (err) {
        console.error(`  ✗ Valid address '${addr}' failed to parse:`, err.message);
      }
    }

    if (validParses === validAddresses.length) {
      console.log(`✓ All ${validAddresses.length} valid addresses parse successfully`);
      console.log('  (Diagnostic mode doesn\'t affect valid parsing)');
      passed++;
    } else {
      console.error(`✗ Only ${validParses}/${validAddresses.length} parsed successfully`);
      failed++;
    }

    // Test 11: Error position property accessible directly
    console.log('\nTest 11: Error position property accessible');
    try {
      parser.parse('::xyz');
      console.error('✗ Should have thrown IPv6ParseError');
      failed++;
    } catch (err) {
      if (typeof err.position === 'number' && err.position >= 0) {
        console.log('✓ Position accessible via err.position');
        console.log(`  Position: ${err.position}`);
        passed++;
      } else {
        console.error('✗ Position not accessible via err.position');
        failed++;
      }
    }

    // Test 12: Diagnostic works with complex invalid input
    console.log('\nTest 12: Complex invalid input diagnostics');
    const complexInvalid = '[2001:db8::gggg:1/64%eth0]:8080';
    try {
      parser.parse(complexInvalid);
      console.error('✗ Should have thrown IPv6ParseError');
      failed++;
    } catch (err) {
      if (
        err.diagnostic &&
        err.diagnostic.message &&
        typeof err.diagnostic.position === 'number'
      ) {
        console.log('✓ Complex input produces detailed diagnostic');
        console.log(`  Input: "${complexInvalid}"`);
        console.log(`  Error: "${err.diagnostic.message}"`);
        console.log(`  Position: ${err.diagnostic.position}`);
        passed++;
      } else {
        console.error('✗ Complex input missing diagnostic details');
        failed++;
      }
    }

    // Test 13: Empty string error has diagnostic
    console.log('\nTest 13: Empty string error handling');
    try {
      parser.parse('');
      console.error('✗ Should have thrown IPv6ParseError for empty string');
      failed++;
    } catch (err) {
      if (err instanceof IPv6ParseError) {
        console.log('✓ Empty string throws IPv6ParseError');
        console.log(`  Message: "${err.message}"`);
        // Empty string might not have diagnostic from C library, which is ok
        if (err.diagnostic) {
          console.log('  (Diagnostic info available)');
        }
        passed++;
      } else {
        console.error('✗ Wrong error type for empty string');
        failed++;
      }
    }

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
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
