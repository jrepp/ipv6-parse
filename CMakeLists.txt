cmake_minimum_required(VERSION 3.12)

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

## Build options for library type
option(BUILD_SHARED_LIBS "Build shared libraries instead of static" OFF)
if(NOT BUILD_SHARED_LIBS)
    set(STATIC ON CACHE BOOL FORCE "Link libraries statically? Forced to ON")
    add_definitions(-DSTATICLIB)
endif()

SET(PARSE_TRACE 0 CACHE BOOL "Enable tracing of address parsing")
SET(ENABLE_COVERAGE 0 CACHE BOOL "Enable code coverage reporting")

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

option(IPV6_CONAN_BUILD "Building with Conan package manager" OFF)

if (MSVC)
    if (IPV6_CONAN_BUILD)
        # When building with Conan, use minimal flags and let Conan control runtime
        # Disable C4711 (auto inline) and C5045 (Spectre) warnings
        set(ipv6_target_compile_flags "/W4 /wd4711 /wd5045")
    else ()
        set(ipv6_target_compile_flags "/MTd /Wall /WX /wd5045 /ZI /Od /D_NO_CRT_STDIO_INLINE=1")
    endif ()
else ()
    set(ipv6_target_compile_flags "-Wall -Werror -Wno-long-long -pedantic -std=c99 -Wno-unused-but-set-variable")
    if (ENABLE_COVERAGE)
        set(ipv6_target_compile_flags "${ipv6_target_compile_flags} --coverage -O0")
        set(ipv6_target_link_flags "--coverage")
    endif ()
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
    add_executable(ipv6-fuzz ${ipv6_sources} "fuzz.c")
    add_executable(ipv6-cmd ${ipv6_sources} "cmdline.c")
    add_executable(ipv6-test-extended ${ipv6_sources} "test_extended.c")

    set_target_properties(ipv6-test PROPERTIES COMPILE_FLAGS ${ipv6_target_compile_flags})
    set_target_properties(ipv6-fuzz PROPERTIES COMPILE_FLAGS ${ipv6_target_compile_flags})
    set_target_properties(ipv6-cmd PROPERTIES COMPILE_FLAGS ${ipv6_target_compile_flags})
    set_target_properties(ipv6-test-extended PROPERTIES COMPILE_FLAGS ${ipv6_target_compile_flags})

    if (ENABLE_COVERAGE)
        set_target_properties(ipv6-test PROPERTIES LINK_FLAGS ${ipv6_target_link_flags})
        set_target_properties(ipv6-fuzz PROPERTIES LINK_FLAGS ${ipv6_target_link_flags})
        set_target_properties(ipv6-cmd PROPERTIES LINK_FLAGS ${ipv6_target_link_flags})
        set_target_properties(ipv6-test-extended PROPERTIES LINK_FLAGS ${ipv6_target_link_flags})
    endif ()

    target_include_directories(ipv6-test PRIVATE ${IPV6_CONFIG_HEADER_PATH} ${IPV6_TEST_CONFIG_HEADER_PATH})
    target_include_directories(ipv6-fuzz PRIVATE ${IPV6_CONFIG_HEADER_PATH} ${IPV6_TEST_CONFIG_HEADER_PATH})
    target_include_directories(ipv6-cmd PRIVATE ${IPV6_CONFIG_HEADER_PATH})
    target_include_directories(ipv6-test-extended PRIVATE ${IPV6_CONFIG_HEADER_PATH} ${IPV6_TEST_CONFIG_HEADER_PATH})

    if (MSVC)
        target_link_libraries(ipv6-test ws2_32)
        target_link_libraries(ipv6-fuzz ws2_32)
        target_link_libraries(ipv6-cmd ws2_32)
        target_link_libraries(ipv6-test-extended ws2_32)
    endif ()
    enable_testing()
    add_test(NAME verification COMMAND ipv6-test)
    add_test(NAME fuzz COMMAND ipv6-fuzz 100)
    add_test(NAME extended COMMAND ipv6-test-extended)
endif ()

add_library(ipv6-parse ${ipv6_sources})
target_include_directories(ipv6-parse PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}>
    $<BUILD_INTERFACE:${IPV6_CONFIG_HEADER_PATH}>
    $<INSTALL_INTERFACE:include>
)
set_target_properties(ipv6-parse PROPERTIES
    COMPILE_FLAGS ${ipv6_target_compile_flags}
    VERSION ${LIB_VERSION_STRING}
    SOVERSION ${LIB_MAJOR_VERSION}
    PUBLIC_HEADER "ipv6.h;${IPV6_CONFIG_HEADER_PATH}/ipv6_config.h"
)

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

