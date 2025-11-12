/**
 * Type definitions for ipv6-parse (Node.js)
 *
 * High-performance IPv6/IPv4 address parser with full RFC compliance
 */

/**
 * Parsed IPv6/IPv4 address with all metadata
 */
export interface IPv6Address {
  /** RFC 5952 formatted address string */
  readonly formatted: string;

  /** Address components (8 x uint16) */
  readonly components: readonly number[];

  /** Port number or null if not specified */
  readonly port: number | null;

  /** CIDR mask bits or null if not specified */
  readonly mask: number | null;

  /** Zone ID (interface name) or null if not specified */
  readonly zone: string | null;

  /** True if address has port specified */
  readonly hasPort: boolean;

  /** True if address has CIDR mask specified */
  readonly hasMask: boolean;

  /** True if address has IPv4 embedded (::ffff:192.0.2.1) */
  readonly isIPv4Embedded: boolean;

  /** True if address is IPv4 compatible (::192.0.2.1) */
  readonly isIPv4Compatible: boolean;

  /** Get hexadecimal representation of component */
  getComponentHex(index: number): string;

  /** Convert to plain object */
  toJSON(): object;

  /** Convert to string (returns formatted address) */
  toString(): string;
}

/**
 * Custom error for IPv6 parsing failures
 */
export class IPv6ParseError extends Error {
  /** Error message */
  readonly message: string;

  /** Input that failed to parse */
  readonly input: string;

  constructor(message: string, input: string);
}

/**
 * Comparison options
 */
export interface ComparisonOptions {
  /** Ignore port in comparison */
  ignorePort?: boolean;

  /** Ignore CIDR mask in comparison */
  ignoreMask?: boolean;

  /** Ignore zone ID in comparison */
  ignoreZone?: boolean;
}

/**
 * IPv6/IPv4 Address Parser class
 */
export class IPv6Parser {
  /**
   * Parse an IPv6 or IPv4 address
   * @param address - Address to parse (e.g., "::1", "[::1]:8080", "fe80::1%eth0")
   * @returns Parsed address object
   * @throws IPv6ParseError if address is invalid
   */
  parse(address: string): IPv6Address;

  /**
   * Try to parse an address, returning null on failure instead of throwing
   * @param address - Address to parse
   * @returns Parsed address or null if invalid
   */
  tryParse(address: string): IPv6Address | null;

  /**
   * Check if a string is a valid address
   * @param address - Address to validate
   * @returns True if valid
   */
  isValid(address: string): boolean;

  /**
   * Compare two addresses for equality
   * @param addr1 - First address
   * @param addr2 - Second address
   * @param options - Comparison options
   * @returns True if addresses are equal
   */
  equals(addr1: string, addr2: string, options?: ComparisonOptions): boolean;

  /**
   * Get library version
   * @returns Version string
   */
  getVersion(): string;

  /**
   * Clean up allocated memory
   */
  destroy(): void;
}

/**
 * Functional API object
 */
export interface IPv6API {
  parse(address: string): IPv6Address;
  tryParse(address: string): IPv6Address | null;
  isValid(address: string): boolean;
  equals(addr1: string, addr2: string, options?: ComparisonOptions): boolean;
  getVersion(): string;
}

/**
 * Parser initialization result
 */
export interface ParserAPI {
  parser: IPv6Parser;
  IPv6Parser: typeof IPv6Parser;
  IPv6Address: typeof IPv6Address;
  IPv6ParseError: typeof IPv6ParseError;
  ipv6: IPv6API;
}

// ============================================================================
// Async Convenience API (auto-initializes on first use)
// ============================================================================
// Use these for simple scripts where convenience matters more than performance.
// These functions auto-initialize on first use, so they're async.

/**
 * Parse an IPv6/IPv4 address (async, auto-initializes)
 * @param address - Address to parse
 * @returns Promise that resolves to parsed address object
 * @throws IPv6ParseError if address is invalid
 */
export function parse(address: string): Promise<IPv6Address>;

/**
 * Try to parse an address, returning null on failure (async, auto-initializes)
 * @param address - Address to parse
 * @returns Promise that resolves to parsed address or null
 */
export function tryParse(address: string): Promise<IPv6Address | null>;

/**
 * Check if an address is valid (async, auto-initializes)
 * @param address - Address to validate
 * @returns Promise that resolves to true if valid
 */
export function isValid(address: string): Promise<boolean>;

/**
 * Compare two addresses for equality (async, auto-initializes)
 * @param addr1 - First address
 * @param addr2 - Second address
 * @param options - Comparison options
 * @returns Promise that resolves to true if equal
 */
export function equals(
  addr1: string,
  addr2: string,
  options?: ComparisonOptions
): Promise<boolean>;

/**
 * Get library version (async, auto-initializes)
 * @returns Promise that resolves to version string
 */
export function getVersion(): Promise<string>;

// ============================================================================
// Sync Explicit API (requires explicit initialization)
// ============================================================================
// Use these for performance-critical code or when you need synchronous operations.
// Initialize once with createParser(), then use the sync methods.

/**
 * Initialize the IPv6 parser
 * Call this once at startup, then use parser.parse() synchronously.
 * @returns Promise that resolves to the parser API with sync methods
 * @example
 * const { parser } = await createParser();
 * const addr = parser.parse('2001:db8::1'); // Synchronous!
 */
export function createParser(): Promise<ParserAPI>;

/**
 * Get synchronous parser instance (requires prior initialization)
 * @returns Parser instance with synchronous methods
 * @throws Error if not initialized (call createParser() first)
 * @example
 * await createParser();
 * const parser = getParser();
 * const addr = parser.parse('::1'); // Synchronous!
 */
export function getParser(): IPv6Parser;

/**
 * Get synchronous functional API (requires prior initialization)
 * @returns Functional API object with synchronous methods
 * @throws Error if not initialized (call createParser() first)
 * @example
 * await createParser();
 * const ipv6 = getAPI();
 * const addr = ipv6.parse('::1'); // Synchronous!
 */
export function getAPI(): IPv6API;

// Export types
export { IPv6Address, IPv6ParseError, IPv6Parser, ComparisonOptions };
