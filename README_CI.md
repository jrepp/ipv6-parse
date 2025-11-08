# Continuous Integration (CI) Guide

This document describes the CI/CD setup for the IPv6-parse project.

## Overview

The project uses GitHub Actions for continuous integration with the following features:

1. **Multi-platform builds** - Linux, macOS, Windows
2. **Multiple compiler versions** - GCC 11-12, Clang 11-15, MSVC, MinGW
3. **Code coverage analysis** - Using gcov/lcov
4. **Memory leak detection** - Using Valgrind
5. **Automated testing** - All test suites run on every commit

## Workflows

### Coverage & Memory Check Job

**Job**: `coverage`
**Runs on**: Ubuntu Latest
**Triggers**: Push, Pull Request, Release, Weekly Schedule

This job performs comprehensive quality checks:

#### Steps:

1. **Install Dependencies**
   ```bash
   sudo apt-get install -y lcov valgrind
   ```

2. **Build with Coverage**
   ```bash
   cmake -DENABLE_COVERAGE=1 -DIPV6_PARSE_LIBRARY_ONLY=OFF ..
   cmake --build . -j
   ```

3. **Run All Tests**
   - Original test suite (315 tests)
   - Extended test suite (36 tests)
   - Fuzz tests

4. **Generate Coverage Report**
   - Uses lcov to collect coverage data
   - Filters out system files
   - Uploads to Codecov

5. **Memory Leak Detection**
   - Runs Valgrind on all test binaries
   - Checks for memory leaks
   - Verifies no invalid memory access
   - Uses suppression file for false positives

### Multi-Platform Build Job

**Job**: `cpp_build`
**Runs on**: Ubuntu, macOS, Windows
**Matrix**: 11 different compiler/OS combinations

Ensures compatibility across:
- **Linux**: GCC 11-12, Clang 11-15
- **macOS**: Clang, AppleClang
- **Windows**: MSVC, MinGW-GCC

Each build:
1. Checks out code
2. Installs compiler-specific dependencies
3. Configures with CMake
4. Builds the project
5. Runs tests (Linux/macOS only)

## Badges

Add these badges to your README.md:

```markdown
![CI Build Status](https://github.com/jrepp/ipv6-parse/workflows/CI%20Build%20Tests/badge.svg)
[![codecov](https://codecov.io/gh/jrepp/ipv6-parse/branch/master/graph/badge.svg)](https://codecov.io/gh/jrepp/ipv6-parse)
```

## Coverage Reporting

### Codecov Integration