## Installation configuration
include(GNUInstallDirs)

# Install library
install(TARGETS ipv6-parse
    EXPORT ipv6-parse-targets
    LIBRARY DESTINATION ${CMAKE_INSTALL_LIBDIR}
    ARCHIVE DESTINATION ${CMAKE_INSTALL_LIBDIR}
    RUNTIME DESTINATION ${CMAKE_INSTALL_BINDIR}
    PUBLIC_HEADER DESTINATION ${CMAKE_INSTALL_INCLUDEDIR}
)

# Configure and install pkg-config file
configure_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/ipv6-parse.pc.in
    ${CMAKE_CURRENT_BINARY_DIR}/ipv6-parse.pc
    @ONLY
)
install(FILES ${CMAKE_CURRENT_BINARY_DIR}/ipv6-parse.pc
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/pkgconfig
)

# Install CMake package configuration
install(EXPORT ipv6-parse-targets
    FILE ipv6-parse-targets.cmake
    NAMESPACE ipv6-parse::
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/ipv6-parse
)

# Create and install package config file
include(CMakePackageConfigHelpers)
configure_package_config_file(
    ${CMAKE_CURRENT_SOURCE_DIR}/cmake/ipv6-parse-config.cmake.in
    ${CMAKE_CURRENT_BINARY_DIR}/ipv6-parse-config.cmake
    INSTALL_DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/ipv6-parse
)
write_basic_package_version_file(
    ${CMAKE_CURRENT_BINARY_DIR}/ipv6-parse-config-version.cmake
    VERSION ${LIB_VERSION_STRING}
    COMPATIBILITY SameMajorVersion
)
install(FILES
    ${CMAKE_CURRENT_BINARY_DIR}/ipv6-parse-config.cmake
    ${CMAKE_CURRENT_BINARY_DIR}/ipv6-parse-config-version.cmake
    DESTINATION ${CMAKE_INSTALL_LIBDIR}/cmake/ipv6-parse
)

## CPack configuration for package generation
set(CPACK_PACKAGE_NAME "ipv6-parse")
set(CPACK_PACKAGE_VENDOR "Jacob Repp")
set(CPACK_PACKAGE_DESCRIPTION_SUMMARY "IPv6/IPv4 address parser with full RFC compliance")
set(CPACK_PACKAGE_DESCRIPTION "High-performance IPv6/IPv4 address parser supporting RFC 4291, RFC 5952, and RFC 4007. Includes support for CIDR masks, ports, zone IDs, and IPv4 embedding.")
set(CPACK_PACKAGE_VERSION_MAJOR ${LIB_MAJOR_VERSION})
set(CPACK_PACKAGE_VERSION_MINOR ${LIB_MINOR_VERSION})
set(CPACK_PACKAGE_VERSION_PATCH ${LIB_PATCH_VERSION})
set(CPACK_PACKAGE_VERSION ${LIB_VERSION_STRING})
set(CPACK_PACKAGE_HOMEPAGE_URL "https://github.com/jrepp/ipv6-parse")
set(CPACK_PACKAGE_CONTACT "Jacob Repp <jacobrepp@gmail.com>")
set(CPACK_RESOURCE_FILE_LICENSE "${CMAKE_CURRENT_SOURCE_DIR}/LICENSE")
set(CPACK_RESOURCE_FILE_README "${CMAKE_CURRENT_SOURCE_DIR}/README.md")

# Debian package configuration
set(CPACK_DEBIAN_PACKAGE_SECTION "libs")
set(CPACK_DEBIAN_PACKAGE_PRIORITY "optional")
set(CPACK_DEBIAN_PACKAGE_DEPENDS "libc6 (>= 2.17)")
set(CPACK_DEBIAN_PACKAGE_MAINTAINER "Jacob Repp <jacobrepp@gmail.com>")
set(CPACK_DEBIAN_FILE_NAME DEB-DEFAULT)

# RPM package configuration
set(CPACK_RPM_PACKAGE_LICENSE "MIT")
set(CPACK_RPM_PACKAGE_GROUP "System Environment/Libraries")
set(CPACK_RPM_PACKAGE_REQUIRES "glibc >= 2.17")
set(CPACK_RPM_FILE_NAME RPM-DEFAULT)

# Source package configuration
set(CPACK_SOURCE_GENERATOR "TGZ;ZIP")
set(CPACK_SOURCE_IGNORE_FILES
    "/\\.git/"
    "/\\.github/"
    "/\\.vscode/"
    "/\\.idea/"
    "/build/"
    "/build_wasm/"
    "/build_test/"
    "\\.swp$"
    "\\.swo$"
    "~$"
    "\\.DS_Store$"
)

include(CPack)
