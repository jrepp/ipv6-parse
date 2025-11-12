/**
 * IPv6/IPv4 Address Parser - JavaScript API
 *
 * A clean, idiomatic JavaScript wrapper for the ipv6-parse WASM library.
 * Provides an easy-to-use API for parsing IPv6/IPv4 addresses with full
 * RFC compliance (RFC 4291, RFC 5952, RFC 4007).
 *
 * @example
 * // Initialize once when WASM module loads
 * createIPv6Module().then(wasmModule => {
 *     const parser = new IPv6Parser(wasmModule);
 *
 *     // Parse an address
 *     const addr = parser.parse('2001:db8::1/64');
 *     console.log(addr.formatted);  // "2001:db8::1"
 *     console.log(addr.mask);       // 64
 * });
 *
 * @license MIT
 * @author Jacob Repp <jacobrepp@gmail.com>
 */

/**
 * IPv6/IPv4 Address Parser
 *
 * Main parser class that wraps the WASM module and provides a clean API.
 */
class IPv6Parser {
  /**
     * Create a new parser instance
     *
     * @param {Object} wasmModule - The loaded Emscripten module
     */
  constructor(wasmModule) {
    this._module = wasmModule;
    this._resultPtr = null;
    this._resultSize = 92; // sizeof(ipv6_parse_result_t)

    // Get actual size from WASM if available
    if (typeof this._module.ccall === 'function') {
      try {
        this._resultSize = this._module.ccall('ipv6_result_size', 'number', [], []);
      } catch (e) {
        // Fall back to hardcoded size
      }
    }
  }

  /**
     * Parse an IPv6 or IPv4 address
     *
     * Parses various address formats including:
     * - Pure IPv6: "2001:db8::1", "::1"
     * - IPv4: "192.168.1.1", "10.1"
     * - IPv4-embedded IPv6: "::ffff:192.0.2.1"
     * - With port: "[::1]:8080", "192.168.1.1:80"
     * - With CIDR: "2001:db8::/32", "10.0.0.0/8"
     * - With zone ID: "fe80::1%eth0"
     * - Combined: "[2001:db8::1/64%eth0]:443"
     *
     * @param {string} address - Address to parse
     * @returns {IPv6Address} Parsed address object with all metadata
     * @throws {IPv6ParseError} If address format is invalid
     *
     * @example
     * const addr = parser.parse('2001:db8::1/64');
     * console.log(addr.mask);  // 64
     * console.log(addr.components[0]); // 0x2001
     */
  parse(address) {
    if (typeof address !== 'string' || address.length === 0) {
      throw new IPv6ParseError('Address must be a non-empty string', address);
    }

    // Allocate result buffer on first use
    if (!this._resultPtr) {
      this._resultPtr = this._module._malloc(this._resultSize);
      if (!this._resultPtr) {
        throw new Error('Failed to allocate memory for parse result');
      }
    }

    // Call WASM function to parse and populate result structure
    const success = this._module.ccall(
      'ipv6_parse_full',
      'number',
      ['string', 'number'],
      [address, this._resultPtr]
    );

    if (!success) {
      throw new IPv6ParseError('Invalid IPv6/IPv4 address format', address);
    }

    // Read result from WASM memory and create address object
    return this._readResult();
  }

  /**
     * Try to parse an address, returning null on failure instead of throwing
     *
     * Useful for validation without exception handling.
     *
     * @param {string} address - Address to parse
     * @returns {IPv6Address|null} Parsed address or null if invalid
     *
     * @example
     * const addr = parser.tryParse(userInput);
     * if (addr) {
     *     console.log('Valid:', addr.formatted);
     * } else {
     *     console.log('Invalid address');
     * }
     */
  tryParse(address) {
    try {
      return this.parse(address);
    } catch (err) {
      if (err instanceof IPv6ParseError) {
        return null;
      }
      throw err; // Re-throw non-parse errors
    }
  }

  /**
     * Check if a string is a valid IPv6/IPv4 address
     *
     * @param {string} address - Address to validate
     * @returns {boolean} True if valid, false otherwise
     *
     * @example
     * if (parser.isValid(userInput)) {
     *     processAddress(userInput);
     * }
     */
  isValid(address) {
    return this.tryParse(address) !== null;
  }

