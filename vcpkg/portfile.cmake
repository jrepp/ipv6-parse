# vcpkg portfile for ipv6-parse
# To use: Copy this directory to vcpkg/ports/ipv6-parse and run: vcpkg install ipv6-parse

vcpkg_from_github(
    OUT_SOURCE_PATH SOURCE_PATH
    REPO jrepp/ipv6-parse
    REF v1.2.1
    SHA512 0  # Will be computed by vcpkg
    HEAD_REF master
)

vcpkg_cmake_configure(
    SOURCE_PATH "${SOURCE_PATH}"
    OPTIONS
        -DIPV6_PARSE_LIBRARY_ONLY=ON
        -DENABLE_COVERAGE=OFF
        -DPARSE_TRACE=OFF
)

vcpkg_cmake_build()

vcpkg_cmake_install()

vcpkg_cmake_config_fixup(CONFIG_PATH lib/cmake/ipv6-parse)

vcpkg_fixup_pkgconfig()

# Remove duplicate files
file(REMOVE_RECURSE "${CURRENT_PACKAGES_DIR}/debug/include")
file(REMOVE_RECURSE "${CURRENT_PACKAGES_DIR}/debug/share")

# Install command-line tool
if(EXISTS "${CURRENT_PACKAGES_DIR}/bin/ipv6-parse-cli${VCPKG_TARGET_EXECUTABLE_SUFFIX}")
    vcpkg_copy_tools(TOOL_NAMES ipv6-parse-cli AUTO_CLEAN)
endif()

# Handle copyright
vcpkg_install_copyright(FILE_LIST "${SOURCE_PATH}/LICENSE")

# Copy usage file
file(INSTALL "${CMAKE_CURRENT_LIST_DIR}/usage" DESTINATION "${CURRENT_PACKAGES_DIR}/share/${PORT}")
