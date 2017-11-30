cmake_minimum_required(VERSION 3.1)

project(ipv6)

SET(PARSE_TRACE "" CACHE STRING "Enable tracing of address parsing")

# Check the for the windows secure CRT version of snprintf
if (MSVC)
    include(CheckSymbolExists)
    set (CMAKE_REQUIRED_FLAGS "/MTd")
    check_symbol_exists(_snprintf_s "stdio.h" HAVE__SNPRINTF_S)
endif (MSVC)

# Include header checks
include (CheckIncludeFiles)
CHECK_INCLUDE_FILES(malloc.h HAVE_MALLOC_H)
CHECK_INCLUDE_FILES(alloca.h HAVE_ALLOCA_H)
CHECK_INCLUDE_FILES(string.h HAVE_STRING_H)
CHECK_INCLUDE_FILES(stdio.h HAVE_STDIO_H)
CHECK_INCLUDE_FILES(stdarg.h HAVE_STDARG_H)
CONFIGURE_FILE(ipv6_config.h.in ipv6_config.h)

# Use bin as the directory for all executables.
# This will make protoc easy to find.
set(EXECUTABLE_OUTPUT_PATH ${PROJECT_BINARY_DIR}/bin)
set(LIBRARY_OUTPUT_PATH ${PROJECT_BINARY_DIR}/bin)

# Windows builds subdirectories Debug/Release.
# These variables will overwrite that and put binaries in bin.
set(CMAKE_LIBRARY_OUTPUT_DIRECTORY_DEBUG ${PROJECT_BINARY_DIR}/bin)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY_DEBUG ${PROJECT_BINARY_DIR}/bin)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY_DEBUG ${PROJECT_BINARY_DIR}/bin)

set(CMAKE_LIBRARY_OUTPUT_DIRECTORY_RELEASE ${PROJECT_BINARY_DIR}/bin)
set(CMAKE_ARCHIVE_OUTPUT_DIRECTORY_RELEASE ${PROJECT_BINARY_DIR}/bin)
set(CMAKE_RUNTIME_OUTPUT_DIRECTORY_RELEASE ${PROJECT_BINARY_DIR}/bin)

# Build with c++14 support.
set(CMAKE_CXX_STANDARD 14)

# Allow creating filters for projects in visual studio.
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

if(COMMAND cmake_policy)
    cmake_policy(SET CMP0003 NEW)
endif()

file(GLOB sources "ipv6.h" "ipv6.c")

include_directories(build)

if (MSVC)
    set(CMAKE_C_FLAGS_DEBUG "/MTd /Wall /ZI /Od /D_NO_CRT_STDIO_INLINE=1" CACHE STRING "" FORCE)
    set(CMAKE_C_FLAGS_RELEASE "/MT /Wall" CACHE STRING "" FORCE)
else ()
    set(CMAKE_C_FLAGS "-Wall -Wno-long-long -pedantic -std=c99")
endif ()

if (NOT IPV6_PARSE_LIBRARY_ONLY)
    add_executable(ipv6-test ${sources} "test.c")
    add_executable(ipv6-cmd ${sources} "cmdline.c")
    if (MSVC)
        set_target_properties(ipv6-test PROPERTIES COMPILE_FLAGS "/MT")
    endif ()
endif ()

add_library(ipv6-parse ${sources})

if (PARSE_TRACE)
    add_definitions(-DPARSE_TRACE=1)
endif ()

