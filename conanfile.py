#!/usr/bin/env python
# -*- coding: utf-8 -*-

from conan import ConanFile
from conan.tools.cmake import CMake, CMakeToolchain, cmake_layout
from conan.tools.files import copy, load
import os
import re


class Ipv6ParseConan(ConanFile):
    name = "ipv6-parse"
    description = "Fast, RFC-compliant IPv6/IPv4 address parser with CIDR, port, and zone ID support"
    topics = ("ipv6", "ipv4", "parser", "address", "cidr", "rfc", "networking")
    homepage = "https://github.com/jrepp/ipv6-parse"
    url = "https://github.com/jrepp/ipv6-parse"
    license = "MIT"

    # Binary configuration
    settings = "os", "compiler", "build_type", "arch"
    options = {
        "shared": [True, False],
        "fPIC": [True, False],
    }
    default_options = {
        "shared": False,
        "fPIC": True,
    }

    exports_sources = (
        "CMakeLists.txt",
        "cmake/*",
        "ipv6.c",
        "ipv6.h",
        "ipv6_wasm.c",
        "cmdline.c",
        "LICENSE",
        "README.md",
        "ipv6-parse.pc.in",
        "cmake/ipv6-parse-config.cmake.in",
    )

    def set_version(self):
        """Extract version from CMakeLists.txt"""
        content = load(self, os.path.join(self.recipe_folder, "CMakeLists.txt"))
        version_match = re.search(r"project\(ipv6-parse VERSION ([0-9.]+)", content)
        if version_match:
            self.version = version_match.group(1)
        else:
            self.version = "1.2.1"

    def config_options(self):
        if self.settings.os == "Windows":
            del self.options.fPIC

    def configure(self):
        if self.options.shared:
            self.options.rm_safe("fPIC")
        # Pure C library
        self.settings.rm_safe("compiler.libcxx")
        self.settings.rm_safe("compiler.cppstd")

    def layout(self):
        cmake_layout(self, src_folder=".")

    def generate(self):
        tc = CMakeToolchain(self)
        tc.variables["IPV6_PARSE_LIBRARY_ONLY"] = True
        tc.variables["BUILD_SHARED_LIBS"] = self.options.shared
        tc.variables["ENABLE_COVERAGE"] = False
        tc.variables["PARSE_TRACE"] = False
        tc.generate()

    def build(self):
        cmake = CMake(self)
        cmake.configure()
        cmake.build()

    def package(self):
        cmake = CMake(self)
        cmake.install()

        # Copy license
        copy(self, "LICENSE",
             src=self.source_folder,
             dst=os.path.join(self.package_folder, "licenses"))

        # Copy documentation
        copy(self, "README*.md",
             src=self.source_folder,
             dst=os.path.join(self.package_folder, "docs"))

    def package_info(self):
        self.cpp_info.libs = ["ipv6-parse"]
        self.cpp_info.includedirs = ["include"]

        # Set component for pkg-config
        self.cpp_info.set_property("pkg_config_name", "ipv6-parse")

        # Set component for CMake
        self.cpp_info.set_property("cmake_file_name", "ipv6-parse")
        self.cpp_info.set_property("cmake_target_name", "ipv6-parse::ipv6-parse")

        # Add bin folder to PATH for CLI tool
        self.cpp_info.bindirs = ["bin"]
