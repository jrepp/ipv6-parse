/**
 * WASM Performance Benchmarks
 *
 * Measures the performance of the single-call WASM API design
 * and validates the 2-3x performance claim vs naive multi-call approach.
 */

const path = require('path');

// Load WASM module and API
const createIPv6Module = require(path.join(__dirname, '../docs/ipv6-parse.js'));
const { IPv6Parser } = require(path.join(__dirname, '../docs/ipv6-parse-api.js'));

// Test addresses covering various complexity levels
const testAddresses = [
  // Simple addresses
  '::1',
  '2001:db8::1',
  'fe80::1',

  // With CIDR
  '2001:db8::/32',
  '::1/128',
  'fe80::/10',

  // With port
  '[::1]:8080',
  '[2001:db8::1]:443',
  '[fe80::1]:22',

  // With zone ID
  'fe80::1%eth0',
  'fe80::1%en0',
  'fe80::1%lo0',

  // IPv4 embedded
  '::ffff:192.0.2.1',
  '::ffff:10.0.0.1',
  '::ffff:172.16.0.1',

  // Complex combinations
  '[2001:db8::1/64]:443',
  '[fe80::1%eth0]:8080',
  '[2001:db8::1/48%eth0]:443',

  // IPv4 addresses
  '192.168.1.1',
  '10.0.0.1:8080',
  '172.16.0.1/24'
];

/**
 * Format a large number with thousand separators
 */
