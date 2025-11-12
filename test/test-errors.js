/**
 * Error Diagnostic Tests
 *
 * Tests comprehensive error handling and diagnostic information
 * for the JavaScript API layer.
 */

const { createParser } = require('../index.js');

async function runTests() {
  console.log('Error Diagnostic Tests\n======================\n');

  let passed = 0;
  let failed = 0;

  try {
    // Initialize parser
    const { parser, IPv6ParseError } = await createParser();

    // Test 1: Empty string
    console.log('Test 1: Empty string error');
    try {
      parser.parse('');
      console.error('✗ Should have thrown IPv6ParseError for empty string');
      failed++;
    } catch (err) {
      if (err instanceof IPv6ParseError && err.input === '') {
        console.log('✓ Empty string error handled correctly');
        console.log(`  Message: "${err.message}"`);
        passed++;
      } else {
        console.error('✗ Wrong error type or missing input property');
        failed++;
      }
    }

    // Test 2: Invalid characters
    console.log('\nTest 2: Invalid character errors');
    const invalidChars = [
      'gggg::1',           // Invalid hex character
      '2001:db8::xyz',     // Invalid characters in component
      '::1@invalid',       // Invalid character
      '2001:db8::1#bad'   // Invalid character
    ];

    let invalidCharTests = 0;
    for (const addr of invalidChars) {
      try {
        parser.parse(addr);
        console.error(`  ✗ Should have thrown for: ${addr}`);
      } catch (err) {
        if (err instanceof IPv6ParseError && err.input === addr) {
          invalidCharTests++;
        } else {
          console.error(`  ✗ Wrong error for: ${addr}`);
        }
      }
    }

    if (invalidCharTests === invalidChars.length) {
      console.log(`✓ All ${invalidChars.length} invalid character errors handled`);
      passed++;
    } else {
      console.error(`✗ Only ${invalidCharTests}/${invalidChars.length} handled correctly`);
      failed++;
    }

    // Test 3: Too many components
    console.log('\nTest 3: Too many components error');
    try {
      parser.parse('1:2:3:4:5:6:7:8:9');
      console.error('✗ Should have thrown for too many components');
      failed++;
    } catch (err) {
      if (err instanceof IPv6ParseError && err.input === '1:2:3:4:5:6:7:8:9') {
        console.log('✓ Too many components error handled');
        console.log(`  Message: "${err.message}"`);
        passed++;
      } else {
        console.error('✗ Wrong error details');
        failed++;
      }
    }

    // Test 4: Invalid double colon usage
    console.log('\nTest 4: Invalid double colon errors');
    const invalidDoubleColon = [
      '::1::2',           // Multiple double colons
      ':::1',             // Triple colon
      '2001::db8::1'     // Multiple double colons
    ];

    let doubleColonTests = 0;
    for (const addr of invalidDoubleColon) {
      try {
        parser.parse(addr);
        console.error(`  ✗ Should have thrown for: ${addr}`);
      } catch (err) {
        if (err instanceof IPv6ParseError) {
          doubleColonTests++;
        }
      }
    }

    if (doubleColonTests === invalidDoubleColon.length) {
      console.log(`✓ All ${invalidDoubleColon.length} double colon errors handled`);
      passed++;
    } else {
      console.error(`✗ Only ${doubleColonTests}/${invalidDoubleColon.length} handled correctly`);
      failed++;
    }

    // Test 5: Invalid port errors
    console.log('\nTest 5: Invalid port errors');
    const invalidPorts = [
      '[::1]:99999',      // Port out of range
      '[::1]:-1',         // Negative port
      '[::1]:abc'        // Non-numeric port
      // Note: '[::1]:' is accepted by C library (parses as port 0)
    ];

    let portTests = 0;
    for (const addr of invalidPorts) {
      try {
        parser.parse(addr);
        console.error(`  ✗ Should have thrown for: ${addr}`);
      } catch (err) {
        if (err instanceof IPv6ParseError) {
          portTests++;
        }
      }
    }

    if (portTests === invalidPorts.length) {
      console.log(`✓ All ${invalidPorts.length} port errors handled`);
      passed++;
    } else {
      console.error(`✗ Only ${portTests}/${invalidPorts.length} handled correctly`);
      failed++;
    }

    // Test 6: Invalid CIDR mask errors
    console.log('\nTest 6: Invalid CIDR mask errors');
    const invalidMasks = [
      '::1/129',          // Mask too large for IPv6
      '::1/-1',           // Negative mask
      '::1/abc'          // Non-numeric mask
      // Note: '::1/' and '192.168.1.1/33' are accepted by C library
      // (parses as mask 0 or doesn't validate IPv4 mask range)
    ];

    let maskTests = 0;
    for (const addr of invalidMasks) {
      try {
        parser.parse(addr);
        console.error(`  ✗ Should have thrown for: ${addr}`);
      } catch (err) {
        if (err instanceof IPv6ParseError) {
          maskTests++;
        }
      }
    }

    if (maskTests === invalidMasks.length) {
      console.log(`✓ All ${invalidMasks.length} CIDR mask errors handled`);
      passed++;
    } else {
      console.error(`✗ Only ${maskTests}/${invalidMasks.length} handled correctly`);
      failed++;
    }

    // Test 7: Invalid bracket errors
    console.log('\nTest 7: Invalid bracket errors');
    const invalidBrackets = [
      // Note: '[::1' and '::1]' are accepted by C library
      // (brackets are optional in some contexts)
      '[[::1]]',          // Double brackets
      '[::1]:8080]'      // Extra closing bracket
    ];

    let bracketTests = 0;
    for (const addr of invalidBrackets) {
      try {
        parser.parse(addr);
        console.error(`  ✗ Should have thrown for: ${addr}`);
      } catch (err) {
        if (err instanceof IPv6ParseError) {
          bracketTests++;
        }
      }
    }

    if (bracketTests === invalidBrackets.length) {
      console.log(`✓ All ${invalidBrackets.length} bracket errors handled`);
      passed++;
    } else {
      console.error(`✗ Only ${bracketTests}/${invalidBrackets.length} handled correctly`);
      failed++;
    }

    // Test 8: IPv4 embedded errors
    console.log('\nTest 8: IPv4 embedded format errors');
    const invalidIPv4Embed = [
      '::ffff:999.0.0.1',     // IPv4 component out of range
      '::ffff:192.0.2',       // Incomplete IPv4
      '::ffff:192.0.2.1.5'   // Too many IPv4 components
    ];

    let ipv4Tests = 0;
    for (const addr of invalidIPv4Embed) {
      try {
        parser.parse(addr);
        console.error(`  ✗ Should have thrown for: ${addr}`);
      } catch (err) {
        if (err instanceof IPv6ParseError) {
          ipv4Tests++;
        }
      }
    }

    if (ipv4Tests === invalidIPv4Embed.length) {
      console.log(`✓ All ${invalidIPv4Embed.length} IPv4 embed errors handled`);
      passed++;
    } else {
      console.error(`✗ Only ${ipv4Tests}/${invalidIPv4Embed.length} handled correctly`);
      failed++;
    }

    // Test 9: Error object properties
    console.log('\nTest 9: IPv6ParseError object properties');
    try {
      parser.parse('definitely_invalid');
    } catch (err) {
      if (
        err instanceof Error &&
        err instanceof IPv6ParseError &&
        err.name === 'IPv6ParseError' &&
        typeof err.message === 'string' &&
        err.message.length > 0 &&
        err.input === 'definitely_invalid' &&
        err.stack
      ) {
        console.log('✓ IPv6ParseError has all required properties');
        console.log(`  name: "${err.name}"`);
        console.log(`  message: "${err.message}"`);
        console.log(`  input: "${err.input}"`);
        console.log(`  stack: ${err.stack.split('\n')[0]}`);

        // Check for diagnostic properties (new feature)
        if (err.diagnostic && typeof err.diagnostic === 'object') {
          console.log('  diagnostic: present ✓');
          if (typeof err.diagnostic.message === 'string') {
            console.log(`    - message: "${err.diagnostic.message}"`);
          }
          if (typeof err.diagnostic.position === 'number') {
            console.log(`    - position: ${err.diagnostic.position}`);
          }
        }

        passed++;
      } else {
        console.error('✗ IPv6ParseError missing required properties');
        failed++;
      }
    }

    // Test 10: tryParse returns null instead of throwing
    console.log('\nTest 10: tryParse() error handling');
    const invalidAddresses = [
      '',
      'invalid',
      'gggg::1',
      '::1::2',
      // Note: '[::1' is accepted by C library (brackets are optional)
      '::1/999'  // Invalid: mask out of range
    ];

    let tryParseTests = 0;
    for (const addr of invalidAddresses) {
      const result = parser.tryParse(addr);
      if (result === null) {
        tryParseTests++;
      } else {
        console.error(`  ✗ tryParse('${addr}') should return null, got:`, result);
      }
    }

    if (tryParseTests === invalidAddresses.length) {
      console.log(`✓ tryParse() returns null for all ${invalidAddresses.length} invalid addresses`);
      passed++;
    } else {
      console.error(`✗ Only ${tryParseTests}/${invalidAddresses.length} handled correctly`);
      failed++;
    }

    // Test 11: isValid returns false for invalid addresses
    console.log('\nTest 11: isValid() error handling');
    let isValidTests = 0;
    for (const addr of invalidAddresses) {
      if (parser.isValid(addr) === false) {
        isValidTests++;
      } else {
        console.error(`  ✗ isValid('${addr}') should return false`);
      }
    }

    if (isValidTests === invalidAddresses.length) {
      console.log(`✓ isValid() returns false for all ${invalidAddresses.length} invalid addresses`);
      passed++;
    } else {
      console.error(`✗ Only ${isValidTests}/${invalidAddresses.length} handled correctly`);
      failed++;
    }

    // Test 12: Non-string inputs
    console.log('\nTest 12: Non-string input errors');
    const nonStringInputs = [
      null,
      undefined,
      123,
      { address: '::1' },
      ['::1']
    ];

    let nonStringTests = 0;
    for (const input of nonStringInputs) {
      try {
        parser.parse(input);
        console.error(`  ✗ Should have thrown for: ${typeof input}`);
      } catch (err) {
        if (err instanceof IPv6ParseError || err instanceof TypeError) {
          nonStringTests++;
        } else {
          console.error(`  ✗ Wrong error type for: ${typeof input}`);
        }
      }
    }

    if (nonStringTests === nonStringInputs.length) {
      console.log(`✓ All ${nonStringInputs.length} non-string input errors handled`);
      passed++;
    } else {
      console.error(`✗ Only ${nonStringTests}/${nonStringInputs.length} handled correctly`);
      failed++;
    }

    // Test 13: Error message clarity
    console.log('\nTest 13: Error message clarity');
    const testCases = [
      { addr: '', shouldContain: ['empty', 'string'] },
      { addr: 'invalid', shouldContain: ['invalid', 'format'] },
      { addr: '::1::2', shouldContain: ['invalid', 'format'] }
    ];

    let clarityTests = 0;
    for (const { addr, shouldContain } of testCases) {
      try {
        parser.parse(addr);
      } catch (err) {
        const message = err.message.toLowerCase();
        const hasKeywords = shouldContain.some(keyword => message.includes(keyword.toLowerCase()));
        if (hasKeywords) {
          clarityTests++;
        } else {
          console.error(`  ✗ Error message for '${addr}' doesn't contain expected keywords`);
          console.error(`    Message: "${err.message}"`);
          console.error(`    Expected one of: ${shouldContain.join(', ')}`);
        }
      }
    }

    if (clarityTests === testCases.length) {
      console.log(`✓ All ${testCases.length} error messages are clear`);
      passed++;
    } else {
      console.error(`✗ Only ${clarityTests}/${testCases.length} messages are clear`);
      failed++;
    }

  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }

  // Summary
  console.log('\n======================');
  console.log(`Tests passed: ${passed}`);
  console.log(`Tests failed: ${failed}`);
  console.log('======================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
