# Contributing to ipv6-parse

Thank you for your interest in contributing to ipv6-parse! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Development Setup](#development-setup)
- [Building](#building)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Submitting Changes](#submitting-changes)
- [Project Structure](#project-structure)

## Development Setup

### Prerequisites

1. **C Compiler** (for native library):
   - GCC 12+ or Clang 15+ (Linux/macOS)
   - MSVC (Windows)

2. **CMake** 3.12+

3. **Node.js** 26.7.0 and npm 12.0.2 (for JavaScript/WASM)

4. **Emscripten SDK** (for WebAssembly):
   ```bash
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/jrepp/ipv6-parse.git
cd ipv6-parse

# Install Node.js dependencies
npm ci

# Build WASM module (requires Emscripten)
./build_wasm.sh

# Or build C library
mkdir build && cd build
cmake ..
make
```

## Building

### C Library

**Static library (default):**
```bash
mkdir build && cd build
cmake ..
make
```

**Shared library:**
```bash
mkdir build && cd build
cmake -DBUILD_SHARED_LIBS=ON ..
make
```

**With code coverage:**
```bash
mkdir build && cd build
cmake -DENABLE_COVERAGE=ON ..
make
```

### WebAssembly

```bash
# Ensure Emscripten is activated
source /path/to/emsdk/emsdk_env.sh

# Build WASM module
./build_wasm.sh

# Clean build
./build_wasm.sh clean
```

## Testing

### Quick Test (All Tests)

```bash
./test.sh
```

This runs all tests in the correct order:
1. C library tests
2. WebAssembly build
3. ESLint
4. Build validation
5. Node.js tests
6. WASM tests
7. API tests

### Individual Test Suites

**C Library Tests:**
```bash
cd build
ctest --output-on-failure
```

**Node.js Tests:**
```bash
npm run test:node        # Node.js wrapper tests
npm run test:wasm        # WASM module tests
npm run test:api         # JavaScript API tests
```

**All JavaScript Tests:**
```bash
npm test                 # Runs all JS tests + linting
```

### Code Coverage

```bash
mkdir build && cd build
cmake -DENABLE_COVERAGE=ON ..
make
ctest
lcov --capture --directory . --output-file coverage.info
lcov --remove coverage.info '/usr/*' --output-file coverage.info
genhtml coverage.info --output-directory coverage
```

Open `coverage/index.html` to view coverage report.

## Code Quality

### Linting

**JavaScript/Node.js:**
```bash
npm run lint             # Check for issues
npm run lint:fix         # Auto-fix issues
```

**C Code:**
- Follow existing code style
- Use `-Wall -Werror -pedantic` flags
- Keep functions focused and well-documented

### Code Style

**C Code:**
- Use snake_case for functions and variables
- Use UPPER_CASE for macros and constants
- Comment all public APIs
- Keep lines under 100 characters
- Use `const` where appropriate

**JavaScript Code:**
- ES6+ syntax (classes, arrow functions, const/let)
- Use single quotes for strings
- 2-space indentation
- Semicolons required
- Follow ESLint rules (see `eslint.config.js`)

### Build Validation

Before submitting a PR, ensure build output is valid:

```bash
npm run validate
```

This checks:
- All required files exist
- WASM module is properly built
- API layer exports all classes
- TypeScript definitions are complete
- package.json is valid

## Submitting Changes

### Pull Request Process

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/my-new-feature
   ```

2. **Make your changes:**
   - Write code following style guidelines
   - Add tests for new functionality
   - Update documentation as needed

3. **Run tests locally:**
   ```bash
   ./test.sh
   ```

4. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add feature: description"
   ```

   Commit message format:
   - Use present tense ("Add feature" not "Added feature")
   - Keep first line under 72 characters
   - Add detailed description in body if needed

5. **Push and create PR:**
   ```bash
   git push origin feature/my-new-feature
   ```

   Then open a pull request on GitHub.

### PR Requirements

- [ ] All tests pass (`./test.sh`)
- [ ] Code follows style guidelines
- [ ] New tests added for new features
- [ ] Documentation updated (if applicable)
- [ ] No linting errors (`npm run lint`)
- [ ] Build validation passes (`npm run validate`)

### CI/CD

All PRs are automatically tested via GitHub Actions:
- Multi-platform builds (Linux, macOS, Windows)
- Multi-compiler testing (GCC, Clang, MSVC)
- Code coverage analysis
- Memory leak detection (Valgrind)
- ESLint checks
- Node.js tests
- WASM tests

## Project Structure

```
ipv6-parse/
├── ipv6.h                      # Public C API header
├── ipv6.c                      # Core C implementation
├── ipv6_wasm.c                 # WASM bindings
├── ipv6_config.h.in            # CMake configuration template
│
├── index.js                    # Node.js entry point
├── index.d.ts                  # Node.js TypeScript definitions
├── package.json                # NPM package configuration
│
├── docs/                       # WebAssembly distribution
│   ├── index.html             # Interactive demo
│   ├── ipv6-parse.js          # WASM module (generated)
│   ├── ipv6-parse-api.js      # JavaScript API layer
│   └── ipv6-parse-api.d.ts    # TypeScript definitions
│
├── test/                       # Test suite
│   ├── test-node.js           # Node.js wrapper tests
│   ├── test-wasm.js           # WASM module tests
│   ├── test-api.js            # API layer tests
│   ├── check-wasm.js          # Pre-test WASM check
│   └── validate-build.js      # Build validation
│
├── cmake/                      # CMake modules
│   ├── emscripten.cmake       # Emscripten toolchain
│   └── ipv6-parse-config.cmake.in
│
├── debian/                     # Debian packaging
├── .github/workflows/          # CI/CD pipelines
│   ├── ci.yml                 # Continuous integration
│   └── release.yml            # Release automation
│
├── CMakeLists.txt             # CMake configuration
├── build_wasm.sh              # WASM build script
├── test.sh                    # Comprehensive test script
│
└── README.md                  # Main documentation
```

## Questions?

- Open an issue on GitHub
- Email: jacobrepp@gmail.com

## License

By contributing to ipv6-parse, you agree that your contributions will be licensed under the MIT License.
