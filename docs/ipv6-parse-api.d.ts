/**
 * TypeScript definitions for ipv6-parse WebAssembly API
 *
 * Provides type-safe access to IPv6/IPv4 address parsing functionality.
 *
 * @module ipv6-parse-api
 * @version 1.2.1-wasm
 * @license MIT
 */

/**
 * Options for address comparison
 */
export interface ComparisonOptions {
    /**
     * Ignore port numbers in comparison
     * @default false
     */
    ignorePort?: boolean;

    /**
     * Ignore CIDR mask in comparison
     * @default false
     */
    ignoreMask?: boolean;

    /**
     * Ignore IPv4 embedding format differences
     * @default false
     */
    ignoreFormat?: boolean;
}

/**
 * Alias for ComparisonOptions (for backward compatibility)
 * @deprecated Use ComparisonOptions instead
 */
export type IPv6CompareOptions = ComparisonOptions;

/**
 * Plain object representation of a parsed address
 */
export interface IPv6AddressJSON {
    /** RFC 5952 canonical formatted address */
    formatted: string;

    /** Array of 8 uint16 address components */
    components: number[];

    /** Port number or null if not specified */
    port: number | null;

    /** CIDR mask bits or null if not specified */
    mask: number | null;

    /** Zone ID (interface name) or null if not specified */
    zone: string | null;

    /** True if address has port specified */
    hasPort: boolean;

    /** True if address has CIDR mask specified */
    hasMask: boolean;

    /** True if address has IPv4 embedded in last 32 bits */
    isIPv4Embedded: boolean;

    /** True if address is IPv4 compatible format */
    isIPv4Compatible: boolean;
}

/**
 * Parsed IPv6/IPv4 Address
 *
 * Immutable object representing a parsed address with all metadata.
 * All properties are read-only.
 *
 * @example
 * const addr = parser.parse('2001:db8::1/64');
 * console.log(addr.formatted);  // "2001:db8::1"
 * console.log(addr.mask);       // 64
 */
export class IPv6Address {
    /**
     * @internal
     * Constructor is internal - use IPv6Parser.parse() instead
     */
    private constructor(data: any);

    /**
     * RFC 5952 canonical formatted address
     * @example "2001:db8::1"
     */
    readonly formatted: string;

    /**
     * Array of 8 uint16 address components
     * @example [0x2001, 0x0db8, 0, 0, 0, 0, 0, 1]
     */
    readonly components: ReadonlyArray<number>;

    /**
     * Port number or null if not specified
     * @example 8080
     */
    readonly port: number | null;

    /**
     * CIDR mask bits or null if not specified
     * @example 64
     */
    readonly mask: number | null;

    /**
     * Zone ID (interface name) or null if not specified
     * @example "eth0"
     */
    readonly zone: string | null;

    /**
     * True if address has port specified
     */
    readonly hasPort: boolean;

    /**
     * True if address has CIDR mask specified
     */
    readonly hasMask: boolean;

    /**
     * True if address has IPv4 embedded in last 32 bits
     * Example: ::ffff:192.0.2.1
     */
    readonly isIPv4Embedded: boolean;

    /**
     * True if address is IPv4 compatible format
     * Example: 192.168.1.1
     */
    readonly isIPv4Compatible: boolean;

    /**
     * Convert to plain JavaScript object
     *
     * @returns Plain object with all address properties
     *
     * @example
     * const json = addr.toJSON();
     * console.log(JSON.stringify(json, null, 2));
     */
    toJSON(): IPv6AddressJSON;

    /**
     * Convert to string (returns formatted address)
     *
     * @returns Formatted address string
     *
     * @example
     * const addr = parser.parse('2001:db8::1');
     * console.log(`Address: ${addr}`);  // "Address: 2001:db8::1"
     */
    toString(): string;

    /**
     * Get component as hexadecimal string
     *
     * @param index - Component index (0-7)
     * @returns Hex string (e.g., "2001")
     * @throws {RangeError} If index is not 0-7
     *
     * @example
     * addr.getComponentHex(0);  // "2001"
     * addr.getComponentHex(1);  // "0db8"
     */
    getComponentHex(index: number): string;
}

/**
 * Custom error for IPv6 parsing failures
 *
 * Thrown when an address cannot be parsed.
 *
 * @example
 * try {
 *     const addr = parser.parse('invalid');
 * } catch (err) {
 *     if (err instanceof IPv6ParseError) {
 *         console.error('Parse error:', err.message);
 *         console.error('Input was:', err.input);
 *     }
 * }
 */
