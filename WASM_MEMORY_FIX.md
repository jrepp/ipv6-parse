# WASM Memory Initialization Fix

## Problem

The WASM module was failing to initialize properly with the error:
```
Error: WASM memory not initialized
```

This occurred because the memory typed arrays (HEAPU8, HEAPU16, HEAPU32) were not accessible to the JavaScript API layer (`ipv6-parse-api.js`), which needs them to read parsed results from WASM memory.

## Root Cause

The Emscripten build configuration was not exporting the HEAP memory arrays. While the module had functions like `ccall`, `cwrap`, `_malloc`, `_free`, and `UTF8ToString`, it didn't expose the typed array views needed to directly read memory.

## Solution

### 1. Export Memory Arrays in Build Configuration

Modified `build_wasm.sh` to include HEAPU8, HEAPU16, and HEAPU32 in `EXPORTED_RUNTIME_METHODS`:

```bash
-s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ToString","stringToUTF8","HEAPU8","HEAPU16","HEAPU32"]'
```

### 2. Create Proper Module Wrapper

Added a wrapper that:
- Waits for WASM runtime initialization
- Exposes memory arrays through multiple fallback methods
- Ensures compatibility with both Node.js and browser environments

### 3. Add Comprehensive Testing

Created `test_wasm_node.js` to validate:
- WASM module loads correctly
- All required functions are accessible
- Memory arrays are properly initialized
- Address parsing works as expected

## Verification

Run the Node.js test to verify the fix:

```bash
node test_wasm_node.js
```

Expected output:
```
=== IPv6 Parser WASM Integration Test ===

Step 1: Loading WASM module...
✓ WASM module loaded

Step 2: Checking module properties...
  - Has ccall: true
  - Has cwrap: true
  - Has _malloc: true
  - Has _free: true
  - Has UTF8ToString: true
  - Has HEAPU8: true
  - Has HEAPU16: true
  - Has HEAPU32: true
✓ All memory arrays present

Step 3: Testing version function...
✓ Version: 1.2.1-wasm

Step 4: Testing address parsing...
✓ Parsed: 2001:db8::1
...

=== ALL TESTS PASSED ===
```

## Files Modified

1. **build_wasm.sh** - Updated Emscripten build configuration and module wrapper
2. **docs/ipv6-parse.js** - Generated WASM module with proper exports
3. **test_wasm_node.js** - New Node.js integration test

## Technical Details

### Memory Layout in WASM

The parser allocates a result structure in WASM memory and populates it. The JavaScript API needs typed array views to read this data:

- **HEAPU8**: Byte-level access for strings and raw data
- **HEAPU16**: 16-bit access for address components (8 x uint16_t)
- **HEAPU32**: 32-bit access for flags and mask values

### Build Changes

The build now:
1. Generates a raw module with internal name `_createIPv6ModuleInternal`
2. Wraps it with a `createIPv6Module()` function that ensures proper initialization
3. Exports memory arrays as module properties
4. Provides fallback mechanisms for different Emscripten versions

## Browser Compatibility

The fix maintains browser compatibility:
- Uses `MODULARIZE=1` for clean module loading
- Async module initialization
- No external dependencies
- Single-file WASM bundle

## Next Steps

The fix is complete and tested. To use in production:

1. Rebuild WASM: `./build_wasm.sh`
2. Test locally: `node test_wasm_node.js`
3. Deploy: `git add build_wasm.sh docs/ipv6-parse.js test_wasm_node.js`
4. Test in browser: Open `docs/diagnostic.html` in a web server

## References

- Emscripten EXPORTED_RUNTIME_METHODS: https://emscripten.org/docs/api_reference/module.html
- WebAssembly Memory: https://developer.mozilla.org/en-US/docs/WebAssembly/JavaScript_interface/Memory
