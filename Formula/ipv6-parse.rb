# Homebrew formula for ipv6-parse
# To install: brew install --HEAD https://raw.githubusercontent.com/jrepp/ipv6-parse/master/Formula/ipv6-parse.rb
# Or after publishing to homebrew-core: brew install ipv6-parse

class Ipv6Parse < Formula
  desc "Fast, RFC-compliant IPv6/IPv4 address parser with CIDR, port, and zone ID support"
  homepage "https://github.com/jrepp/ipv6-parse"
  url "https://github.com/jrepp/ipv6-parse/archive/v1.2.1.tar.gz"
  sha256 "" # Will be computed on release
  license "MIT"
  head "https://github.com/jrepp/ipv6-parse.git", branch: "master"

  depends_on "cmake" => :build
  depends_on "emscripten" => [:build, :optional]

  def install
    # Build static and shared libraries
    system "cmake", "-S", ".", "-B", "build",
                    "-DCMAKE_BUILD_TYPE=Release",
                    "-DBUILD_SHARED_LIBS=ON",
                    "-DCMAKE_INSTALL_PREFIX=#{prefix}",
                    *std_cmake_args
    system "cmake", "--build", "build"
    system "cmake", "--install", "build"

    # Build WASM if emscripten is available
    if build.with? "emscripten"
      system "./build_wasm.sh"
      # Install WASM files to share/ipv6-parse/wasm
      (share/"ipv6-parse/wasm").install "docs/ipv6-parse.js"
      (share/"ipv6-parse/wasm").install "docs/ipv6-parse-api.js"
      (share/"ipv6-parse/wasm").install "docs/ipv6-parse-api.d.ts"
      (share/"ipv6-parse/wasm").install "docs/index.html"
    end

    # Install additional documentation
    doc.install "README.md", "README_WASM.md", "README_NPM.md"
  end

  test do
    # Test the command-line tool
    output = shell_output("#{bin}/ipv6-parse-cli '2001:db8::1'")
    assert_match "2001:db8::1", output
    assert_match "Parsed successfully", output

    # Test with CIDR notation
    output = shell_output("#{bin}/ipv6-parse-cli '2001:db8::/32'")
    assert_match "2001:db8::", output
    assert_match "Mask: 32", output

    # Test with port
    output = shell_output("#{bin}/ipv6-parse-cli '[::1]:8080'")
    assert_match "::1", output
    assert_match "Port: 8080", output

    # Test with zone ID
    output = shell_output("#{bin}/ipv6-parse-cli 'fe80::1%eth0'")
    assert_match "fe80::1", output
    assert_match "Zone: eth0", output

    # Test invalid address
    assert_match "Invalid IPv6 address",
      shell_output("#{bin}/ipv6-parse-cli 'not-an-address' 2>&1", 1)

    # Test C library integration
    (testpath/"test.c").write <<~EOS
      #include <ipv6.h>
      #include <stdio.h>
      #include <string.h>

      int main() {
          ipv6_address addr;
          if (ipv6_parse("2001:db8::1", &addr) == 0) {
              char formatted[IPV6_STRING_SIZE];
              ipv6_format(&addr, formatted, sizeof(formatted));
              if (strcmp(formatted, "2001:db8::1") == 0) {
                  printf("Test passed\\n");
                  return 0;
              }
          }
          printf("Test failed\\n");
          return 1;
      }
    EOS

    system ENV.cc, "test.c", "-I#{include}", "-L#{lib}", "-lipv6-parse", "-o", "test"
    assert_equal "Test passed\n", shell_output("./test")

    # Test pkg-config
    system "pkg-config", "--cflags", "--libs", "ipv6-parse"

    # Verify shared library is installed
    assert_predicate lib/"libipv6-parse.dylib", :exist?

    # Verify header is installed
    assert_predicate include/"ipv6.h", :exist?

    # Verify pkg-config file is installed
    assert_predicate lib/"pkgconfig/ipv6-parse.pc", :exist?
  end
end
