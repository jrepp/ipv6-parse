#!/usr/bin/env bash
# Comprehensive test script for local development

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================${NC}"
echo -e "${BLUE}IPv6-Parse Comprehensive Test Suite${NC}"
echo -e "${BLUE}======================================${NC}\n"

# Function to print section headers
print_section() {
  echo -e "\n${BLUE}▶ $1${NC}"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Function to run command and check result
run_test() {
  local name="$1"
  local cmd="$2"

  echo -e "${YELLOW}Running: ${name}${NC}"
  if eval "$cmd"; then
    echo -e "${GREEN}✓ ${name} passed${NC}"
    return 0
  else
    echo -e "${RED}✗ ${name} failed${NC}"
    return 1
  fi
}

# Track test results
TESTS_PASSED=0
TESTS_FAILED=0

# 1. C Library Tests
print_section "C Library Tests"

if command -v cmake &> /dev/null; then
  if [ ! -d "build" ]; then
    echo "Creating build directory..."
    mkdir -p build
    cd build
    cmake .. -DENABLE_COVERAGE=OFF -DIPV6_PARSE_LIBRARY_ONLY=OFF
    cd ..
  fi

  if run_test "Build C library" "cmake --build build --config Release"; then
    ((TESTS_PASSED++))
  else
    ((TESTS_FAILED++))
  fi

  if run_test "C library tests" "cd build && ctest --output-on-failure -C Release"; then
    ((TESTS_PASSED++))
  else
    ((TESTS_FAILED++))
  fi
else
  echo -e "${YELLOW}⚠ CMake not found, skipping C library tests${NC}"
fi

# 2. WebAssembly Build
print_section "WebAssembly Build"

if [ -n "$EMSDK" ]; then
  if run_test "Build WASM module" "./build_wasm.sh"; then
    ((TESTS_PASSED++))
  else
    ((TESTS_FAILED++))
  fi
else
  echo -e "${YELLOW}⚠ Emscripten not found, skipping WASM build${NC}"
  echo "  Set up Emscripten: source /path/to/emsdk/emsdk_env.sh"

  # Check if WASM already exists
  if [ -f "docs/ipv6-parse.js" ]; then
    echo -e "${GREEN}  ✓ Using existing WASM build${NC}"
  else
    echo -e "${RED}  ✗ WASM module not found, some tests will fail${NC}"
  fi
fi

# 3. Node.js Setup
print_section "Node.js Setup"

if command -v node &> /dev/null; then
  echo "Node.js version: $(node --version)"
  echo "npm version: $(npm --version)"

  if [ ! -d "node_modules" ]; then
    if run_test "Install npm dependencies" "npm install"; then
      ((TESTS_PASSED++))
    else
      ((TESTS_FAILED++))
    fi
  else
    echo -e "${GREEN}✓ npm dependencies already installed${NC}"
  fi
else
  echo -e "${RED}✗ Node.js not found, cannot run JavaScript tests${NC}"
  exit 1
fi

# 4. Linting
print_section "Code Linting (ESLint)"

if run_test "ESLint" "npm run lint"; then
  ((TESTS_PASSED++))
else
  ((TESTS_FAILED++))
  echo -e "${YELLOW}  Tip: Run 'npm run lint:fix' to auto-fix issues${NC}"
fi

# 5. Build Validation
print_section "Build Output Validation"

if run_test "Validate build output" "npm run validate"; then
  ((TESTS_PASSED++))
else
  ((TESTS_FAILED++))
fi

# 6. Node.js Tests
print_section "Node.js Tests"

if run_test "Node.js wrapper tests" "npm run test:node"; then
  ((TESTS_PASSED++))
else
  ((TESTS_FAILED++))
fi

# 7. WASM Tests
print_section "WebAssembly Module Tests"

if run_test "WASM module tests" "npm run test:wasm"; then
  ((TESTS_PASSED++))
else
  ((TESTS_FAILED++))
fi

# 8. API Tests
print_section "JavaScript API Tests"

if run_test "API layer tests" "npm run test:api"; then
  ((TESTS_PASSED++))
else
  ((TESTS_FAILED++))
fi

# Summary
print_section "Test Summary"

echo ""
echo -e "Tests passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}═══════════════════════════════════${NC}"
  echo -e "${GREEN}✓ All tests passed successfully!${NC}"
  echo -e "${GREEN}═══════════════════════════════════${NC}\n"
  exit 0
else
  echo -e "${RED}═══════════════════════════════════${NC}"
  echo -e "${RED}✗ Some tests failed${NC}"
  echo -e "${RED}═══════════════════════════════════${NC}\n"
  exit 1
fi