  /**
     * Compare two addresses for equality
     *
     * @param {string} addr1 - First address
     * @param {string} addr2 - Second address
     * @param {Object} [options={}] - Comparison options
     * @param {boolean} [options.ignorePort=false] - Ignore port in comparison
     * @param {boolean} [options.ignoreMask=false] - Ignore CIDR mask in comparison
     * @param {boolean} [options.ignoreFormat=false] - Ignore IPv4 embedding format
     * @returns {boolean} True if addresses are equal
     *
     * @example
     * // Compare addresses
     * parser.equals('::1', '0:0:0:0:0:0:0:1'); // true
     *
     * // Ignore port
     * parser.equals('[::1]:80', '[::1]:443', { ignorePort: true }); // true
     */
  equals(addr1, addr2, options = {}) {
    let ignoreFlags = 0;
    if (options.ignorePort) ignoreFlags |= 0x01;  // IPV6_FLAG_HAS_PORT
    if (options.ignoreMask) ignoreFlags |= 0x02;  // IPV6_FLAG_HAS_MASK
    if (options.ignoreFormat) ignoreFlags |= 0x04; // IPV6_FLAG_IPV4_EMBED

    try {
      const result = this._module.ccall(
        'ipv6_compare_str',
        'number',
        ['string', 'string', 'number'],
        [addr1, addr2, ignoreFlags]
      );

      return result === 0; // IPV6_COMPARE_OK
    } catch (err) {
      return false;
    }
  }

  /**
     * Get library version
     *
     * @returns {string} Version string (e.g., "1.2.1-wasm")
     */
  getVersion() {
    try {
      return this._module.ccall('ipv6_version', 'string', [], []);
    } catch (err) {
      return 'unknown';
    }
  }

  /**
     * Read parsed result from WASM memory
     * @private
     */
  _readResult() {
    const ptr = this._resultPtr;

    // Access heap arrays safely - check if they exist first
    if (!this._module.HEAPU8 || !this._module.HEAPU16 || !this._module.HEAPU32) {
      throw new Error('WASM memory not initialized');
    }

    const heap = this._module.HEAPU8;
    const heap16 = this._module.HEAPU16;
    const heap32 = this._module.HEAPU32;

    // Verify pointer is valid
    if (!ptr || ptr < 0 || ptr >= heap.length) {
      throw new Error('Invalid memory pointer');
    }

    // Read components (8 x uint16_t at offset 0-15)
    const components = [];
    const componentOffset = ptr >> 1; // Divide by 2 for 16-bit array indexing
    for (let i = 0; i < 8; i++) {
      const idx = componentOffset + i;
      if (idx >= heap16.length) {
        throw new Error('Memory access out of bounds');
      }
      components.push(heap16[idx]);
    }

    // Read port (uint16_t at byte offset 16)
    const portIdx = (ptr >> 1) + 8;
    const port = portIdx < heap16.length ? heap16[portIdx] : 0;

    // Read mask (uint32_t at byte offset 20)
    const maskIdx = (ptr + 20) >> 2; // Divide by 4 for 32-bit array indexing
    const mask = maskIdx < heap32.length ? heap32[maskIdx] : 0;

    // Read flags (uint32_t at byte offset 24)
    const flagsIdx = (ptr + 24) >> 2;
    const flags = flagsIdx < heap32.length ? heap32[flagsIdx] : 0;

    // Read formatted string (48 bytes at offset 28)
    const formatted = this._module.UTF8ToString(ptr + 28);

    // Read zone (16 bytes at offset 76)
    const zone = this._module.UTF8ToString(ptr + 76);

    return new IPv6Address({
      components,
      port,
      mask,
      zone,
      formatted,
      flags
    });
  }

  /**
     * Clean up allocated memory
     *
     * Call this when done with the parser to free WASM memory.
     * After calling destroy(), the parser cannot be used anymore.
     */
  destroy() {
    if (this._resultPtr) {
      this._module._free(this._resultPtr);
      this._resultPtr = null;
    }
  }
}

/**
 * Parsed IPv6/IPv4 Address
 *
 * Immutable object representing a parsed address with all metadata.
 * All properties are read-only (frozen).
 */
