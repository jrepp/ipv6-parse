# Package Manager Distribution Guide

This document describes how to install ipv6-parse using various package managers.

## Table of Contents

- [Homebrew (macOS/Linux)](#homebrew)
- [Conan (Cross-platform)](#conan)
- [vcpkg (Cross-platform)](#vcpkg)
- [NPM (Node.js)](#npm)
- [APT (Debian/Ubuntu)](#apt-debianubuntu)
- [YUM/DNF (Fedora/RHEL)](#yumdnf-fedorarhel)
- [CMake FetchContent](#cmake-fetchcontent)

---

## Homebrew

Homebrew is a popular package manager for macOS and Linux.

### Installation

```bash
# Install from HEAD (latest master)
brew install --HEAD https://raw.githubusercontent.com/jrepp/ipv6-parse/master/Formula/ipv6-parse.rb

# Or, after publishing to homebrew-core:
brew install ipv6-parse
```

### Optional: Build with WASM Support

```bash
brew install ipv6-parse --with-emscripten
```

This installs WASM files to `/usr/local/share/ipv6-parse/wasm/` (or `/opt/homebrew/share/ipv6-parse/wasm/` on Apple Silicon).

### Usage

**Command-line tool:**
```bash
ipv6-parse-cli "2001:db8::1/64"
```

**C library:**
```c
#include <ipv6.h>

int main() {
    ipv6_address addr;
    if (ipv6_parse("2001:db8::1", &addr) == 0) {
        char formatted[IPV6_STRING_SIZE];
        ipv6_format(&addr, formatted, sizeof(formatted));
        printf("%s\n", formatted);
    }
    return 0;
}
```

**Compile with Homebrew:**
```bash
gcc -o test test.c $(pkg-config --cflags --libs ipv6-parse)
```

### Uninstall

```bash
brew uninstall ipv6-parse
```

---

## Conan

Conan is a decentralized, cross-platform C/C++ package manager.

### Prerequisites

```bash
pip install conan
```

### Installation

**Option 1: From Source (Development)**

```bash
# Clone repository
git clone https://github.com/jrepp/ipv6-parse.git
cd ipv6-parse

# Create package
conan create . ipv6-parse/1.2.1@

# Or install to local cache
conan install . --install-folder=build
```

**Option 2: From Conan Center (After Publishing)**

Add to your `conanfile.txt`:
```ini
[requires]
ipv6-parse/1.2.1

[generators]
CMakeDeps
CMakeToolchain
```

Or in `conanfile.py`:
```python
from conan import ConanFile

class MyProject(ConanFile):
    requires = "ipv6-parse/1.2.1"
    generators = "CMakeDeps", "CMakeToolchain"
```

### Usage with CMake

**CMakeLists.txt:**
```cmake
cmake_minimum_required(VERSION 3.15)
project(my_project)

find_package(ipv6-parse REQUIRED)

add_executable(my_app main.c)
target_link_libraries(my_app PRIVATE ipv6-parse::ipv6-parse)
```

**Build:**
```bash
conan install . --output-folder=build --build=missing
cd build
cmake .. -DCMAKE_TOOLCHAIN_FILE=conan_toolchain.cmake
cmake --build .
```

### Options

```bash
# Build shared library (default: static)
conan install . -o ipv6-parse:shared=True

# Build for specific configuration
conan install . -s build_type=Release

# Cross-compile
conan install . -s arch=armv7 -s os=Linux
```

---

## vcpkg

vcpkg is Microsoft's cross-platform package manager for C/C++.

### Prerequisites

```bash
# Clone vcpkg (if not already installed)
git clone https://github.com/microsoft/vcpkg.git
cd vcpkg
./bootstrap-vcpkg.sh  # or bootstrap-vcpkg.bat on Windows
```

### Installation

**Option 1: Install from vcpkg Registry (After Publishing)**

```bash
./vcpkg install ipv6-parse
```

**Option 2: Install from Local Port (Development)**

```bash
# Copy port files to vcpkg
cp -r /path/to/ipv6-parse/vcpkg /path/to/vcpkg/ports/ipv6-parse

# Install
./vcpkg install ipv6-parse
```

### Usage with CMake

**CMakeLists.txt:**
```cmake
cmake_minimum_required(VERSION 3.15)
project(my_project)

find_package(ipv6-parse CONFIG REQUIRED)

add_executable(my_app main.c)
target_link_libraries(my_app PRIVATE ipv6-parse::ipv6-parse)
```

**Build with vcpkg:**
```bash
cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE=[vcpkg-root]/scripts/buildsystems/vcpkg.cmake
cmake --build build
```

**Or set environment variable:**
```bash
export VCPKG_ROOT=/path/to/vcpkg
cmake -B build -S . -DCMAKE_TOOLCHAIN_FILE=$VCPKG_ROOT/scripts/buildsystems/vcpkg.cmake
cmake --build build
```

### Options

```bash
# Install specific features
./vcpkg install ipv6-parse[tools]   # Include CLI tool

# Cross-compile
./vcpkg install ipv6-parse:x64-windows
./vcpkg install ipv6-parse:arm64-osx
./vcpkg install ipv6-parse:x64-linux
```

---

## NPM

For Node.js and JavaScript/TypeScript projects.

### Installation

```bash
npm install ipv6-parse
```

See [README_NPM.md](README_NPM.md) for complete NPM usage guide.

---

## APT (Debian/Ubuntu)

For Debian-based Linux distributions.

### Installation from .deb Package

```bash
# Download .deb from releases
wget https://github.com/jrepp/ipv6-parse/releases/download/v1.2.1/ipv6-parse-1.2.1-Linux.deb

# Install
sudo dpkg -i ipv6-parse-1.2.1-Linux.deb

# Install dependencies if needed
sudo apt-get install -f
```

### Usage

```bash
# Use command-line tool
ipv6-parse-cli "2001:db8::1"

# Compile C programs
gcc -o test test.c $(pkg-config --cflags --libs ipv6-parse)
```

### Uninstall

```bash
sudo apt-get remove ipv6-parse
```

---

## YUM/DNF (Fedora/RHEL)

For RPM-based Linux distributions.

### Installation from .rpm Package

```bash
# Download .rpm from releases
wget https://github.com/jrepp/ipv6-parse/releases/download/v1.2.1/ipv6-parse-1.2.1-Linux.rpm

# Install (Fedora/RHEL 8+)
sudo dnf install ipv6-parse-1.2.1-Linux.rpm

# Or (RHEL/CentOS 7)
sudo yum install ipv6-parse-1.2.1-Linux.rpm
```

### Usage

Same as APT usage above.

### Uninstall

```bash
# Fedora/RHEL 8+
sudo dnf remove ipv6-parse

# RHEL/CentOS 7
sudo yum remove ipv6-parse
```

---

## CMake FetchContent

Integrate directly into your CMake project without external package managers.

### CMakeLists.txt

```cmake
cmake_minimum_required(VERSION 3.14)
project(my_project)

include(FetchContent)

FetchContent_Declare(
    ipv6-parse
    GIT_REPOSITORY https://github.com/jrepp/ipv6-parse.git
    GIT_TAG        v1.2.1  # or master for latest
)

# Make available
FetchContent_MakeAvailable(ipv6-parse)

add_executable(my_app main.c)
target_link_libraries(my_app PRIVATE ipv6-parse)
```

### Build

```bash
mkdir build && cd build
cmake ..
cmake --build .
```

---

## Comparison Matrix

| Package Manager | Platforms | Languages | Binary/Source | Toolchain |
|----------------|-----------|-----------|---------------|-----------|
| **Homebrew** | macOS, Linux | C, CLI | Binary | Built-in |
| **Conan** | All | C, C++ | Both | CMake, Meson, etc. |
| **vcpkg** | All | C, C++ | Source (cached) | CMake, MSBuild |
| **NPM** | All | Node.js, JS, TS | Binary (WASM) | Node.js |
| **APT** | Debian/Ubuntu | C, CLI | Binary | dpkg |
| **YUM/DNF** | Fedora/RHEL | C, CLI | Binary | rpm |
| **FetchContent** | All | C, C++ | Source | CMake |

---

## Choosing a Package Manager

**Use Homebrew if:**
- You're on macOS or Linux
- You want simple command-line installation
- You're building native applications

**Use Conan if:**
- You need cross-platform C++ builds
- You have complex dependency chains
- You want fine-grained control over builds

**Use vcpkg if:**
- You're using Visual Studio or CMake
- You want Microsoft's ecosystem integration
- You need extensive cross-platform support

**Use NPM if:**
- You're building Node.js applications
- You need browser support (WASM)
- You want TypeScript type definitions

**Use APT/YUM if:**
- You're deploying on Linux servers
- You need system-level package management
- You want automatic dependency resolution

**Use CMake FetchContent if:**
- You want zero external dependencies
- You're building from source anyway
- You need the latest development version

---

## Testing Package Installations

After installing via any method, test with:

### Command-line Tool Test

```bash
# Basic test
ipv6-parse-cli "2001:db8::1"

# Expected output:
# Parsed successfully
# Formatted: 2001:db8::1
# ...

# Test with CIDR
ipv6-parse-cli "2001:db8::/32"

# Test with port
ipv6-parse-cli "[::1]:8080"

# Test with zone ID
ipv6-parse-cli "fe80::1%eth0"
```

### C Library Test

```c
// test.c
#include <ipv6.h>
#include <stdio.h>
#include <string.h>

int main() {
    ipv6_address addr;

    if (ipv6_parse("2001:db8::1/64", &addr) == 0) {
        char formatted[IPV6_STRING_SIZE];
        ipv6_format(&addr, formatted, sizeof(formatted));

        printf("Parsed: %s\n", formatted);
        printf("Mask: %d\n", addr.mask);

        if (strcmp(formatted, "2001:db8::1") == 0 && addr.mask == 64) {
            printf("✓ Test passed\n");
            return 0;
        }
    }

    printf("✗ Test failed\n");
    return 1;
}
```

**Compile and run:**
```bash
gcc -o test test.c $(pkg-config --cflags --libs ipv6-parse)
./test
```

---

## Troubleshooting

### Homebrew: Formula not found
```bash
# Make sure you're using the full URL for HEAD install
brew install --HEAD https://raw.githubusercontent.com/jrepp/ipv6-parse/master/Formula/ipv6-parse.rb
```

### Conan: Package not found
```bash
# Make sure to create package from source first
conan create . ipv6-parse/1.2.1@
```

### vcpkg: Port not found
```bash
# Copy port files manually
cp -r vcpkg /path/to/vcpkg/ports/ipv6-parse
```

### pkg-config: Package not found
```bash
# Check PKG_CONFIG_PATH
echo $PKG_CONFIG_PATH

# Add install location if needed
export PKG_CONFIG_PATH=/usr/local/lib/pkgconfig:$PKG_CONFIG_PATH
```

---

## Contributing

Found an issue with package installations? Please report at:
https://github.com/jrepp/ipv6-parse/issues

---

## See Also

- [Main README](README.md) - General information and building from source
- [WASM Guide](README_WASM.md) - WebAssembly usage
- [NPM Guide](README_NPM.md) - Node.js package usage
- [Contributing Guide](CONTRIBUTING.md) - Development setup