Coverage reports are automatically uploaded to [Codecov](https://codecov.io) after each build.

Features:
- Line and branch coverage tracking
- Pull request comments with coverage diff
- Coverage trend graphs
- Configurable coverage thresholds

### Local Coverage

To run coverage locally:

```bash
# Using the provided script
./run_coverage.sh

# Or manually
mkdir build && cd build
cmake -DENABLE_COVERAGE=1 -DIPV6_PARSE_LIBRARY_ONLY=OFF ..
cmake --build . -j
ctest
lcov --capture --directory . --output-file coverage.info
lcov --remove coverage.info '/usr/*' --output-file coverage.info
genhtml coverage.info --output-directory coverage_html
open coverage_html/index.html  # View in browser
```

## Valgrind Memory Checking

### What is Checked

Valgrind detects:
- Memory leaks (allocated but not freed)
- Use of uninitialized values
- Invalid memory access
- Double frees
- Mismatched allocations (malloc/delete, new/free)

### Running Valgrind Locally

```bash
# Basic check
valgrind --leak-check=full ./build/bin/ipv6-test

# Detailed check (same as CI)
valgrind --leak-check=full \
         --show-leak-kinds=all \
         --track-origins=yes \
         --verbose \
         --error-exitcode=1 \
         --suppressions=valgrind.supp \
         ./build/bin/ipv6-test
```

### Suppression File

The `valgrind.supp` file contains suppressions for known false positives.

To add a new suppression:

1. Run Valgrind and get the error
2. Generate suppression:
   ```bash
   valgrind --gen-suppressions=all ./build/bin/ipv6-test 2>&1 | grep -A 20 "insert_a_suppression_name_here"
   ```
3. Copy the suppression block to `valgrind.supp`
4. Give it a descriptive name

## Troubleshooting

### Coverage Not Generated

**Problem**: No coverage data after running tests

**Solutions**:
1. Ensure built with `ENABLE_COVERAGE=1`
2. Check `.gcda` files exist: `find . -name "*.gcda"`
3. Verify tests actually ran: `echo $?` after test execution
4. Clean and rebuild: `rm -rf build && mkdir build`

### Valgrind Errors

**Problem**: Valgrind reports leaks or errors

**Solutions**:
1. Check if it's a real leak or false positive
2. For false positives, add to `valgrind.supp`
3. For real leaks, fix the code and verify:
   ```bash
   valgrind --leak-check=full ./build/bin/ipv6-test
   ```

### CI Build Failures

**Problem**: CI passes locally but fails on GitHub

**Solutions**:
1. Check compiler versions match
2. Look at full CI logs for specific errors
3. Ensure dependencies are installed
4. Test in Docker with same OS/compiler:
   ```bash
   docker run -it ubuntu:latest bash
   # Install dependencies and test
   ```

### macOS Specific Issues

**Problem**: Valgrind not available on macOS

**Note**: Valgrind has limited support on macOS. The CI only runs Valgrind on Linux.

For macOS memory checking, use:
- **Instruments** (Xcode's Leaks tool)
- **AddressSanitizer**: `cmake -DCMAKE_CXX_FLAGS="-fsanitize=address" ..`
- **LeakSanitizer**: `cmake -DCMAKE_CXX_FLAGS="-fsanitize=leak" ..`

## Adding New Compilers

To test with a new compiler version:

1. Edit `.github/workflows/ci.yml`
2. Add to the matrix:
   ```yaml
   - os: ubuntu-latest
     CC: gcc-13
     CXX: g++-13
     CMAKE_CMD: cmake ..
     NAME: gcc-13
   ```
3. Update dependencies step if needed
4. Commit and push

## Performance Considerations

### Build Times

Typical CI build times:
- Coverage job: ~2-3 minutes
- Linux builds: ~1-2 minutes each
- macOS builds: ~2-3 minutes each
- Windows builds: ~3-5 minutes each

Total CI time: ~15-20 minutes for all jobs

### Optimization Tips

1. **Use ccache**: Cache compiler outputs
   ```yaml
   - uses: actions/cache@v3
     with:
       path: ~/.ccache
       key: ${{ runner.os }}-ccache-${{ github.sha }}
   ```

2. **Parallel builds**: Already using `cmake --build . -j`

3. **Matrix limits**: Consider if all compiler versions are needed

## Maintenance

### Weekly Schedule

The CI runs weekly (Sundays at 3:30 AM UTC) to catch:
- Dependency updates
- Platform changes
- Bitrot

### Updates Needed

Periodically update:
- Compiler versions in matrix
- GitHub Actions versions (`actions/checkout@v3`, etc.)
- OS versions (`ubuntu-latest`, etc.)
- Dependencies (lcov, valgrind)

### Monitoring

Check regularly:
- [GitHub Actions](https://github.com/jrepp/ipv6-parse/actions)
- [Codecov Dashboard](https://codecov.io/gh/jrepp/ipv6-parse)
- Test failure trends
- Coverage trends

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Codecov Documentation](https://docs.codecov.com/)
- [Valgrind Manual](https://valgrind.org/docs/manual/manual.html)
- [gcov Documentation](https://gcc.gnu.org/onlinedocs/gcc/Gcov.html)
- [lcov Documentation](http://ltp.sourceforge.net/coverage/lcov.php)

## Support

For CI issues:
1. Check the [Actions tab](https://github.com/jrepp/ipv6-parse/actions)
2. Review workflow logs
3. Open an issue with:
   - Job name that failed
   - Error message
   - Link to failed run
   - Steps to reproduce locally
