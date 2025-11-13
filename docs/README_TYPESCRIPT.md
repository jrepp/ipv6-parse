# TypeScript Usage Guide

Complete TypeScript support with type definitions for compile-time type safety and IDE autocomplete.

## Installation

The type definitions are included in the repository at `docs/ipv6-parse-api.d.ts`.

## Setup

### Option 1: Using with Script Tags (Browser)

```html
<!DOCTYPE html>
<html>
<head>
    <title>TypeScript Example</title>
</head>
<body>
    <script src="ipv6-parse.js"></script>
    <script src="ipv6-parse-api.js"></script>

    <!-- Your TypeScript compiled to JavaScript -->
    <script src="app.js"></script>
</body>
</html>
```

In your TypeScript file:

```typescript
// app.ts
/// <reference path="ipv6-parse-api.d.ts" />

// Types are automatically available
let parser: IPv6Parser;

createIPv6Module().then((wasmModule) => {
    parser = new IPv6Parser(wasmModule);

    const addr = parser.parse('2001:db8::1/64');
    console.log(addr.formatted); // TypeScript knows this is a string
    console.log(addr.mask);      // TypeScript knows this is number | null
});
```

Compile:
```bash
tsc app.ts --target es2015 --lib es2015,dom
```

### Option 2: Using with Module Bundlers (Webpack, Vite, etc.)

```typescript
// app.ts
import { IPv6Parser, IPv6Address, IPv6ParseError } from './ipv6-parse-api';

async function main() {
    // Load WASM module (you'll need to configure your bundler for this)
    const createModule = (await import('./ipv6-parse.js')).default;
    const wasmModule = await createModule();

    const parser = new IPv6Parser(wasmModule);

    try {
        const addr = parser.parse('2001:db8::1/64');
        console.log(addr.formatted);
    } catch (err) {
        if (err instanceof IPv6ParseError) {
            console.error('Parse error:', err.message);
        }
    }
}

main();
```

## Type-Safe Examples

### Basic Parsing with Types

```typescript
import { IPv6Parser, IPv6Address } from './ipv6-parse-api';

async function parseAddress(input: string): Promise<IPv6Address | null> {
    const wasmModule = await createIPv6Module();
    const parser = new IPv6Parser(wasmModule);

    return parser.tryParse(input);
}

// Usage with type safety
const addr = await parseAddress('2001:db8::1');
if (addr) {
    // TypeScript knows all these types
    const formatted: string = addr.formatted;
    const port: number | null = addr.port;
    const mask: number | null = addr.mask;
    const zone: string | null = addr.zone;
    const hasPort: boolean = addr.hasPort;
}
```

### Type-Safe Validation

```typescript
import { IPv6Parser } from './ipv6-parse-api';

function validateAddress(parser: IPv6Parser, input: string): boolean {
    // TypeScript ensures correct return type
    return parser.isValid(input);
}

// Usage
const parser = new IPv6Parser(wasmModule);
if (validateAddress(parser, userInput)) {
    console.log('Valid address');
}
```

### Type-Safe Comparison with Options

```typescript
import { IPv6Parser, IPv6CompareOptions } from './ipv6-parse-api';

function compareAddresses(
    parser: IPv6Parser,
    addr1: string,
    addr2: string,
    options?: IPv6CompareOptions
): boolean {
    return parser.equals(addr1, addr2, options);
}

// Usage with type-checked options
const parser = new IPv6Parser(wasmModule);

// TypeScript validates these option names
compareAddresses(parser, '::1', '[::1]:80', { ignorePort: true });
compareAddresses(parser, '::1/64', '::1/128', { ignoreMask: true });

// TypeScript error: Property 'invalidOption' does not exist
// compareAddresses(parser, '::1', '::1', { invalidOption: true });
```

### Working with Components

```typescript
import { IPv6Address } from './ipv6-parse-api';

function printComponents(addr: IPv6Address): void {
    // TypeScript knows components is ReadonlyArray<number>
    addr.components.forEach((component: number, index: number) => {
        // TypeScript validates getComponentHex takes a number
        const hex: string = addr.getComponentHex(index);
        console.log(`[${index}]: 0x${hex}`);
    });

    // TypeScript error: Cannot assign to read-only property
    // addr.components[0] = 0x1234;
}
```

### Error Handling with Type Guards

```typescript
import { IPv6Parser, IPv6ParseError } from './ipv6-parse-api';

async function safeParse(input: string): Promise<string | null> {
    const wasmModule = await createIPv6Module();
    const parser = new IPv6Parser(wasmModule);

    try {
        const addr = parser.parse(input);
        return addr.formatted;
    } catch (err) {
        // Type guard for IPv6ParseError
        if (err instanceof IPv6ParseError) {
            console.error(`Parse error: ${err.message}`);
            console.error(`Invalid input: ${err.input}`);
            return null;
        }
        // Re-throw unexpected errors
        throw err;
    }
}
```

### Using toJSON with Type Safety

```typescript
import { IPv6Address, IPv6AddressJSON } from './ipv6-parse-api';

function serializeAddress(addr: IPv6Address): string {
    // TypeScript knows the structure of the JSON object
    const json: IPv6AddressJSON = addr.toJSON();

    // All properties are typed
    const obj = {
        formatted: json.formatted,        // string
        port: json.port,                  // number | null
        mask: json.mask,                  // number | null
        zone: json.zone,                  // string | null
        components: json.components,      // number[]
        hasPort: json.hasPort,           // boolean
        hasMask: json.hasMask,           // boolean
        isIPv4Embedded: json.isIPv4Embedded,     // boolean
        isIPv4Compatible: json.isIPv4Compatible  // boolean
    };

    return JSON.stringify(obj, null, 2);
}
```

