#!/bin/bash 

set -e

# Generate the build folder
if [ ! -d build ]; then
    ./cmake_gmake.sh
fi

# Create the test application
pushd build
make all

# Run the tests collecting failures
bin/ipv6-test > test_results.md
failures=`grep -c FAIL test_results.md`
popd

echo "Completed test pass, ${failures} failures. See build/test_results.md"
