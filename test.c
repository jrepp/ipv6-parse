#include "ipv6.h"
#include "ipv6_config.h"
#include "ipv6_test_config.h"

#ifdef HAVE_STDIO_H
#include <stdio.h>
#endif

#ifdef HAVE_STRING_H
#include <string.h>
#endif

#ifdef HAVE_MALLOC_H
#include <malloc.h>
#endif

#ifdef HAVE_ALLOCA_H
#include <alloca.h>
#endif

#ifdef HAVE_WINSOCK_2_H
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <winsock2.h>
#endif

#ifdef HAVE_SYS_SOCKET_H
#include <sys/socket.h>
#endif

#ifdef HAVE_NETINET_IN_H
#include <netinet/in.h>
#endif

#ifdef HAVE_ARPA_INET_H
#define __USE_MISC
#include <arpa/inet.h>
#endif

//
// Leading zeros MUST be suppressed.
// For example, 2001:0db8::0001 is not acceptable and must be represented as 2001 : db8::1
// The use of the symbol "::" MUST be used to its maximum capability.
// For example, 2001 : db8 : 0 : 0 : 0 : 0 : 2 : 1 must be shortened to 2001 : db8::2 : 1.
// The symbol "::" MUST NOT be used to shorten just one 16 - bit 0 field.
// For example, the representation 2001 : db8 : 0 : 1 : 1 : 1 : 1 : 1 is correct, but 2001 : db8::1 : 1 : 1 : 1 : 1 is not correct.
// The characters "a", "b", "c", "d", "e", and "f" in an IPv6 address MUST be represented in lowercase.
//
// IPv6 addresses including a port number
// IPv6 addresses including a port number should be enclosed in brackets[rfc5952]:
// [2001:db8:a0b:12f0::1] : 21
//
//
// IPv6 addresses with prefix
// The prefix is appended to the IPv6 address separated by a slash "/" character(CIDR notation)[rfc4291]:
// 2001 : db8 : a0b : 12f0::1 / 64
//
// IPv6 address types
// RFC 4291 defines three types of IPv6 addresses :
//
// ## Unicast
//
//    An identifier for a single interface.A packet sent to a unicast address is delivered to the interface identified by that address.
//    An example for an IPv6 unicast address is 3731 :54 : 65fe : 2::a7
//
// ## Anycast
//
//    An identifier for a set of interfaces(typically belonging to different nodes).A packet sent to an anycast address is
//    delivered to one of the interfaces identified by that address(the "nearest" one, according to the routing protocols' measure of distance).
//    Anycast addresses are allocated from the Unicast address space and are not syntactically distinguishable from unicast addresses.
//
//    An example for an IPv6 Anycast address is 3731:54 : 65fe : 2::a8
//
// ## Multicast
//
//    An identifier for a set of interfaces(typically belonging to different nodes).A packet sent to a multicast address is delivered to all
//    interfaces identified by that address.
//
//    An example for an IPv6 Multicast address is FF01 : 0 : 0 : 0 : 0 : 0 : 0 : 1
//
//    There are no broadcast addresses in IPv6, their function being superseded by multicast addresses.
//

// Capture high level test run status
typedef struct {
    size_t                  total_tests;
    size_t                  failed_count;
} test_status_t;

// Structure to represent function over group of tests
typedef struct {
    const char*             name;
    void                    (*func)(test_status_t* status);
} test_group_t;

// Representation of mainline test data
typedef struct {
    const char*             input;
    uint16_t                components[IPV6_NUM_COMPONENTS];
    uint16_t                port;
    uint32_t                mask;
    uint32_t                flags;
} test_data_t;

// Representation of diagnostic test data
typedef struct {
    const char*             input;
    ipv6_diag_event_t       expected_event;
} diag_test_data_t;

typedef struct {
    const char*             message;
    ipv6_diag_event_t       event;
    size_t                  calls;
} diag_test_capture_t;

// Comparison that converts inputs to strings for textual output
#define COMPARE(a, b) compare(#a, a, #b, b)

#define LENGTHOF(x) (sizeof(x)/sizeof(x[0]))

#define TEST_FAILED(...) \
    printf("  FAILED %s:%d", __FILE__, __LINE__); \
    printf(__VA_ARGS__); \
    failed = true;


static bool compare(const char* aname, const ipv6_address_full_t* a, const char* bname, const ipv6_address_full_t* b) {
    for (int i = 0; i < IPV6_NUM_COMPONENTS; ++i) {
        if (a->address.components[i] != b->address.components[i]) {
            printf("  address element %s [%d]: %04x != %s[%d]: %04x\n",
                aname, i, a->address.components[i],
                bname, i, b->address.components[i]);
            return false;
        }
    }
    return true;
}