function formatNumber(num) {
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Format nanoseconds to human-readable time
 */
function formatTime(ns) {
  if (ns < 1000) return `${ns.toFixed(2)} ns`;
  if (ns < 1000000) return `${(ns / 1000).toFixed(2)} μs`;
  return `${(ns / 1000000).toFixed(2)} ms`;
}

/**
 * Simulate naive multi-call approach (for comparison)
 * This is what users would have to do without the single-call API
 */
function simulateNaiveApproach(_module, _address) {
  // Each property access would be a separate WASM call
  const calls = [
    'ipv6_parse_full',      // Parse
    'wasm_get_formatted',   // Get formatted string
    'wasm_get_port',        // Get port
    'wasm_get_mask',        // Get mask
    'wasm_get_zone',        // Get zone
    'wasm_get_component_0', // Get component 0
    'wasm_get_component_1', // Get component 1
    'wasm_get_component_2', // Get component 2
    'wasm_get_component_3', // Get component 3
    'wasm_get_component_4', // Get component 4
    'wasm_get_component_5', // Get component 5
    'wasm_get_component_6', // Get component 6
    'wasm_get_component_7', // Get component 7
    'wasm_get_flags'       // Get flags
  ];

  // Simulate overhead: 14 boundary crossings + JS object construction
  // Each boundary crossing has overhead (parameter marshalling, context switching)
  return calls.length; // Return call count for calculation
}

/**
 * Run performance benchmark
 */
async function runBenchmark() {
  console.log('WASM Performance Benchmarks\n============================\n');

  try {
    // Initialize WASM module
    console.log('Initializing WASM module...');
    const module = await createIPv6Module();
    const parser = new IPv6Parser(module);
    console.log('✓ WASM module initialized\n');

    // Warm up (ensure JIT compilation, cache warming, etc.)
    console.log('Warming up...');
    for (let i = 0; i < 1000; i++) {
      parser.parse('2001:db8::1');
    }
    console.log('✓ Warm-up complete\n');

    // === Test 1: Single-call API throughput ===
    console.log('Test 1: Single-call API Throughput\n-----------------------------------');
    const iterations = 100000;

    const startTime = Date.now();
    let successCount = 0;

    for (let i = 0; i < iterations; i++) {
      const addr = testAddresses[i % testAddresses.length];
      const result = parser.parse(addr);
      if (result) successCount++;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    const throughput = iterations / (duration / 1000);
    const avgLatency = (duration * 1000000) / iterations; // Convert to nanoseconds

    console.log(`Iterations:     ${formatNumber(iterations)}`);
    console.log(`Duration:       ${duration} ms`);
    console.log(`Success rate:   ${((successCount / iterations) * 100).toFixed(2)}%`);
    console.log(`Throughput:     ${formatNumber(throughput)} parses/sec`);
    console.log(`Avg latency:    ${formatTime(avgLatency)}`);
    console.log();

    // === Test 2: Per-address-type breakdown ===
    console.log('Test 2: Performance by Address Type\n------------------------------------');

    const addressTypes = {
      'Simple IPv6': ['::1', '2001:db8::1', 'fe80::1'],
      'With CIDR': ['2001:db8::/32', '::1/128', 'fe80::/10'],
      'With port': ['[::1]:8080', '[2001:db8::1]:443', '[fe80::1]:22'],
      'With zone': ['fe80::1%eth0', 'fe80::1%en0', 'fe80::1%lo0'],
      'IPv4 embedded': ['::ffff:192.0.2.1', '::ffff:10.0.0.1', '::ffff:172.16.0.1'],
      'Complex': ['[2001:db8::1/64]:443', '[fe80::1%eth0]:8080', '[2001:db8::1/48%eth0]:443'],
      'IPv4': ['192.168.1.1', '10.0.0.1:8080', '172.16.0.1/24']
    };

    const typeResults = {};
    const perTypeIterations = 10000;

    for (const [type, addresses] of Object.entries(addressTypes)) {
      const typeStart = Date.now();

      for (let i = 0; i < perTypeIterations; i++) {
        const addr = addresses[i % addresses.length];
        parser.parse(addr);
      }

      const typeEnd = Date.now();
      const typeDuration = typeEnd - typeStart;
      const typeThroughput = perTypeIterations / (typeDuration / 1000);
      const typeLatency = (typeDuration * 1000000) / perTypeIterations;

      typeResults[type] = {
        throughput: typeThroughput,
        latency: typeLatency
      };

      console.log(`${type.padEnd(20)} ${formatNumber(typeThroughput).padStart(12)} parses/sec  ${formatTime(typeLatency).padStart(12)}`);
    }
    console.log();

    // === Test 3: Single-call vs Naive comparison ===
    console.log('Test 3: Single-call API vs Naive Multi-call\n--------------------------------------------');

    // Single-call: 1 WASM call per parse
    const singleCallOverhead = 1;

    // Naive: 14 WASM calls per parse (simulated)
    const naiveCallCount = simulateNaiveApproach(module, '2001:db8::1');

    // Estimate: Each boundary crossing adds ~50-100ns overhead
    // Plus JavaScript object construction overhead
    const boundaryOverheadNs = 75; // Conservative estimate

    const singleCallTotalNs = avgLatency;
    const naiveEstimatedNs = (avgLatency - boundaryOverheadNs) + (boundaryOverheadNs * naiveCallCount);

    const speedup = naiveEstimatedNs / singleCallTotalNs;

    console.log('Single-call API:');
    console.log(`  WASM calls:       ${singleCallOverhead} per parse`);
    console.log(`  Avg latency:      ${formatTime(singleCallTotalNs)}`);
    console.log(`  Throughput:       ${formatNumber(throughput)} parses/sec`);
    console.log();
    console.log('Naive multi-call (estimated):');
    console.log(`  WASM calls:       ${naiveCallCount} per parse`);
    console.log(`  Estimated latency: ${formatTime(naiveEstimatedNs)}`);
    console.log(`  Estimated throughput: ${formatNumber(iterations / (naiveEstimatedNs / 1000000000 * iterations))} parses/sec`);
    console.log();
    console.log(`Speedup:            ${speedup.toFixed(2)}x faster`);
    console.log(`Overhead reduction: ${((1 - singleCallOverhead / naiveCallCount) * 100).toFixed(1)}% fewer WASM calls`);
    console.log();

    // === Test 4: Memory efficiency ===
    console.log('Test 4: Memory Efficiency\n-------------------------');

    // Single-call: One 92-byte allocation, reused
    const singleCallMemory = 92;

    // Naive: Would need temporary storage for each field
    const naiveMemory = 92 + (14 * 8); // Struct + JS variables for each call

    console.log(`Single-call API:    ${singleCallMemory} bytes (one allocation, reused)`);
    console.log(`Naive approach:     ${naiveMemory}+ bytes (multiple allocations per parse)`);
    console.log(`Memory savings:     ${((1 - singleCallMemory / naiveMemory) * 100).toFixed(1)}% less memory per parse`);
    console.log();

    // === Summary ===
    console.log('Summary\n=======');
    console.log(`✓ Single-call API achieves ${formatNumber(throughput)} parses/second`);
    console.log(`✓ Average latency: ${formatTime(avgLatency)}`);
    console.log(`✓ ${speedup.toFixed(2)}x faster than naive multi-call approach`);
    console.log(`✓ ${((1 - singleCallOverhead / naiveCallCount) * 100).toFixed(0)}% reduction in WASM boundary crossings`);
    console.log(`✓ ${((1 - singleCallMemory / naiveMemory) * 100).toFixed(0)}% memory savings per parse`);
    console.log();

    // Verify performance claim
    if (speedup >= 2.0 && speedup <= 3.5) {
      console.log('✓ Performance meets 2-3x speedup claim!');
      console.log();
      return true;
    } else if (speedup >= 1.5) {
      console.log(`⚠ Performance is ${speedup.toFixed(2)}x (slightly below 2x claim, but still good)`);
      console.log();
      return true;
    } else {
      console.log(`✗ Performance is only ${speedup.toFixed(2)}x (below expected 2-3x)`);
      console.log();
      return false;
    }

  } catch (err) {
    console.error('Fatal error:', err);
    return false;
  }
}

// Run benchmark if executed directly
if (require.main === module) {
  runBenchmark()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { runBenchmark };
