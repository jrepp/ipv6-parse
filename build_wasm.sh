#!/usr/bin/env bash
# Build script for WebAssembly target using Emscripten

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}IPv6-Parse WebAssembly Build Script${NC}"
echo "========================================"

# Check if Emscripten is installed
if [ -z "$EMSDK" ]; then
    echo -e "${RED}Error: EMSDK environment variable not set${NC}"
    echo "Please install and activate Emscripten SDK:"
    echo "  git clone https://github.com/emscripten-core/emsdk.git"
    echo "  cd emsdk"
    echo "  ./emsdk install latest"
    echo "  ./emsdk activate latest"
    echo "  source ./emsdk_env.sh"
    exit 1
fi

echo -e "${GREEN}✓${NC} Emscripten SDK found at: $EMSDK"

# Build directory
BUILD_DIR="build_wasm"
OUTPUT_DIR="docs"

# Clean previous build if requested
if [ "$1" == "clean" ]; then
    echo -e "${YELLOW}Cleaning previous build...${NC}"
    rm -rf "$BUILD_DIR"
    rm -rf "$OUTPUT_DIR"
fi

# Create build directory
mkdir -p "$BUILD_DIR"

# Configure with CMake
echo -e "${GREEN}Configuring CMake for WebAssembly...${NC}"
cd "$BUILD_DIR"

# Use library-only mode for WASM
export IPV6_PARSE_LIBRARY_ONLY=ON

emcmake cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DIPV6_PARSE_LIBRARY_ONLY=ON \
    -DENABLE_COVERAGE=OFF \
    -DPARSE_TRACE=0

# Build the WASM module directly with emcc
echo -e "${GREEN}Building WebAssembly module with JavaScript bindings...${NC}"

cd ..

# Create output directory for GitHub Pages
mkdir -p "$OUTPUT_DIR"

# Compile the WASM module
emcc ipv6.c ipv6_wasm.c \
    -I${BUILD_DIR} \
    -O3 \
    -s WASM=1 \
    -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ToString","stringToUTF8"]' \
    -s EXPORTED_FUNCTIONS='["_malloc","_free"]' \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME='createIPv6Module' \
    -s ENVIRONMENT='web' \
    -s SINGLE_FILE=1 \
    --no-entry \
    -o "$OUTPUT_DIR/ipv6-parse.js"

# Check if build succeeded
if [ ! -f "$OUTPUT_DIR/ipv6-parse.js" ]; then
    echo -e "${RED}Error: WASM module not built${NC}"
    exit 1
fi

echo -e "${GREEN}✓${NC} WASM module built successfully"
echo -e "${GREEN}✓${NC} Output: $OUTPUT_DIR/ipv6-parse.js"

echo ""
echo -e "${GREEN}Build completed successfully!${NC}"
echo ""
echo "Generated files:"
echo "  📦 $OUTPUT_DIR/ipv6-parse.js (WASM module + JS glue)"
echo ""
echo "Source files (version controlled):"
echo "  📄 $OUTPUT_DIR/ipv6-parse-api.js (Clean JavaScript API)"
echo "  📄 $OUTPUT_DIR/index.html (Interactive demo page)"
echo "  📄 $OUTPUT_DIR/README.md (Documentation)"
echo ""
echo "Test locally:"
echo "  python3 -m http.server --directory $OUTPUT_DIR 8000"
echo "  Then open: http://localhost:8000"
echo ""
echo "Deploy to GitHub Pages:"
echo "  git add docs/"
echo "  git commit -m 'Update WASM build'"
echo "  git push"
