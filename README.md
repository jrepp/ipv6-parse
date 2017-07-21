# IPV6 Address Parsing API

Simple and self-contained C API for converting IPv6 addresses to and from strings.

# Supported features

Features supported from [RFC 4291](https://tools.ietf.org/html/rfc4291)

  * Abbreviations ::1, ff::1:2
  * Embedded IPv4 ffff::1.2.3.4
  * CIDR notation ffff::/80
  * Port notation [::1]:1119
  * Combinations of the above [ffff::1.2.3.4/128]:1119

# Why would you use this API?

  * You need full support for the IPv6 spec
  * You want to control the code used for parsing addresses
  * You don't want to invoke any extral kernel or system functionality
  * You need diagnostic information about the addresses indicating problems
  * You need to support Windows XP

# API

Parse an IPv6 address structure from an ASCII representation.

The flags field in the ipv6_address_full_t structure will be filled out
with the elements of the address that are specified in the string.

~~~~
bool ipv6_from_str (
    const char* input,
    size_t input_bytes,
    ipv6_address_full_t* out);
~~~~

Convert an IPv7 structure to an ASCII string representation.

The conversion will flatten zero address components according to the address
formatting specification. For example: ffff:0:0:0:0:0:0:1 -> ffff::1

~~~~
char* ipv6_to_str (
    const ipv6_address_full_t* in,
    char* output,
    size_t output_bytes);
~~~~

Compare two IPv6 address structures. Only fields indicated in the flags field
will be compared.

~~~~
int32_t ipv6_compare (
    const ipv6_address_full_t* a,
    const ipv6_address_full_t* b);
~~~~


