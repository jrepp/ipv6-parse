
# IPv6 / IPv4 address parser in C

    A self-contained embeddable address parsing library.

Author: jacobrepp@gmail.com
License: MIT

[![Build Status](https://travis-ci.org/jrepp/ipv6-parse.svg?branch=master)](https://travis-ci.org/jrepp/ipv6-parse)

# Features

- Full support for the IPv6 address specification
    - Abbreviations ::1, ff::1:2
    - Embedded IPv4 ffff::1.2.3.4
    - CIDR notation ffff::/80
    - Port notation [::1]:1119
    - Combinations of the above [ffff::1.2.3.4/128]:1119
- IPv4 addresses and ports 1.2.3.4, 1.2.3.4:5555
- Single function to parse both IPv4 and IPv6 addresses and ports
- Self contained and multi-plaform, eliminates problems with using built-in address parsing routines
- Diagnostic information from the parsing API
- Two way functionality address -> parse -> string -> parse
- Careful use of strings and pointers
- Comprehensive positive and negative tests


*ipv6_flag_t*
===

Flags are used to communicate which fields are filled out in the address structure
after parsing. Address components are assumed.

~~~~
typedef enum {
    IPV6_FLAG_HAS_PORT      = 0x00000001,   // the address specifies a port setting
    IPV6_FLAG_HAS_MASK      = 0x00000002,   // the address specifies a CIDR mask
    IPV6_FLAG_IPV4_EMBED    = 0x00000002,   // the address has an embedded IPv4 address in the last 32bits
    IPV6_FLAG_IPV4_COMPAT   = 0x00000004,   // the address is IPv4 compatible (1.2.3.4:5555)
} ipv6_flag_t;
~~~~

*ipv6_address_t*
===
Simplified address structure where the components are represented in
machine format, left to right [0..7]

e.g. little-endian x86 mahinces:

     aa11:bb22:: -> 0xaa11, 0xbb22, 0x0000, ...

~~~~
#define IPV6_NUM_COMPONENTS 8
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
    IPV6_DIAG_STRING_SIZE_EXCEEDED          = 0,
    IPV6_DIAG_INVALID_INPUT                 = 1,
    IPV6_DIAG_INVALID_INPUT_CHAR            = 2,
    IPV6_DIAG_TRAILING_ZEROES               = 3,
    IPV6_DIAG_V6_BAD_COMPONENT_COUNT        = 4,
    IPV6_DIAG_V4_BAD_COMPONENT_COUNT        = 5,
    IPV6_DIAG_V6_COMPONENT_OUT_OF_RANGE     = 6,
    IPV6_DIAG_V4_COMPONENT_OUT_OF_RANGE     = 7,
    IPV6_DIAG_INVALID_PORT                  = 8,
    IPV6_DIAG_INVALID_CIDR_MASK             = 9,
    IPV6_DIAG_IPV4_REQUIRED_BITS            = 10,
    IPV6_DIAG_IPV4_INCORRECT_POSITION       = 11,
    IPV6_DIAG_INVALID_BRACKETS              = 12,
    IPV6_DIAG_INVALID_ABBREV                = 13,
    IPV6_DIAG_INVALID_DECIMAL_TOKEN         = 14,
    IPV6_DIAG_INVALID_HEX_TOKEN             = 15,
} ipv6_diag_event_t;
~~~~

*ipv6_diag_info_t*
===

Structure that carriers information about the diagnostic message

~~~~
typedef struct {
    const char* message;    // English ascii debug message
    const char* input;      // Input string that generated the diagnostic
    uint32_t    position;   // Position in input that caused the diagnostic
    uint32_t    pad0;
} ipv6_diag_info_t;
~~~~

*ipv6_diag_func_t*
===

A diagnostic function that receives information from parsing the address

~~~~
typedef void (*ipv6_diag_func_t )(
    ipv6_diag_event_t event,
    const ipv6_diag_info_t* info,
    void* user_data);
~~~~

*ipv6_from_str*
===

Read an IPv6 address from a string, handles parsing a variety of format
information from the spec. Will also handle IPv4 address passed in without
any embedding information.

~~~~
bool IPV6_API_DECL(ipv6_from_str) (
    const char* input,
    size_t input_bytes,
    ipv6_address_full_t* out);
~~~~

*ipv6_from_str_diag*
===

Additional functionality parser that receives diagnostics information from parsing the address,
including errors.

~~~~
bool IPV6_API_DECL(ipv6_from_str_diag) (
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
char* IPV6_API_DECL(ipv6_to_str) (
    const ipv6_address_full_t* in,
    char* output,
    size_t output_bytes);
~~~~

*ipv6_compare*
===

Compare two addresses, 0 if equal, 1 if a greater, -1 if a lesser

~~~~
int32_t IPV6_API_DECL(ipv6_compare) (
    const ipv6_address_full_t* a,
    const ipv6_address_full_t* b);
~~~~
