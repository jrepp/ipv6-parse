#!/bin/bash 

set -e

# Generate the build_gmake folder
if [ ! -d build_gmake ]; then
    ./cmake_gmake.sh
fi

# Create the test application
pushd build_gmake
make all

# Run the tests collecting failures
bin/ipv6-test > test_results.md
failures=`grep -c FAIL test_results.md`
popd

echo "Completed test pass, ${failures} failures. See build_gmake/test_results.md"
