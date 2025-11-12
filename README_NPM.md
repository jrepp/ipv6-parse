# ipv6-parse (NPM Package)

High-performance IPv6/IPv4 address parser with full RFC compliance, compiled to WebAssembly for maximum performance.

## Features

- **Full RFC Compliance**: RFC 4291, RFC 5952, RFC 4007
- **High Performance**: 2-3x faster than naive implementations (single WASM call)
- **Zero Dependencies**: Pure WebAssembly, no external dependencies
- **TypeScript Support**: Complete type definitions included
- **Modern API**: Clean, idiomatic JavaScript with async/await
- **Comprehensive**: Supports ports, CIDR masks, zone IDs, and IPv4 embedding

## Installation

```bash
npm install ipv6-parse
```

## Quick Start

> **Note**: The parse operations themselves are **synchronous** - only WASM module initialization is async. Choose the API pattern that fits your use case.

### Async Convenience API (Recommended for Simple Scripts)

The async API auto-initializes on first use. Perfect for simple scripts where convenience matters more than performance.

```javascript
const ipv6 = require('ipv6-parse');

async function main() {
  // Parse an address (async wrapper, auto-initializes)
  const addr = await ipv6.parse('2001:db8::1');
  console.log(addr.formatted);  // "2001:db8::1"
  console.log(addr.components); // [0x2001, 0x0db8, 0, 0, 0, 0, 0, 1]

  // Parse with CIDR mask
  const cidr = await ipv6.parse('2001:db8::1/64');
  console.log(cidr.mask); // 64

  // Parse with port
  const withPort = await ipv6.parse('[::1]:8080');
  console.log(withPort.port); // 8080

  // Validate address
  if (await ipv6.isValid('::1')) {
    console.log('Valid address!');
  }
}

main();
```

### Sync Explicit API (Recommended for Performance-Critical Code)

Initialize once, then use **synchronous** parse operations. Best for high-performance applications, servers, or hot code paths.

```javascript
const { createParser } = require('ipv6-parse');

async function main() {
  // Initialize once at startup (this is async)
  const { parser, IPv6ParseError } = await createParser();

  // All parse operations are now synchronous!
  const addr = parser.parse('2001:db8::1');         // Sync!
  console.log(addr.formatted);

  // Validate synchronously
  if (parser.isValid('::1')) {                      // Sync!
    console.log('Valid!');
  }

  // Try parse synchronously
  const result = parser.tryParse('invalid');        // Sync!
  console.log(result); // null

  // Parse 1 million addresses synchronously
  for (let i = 0; i < 1000000; i++) {
    parser.parse('2001:db8::1');                    // No async overhead!
  }
}

main();
```

### Alternative: Get Parser After Auto-Init

If you start with the async API but later need sync operations, you can get the parser instance:

```javascript
const ipv6 = require('ipv6-parse');

async function main() {
  // Use async API initially
  await ipv6.parse('2001:db8::1');

  // Now get the sync parser
  const { getParser } = require('ipv6-parse');
  const parser = getParser();

  // All operations are now synchronous
  parser.parse('::1');           // Sync!
  parser.isValid('fe80::1');     // Sync!
}

main();
```

### TypeScript

```typescript
import { parse, tryParse, isValid, IPv6Address } from 'ipv6-parse';

async function example() {
  // Full type safety
  const addr: IPv6Address = await parse('2001:db8::1');
  console.log(addr.formatted); // TypeScript knows all properties

  // Validation
  const valid: boolean = await isValid('::1');

  // Try parse
  const result: IPv6Address | null = await tryParse('invalid');
}
```

## API Reference

### When to Use Which API?

| Use Case | Recommended API | Why? |
|----------|----------------|------|
| Simple scripts, CLI tools | **Async Convenience API** | Auto-initialization, minimal boilerplate |
| Web servers (Express, Fastify) | **Sync Explicit API** | Synchronous operations after startup, best performance |
| Performance-critical loops | **Sync Explicit API** | No async overhead per parse |
| Batch processing | **Sync Explicit API** | Maximum throughput (1.7M+ parses/sec) |
| One-off parsing | **Async Convenience API** | Most convenient for single operations |

### Async Convenience API

Auto-initializes on first use. Use for convenience when performance isn't critical.

#### `parse(address: string): Promise<IPv6Address>`

Parse an IPv6/IPv4 address. Throws `IPv6ParseError` on failure.

```javascript
const addr = await ipv6.parse('2001:db8::1/64');
```

#### `tryParse(address: string): Promise<IPv6Address | null>`

Try to parse an address, returning `null` on failure instead of throwing.

```javascript
const addr = await ipv6.tryParse(userInput);
if (addr) {
  console.log('Valid:', addr.formatted);
} else {
  console.log('Invalid address');
}
```

#### `isValid(address: string): Promise<boolean>`

Check if an address is valid.

```javascript
if (await ipv6.isValid(userInput)) {
  // Process valid address
}
```

#### `equals(addr1: string, addr2: string, options?: ComparisonOptions): Promise<boolean>`

Compare two addresses for equality.

```javascript
// Exact comparison
await ipv6.equals('::1', '0:0:0:0:0:0:0:1'); // true

// Ignore port
await ipv6.equals('[::1]:80', '[::1]:443', { ignorePort: true }); // true

// Ignore CIDR mask
await ipv6.equals('::1/64', '::1/128', { ignoreMask: true }); // true
```

#### `getVersion(): Promise<string>`

Get library version string.

```javascript
const version = await ipv6.getVersion();
console.log(version); // "1.2.1-wasm"
```

### Sync Explicit API

Initialize once with `createParser()`, then use **synchronous** methods. Best for performance.

