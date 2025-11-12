/**
 * ipv6-parse - Node.js entry point
 *
 * This module provides a high-performance IPv6/IPv4 address parser using WebAssembly.
 * It supports RFC 4291, RFC 5952, and RFC 4007 with full compliance.
 */

const path = require('path');
const fs = require('fs');

// Load the WASM module
const createIPv6Module = require('./docs/ipv6-parse.js');

// Import the API layer
let IPv6Parser, IPv6Address, IPv6ParseError, ipv6;

/**
 * Initialize the IPv6 parser
 * @returns {Promise<Object>} Promise that resolves to the parser API
 */
async function createParser() {
  // Load WASM module
  const wasmModule = await createIPv6Module();

  // Load API layer (we need to evaluate it in the current context)
  const apiCode = fs.readFileSync(path.join(__dirname, 'docs/ipv6-parse-api.js'), 'utf8');

  // Create a minimal browser-like environment for the API layer
  const context = {
    module: { exports: {} },
    Module: wasmModule
  };

  // Execute API layer code
  const Function = global.Function;
  const apiFunc = new Function('module', 'Module', apiCode + '\nreturn module.exports;');
  const api = apiFunc(context.module, wasmModule);

  // Cache exports
  IPv6Parser = api.IPv6Parser;
  IPv6Address = api.IPv6Address;
  IPv6ParseError = api.IPv6ParseError;

  // Create and return parser instance
  const parser = new IPv6Parser(wasmModule);

  // Create functional API
  ipv6 = {
    parse: (addr) => parser.parse(addr),
    tryParse: (addr) => parser.tryParse(addr),
    isValid: (addr) => parser.isValid(addr),
    equals: (addr1, addr2, opts) => parser.equals(addr1, addr2, opts),
    getVersion: () => parser.getVersion()
  };

  return {
    parser,
    IPv6Parser,
    IPv6Address,
    IPv6ParseError,
    ipv6
  };
}

// Synchronous API (uses lazy initialization)
let _initPromise = null;
let _api = null;

function ensureInitialized() {
  if (_initPromise === null) {
    _initPromise = createParser().then(api => {
      _api = api;
      return api;
    });
  }
  return _initPromise;
}

/**
 * Parse an IPv6/IPv4 address (async)
 * @param {string} address - Address to parse
 * @returns {Promise<IPv6Address>} Parsed address object
 */
async function parse(address) {
  await ensureInitialized();
  return _api.ipv6.parse(address);
}

/**
 * Try to parse an address, returning null on failure (async)
 * @param {string} address - Address to parse
 * @returns {Promise<IPv6Address|null>} Parsed address or null
 */
async function tryParse(address) {
  await ensureInitialized();
  return _api.ipv6.tryParse(address);
}

/**
 * Check if an address is valid (async)
 * @param {string} address - Address to validate
 * @returns {Promise<boolean>} True if valid
 */
async function isValid(address) {
  await ensureInitialized();
  return _api.ipv6.isValid(address);
}

/**
 * Compare two addresses for equality (async)
 * @param {string} addr1 - First address
 * @param {string} addr2 - Second address
 * @param {Object} options - Comparison options
 * @returns {Promise<boolean>} True if equal
 */
async function equals(addr1, addr2, options = {}) {
  await ensureInitialized();
  return _api.ipv6.equals(addr1, addr2, options);
}

/**
 * Get library version (async)
 * @returns {Promise<string>} Version string
 */
async function getVersion() {
  await ensureInitialized();
  return _api.ipv6.getVersion();
}

// Export both async API and initialization function
module.exports = {
  // Async functional API (most convenient for Node.js)
  parse,
  tryParse,
  isValid,
  equals,
  getVersion,

  // Initialization function (for advanced usage)
  createParser,

  // Classes (available after initialization)
  get IPv6Parser() { return IPv6Parser; },
  get IPv6Address() { return IPv6Address; },
  get IPv6ParseError() { return IPv6ParseError; },

  // Functional API object (available after initialization)
  get ipv6() { return ipv6; }
};
