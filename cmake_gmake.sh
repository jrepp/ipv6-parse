#!/bin/bash

set -e

mkdir -p build_gmake
pushd build_gmake || exit

# -DCMAKE_RULE_MESSAGES:BOOL=OFF -DCMAKE_VERBOSE_MAKEFILE:BOOL=ON
cmake -DCMAKE_BUILD_TYPE=Debug -G "Unix Makefiles" ..
# make --no-print-directory

popd || exit
