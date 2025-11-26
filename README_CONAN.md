# Conan Package for ipv6-parse

This document describes how to use the ipv6-parse library with [Conan](https://conan.io/), the C/C++ package manager.

## Quick Start

### Installing from Local Source

```bash
# Build and install to local cache
conan create . --build=missing

# Or export without building
conan export .
```

### Using in Your Project

Add ipv6-parse to your `conanfile.txt`:

```ini
[requires]
ipv6-parse/1.2.1

[generators]
CMakeDeps
CMakeToolchain
```

Or in your `conanfile.py`:

```python
from conan import ConanFile

class MyProjectConan(ConanFile):
    requires = "ipv6-parse/1.2.1"
    generators = "CMakeDeps", "CMakeToolchain"
```

### CMake Integration

In your `CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.12)
project(myproject C)

find_package(ipv6-parse REQUIRED)

add_executable(myapp main.c)
target_link_libraries(myapp ipv6-parse::ipv6-parse)
```

### Building Your Project

```bash
# Install dependencies
conan install . --output-folder=build --build=missing

# Configure with CMake
cmake -B build -DCMAKE_TOOLCHAIN_FILE=build/conan_toolchain.cmake

# Build
cmake --build build
```

## Package Options

| Option   | Default | Description                        |
|----------|---------|-----------------------------------|
| `shared` | `False` | Build shared library              |
| `fPIC`   | `True`  | Generate position-independent code |

### Example: Building Shared Library

```bash
conan create . -o ipv6-parse/*:shared=True --build=missing
```

## Example Usage

```c
#include <stdio.h>
#include <string.h>
#include <ipv6.h>

int main(void) {
    ipv6_address_full_t addr;
    const char *input = "2001:db8::1";

    if (ipv6_from_str(input, strlen(input), &addr)) {
        char buffer[IPV6_STRING_SIZE];
        ipv6_to_str(&addr, buffer, sizeof(buffer));
        printf("Parsed: %s\n", buffer);
    }
    return 0;
}
```

## Development

### Running Tests

The package includes a test consumer in `test_package/` that verifies the package works correctly:

```bash
conan create . --build=missing
```

### Supported Platforms

- Linux (GCC, Clang)
- macOS (Apple Clang)
- Windows (MSVC)

### Conan 2.x Compatibility

This package is designed for Conan 2.x and uses the modern Conan API.

## CI/CD Integration

The Conan package is automatically tested and published via GitHub Actions:

- **CI Testing**: Every push and PR runs `conan create` on Linux, macOS, and Windows
- **Release Publishing**: Tagged releases (e.g., `v1.2.1`) trigger automatic Conan package creation

### Publishing to a Custom Remote

To publish releases to your own Conan remote, configure these GitHub repository settings:

1. **Variables** (Settings > Secrets and variables > Actions > Variables):
   - `CONAN_REMOTE_URL`: Your Conan remote URL (e.g., `https://your-artifactory.com/artifactory/api/conan/conan-local`)

2. **Secrets** (Settings > Secrets and variables > Actions > Secrets):
   - `CONAN_API_KEY`: API key or token for authentication

The publish step will be skipped if `CONAN_REMOTE_URL` is not configured.