class IPv6Address {
  /**
     * Create a new IPv6Address (internal use only)
     * @param {Object} data - Parsed address data
     * @private
     */
  constructor(data) {
    this._components = data.components;
    this._port = data.port;
    this._mask = data.mask;
    this._zone = data.zone;
    this._formatted = data.formatted;
    this._flags = data.flags;

    // Make this object immutable
    Object.freeze(this);
  }

  /**
     * Get formatted address (RFC 5952 canonical form)
     * @type {string}
     * @example "2001:db8::1"
     */
  get formatted() {
    return this._formatted;
  }

  /**
     * Get address components as array of 8 uint16 values
     * @type {number[]}
     * @example [0x2001, 0x0db8, 0, 0, 0, 0, 0, 1]
     */
  get components() {
    return [...this._components]; // Return copy to maintain immutability
  }

  /**
     * Get port number or null if not specified
     * @type {number|null}
     * @example 8080
     */
  get port() {
    return this.hasPort ? this._port : null;
  }

  /**
     * Get CIDR mask bits or null if not specified
     * @type {number|null}
     * @example 64
     */
  get mask() {
    return this.hasMask ? this._mask : null;
  }

  /**
     * Get zone ID (interface name) or null if not specified
     * @type {string|null}
     * @example "eth0"
     */
  get zone() {
    return this._zone && this._zone.length > 0 ? this._zone : null;
  }

  /**
     * Check if address has port specified
     * @type {boolean}
     */
  get hasPort() {
    return !!(this._flags & 0x01); // IPV6_FLAG_HAS_PORT
  }

  /**
     * Check if address has CIDR mask specified
     * @type {boolean}
     */
  get hasMask() {
    return !!(this._flags & 0x02); // IPV6_FLAG_HAS_MASK
  }

  /**
     * Check if address has IPv4 embedded in last 32 bits
     * @type {boolean}
     */
  get isIPv4Embedded() {
    return !!(this._flags & 0x04); // IPV6_FLAG_IPV4_EMBED
  }

  /**
     * Check if address is IPv4 compatible format
     * @type {boolean}
     */
  get isIPv4Compatible() {
    return !!(this._flags & 0x08); // IPV6_FLAG_IPV4_COMPAT
  }

  /**
     * Convert to plain JavaScript object
     *
     * @returns {Object} Plain object representation
     * @example
     * {
     *   formatted: "2001:db8::1",
     *   components: [0x2001, 0x0db8, ...],
     *   port: 8080,
     *   mask: 64,
     *   zone: "eth0",
     *   hasPort: true,
     *   hasMask: true,
     *   isIPv4Embedded: false,
     *   isIPv4Compatible: false
     * }
     */
  toJSON() {
    return {
      formatted: this.formatted,
      components: this.components,
      port: this.port,
      mask: this.mask,
      zone: this.zone,
      hasPort: this.hasPort,
      hasMask: this.hasMask,
      isIPv4Embedded: this.isIPv4Embedded,
      isIPv4Compatible: this.isIPv4Compatible
    };
  }

  /**
     * Convert to string (returns formatted address)
     *
     * @returns {string} Formatted address
     * @example "2001:db8::1"
     */
  toString() {
    return this.formatted;
  }

  /**
     * Get component as hexadecimal string
     *
     * @param {number} index - Component index (0-7)
     * @returns {string} Hex string (e.g., "2001")
     */
  getComponentHex(index) {
    if (index < 0 || index >= this._components.length) {
      throw new RangeError('Component index must be 0-7');
    }
    return this._components[index].toString(16).padStart(4, '0');
  }
}

/**
 * Custom error for IPv6 parsing failures
 */
class IPv6ParseError extends Error {
  /**
     * Create a parse error
     * @param {string} message - Error message
     * @param {string} input - Input that caused the error
     */
  constructor(message, input) {
    super(message);
    this.name = 'IPv6ParseError';
    this.input = input;
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    IPv6Parser,
    IPv6Address,
    IPv6ParseError
  };
}

// Also export for ES6 modules
if (typeof exports !== 'undefined') {
  exports.IPv6Parser = IPv6Parser;
  exports.IPv6Address = IPv6Address;
  exports.IPv6ParseError = IPv6ParseError;
}
