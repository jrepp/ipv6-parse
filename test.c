#include "ipv6.h"
#include "config.h"

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

typedef struct {
    const char*             input;
    uint16_t                components[IPV6_NUM_COMPONENTS];
    uint16_t                port;
    uint32_t                mask;
    uint32_t                flags;
} test_data_t;

#define COMPARE(a, b) compare(#a, a, #b, b)

bool compare(const char* aname, const ipv6_address_full_t* a, const char* bname, const ipv6_address_full_t* b) {
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

void copy_test_data(ipv6_address_full_t* dst, const test_data_t* src) {
    memset(dst, 0, sizeof(ipv6_address_full_t));
    memcpy(&(dst->address.components[0]), &src->components[0], sizeof(uint16_t) * IPV6_NUM_COMPONENTS); 
    dst->port = src->port;
    dst->mask = src->mask;
}

// TODO: negative tests
//
// { "::", "0:0:0:0:0:0:0:0:0", { 0, }, 0, 0 }, // 9 address indicators
// not enough address indicators
// multiple zeroruns
// triple separator
// out of bound address component
// out of bound cidr
// invalid brackets
// invalid port specifier
// out of bound port
// v6 separator after v4 embedding
// non zero-padded v4 embedding
// invalid number of v4 octets
// 
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
//
void test_parsing (test_status_t* status) {
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
        { "::ffff:1.2.3.4", { 0, 0, 0, 0, 0, 0xffff, 0x102, 0x304 }, 0, 0, IPV6_FLAG_IPV4_EMBED },
        { "::ffff:1.2.3.4/32", { 0, 0, 0, 0, 0, 0xffff, 0x102, 0x304 }, 32, 0, IPV6_FLAG_IPV4_EMBED|IPV6_FLAG_HAS_MASK },
        { "[::ffff:1.2.3.4/32]:5678", { 0, 0, 0, 0, 0, 0xffff, 0x102, 0x304 }, 32, 5678, IPV6_FLAG_IPV4_EMBED|IPV6_FLAG_HAS_MASK|IPV6_FLAG_HAS_PORT },
        { "1:2:3:4:5:0:0:0/128", { 1, 2, 3, 4, 5, 0, 0, 0 }, 128, 0, IPV6_FLAG_HAS_MASK },
        { "[1:2:3:4:5:0:0:0/128]:5678", { 1, 2, 3, 4, 5, 0, 0, 0 }, 128, 5678, IPV6_FLAG_HAS_MASK|IPV6_FLAG_HAS_PORT },
        { "[1:2:3:4:5::]:5678", { 1, 2, 3, 4, 5, 0, 0, 0 }, 0, 5678, IPV6_FLAG_HAS_PORT },
        { "[::1]:5678", { 0, 0, 0, 0, 0, 0, 0, 1 }, 0, 5678, IPV6_FLAG_HAS_PORT },
    };

#define lengthof(x) (sizeof(x)/sizeof(x[0]))

#define test_failed(...) \
    printf("  FAILED %s:%d", __FILE__, __LINE__); \
    printf(__VA_ARGS__); \
    failed = true;

    size_t failed_count = 0;
    size_t total_tests = lengthof(tests);
    char* tostr = (char*)alloca(IPV6_STRING_SIZE);

    for (size_t i = 0; i < total_tests; ++i) {
        ipv6_address_full_t test = { 0, };
        ipv6_address_full_t parsed = { 0, };
        bool failed = false;

        //
        // Test the string conversion into the 'parsed' structure
        //
        printf("## ipv6 test from_str (primary) test %lu/%lu \"%s\"\n", i+1, total_tests, tests[i].input);
        if (!ipv6_from_str(tests[i].input, strlen(tests[i].input), &parsed)) {
            test_failed("  ipv6_from_str failed\n");
        }
        copy_test_data(&test, &tests[i]);
        if (!COMPARE(&test, &parsed)) {
            test_failed("  compare failed\n");
        }

        // Test to_str and back with comparion
        if (!ipv6_to_str(&parsed, tostr, IPV6_STRING_SIZE)) {
            test_failed("  ipv6_to_str failed\n");
        }

        // printf("  ipv6_to_str -> %s\n", tostr);
        if (!ipv6_from_str(tostr, strlen(tostr), &parsed)) {
            test_failed("  ipv6 string round-trip failed\n");
        }
        if (!COMPARE(&parsed, &test)) {
            test_failed("  compare failed\n");
        }
        
        if (!failed) {
            printf("+ pass\n");
        } else {
            printf("- fail\n");
            failed_count++;
        }
    }
}

void test_parsing_diag (test_status_t* status) {
}

int main() {
    
    printf("== %lu/%lu passed.\n", (total_tests - failed_count), total_tests);

    return 0;
}