static void copy_test_data(ipv6_address_full_t* dst, const test_data_t* src) {
    memset(dst, 0, sizeof(ipv6_address_full_t));
    memcpy(&(dst->address.components[0]), &src->components[0], sizeof(uint16_t) * IPV6_NUM_COMPONENTS);
    dst->port = src->port;
    dst->mask = src->mask;
}

//
// CIDR positive tests:
//
// 2001:0DB8:0000:CD30:0000:0000:0000:0000/60
// 2001:0DB8::CD30:0:0:0:0/60
// 2001:0DB8:0:CD30::/60
//
//
// When writing both a node address and a prefix of that node address
//      (e.g., the node's subnet prefix), the two can be combined as follows:
//   the node address      2001:0DB8:0:CD30:123:4567:89AB:CDEF
//   and its subnet number 2001:0DB8:0:CD30::/60
//   can be abbreviated as 2001:0DB8:0:CD30:123:4567:89AB:CDEF/60
//
static void test_parsing (test_status_t* status) {
    // input, alternate, components, mask, port
    test_data_t tests[] = {
        { "::1:2:3:4:5", { 0, 0, 0, 1, 2, 3, 4, 5 }, 0, 0, 0 },
        { "0:0:0:1:2:3:4:5", { 0, 0, 0, 1, 2, 3, 4, 5 }, 0, 0, 0 },
        { "1:2::3:4:5", { 1, 2, 0, 0, 0, 3, 4, 5 }, 0, 0, 0 },
        { "1:2:0:0:0:3:4:5", { 1, 2, 0, 0, 0, 3, 4, 5 }, 0, 0, 0 },
        { "1:2:3:4:5::", { 1, 2, 3, 4, 5, 0, 0, 0 }, 0, 0, 0 },
        { "1:2:3:4:5:0:0:0", { 1, 2, 3, 4, 5, 0, 0, 0 }, 0, 0, 0 },
        { "0:0:0:0:0:ffff:102:405", { 0, 0, 0, 0, 0, 0xffff, 0x102, 0x405 }, 0, 0, 0 },
        { "::", { 0, 0, 0, 0, 0, 0, 0, 0 }, 0, 0, 0 },
        { "::0", { 0, 0, 0, 0, 0, 0, 0, 0 }, 0, 0, 0 },
        { "::1", { 0, 0, 0, 0, 0, 0, 0, 1 }, 0, 0, 0 },
        { "0:0:0::1", { 0, 0, 0, 0, 0, 0 , 0, 1 }, 0, 0, 0 },
        { "ffff::1", { 0xffff, 0, 0, 0, 0, 0, 0, 1 }, 0, 0, 0 },
        { "ffff:0:0:0:0:0:0:1", { 0xffff, 0, 0, 0, 0, 0, 0, 1 }, 0, 0, 0 },
        { "2001:0db8:0a0b:12f0:0:0:0:1", { 0x2001, 0x0db8, 0x0a0b, 0x12f0, 0, 0, 0, 1 }, 0, 0, 0 },
        { "2001:db8:a0b:12f0::1", { 0x2001, 0xdb8, 0xa0b, 0x12f0, 0, 0, 0, 1 }, 0, 0, 0 },
        { "::ffff:1.2.3.4", { 0, 0, 0, 0, 0, 0xffff, 0x0102, 0x0304 }, 0, 0, IPV6_FLAG_IPV4_EMBED },
        { "::ffff:1.2.3.4/32", { 0, 0, 0, 0, 0, 0xffff, 0x0102, 0x0304 }, 32, 0, IPV6_FLAG_IPV4_EMBED|IPV6_FLAG_HAS_MASK },
        { "[::ffff:1.2.3.4/32]:5678", { 0, 0, 0, 0, 0, 0xffff, 0x0102, 0x0304 }, 32, 5678, IPV6_FLAG_IPV4_EMBED|IPV6_FLAG_HAS_MASK|IPV6_FLAG_HAS_PORT },
        { "1:2:3:4:5:0:0:0/128", { 1, 2, 3, 4, 5, 0, 0, 0 }, 128, 0, IPV6_FLAG_HAS_MASK },
        { "[1:2:3:4:5:0:0:0/128]:5678", { 1, 2, 3, 4, 5, 0, 0, 0 }, 128, 5678, IPV6_FLAG_HAS_MASK|IPV6_FLAG_HAS_PORT },
        { "[1:2:3:4:5::]:5678", { 1, 2, 3, 4, 5, 0, 0, 0 }, 0, 5678, IPV6_FLAG_HAS_PORT },
        { "[::1]:5678", { 0, 0, 0, 0, 0, 0, 0, 1 }, 0, 5678, IPV6_FLAG_HAS_PORT },
        { "1.2.3.4", { 0x102, 0x304, 0, 0, 0, 0, 0, 0 }, 0, 0, IPV6_FLAG_IPV4_COMPAT },
        { "1.2.3.4:5678", { 0x102, 0x304, 0, 0, 0, 0, 0, 0 }, 0, 5678, IPV6_FLAG_IPV4_COMPAT|IPV6_FLAG_HAS_PORT },
        { "127.0.0.1", { 0x7f00, 0x0001, 0, 0, 0, 0, 0, 0 }, 0, 0, IPV6_FLAG_IPV4_COMPAT },
        { "255.255.255.255", { 0xffff, 0xffff, 0, 0, 0, 0, 0, 0 }, 0, 0, IPV6_FLAG_IPV4_COMPAT },
    };

    status->total_tests = LENGTHOF(tests);
    char* tostr = (char*)alloca(IPV6_STRING_SIZE);

    for (size_t i = 0; i < status->total_tests; ++i) {
        ipv6_address_full_t test;
        ipv6_address_full_t parsed;
        bool failed = false;

        memset(&test, 0, sizeof(test));
        memset(&parsed, 0, sizeof(parsed));

        //
        // Test the string conversion into the 'parsed' structure
        //
        printf("ipv6_from_str %lu/%lu \"%s\"\n####\n",
            i+1,
            status->total_tests,
            tests[i].input);

        if (!ipv6_from_str(tests[i].input, strlen(tests[i].input), &parsed)) {
            TEST_FAILED("  ipv6_from_str failed\n");
        }
        copy_test_data(&test, &tests[i]);
        if (!COMPARE(&test, &parsed)) {
            TEST_FAILED("  compare failed\n");
        }

        // Test to_str and back with comparion
        if (!ipv6_to_str(&parsed, tostr, IPV6_STRING_SIZE)) {
            TEST_FAILED("  ipv6_to_str failed\n");
        }

        // printf("  ipv6_to_str -> %s\n", tostr);
        if (!ipv6_from_str(tostr, strlen(tostr), &parsed)) {
            TEST_FAILED("  ipv6 string round-trip failed\n");
        }
        if (!COMPARE(&parsed, &test)) {
            TEST_FAILED("  compare failed\n");
        }

        if (!failed) {
            printf("+ PASS\n\n");
        } else {
            printf("- FAIL\n\n");
            status->failed_count++;
        }
    }
}