export class IPv6ParseError extends Error {
    /**
     * Error name (always "IPv6ParseError")
     */
    readonly name: 'IPv6ParseError';

    /**
     * Error message describing what went wrong
     */
    readonly message: string;

    /**
     * Input string that caused the parsing error
     */
    readonly input: string;

    /**
     * Create a new IPv6ParseError
     *
     * @param message - Error message
     * @param input - Input that caused the error
     */
    constructor(message: string, input: string);
}

/**
 * IPv6/IPv4 Address Parser
 *
 * Main parser class that wraps the WASM module and provides a clean API.
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
 */
export class IPv6Parser {
    /**
     * Create a new parser instance
     *
     * @param wasmModule - The loaded Emscripten WASM module
     *
     * @example
     * createIPv6Module().then(wasmModule => {
     *     const parser = new IPv6Parser(wasmModule);
     * });
     */
    constructor(wasmModule: any);

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
     * @param address - Address string to parse
     * @returns Parsed address object with all metadata
     * @throws {IPv6ParseError} If address format is invalid
     *
     * @example
     * const addr = parser.parse('2001:db8::1/64');
     * console.log(addr.mask);          // 64
     * console.log(addr.components[0]); // 0x2001
     *
     * @example
     * // Parse with port and zone
     * const addr = parser.parse('[fe80::1%eth0]:8080');
     * console.log(addr.port);  // 8080
     * console.log(addr.zone);  // "eth0"
     */
    parse(address: string): IPv6Address;

    /**
     * Try to parse an address, returning null on failure instead of throwing
     *
     * Useful for validation without exception handling.
     *
     * @param address - Address string to parse
     * @returns Parsed address or null if invalid
     *
     * @example
     * const addr = parser.tryParse(userInput);
     * if (addr) {
     *     console.log('Valid:', addr.formatted);
     * } else {
     *     console.log('Invalid address');
     * }
     */
    tryParse(address: string): IPv6Address | null;

    /**
     * Check if a string is a valid IPv6/IPv4 address
     *
     * @param address - Address string to validate
     * @returns True if valid, false otherwise
     *
     * @example
     * if (parser.isValid(userInput)) {
     *     processAddress(userInput);
     * }
     */
    isValid(address: string): boolean;

    /**
     * Compare two addresses for equality
     *
     * @param addr1 - First address string
     * @param addr2 - Second address string
     * @param options - Comparison options
     * @returns True if addresses are equal
     *
     * @example
     * // Compare addresses
     * parser.equals('::1', '0:0:0:0:0:0:0:1'); // true
     *
     * @example
     * // Ignore port in comparison
     * parser.equals('[::1]:80', '[::1]:443', { ignorePort: true }); // true
     *
     * @example
     * // Ignore CIDR mask
     * parser.equals('2001:db8::/32', '2001:db8::1/64', { ignoreMask: true }); // true
     */
    equals(
        addr1: string,
        addr2: string,
        options?: ComparisonOptions
    ): boolean;

    /**
     * Get library version
     *
     * @returns Version string (e.g., "1.2.1-wasm")
     *
     * @example
     * console.log('Parser version:', parser.getVersion());
     */
    getVersion(): string;

    /**
     * Clean up allocated memory
     *
     * Call this when done with the parser to free WASM memory.
     * After calling destroy(), the parser cannot be used anymore.
     *
     * @example
     * const parser = new IPv6Parser(wasmModule);
     * // ... use parser ...
     * parser.destroy(); // Clean up
     */
    destroy(): void;
}

/**
 * Factory function type for creating the WASM module
 *
 * This is the function exported by the Emscripten-generated code.
 */
export type CreateIPv6Module = () => Promise<any>;

/**
 * Default export - Use named exports instead
 */
export default IPv6Parser;

/**
 * Module augmentation for global scope (if loaded via script tag)
 */
declare global {
    /**
     * Global IPv6Parser constructor (available when loaded via script tag)
     */
    const IPv6Parser: typeof IPv6Parser;

    /**
     * Global IPv6Address constructor (available when loaded via script tag)
     */
    const IPv6Address: typeof IPv6Address;

    /**
     * Global IPv6ParseError constructor (available when loaded via script tag)
     */
    const IPv6ParseError: typeof IPv6ParseError;

    /**
     * Factory function to create WASM module (from ipv6-parse.js)
     */
    function createIPv6Module(): Promise<any>;
}
