#!/bin/bash 

set -x
set -eof pipefail

# Generate the build_gmake folder
./cmake_gmake.sh

# Create the test application
pushd build_gmake
make ipv6-test ipv6-fuzz


# Run the tests collecting failures
pushd bin

echo "running test with results in test_results.md"
./ipv6-test > test_results.md
failures=`grep -c FAIL test_results.md`

# Run the fuzzer
echo "fuzzing with results in fuzz_results.md"
./ipv6-test > fuzz_results.md
fuzz_result=$?

popd
popd

echo "Completed test pass, ${failures} failures. Fuzzer result: ${fuzz_result}."
