# Emscripten toolchain file for building WebAssembly target
# Usage: cmake -DCMAKE_TOOLCHAIN_FILE=cmake/emscripten.cmake -S . -B build_wasm

# Check if EMSCRIPTEN environment variable is set
if(NOT DEFINED ENV{EMSDK})
    message(FATAL_ERROR
        "EMSDK environment variable not set. Please install and activate Emscripten SDK:\n"
        "  git clone https://github.com/emscripten-core/emsdk.git\n"
        "  cd emsdk\n"
        "  ./emsdk install latest\n"
        "  ./emsdk activate latest\n"
        "  source ./emsdk_env.sh")
endif()

# Set the Emscripten root path
set(EMSCRIPTEN_ROOT_PATH "$ENV{EMSDK}/upstream/emscripten")

if(NOT EXISTS ${EMSCRIPTEN_ROOT_PATH})
    message(FATAL_ERROR "Emscripten not found at ${EMSCRIPTEN_ROOT_PATH}")
endif()

# Set CMake system and compilers
set(CMAKE_SYSTEM_NAME Emscripten)
set(CMAKE_SYSTEM_VERSION 1)
set(CMAKE_CROSSCOMPILING TRUE)

# Set the compilers
set(CMAKE_C_COMPILER "${EMSCRIPTEN_ROOT_PATH}/emcc")
set(CMAKE_CXX_COMPILER "${EMSCRIPTEN_ROOT_PATH}/em++")
set(CMAKE_AR "${EMSCRIPTEN_ROOT_PATH}/emar" CACHE FILEPATH "Emscripten ar")
set(CMAKE_RANLIB "${EMSCRIPTEN_ROOT_PATH}/emranlib" CACHE FILEPATH "Emscripten ranlib")

# Set the find root path
set(CMAKE_FIND_ROOT_PATH ${EMSCRIPTEN_ROOT_PATH})
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)

# Emscripten-specific flags
set(CMAKE_C_FLAGS_INIT "-s WASM=1")
set(CMAKE_CXX_FLAGS_INIT "-s WASM=1")

# Set executable suffix
set(CMAKE_EXECUTABLE_SUFFIX ".js")

message(STATUS "Emscripten toolchain configured")
message(STATUS "  EMSCRIPTEN_ROOT_PATH: ${EMSCRIPTEN_ROOT_PATH}")
message(STATUS "  CMAKE_C_COMPILER: ${CMAKE_C_COMPILER}")
