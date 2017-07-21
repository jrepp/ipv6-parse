
# IPV6 Address Parsing API

A simple and self-contained IPv6 address parsing library.

# Supported features

  - Abbreviations ::1, ff::1:2
  - Embedded IPv4 ffff::1.2.3.4
  - CIDR notation ffff::/80
  - Port notation [::1]:1119
  - Combinations of the above [ffff::1.2.3.4/128]:1119

# Why would you use this API?

  - You need full support for the IPv6 spec
  - You want to control the code used for parsing addresses
  - You don't want to invoke any extral kernel or system functionality
  - You need diagnostic information about the addresses indicating problems
  - You need to support Windows XP


*ipv6_flag_t*
===

Flags are used to communicate which fields are filled out in the address structure
after parsing. Address components are assumed.

~~~~
typedef enum {
    IPV6_FLAG_HAS_PORT      = 0x00000001,   // the address specifies a port setting
    IPV6_FLAG_HAS_MASK      = 0x00000002,   // the address specifies a CIDR mask
    IPV6_FLAG_IPV4_EMBED    = 0x00000002,   // the address has an embedded IPv4 address in the last 32bits
} ipv6_flag_t;
~~~~

*ipv6_address_t*
===
Simplified address structure where the components are represented in
machine format, left to right [0..7]

e.g. little-endian x86 mahinces:

     aa11:bb22:: -> 0xaa11, 0xbb22, 0x0000, ...

~~~~
typedef struct {
    uint16_t                components[IPV6_NUM_COMPONENTS];
} ipv6_address_t;
~~~~

*ipv6_address_full_t*
===

Input / output type for round trip parsing and converting to string.

Features are indicated using flags, see *ipv6_flag_t*.

~~~~
typedef struct {
    ipv6_address_t          address;        // address components
    uint16_t                port;           // port binding
    uint16_t                pad0;           // first padding
    uint32_t                mask;           // number of mask bits N specified for example in ::1/N
    const char*             iface;          // pointer to place in address string where interface is defined
    uint32_t                iface_len;      // number of bytes in the name of the interface
    uint32_t                flags;          // flags indicating features of address
} ipv6_address_full_t;
~~~~

*ipv6_diag_event_t*
===

Event type emitted from diagnostic function

~~~~
typedef enum {
    IPV6_DIAG_
} ipv6_diag_event_t;
~~~~

*ipv6_diag_func_t*
===

A diagnostic function that receives information from parsing the address

~~~~
typedef void IPV6_API_ENTRY( (*ipv6_diag_func_t) )(
    ipv6_diag_event_t event,
    const char* debug_str);
~~~~

*ipv6_from_str*
===

Read an IPv6 address from a string, handles parsing a variety of format
information from the spec.

~~~~
bool IPV6_API_ENTRY(ipv6_from_str) (
    const char* input,
    size_t input_bytes,
    ipv6_address_full_t* out);
~~~~

*ipv6_from_str_diag*
===

Additional functionality parser that receives diagnostics information from parsing the address,
including errors.

~~~~
bool IPV6_API_ENTRY(ipv6_from_str_diag) (
    const char* input,
    size_t input_bytes,
    ipv6_address_full_t* out,
    ipv6_diag_func_t func,
    void* user_data);
~~~~

*ipv6_to_str*
===

Convert an IPv6 structure to an ASCII string.

The conversion will flatten zero address components according to the address
formatting specification. For example: ffff:0:0:0:0:0:0:1 -> ffff::1

~~~~
char* IPV6_API_ENTRY(ipv6_to_str) (
    const ipv6_address_full_t* in,
    char* output,
    size_t output_bytes);
~~~~

*ipv6_compare*
===

Compare two addresses, 0 if equal, 1 if a greater, -1 if a lesser

~~~~
int32_t IPV6_API_ENTRY(ipv6_compare) (
    const ipv6_address_full_t* a,
    const ipv6_address_full_t* b);
~~~~