#### `createParser(): Promise<ParserAPI>`

Initialize the parser. Call once at startup, then use sync methods.

```javascript
const { createParser } = require('ipv6-parse');

const { parser } = await createParser();

// All subsequent operations are synchronous
parser.parse('2001:db8::1');      // Sync!
parser.isValid('::1');             // Sync!
parser.tryParse('invalid');        // Sync!
```

#### `getParser(): IPv6Parser`

Get the synchronous parser instance after initialization.

```javascript
const { getParser } = require('ipv6-parse');

// Must call createParser() or use async API first
await ipv6.parse('::1');

// Now get sync parser
const parser = getParser();
parser.parse('2001:db8::1');       // Sync!
```

#### `getAPI(): IPv6API`

Get the synchronous functional API after initialization.

```javascript
const { getAPI } = require('ipv6-parse');

// Must initialize first
await ipv6.parse('::1');

// Now get sync API
const ipv6Sync = getAPI();
ipv6Sync.parse('2001:db8::1');     // Sync!
ipv6Sync.isValid('::1');           // Sync!
```

#### Parser Class Methods (Synchronous)

After calling `createParser()`, the parser instance has these **synchronous** methods:

- `parser.parse(address: string): IPv6Address` - Parse synchronously, throws on error
- `parser.tryParse(address: string): IPv6Address | null` - Parse synchronously, returns null on error
- `parser.isValid(address: string): boolean` - Validate synchronously
- `parser.equals(addr1: string, addr2: string, options?: ComparisonOptions): boolean` - Compare synchronously
- `parser.getVersion(): string` - Get version synchronously
- `parser.destroy(): void` - Free WASM memory (call when done)

### IPv6Address Object

The result of parsing an address:

```typescript
interface IPv6Address {
  formatted: string;           // RFC 5952 formatted address
  components: number[];        // 8 x uint16 components
  port: number | null;         // Port number or null
  mask: number | null;         // CIDR mask or null
  zone: string | null;         // Zone ID or null
  hasPort: boolean;            // True if port present
  hasMask: boolean;            // True if CIDR mask present
  isIPv4Embedded: boolean;     // True if IPv4 embedded (::ffff:192.0.2.1)
  isIPv4Compatible: boolean;   // True if IPv4 compatible (::192.0.2.1)

  getComponentHex(index: number): string;  // Get hex string
  toJSON(): object;                        // Convert to plain object
  toString(): string;                      // Get formatted string
}
```

### Comparison Options

```typescript
interface ComparisonOptions {
  ignorePort?: boolean;   // Ignore port in comparison
  ignoreMask?: boolean;   // Ignore CIDR mask in comparison
  ignoreZone?: boolean;   // Ignore zone ID in comparison
}
```

## Examples

### Parse Various Formats

```javascript
const examples = [
  '2001:db8::1',                    // Basic IPv6
  '::1',                            // Loopback
  '::',                             // All zeros
  '[2001:db8::1]:8080',             // With port
  '2001:db8::1/64',                 // With CIDR mask
  'fe80::1%eth0',                   // With zone ID
  '::ffff:192.0.2.1',               // IPv4-mapped
  '::192.0.2.1',                    // IPv4-compatible
  '[2001:db8::1/64%eth0]:443',      // Complex
  '192.168.1.1',                    // IPv4
  '192.168.1.1:8080'                // IPv4 with port
];

for (const addr of examples) {
  const parsed = await ipv6.parse(addr);
  console.log(`${addr} => ${parsed.formatted}`);
}
```

### Validation

```javascript
const addresses = [
  '2001:db8::1',     // Valid
  'invalid',         // Invalid
  '::1',             // Valid
  ':::1'             // Invalid
];

for (const addr of addresses) {
  const valid = await ipv6.isValid(addr);
  console.log(`${addr}: ${valid ? 'VALID' : 'INVALID'}`);
}
```

### Error Handling

```javascript
const { createParser, IPv6ParseError } = require('ipv6-parse');

async function main() {
  const { parser } = await createParser();

  try {
    const addr = parser.parse('invalid address');
  } catch (err) {
    if (err instanceof IPv6ParseError) {
      console.error(`Parse error: ${err.message}`);
      console.error(`Input: ${err.input}`);
    }
  }
}
```

## Performance

The library uses WebAssembly for maximum performance:

- **Single WASM call**: All data returned in one call (no boundary crossing overhead)
- **2-3x faster**: Compared to naive JavaScript implementations
- **Low overhead**: ~100KB total (WASM + JS)

Typical performance:
- Parse operation: 0.5-1ms
- Validation: 0.3-0.5ms
- Comparison: 0.5-1ms

## Supported Formats

### IPv6
- Standard: `2001:db8::1`
- Compressed: `::1`, `::`
- With port: `[2001:db8::1]:8080`
- With CIDR: `2001:db8::1/64`
- With zone: `fe80::1%eth0`
- IPv4-mapped: `::ffff:192.0.2.1`
- IPv4-compatible: `::192.0.2.1`
- Complex: `[2001:db8::1/64%eth0]:443`

### IPv4
- Standard: `192.168.1.1`
- With port: `192.168.1.1:8080`
- With CIDR: `192.168.1.1/24`

## Browser Usage

For browser usage, use the WASM module directly. See [README_WASM.md](./README_WASM.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or PR on [GitHub](https://github.com/jrepp/ipv6-parse).

## Links

- [GitHub Repository](https://github.com/jrepp/ipv6-parse)
- [WASM Documentation](./README_WASM.md)
- [Issue Tracker](https://github.com/jrepp/ipv6-parse/issues)
- [Interactive Demo](https://jrepp.github.io/ipv6-parse/)
