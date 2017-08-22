#!/bin/bash 
./cmake_gmake.sh
pushd build
make all
bin/test_app > test_results.md
failures=`grep -c FAIL test_results.md`
popd

echo "Completed test pass, ${failures} failures. See build/test_results.md"

