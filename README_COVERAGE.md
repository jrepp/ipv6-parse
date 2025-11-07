# Code Coverage Guide for IPv6-Parse

This guide explains how to run code coverage analysis on the IPv6-parse library.

## Quick Start

### Option 1: Manual Build (Recommended when CMake unavailable)

```bash
./build_and_test_coverage.sh
```

This will:
1. Clean previous coverage data
2. Generate config headers for macOS/Linux
3. Compile with coverage instrumentation
4. Run tests
5. Generate coverage report

### Option 2: CMake Build

```bash
./run_coverage.sh
```

This will:
1. Configure CMake with `ENABLE_COVERAGE=1`
2. Build the project
3. Run all tests
4. Generate HTML coverage report (if lcov/genhtml available)

## Requirements

### Minimum Requirements
- GCC or Clang compiler
- gcov (usually included with GCC)

### Optional (for HTML reports)
- lcov - Coverage data processing
- genhtml - HTML report generation

Install on macOS:
```bash
brew install lcov
```

Install on Ubuntu/Debian:
```bash
sudo apt-get install lcov
```

## Test Suites

The project includes two test suites:

### 1. Original Test Suite (test.c)
- 315 tests
- Comprehensive testing of core functionality
- IPv6/IPv4 parsing, comparison, conversion

### 2. Extended Test Suite (test_extended.c)
- 36 tests
- Targets previously uncovered code paths
- Edge cases and error handling

## Manual Coverage Workflow

### Step 1: Compile with Coverage
```bash
gcc -std=c99 -Wall -Wno-long-long -pedantic \
    --coverage -O0 -g \
    -o ipv6-test ipv6.c test.c
```

### Step 2: Run Tests
```bash
./ipv6-test
```

This generates `.gcda` files with execution counts.

### Step 3: Generate Coverage Report
```bash
gcov -b ipv6.c
```

This creates `ipv6.c.gcov` with line-by-line coverage.

### Step 4: View Results
```bash
# Summary
head -5 ipv6.c.gcov

# Find uncovered lines (marked with #####)
grep "^    #####:" ipv6.c.gcov | head -20

# Find partially covered branches (marked with *, -, or numbers)
grep -E "branch.*(never|taken 0%)" ipv6.c.gcov | head -20
```

## Coverage Report Format

The `.gcov` file format:

```
        -:    0:Source:ipv6.c
        3:   15:    int x = 0;      // Executed 3 times
    #####:   16:    return -1;      // Never executed
branch  0 taken 75%                 // Branch taken 75% of the time
branch  1 taken 25% (fallthrough)  // Branch taken 25% of the time
```

- `-`: Line not executable (comments, declarations)
- Number: Execution count
- `#####`: Never executed
- `branch N taken X%`: Branch coverage

## CMake Integration

To enable coverage in your own CMake build:

```bash
mkdir build
cd build
cmake -DENABLE_COVERAGE=1 -DIPV6_PARSE_LIBRARY_ONLY=OFF ..
make
ctest
```

Then generate reports:
```bash
cd ..
gcov -b build/CMakeFiles/ipv6-test.dir/ipv6.c.o
```

## Coverage Targets

Current coverage status:
- **Line Coverage**: 89.45% (455 lines)
- **Branch Coverage**: 98.83% executed, 80.08% taken
- **Target**: > 90% line and branch coverage

## Interpreting Results

### Good Coverage
- Core parsing functions: > 95%
- Error handling: > 80%
- Public API: 100%

### Expected Low Coverage Areas
- Platform-specific code (#ifdef blocks)
- Unreachable error conditions
- Defensive error checks

### Investigating Low Coverage

1. **Find uncovered lines:**
   ```bash
   grep "^    #####:" ipv6.c.gcov
   ```

2. **Check if line is testable:**
   - Error recovery paths?
   - Platform-specific?
   - Defensive check?

3. **Write test if needed:**
   - Add to test_extended.c
   - Verify coverage improves

## Common Issues

### Issue: "gcov: no such file or directory"

The gcov files include the executable name. Try:
```bash
gcov -b <executable-name>-ipv6.gcda
# Example: gcov -b ipv6-test-ipv6.gcda
```

### Issue: "cannot open source file"

Make sure you run gcov from the directory containing the source files.

### Issue: Coverage data shows 0%

Ensure:
1. Compiled with `--coverage`
2. Linked with `--coverage`
3. Tests actually ran (check return code)
4. `.gcda` files were created (ls *.gcda)

## Best Practices

1. **Clean between runs:**
   ```bash
   rm -f *.gcda *.gcno *.gcov
   ```

2. **Test both suites:**
   ```bash
   ./ipv6-test && ./ipv6-test-extended
   # Then run gcov to see combined coverage
   ```

3. **Focus on uncovered branches:**
   Branch coverage often reveals edge cases.

4. **Don't aim for 100%:**
   90-95% is excellent for real-world code.

## Continuous Integration

Example GitHub Actions workflow:

```yaml
- name: Run tests with coverage
  run: |
    ./build_and_test_coverage.sh

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./ipv6.c.gcov
```

## Additional Resources

- [GCC Coverage Documentation](https://gcc.gnu.org/onlinedocs/gcc/Gcov.html)
- [LCOV Documentation](http://ltp.sourceforge.net/coverage/lcov.php)
- [Coverage Best Practices](https://en.wikipedia.org/wiki/Code_coverage)

## Troubleshooting

For issues or questions:
1. Check that all prerequisites are installed
2. Verify compilation succeeded with `--coverage`
3. Ensure tests ran successfully
4. Check file permissions on `.gcda` files

## License

Coverage tools and scripts: MIT License (same as IPv6-parse)
