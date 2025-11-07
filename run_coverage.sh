#!/bin/bash
# Script to generate code coverage reports for ipv6-parse

set -e

echo "=== IPv6 Parse Code Coverage Analysis ==="
echo ""

# Clean previous build and coverage data
echo "Cleaning previous build and coverage data..."
rm -rf build_coverage
mkdir -p build_coverage
cd build_coverage

# Configure with coverage enabled
echo "Configuring CMake with coverage enabled..."
cmake -DENABLE_COVERAGE=1 -DIPV6_PARSE_LIBRARY_ONLY=OFF ..

# Build the project
echo "Building project..."
make -j4

# Run tests to generate coverage data
echo ""
echo "Running tests to generate coverage data..."
./bin/ipv6-test
./bin/ipv6-fuzz

# Generate coverage reports
echo ""
echo "Generating coverage report..."
cd ..

# Check if lcov is available
if command -v lcov &> /dev/null; then
    echo "Using lcov to generate HTML report..."
    lcov --capture --directory build_coverage --output-file build_coverage/coverage.info
    lcov --remove build_coverage/coverage.info '/usr/*' --output-file build_coverage/coverage.info
    lcov --list build_coverage/coverage.info

    if command -v genhtml &> /dev/null; then
        genhtml build_coverage/coverage.info --output-directory build_coverage/coverage_html
        echo ""
        echo "HTML coverage report generated in: build_coverage/coverage_html/index.html"
    fi
else
    echo "lcov not found. Using gcov directly..."
    cd build_coverage
    gcov -r ../ipv6.c
    echo ""
    echo "Coverage files generated: *.gcov"
    cd ..
fi

echo ""
echo "=== Coverage Analysis Complete ==="
echo "To view text summary, check the output above"
echo "To view detailed HTML report: open build_coverage/coverage_html/index.html"
