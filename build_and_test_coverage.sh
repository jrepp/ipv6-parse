#!/bin/bash
# Manual build script with coverage for ipv6-parse (when cmake is not available)

set -e

echo "=== IPv6 Parse Code Coverage Analysis (Manual Build) ==="
echo ""

# Clean previous coverage data
echo "Cleaning previous coverage data..."
rm -f *.gcda *.gcno *.gcov
rm -f ipv6-test-coverage

# Generate config headers manually
echo "Generating config headers..."
cat > ipv6_config.h << 'EOF'
/* #undef HAVE_MALLOC_H */
#define HAVE_STRING_H 1
#define HAVE_STDIO_H 1
#define HAVE_STDARG_H 1
#define HAVE_ALLOCA_H 1
EOF

cat > ipv6_test_config.h << 'EOF'
/* #undef HAVE_WINSOCK_2_H */
#define HAVE_SYS_SOCKET_H 1
#define HAVE_NETINET_IN_H 1
#define HAVE_ARPA_INET_H 1
#define HAVE_ASSERT_H 1
/* #undef HAVE_WS_2_TCPIP_H */
EOF

# Compile with coverage flags
echo "Compiling with coverage instrumentation..."
gcc -std=c99 -Wall -Wno-long-long -pedantic \
    --coverage -O0 -g \
    -o ipv6-test-coverage \
    ipv6.c test.c

echo ""
echo "Running tests to generate coverage data..."
./ipv6-test-coverage

# Generate coverage report
echo ""
echo "Generating coverage report..."
gcov -b ipv6.c

echo ""
echo "=== Coverage Summary ==="
if [ -f ipv6.c.gcov ]; then
    # Extract summary statistics
    echo ""
    echo "Detailed coverage saved to: ipv6.c.gcov"
    echo ""
    echo "Lines coverage:"
    grep -E "^Lines executed:" ipv6.c.gcov || true
    echo ""
    echo "Branches coverage:"
    grep -E "^Branches executed:" ipv6.c.gcov || true
    echo ""

    # Show uncovered lines
    echo "=== Uncovered or Partially Covered Lines ==="
    grep -E "^\s+#####:|^\s+[0-9]+\*:" ipv6.c.gcov | head -30 || echo "All lines covered or error parsing"
fi

echo ""
echo "=== Coverage Analysis Complete ==="
echo "Review ipv6.c.gcov for detailed line-by-line coverage"
