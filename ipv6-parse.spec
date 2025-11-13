Name:           ipv6-parse
Version:        1.2.1
Release:        1%{?dist}
Summary:        IPv6/IPv4 address parser with full RFC compliance

License:        MIT
URL:            https://github.com/jrepp/ipv6-parse
Source0:        %{name}-%{version}.tar.gz

BuildRequires:  gcc
BuildRequires:  cmake >= 3.12
BuildRequires:  make

%description
High-performance IPv6/IPv4 address parser with full RFC compliance
(RFC 4291, RFC 5952, RFC 4007).

Features:
 - Full RFC compliance for IPv6 and IPv4 address parsing
 - Support for CIDR masks, ports, and zone IDs
 - IPv4-mapped and IPv4-compatible address handling
 - High-performance C implementation
 - Zero dependencies

%package        devel
Summary:        Development files for %{name}
Requires:       %{name}%{?_isa} = %{version}-%{release}

%description    devel
The %{name}-devel package contains libraries and header files for
developing applications that use %{name}.

%prep
%autosetup

%build
%cmake -DBUILD_SHARED_LIBS=ON
%cmake_build

%install
%cmake_install

%check
%ctest

%files
%license LICENSE
%doc README.md
%{_libdir}/libipv6-parse.so.1
%{_libdir}/libipv6-parse.so.%{version}

%files devel
%{_includedir}/ipv6.h
%{_includedir}/ipv6_config.h
%{_libdir}/libipv6-parse.so
%{_libdir}/pkgconfig/ipv6-parse.pc
%{_libdir}/cmake/ipv6-parse/

%changelog
* Wed Nov 12 2025 Jacob Repp <jacobrepp@gmail.com> - 1.2.1-1
- Initial RPM package release
- Full RFC compliance (RFC 4291, RFC 5952, RFC 4007)
- Support for CIDR masks, ports, and zone IDs
- IPv4-mapped and IPv4-compatible address handling
- High-performance C implementation
- Shared and static library support
- pkg-config integration
- CMake package configuration
