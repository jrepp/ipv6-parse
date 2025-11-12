#!/usr/bin/env node

/**
 * Node.js Test for IPv6 Parser WASM Integration
 *
 * Tests that the WASM module loads correctly and memory is accessible.
 */

const path = require('path');

// Import the API wrapper
const IPv6Parser = require('./docs/ipv6-parse-api.js').IPv6Parser;

async function runTests() {
    console.log('=== IPv6 Parser WASM Integration Test ===\n');

    try {
        // Step 1: Load WASM module
        console.log('Step 1: Loading WASM module...');
        const createIPv6Module = require('./docs/ipv6-parse.js');
        const wasmModule = await createIPv6Module();
        console.log('✓ WASM module loaded\n');

        // Step 2: Check module properties
        console.log('Step 2: Checking module properties...');
        console.log(`  - Has ccall: ${typeof wasmModule.ccall === 'function'}`);
        console.log(`  - Has cwrap: ${typeof wasmModule.cwrap === 'function'}`);
        console.log(`  - Has _malloc: ${typeof wasmModule._malloc === 'function'}`);
        console.log(`  - Has _free: ${typeof wasmModule._free === 'function'}`);
        console.log(`  - Has UTF8ToString: ${typeof wasmModule.UTF8ToString === 'function'}`);
        console.log(`  - Has HEAPU8: ${typeof wasmModule.HEAPU8 !== 'undefined'}`);
        console.log(`  - Has HEAPU16: ${typeof wasmModule.HEAPU16 !== 'undefined'}`);
        console.log(`  - Has HEAPU32: ${typeof wasmModule.HEAPU32 !== 'undefined'}`);

        if (!wasmModule.HEAPU8) {
            console.error('\n✗ HEAPU8 not available!');
            console.log('  Checking alternative memory access methods...');
            console.log(`  - wasmMemory: ${typeof wasmModule.wasmMemory}`);
            console.log(`  - buffer: ${typeof wasmModule.buffer}`);
            console.log(`  - asm: ${typeof wasmModule.asm}`);

            // Try to manually create memory views
            console.log('  Attempting to find memory buffer...');
            let buffer = null;
            if (wasmModule.wasmMemory && wasmModule.wasmMemory.buffer) {
                buffer = wasmModule.wasmMemory.buffer;
                console.log('  Found buffer at: wasmModule.wasmMemory.buffer');
            } else if (wasmModule.buffer) {
                buffer = wasmModule.buffer;
                console.log('  Found buffer at: wasmModule.buffer');
            } else {
                // List all properties of wasmModule
                console.log('  Available properties on wasmModule:');
                Object.keys(wasmModule).forEach(key => {
                    console.log(`    - ${key}: ${typeof wasmModule[key]}`);
                });
            }

            if (buffer) {
                console.log('  Creating memory views manually...');
                wasmModule.HEAPU8 = new Uint8Array(buffer);
                wasmModule.HEAPU16 = new Uint16Array(buffer);
                wasmModule.HEAPU32 = new Uint32Array(buffer);
                console.log('✓ Memory views created manually\n');
            } else {
                throw new Error('Could not access WASM memory buffer');
            }
        } else {
            console.log('✓ All memory arrays present\n');
        }

        // Step 3: Test version function
        console.log('Step 3: Testing version function...');
        const parser = new IPv6Parser(wasmModule);
        const version = parser.getVersion();
        console.log(`✓ Version: ${version}\n`);

        // Step 4: Test parsing
        console.log('Step 4: Testing address parsing...');
        const testAddresses = [
            '2001:db8::1',
            '::1',
            '::ffff:192.0.2.1',
            '2001:db8::1/64',
            '[2001:db8::1]:8080',
            'fe80::1%eth0'
        ];

        for (const addr of testAddresses) {
            try {
                const result = parser.parse(addr);
                console.log(`✓ Parsed: ${addr}`);
                console.log(`    Formatted: ${result.formatted}`);
                console.log(`    Components: [${result.components.map(c => '0x' + c.toString(16).padStart(4, '0')).join(', ')}]`);
                if (result.port !== null) console.log(`    Port: ${result.port}`);
                if (result.mask !== null) console.log(`    CIDR: /${result.mask}`);
                if (result.zone !== null) console.log(`    Zone: ${result.zone}`);
            } catch (err) {
                console.error(`✗ Failed to parse: ${addr}`);
                console.error(`    Error: ${err.message}`);
                throw err;
            }
        }

        console.log('\n=== ALL TESTS PASSED ===');
        console.log('The IPv6 parser WASM integration is working correctly!\n');

        // Cleanup
        parser.destroy();
        process.exit(0);

    } catch (err) {
        console.error('\n=== TEST FAILED ===');
        console.error(`Error: ${err.message}`);
        console.error(`Stack: ${err.stack}`);
        process.exit(1);
    }
}

// Run tests
runTests();