// Function that is called by the address parser to report diagnostics
static void test_parsing_diag_fn (
    ipv6_diag_event_t event,
    const ipv6_diag_info_t* info,
    void* user_data)
{
    diag_test_capture_t* capture = (diag_test_capture_t*)user_data;

    capture->event = event;
    capture->message = info->message;
    capture->calls++;
}

// CIDR negative tests:
//
// The following are NOT legal representations of the above prefix:
//
// 2001:0DB8:0:CD3/60   may drop leading zeros, but not trailing
//     zeros, within any 16-bit chunk of the address
//
// 2001:0DB8::CD30/60   address to left of "/" expands to
//     2001:0DB8:0000:0000:0000:0000:0000:CD30
//
// 2001:0DB8::CD3/60    address to left of "/" expands to
//     2001:0DB8:0000:0000:0000:0000:0000:0CD3
//
static void test_parsing_diag (test_status_t* status) {
    diag_test_data_t tests[] = {
        { "", IPV6_DIAG_INVALID_INPUT },      // invalid input
        { "-f::", IPV6_DIAG_INVALID_INPUT_CHAR }, // invalid character
        { "%f::", IPV6_DIAG_INVALID_INPUT }, // valid character wrong position
        { "0:0", IPV6_DIAG_V6_BAD_COMPONENT_COUNT }, // too few components
        { "0:0:0:0:0:0:0:0:0", IPV6_DIAG_V6_BAD_COMPONENT_COUNT }, // too many components
        { "0:::", IPV6_DIAG_INVALID_ABBREV }, // invalid abbreviation
        { "1ffff::", IPV6_DIAG_V6_COMPONENT_OUT_OF_RANGE }, // out of bounds separator
        { "ffff::/129", IPV6_DIAG_INVALID_CIDR_MASK }, // out of bounds CIDR mask
        { "[[f::]", IPV6_DIAG_INVALID_BRACKETS }, // invalid brackets
        { "[f::[", IPV6_DIAG_INVALID_BRACKETS }, // invalid brackets
        { "]f::]", IPV6_DIAG_INVALID_INPUT }, // invalid brackets
        { "[f::]::", IPV6_DIAG_INVALID_INPUT }, // invalid port spec
        { "[f::]:70000", IPV6_DIAG_INVALID_PORT }, // invalid port spec
        { "ffff::1.2.3.4:bbbb", IPV6_DIAG_IPV4_INCORRECT_POSITION }, // ipv6 separator after embedding
        { "1.2.3.4:bbbb::", IPV6_DIAG_INVALID_INPUT }, // invalid port string
        { "ffff::1.2.3.4.5", IPV6_DIAG_V4_BAD_COMPONENT_COUNT }, // invalid octet count
        { "111.222.333.444", IPV6_DIAG_V4_COMPONENT_OUT_OF_RANGE }, // component is too large for IPv4
        { "111.222.255.255:70000", IPV6_DIAG_INVALID_PORT }, // port is too large
        { "111.222.255:1010", IPV6_DIAG_V4_BAD_COMPONENT_COUNT }, // wrong number of components
    };

    status->total_tests = LENGTHOF(tests);

    for (size_t i = 0; i < status->total_tests; ++i) {
        ipv6_address_full_t addr;
        diag_test_capture_t capture;
        bool failed = false;

        memset(&addr, 0, sizeof(addr));
        memset(&capture, 0, sizeof(capture));

        printf("ipv6_from_str_diag %lu/%lu \"%s\"\n####\n",
            i+1,
            status->total_tests,
            tests[i].input);

        if (!ipv6_from_str_diag(
                tests[i].input,
                strlen(tests[i].input),
                &addr,
                test_parsing_diag_fn,
                &capture))
        {
            if (capture.calls != 1) {
                TEST_FAILED("    ipv6_from_str_diag failed, wrong # diag calls: %lu\n",
                    capture.calls);
            }
            else if (capture.message == NULL) {
                TEST_FAILED("    ipv6_from_str_diag failed, message was NULL\n");
            }
            else if (capture.event != tests[i].expected_event) {
                TEST_FAILED("    ipv6_from_str_diag failed, event %u != %u (expected), message: %s\n",
                    capture.event,
                    tests[i].expected_event,
                    capture.message);
            }
        }
        else {
            TEST_FAILED("    ipv6_from_str_diag was expected to fail with diagnostic");
        }

        if (!failed) {
            printf("+ PASS\n\n");
        } else {
            printf("- FAIL\n\n");
            status->failed_count++;
        }
    }
}