### Creating a Type-Safe Parser Service

```typescript
import {
    IPv6Parser,
    IPv6Address,
    IPv6ParseError,
    IPv6CompareOptions
} from './ipv6-parse-api';

/**
 * Type-safe IPv6 parser service with initialization
 */
class IPv6Service {
    private parser: IPv6Parser | null = null;

    async initialize(): Promise<void> {
        const wasmModule = await createIPv6Module();
        this.parser = new IPv6Parser(wasmModule);
    }

    private ensureInitialized(): IPv6Parser {
        if (!this.parser) {
            throw new Error('IPv6Service not initialized. Call initialize() first.');
        }
        return this.parser;
    }

    parse(address: string): IPv6Address {
        return this.ensureInitialized().parse(address);
    }

    tryParse(address: string): IPv6Address | null {
        return this.ensureInitialized().tryParse(address);
    }

    isValid(address: string): boolean {
        return this.ensureInitialized().isValid(address);
    }

    equals(addr1: string, addr2: string, options?: IPv6CompareOptions): boolean {
        return this.ensureInitialized().equals(addr1, addr2, options);
    }

    getVersion(): string {
        return this.ensureInitialized().getVersion();
    }

    destroy(): void {
        if (this.parser) {
            this.parser.destroy();
            this.parser = null;
        }
    }
}

// Usage
const service = new IPv6Service();
await service.initialize();

const addr = service.parse('2001:db8::1');
console.log(addr.formatted);

service.destroy();
```

### React Component with TypeScript

```typescript
import React, { useState, useEffect } from 'react';
import { IPv6Parser, IPv6Address, IPv6ParseError } from './ipv6-parse-api';

interface Props {
    wasmModule: any;
}

export const IPv6AddressInput: React.FC<Props> = ({ wasmModule }) => {
    const [parser, setParser] = useState<IPv6Parser | null>(null);
    const [input, setInput] = useState<string>('');
    const [address, setAddress] = useState<IPv6Address | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const p = new IPv6Parser(wasmModule);
        setParser(p);
        return () => p.destroy();
    }, [wasmModule]);

    const handleParse = (): void => {
        if (!parser) return;

        try {
            const addr = parser.parse(input);
            setAddress(addr);
            setError(null);
        } catch (err) {
            if (err instanceof IPv6ParseError) {
                setError(err.message);
                setAddress(null);
            }
        }
    };

    return (
        <div>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter IPv6 address"
            />
            <button onClick={handleParse}>Parse</button>

            {error && <div className="error">{error}</div>}

            {address && (
                <div className="result">
                    <p>Formatted: {address.formatted}</p>
                    {address.port !== null && <p>Port: {address.port}</p>}
                    {address.mask !== null && <p>Mask: /{address.mask}</p>}
                    {address.zone && <p>Zone: {address.zone}</p>}
                </div>
            )}
        </div>
    );
};
```

### Vue Component with TypeScript

```typescript
<template>
  <div>
    <input
      v-model="input"
      type="text"
      placeholder="Enter IPv6 address"
      @keyup.enter="parse"
    />
    <button @click="parse">Parse</button>

    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="address" class="result">
      <p>Formatted: {{ address.formatted }}</p>
      <p v-if="address.port !== null">Port: {{ address.port }}</p>
      <p v-if="address.mask !== null">Mask: /{{ address.mask }}</p>
      <p v-if="address.zone">Zone: {{ address.zone }}</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted, PropType } from 'vue';
import { IPv6Parser, IPv6Address, IPv6ParseError } from './ipv6-parse-api';

export default defineComponent({
  name: 'IPv6AddressInput',
  props: {
    wasmModule: {
      type: Object as PropType<any>,
      required: true
    }
  },
  setup(props) {
    const parser = ref<IPv6Parser | null>(null);
    const input = ref<string>('');
    const address = ref<IPv6Address | null>(null);
    const error = ref<string | null>(null);

    onMounted(() => {
      parser.value = new IPv6Parser(props.wasmModule);
    });

    onUnmounted(() => {
      if (parser.value) {
        parser.value.destroy();
      }
    });

    const parse = (): void => {
      if (!parser.value) return;

      try {
        address.value = parser.value.parse(input.value);
        error.value = null;
      } catch (err) {
        if (err instanceof IPv6ParseError) {
          error.value = err.message;
          address.value = null;
        }
      }
    };

    return {
      input,
      address,
      error,
      parse
    };
  }
});
</script>
```

## tsconfig.json Example

```json
{
  "compilerOptions": {
    "target": "ES2015",
    "lib": ["ES2015", "DOM"],
    "module": "ES2015",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": [
    "src/**/*",
    "docs/ipv6-parse-api.d.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

## IDE Support

### Visual Studio Code

The `.d.ts` file provides full IntelliSense support:

- Autocomplete for all methods and properties
- Inline documentation on hover
- Type checking
- Go-to-definition support

### WebStorm / IntelliJ IDEA

Full TypeScript support with:

- Code completion
- Type checking
- Refactoring support
- Documentation popups

## Type Safety Benefits

1. **Compile-time errors** - Catch mistakes before runtime
2. **Better IDE support** - Autocomplete and inline docs
3. **Refactoring safety** - Rename with confidence
4. **Self-documenting code** - Types serve as documentation
5. **Fewer runtime errors** - Many bugs caught at compile time

## License

MIT License - Same as ipv6-parse
