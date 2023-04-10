cmake_minimum_required(VERSION 3.1)

find_program(CCACHE_PROGRAM ccache)
if(CCACHE_PROGRAM)
    message(STATUS "IPv6-Parse: Found ccache package... Activating...")
    set_property(GLOBAL PROPERTY RULE_LAUNCH_COMPILE "${CCACHE_PROGRAM}")
endif()

set(LIB_MAJOR_VERSION "1")
set(LIB_MINOR_VERSION "2")
set(LIB_PATCH_VERSION "1")
set(LIB_VERSION_STRING "${LIB_MAJOR_VERSION}.${LIB_MINOR_VERSION}.${LIB_PATCH_VERSION}")

if(CMAKE_VERSION VERSION_LESS 3.0)
    project(ipv6 C)
    enable_language(C)
    enable_language(CXX)
else()
    cmake_policy(SET CMP0003 NEW)
    cmake_policy(SET CMP0048 NEW)
    project(ipv6 VERSION "${LIB_VERSION_STRING}" LANGUAGES C CXX)
endif()

## This section describes our general CMake setup options
set_property(GLOBAL PROPERTY USE_FOLDERS ON)
set(CMAKE_POSITION_INDEPENDENT_CODE ON)
set(CMAKE_SKIP_INSTALL_RULES OFF FORCE)
set(CMAKE_SKIP_PACKAGE_ALL_DEPENDENCY ON FORCE)
set(CMAKE_SUPPRESS_REGENERATION ON)
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${CMAKE_CURRENT_SOURCE_DIR}/cmake)

# Build with c++17 support.
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

## We only build static binaries -- this is left here for our dependencies
set(STATIC ON CACHE BOOL FORCE "Link libraries statically? Forced to ON")
add_definitions(-DSTATICLIB)

SET(PARSE_TRACE 0 CACHE BOOL "Enable tracing of address parsing")

option(IPV6_PARSE_LIBRARY_ONLY "Build Only the Library" ON)
if(DEFINED ENV{IPV6_PARSE_LIBRARY_ONLY})
  set(IPV6_PARSE_LIBRARY_ONLY $ENV{IPV6_PARSE_LIBRARY_ONLY})
endif()

# Include header checks
include (CheckIncludeFiles)
CHECK_INCLUDE_FILES(malloc.h HAVE_MALLOC_H)
CHECK_INCLUDE_FILES(alloca.h HAVE_ALLOCA_H)
CHECK_INCLUDE_FILES(string.h HAVE_STRING_H)
CHECK_INCLUDE_FILES(stdio.h HAVE_STDIO_H)
CHECK_INCLUDE_FILES(stdarg.h HAVE_STDARG_H)

configure_file(ipv6_config.h.in ipv6_config.h)
set(IPV6_CONFIG_HEADER_PATH ${CMAKE_CURRENT_BINARY_DIR})
message("-- Including ipv6_config.h from ${IPV6_CONFIG_HEADER_PATH}")

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

# Allow creating filters for projects in visual studio.
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

file(GLOB ipv6_sources "ipv6.h" "ipv6.c" ${IPV6_CONFIG_HEADER_PATH}/ipv6_config.h)

if (MSVC)
    set(ipv6_target_compile_flags "/MTd /Wall /ZI /Od /D_NO_CRT_STDIO_INLINE=1")
else ()
    set(ipv6_target_compile_flags "-Wall -Wno-long-long -pedantic -std=c99 -Wno-unused-but-set-variable")
endif ()

if (NOT IPV6_PARSE_LIBRARY_ONLY)
    CHECK_INCLUDE_FILES(winsock2.h HAVE_WINSOCK_2_H)
    CHECK_INCLUDE_FILES(sys/socket.h HAVE_SYS_SOCKET_H)
    CHECK_INCLUDE_FILES(netinet/in.h HAVE_NETINET_IN_H)
    CHECK_INCLUDE_FILES(arpa/inet.h HAVE_ARPA_INET_H)
    CHECK_INCLUDE_FILES(ws2tcpip.h HAVE_WS_2_TCPIP_H)
    CHECK_INCLUDE_FILES(assert.h HAVE_ASSERT_H)

    configure_file(ipv6_test_config.h.in ipv6_test_config.h)
    set(IPV6_TEST_CONFIG_HEADER_PATH ${CMAKE_CURRENT_BINARY_DIR})

    add_executable(ipv6-test ${ipv6_sources} "test.c")
    add_executable(ipv6-cmd ${ipv6_sources} "cmdline.c")

    set_target_properties(ipv6-test PROPERTIES COMPILE_FLAGS ${ipv6_target_compile_flags})
    set_target_properties(ipv6-cmd PROPERTIES COMPILE_FLAGS ${ipv6_target_compile_flags})

    target_include_directories(ipv6-test PRIVATE ${IPV6_CONFIG_HEADER_PATH} ${IPV6_TEST_CONFIG_HEADER_PATH})
    target_include_directories(ipv6-cmd PRIVATE ${IPV6_CONFIG_HEADER_PATH})

    if (MSVC)
        target_link_libraries(ipv6-test ws2_32)
        target_link_libraries(ipv6-cmd ws2_32)
    endif ()
    enable_testing()
    add_test(NAME verification COMMAND bin/ipv6-test)
endif ()

add_library(ipv6-parse ${ipv6_sources})
target_include_directories(ipv6-parse PUBLIC ${IPV6_CONFIG_HEADER_PATH})
set_target_properties(ipv6-parse PROPERTIES COMPILE_FLAGS ${ipv6_target_compile_flags})

if (PARSE_TRACE)
    message("Address parse tracing enabled")
    set_target_properties(ipv6-parse PROPERTIES COMPILE_DEFINITIONS PARSE_TRACE=1)
		set_target_properties(ipv6-test PROPERTIES COMPILE_DEFINITIONS PARSE_TRACE=1)
		set_target_properties(ipv6-cmd PROPERTIES COMPILE_DEFINITIONS PARSE_TRACE=1)
endif ()

foreach(flag_var
        CMAKE_C_FLAGS CMAKE_C_FLAGS_DEBUG CMAKE_C_FLAGS_RELEASE
        CMAKE_C_FLAGS_MINSIZEREL CMAKE_C_FLAGS_RELWITHDEBINFO
        CMAKE_CXX_FLAGS CMAKE_CXX_FLAGS_DEBUG CMAKE_CXX_FLAGS_RELEASE
        CMAKE_CXX_FLAGS_MINSIZEREL CMAKE_CXX_FLAGS_RELWITHDEBINFO)
    string(REGEX REPLACE "/RTC[^ ]*" "" ${flag_var} "${${flag_var}}")
    string(REGEX REPLACE "/Od" "" ${flag_var} "${${flag_var}}")
endforeach(flag_var)
