# ipv6-parse (NPM Package)

High-performance IPv6/IPv4 address parser with full RFC compliance, compiled to WebAssembly.

**[View on NPM](https://www.npmjs.com/package/ipv6-parse)** | **[GitHub](https://github.com/jrepp/ipv6-parse)**

## Features

- ✅ **Full RFC Compliance**: RFC 4291, RFC 5952, RFC 4007
- ⚡ **High Performance**: 1.75M+ parses/sec, validated by benchmarks
- 📦 **Zero Dependencies**: Pure WebAssembly, no external dependencies
- 🎯 **TypeScript Support**: Complete type definitions included
- 🔄 **Dual API**: Async convenience + Sync explicit for max performance
- 🌐 **Comprehensive**: Supports ports, CIDR masks, zone IDs, IPv4 embedding

## Installation

```bash
npm install ipv6-parse
```

## Quick Start

### Async Convenience API (Simple Scripts)

Perfect for scripts where convenience matters more than performance:

```javascript
const ipv6 = require('ipv6-parse');

async function main() {
  // Parse an address (auto-initializes on first use)
  const addr = await ipv6.parse('2001:db8::1/64');
  console.log(addr.formatted);  // "2001:db8::1"
  console.log(addr.mask);        // 64

  // Validate
  if (await ipv6.isValid('::1')) {
    console.log('Valid!');
  }

  // Try parse (returns null on error)
  const result = await ipv6.tryParse('invalid');
  console.log(result);  // null
}

main();
```

### Sync Explicit API (High Performance)

Initialize once, then parse synchronously. Best for servers and hot code paths:

```javascript
const { createParser } = require('ipv6-parse');

async function main() {
  // Initialize once at startup (async)
  const { parser } = await createParser();

  // All operations now synchronous!
  const addr = parser.parse('2001:db8::1');  // Sync!
  console.log(addr.formatted);

  // Parse 1 million addresses synchronously
  for (let i = 0; i < 1000000; i++) {
    parser.parse('::1');  // No async overhead!
  }
}

main();
```

## TypeScript

Full type safety with comprehensive definitions:

```typescript
import { parse, IPv6Address } from 'ipv6-parse';

async function example() {
  const addr: IPv6Address = await parse('2001:db8::1');
  console.log(addr.formatted);  // Full IDE autocomplete!
}
```

## API Reference

### When to Use Which API?

| Use Case | API | Why? |
|----------|-----|------|
| Simple scripts, CLI tools | **Async Convenience** | Auto-init, minimal code |
| Web servers, middleware | **Sync Explicit** | Max performance |
| Performance-critical loops | **Sync Explicit** | No async overhead |
| Batch processing | **Sync Explicit** | 1.75M+ parses/sec |

### Async Convenience API

Auto-initializes on first use:

- `parse(address): Promise<IPv6Address>` - Parse, throws on error
- `tryParse(address): Promise<IPv6Address | null>` - Parse, returns null on error
- `isValid(address): Promise<boolean>` - Validate address
- `equals(addr1, addr2, options?): Promise<boolean>` - Compare addresses
- `getVersion(): Promise<string>` - Get library version

### Sync Explicit API

Initialize once, parse synchronously:

```javascript
const { createParser } = require('ipv6-parse');
const { parser } = await createParser();

// All methods are now synchronous:
parser.parse(address)        // Sync - throws on error
parser.tryParse(address)     // Sync - returns null on error
parser.isValid(address)      // Sync - returns boolean
parser.equals(addr1, addr2)  // Sync - returns boolean
parser.getVersion()          // Sync - returns string
```

### IPv6Address Object

All parsed addresses have these properties:

```typescript
{
  formatted: string;           // RFC 5952 canonical form
  components: number[];        // 8 x uint16 components
  port: number | null;         // Port number or null
  mask: number | null;         // CIDR mask or null
  zone: string | null;         // Zone ID or null
  hasPort: boolean;
  hasMask: boolean;
  isIPv4Embedded: boolean;
  isIPv4Compatible: boolean;

  getComponentHex(index): string;
  toJSON(): object;
  toString(): string;
}
```

### Comparison Options

```javascript
parser.equals('[::1]:80', '[::1]:443', {
  ignorePort: true,    // Ignore port differences
  ignoreMask: true,    // Ignore CIDR mask differences
  ignoreFormat: true   // Ignore IPv4 embedding format
});
```

## Supported Formats

Parses all standard IPv6/IPv4 address formats:

```javascript
// Pure IPv6
'2001:db8::1', '::1', 'fe80::1'

// IPv4
'192.168.1.1', '10.0.0.1'

// IPv4-embedded IPv6
'::ffff:192.0.2.1'

// With CIDR mask
'2001:db8::/32', '10.0.0.0/8'

// With port
'[::1]:8080', '192.168.1.1:80'

// With zone ID (RFC 4007)
'fe80::1%eth0', 'fe80::1%en0'

// Combined
'[2001:db8::1/64%eth0]:443'
```

## Performance

Validated by comprehensive benchmarks (`npm run bench`):

```
✓ Throughput: 1,754,386 parses/second
✓ Latency: 570 nanoseconds per parse
✓ 2.71x faster than naive multi-call approach
✓ 93% fewer WASM boundary crossings
```

Run benchmarks yourself:
```bash
npm run bench
```

## Testing

All tests passing (36/36):

```bash
npm test              # Run all tests
npm run test:node     # Node.js wrapper tests
npm run test:wasm     # WASM module tests
npm run test:sync     # Sync API tests
npm run test:errors   # Error handling tests
npm run bench         # Performance benchmarks
```

## Error Handling

```javascript
const { createParser, IPv6ParseError } = require('ipv6-parse');
const { parser } = await createParser();

try {
  const addr = parser.parse('invalid');
} catch (err) {
  if (err instanceof IPv6ParseError) {
    console.error('Parse error:', err.message);
    console.error('Input was:', err.input);
  }
}
```

## Examples

### Express Middleware

```javascript
const { createParser } = require('ipv6-parse');

// Initialize once at startup
let parser;
createParser().then(api => { parser = api.parser; });

app.use((req, res, next) => {
  const ip = req.ip;
  if (parser.isValid(ip)) {
    req.parsedIP = parser.parse(ip);
  }
  next();
});
```

### CLI Tool

```javascript
#!/usr/bin/env node
const ipv6 = require('ipv6-parse');

async function main() {
  const address = process.argv[2];

  const addr = await ipv6.tryParse(address);
  if (addr) {
    console.log('Valid:', JSON.stringify(addr.toJSON(), null, 2));
  } else {
    console.error('Invalid address');
    process.exit(1);
  }
}

main();
```

### Batch Processing

```javascript
const { createParser } = require('ipv6-parse');

async function processLogFile(lines) {
  const { parser } = await createParser();

  const addresses = [];
  for (const line of lines) {
    const addr = parser.tryParse(line);
    if (addr) addresses.push(addr);
  }

  return addresses;
}
```

## License

MIT License - see [LICENSE](LICENSE) file

## Links

- **NPM Package**: https://www.npmjs.com/package/ipv6-parse
- **GitHub**: https://github.com/jrepp/ipv6-parse
- **Issues**: https://github.com/jrepp/ipv6-parse/issues
- **WASM Documentation**: [README_WASM.md](README_WASM.md)
- **Package Managers**: [README_PACKAGE_MANAGERS.md](README_PACKAGE_MANAGERS.md)