static void test_api_use_loopback_const (test_status_t* status) {
    // Just treat all of the checks in this function as a single test
    bool failed = false;
    status->total_tests = 1;

    // test using the host order network constant directly in an ipv6_address_full_t
    const uint32_t LOOPBACK = 0x7f000001;
    const char LOOPBACK_STR[] = "127.0.0.1";
    uint16_t components[IPV6_NUM_COMPONENTS] = {
        LOOPBACK >> 16,
        LOOPBACK & 0xffff,
        0 };

    struct in_addr in_addr;
    inet_aton(LOOPBACK_STR, &in_addr);
    if (LOOPBACK != ntohl(in_addr.s_addr)) {
        TEST_FAILED("    ntohl(inet_aton(LOOPBACK_STR)) does not match host constant\n");
    }

    // Make the raw address from the in-memory version
    ipv6_address_full_t addr;
    memset(&addr, 0, sizeof(addr));
    memcpy(&addr.address.components[0], &components[0], sizeof(components));
    addr.flags |= IPV6_FLAG_IPV4_COMPAT;

    ipv6_address_full_t parsed;
    if (!ipv6_from_str(LOOPBACK_STR, sizeof(LOOPBACK_STR) -1, &parsed)) {
        TEST_FAILED("    ipv6_from_str failed on LOOPBACK_STR\n");
    }

    if (!COMPARE(&parsed, &addr)) {
        TEST_FAILED("    ipv4 compat loopback comparison failed\n");
    }

    char buffer[64];
    if (!ipv6_to_str(&addr, buffer, sizeof(buffer))) {
        TEST_FAILED("    ipv6_to_str failed for raw address\n");
    }

    ipv6_address_full_t roundtrip;
    if (!ipv6_from_str(buffer, strlen(buffer), &roundtrip)) {
        TEST_FAILED("    ipv6_from_str failed for roundtrip string: %s\n", buffer);
    }

    if (!COMPARE(&roundtrip, &addr)) {
        TEST_FAILED("    compare failed for roundtrip\n");
    }

    if (failed) {
        printf("- FAIL\n\n");
        status->failed_count++;
    }
    else {
        printf("+ PASS\n\n");
    }
}

int main () {
    test_group_t test_groups[] = {
        { "test_parsing", test_parsing },
        { "test_parsing_diag", test_parsing_diag },
        { "test_api_use_loopback_const", test_api_use_loopback_const }
    };

    for (size_t i = 0; i < LENGTHOF(test_groups); ++i) {
        test_status_t status = { 0, };
        printf("%s\n===\n", test_groups[i].name);
        test_groups[i].func(&status);

        printf("\n%lu/%lu passed.\n\n",
            (status.total_tests - status.failed_count),
            status.total_tests);
    }

    return 0;
}

