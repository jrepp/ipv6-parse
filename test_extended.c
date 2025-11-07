#include "ipv6.h"
#include "ipv6_config.h"
#include "ipv6_test_config.h"

#ifdef HAVE_STDIO_H
#include <stdio.h>
#endif

#ifdef HAVE_STRING_H
#include <string.h>
#endif

#ifdef HAVE_ASSERT_H
#include <assert.h>
#endif

// Extended tests for improved code coverage

typedef struct {
    uint32_t total_tests;
    uint32_t failed_count;
} test_status_t;

typedef struct {
    const char* name;
    void (*func)(test_status_t* status);
} test_group_t;

typedef struct {
    const char* input;
    uint16_t components[IPV6_NUM_COMPONENTS];
    uint16_t port;
    uint32_t mask;
    uint32_t flags;
} test_data_t;

typedef struct {
    const char* input;
    ipv6_diag_event_t expected_event;
} diag_test_data_t;

typedef struct {
    const char* message;
    ipv6_diag_event_t event;
    uint32_t calls;
} diag_test_capture_t;

#define LENGTHOF(x) ((uint32_t)(sizeof(x)/sizeof(x[0])))

#define TEST_FAILED(...) \
    printf("  FAILED %s:%d ", (const char *)__FILE__, (int32_t)__LINE__); \
    printf(__VA_ARGS__); \
    status->failed_count++; \
    status->total_tests++; \
    assert(false);

#define TEST_PASSED(...) \
    status->total_tests++;

static void test_parsing_diag_fn(
    ipv6_diag_event_t event,
    const ipv6_diag_info_t* info,
    void* user_data)
{
    diag_test_capture_t* capture = (diag_test_capture_t*)user_data;
    capture->event = event;
    capture->message = info->message;
    capture->calls++;
}

static bool compare_address(const ipv6_address_full_t* a, const ipv6_address_full_t* b) {
    for (int i = 0; i < IPV6_NUM_COMPONENTS; ++i) {
        if (a->address.components[i] != b->address.components[i]) {
            return false;
        }
    }
    return (a->port == b->port) && (a->mask == b->mask) && (a->flags == b->flags);
}

//
// Test uppercase hexadecimal digits
//
static void test_uppercase_hex(test_status_t* status) {
    test_data_t tests[] = {
        { "FFFF::1", { 0xffff, 0, 0, 0, 0, 0, 0, 1 }, 0, 0, 0 },
        { "2001:DB8::1", { 0x2001, 0xdb8, 0, 0, 0, 0, 0, 1 }, 0, 0, 0 },
        { "ABCD:EF01::1234", { 0xabcd, 0xef01, 0, 0, 0, 0, 0, 0x1234 }, 0, 0, 0 },
        { "::FFFF:1.2.3.4", { 0, 0, 0, 0, 0, 0xffff, 0x0102, 0x0304 }, 0, 0, IPV6_FLAG_IPV4_EMBED },
        { "A:B:C:D:E:F:1:2", { 0xa, 0xb, 0xc, 0xd, 0xe, 0xf, 1, 2 }, 0, 0, 0 },
    };

    for (uint32_t i = 0; i < LENGTHOF(tests); ++i) {
        ipv6_address_full_t parsed;
        ipv6_address_full_t expected;

        memset(&parsed, 0, sizeof(parsed));
        memset(&expected, 0, sizeof(expected));

        printf("test_uppercase_hex index: %u \"%s\"\n", i, tests[i].input);

        if (!ipv6_from_str(tests[i].input, strlen(tests[i].input), &parsed)) {
            TEST_FAILED("  ipv6_from_str failed for uppercase hex\n");
        } else {
            TEST_PASSED();
        }

        // Copy expected values
        memcpy(&expected.address.components[0], &tests[i].components[0],
               sizeof(uint16_t) * IPV6_NUM_COMPONENTS);
        expected.port = tests[i].port;
        expected.mask = tests[i].mask;
        expected.flags = tests[i].flags;

        if (!compare_address(&parsed, &expected)) {
            TEST_FAILED("  uppercase hex address mismatch\n");
        } else {
            TEST_PASSED();
        }
    }
}

//
// Test zone ID / interface support
//
static void test_zone_ids(test_status_t* status) {
    struct zone_test {
        const char* input;
        uint16_t expected_addr[8];
        const char* expected_iface;
        uint32_t expected_iface_len;
        bool should_succeed;
    };

    struct zone_test tests[] = {
        // Basic zone IDs
        { "fe80::1%eth0", { 0xfe80, 0, 0, 0, 0, 0, 0, 1 }, "eth0", 4, true },
        { "::1%lo", { 0, 0, 0, 0, 0, 0, 0, 1 }, "lo", 2, true },
        { "fe80::abcd%wlan0", { 0xfe80, 0, 0, 0, 0, 0, 0, 0xabcd }, "wlan0", 5, true },

        // Interface names with numbers and special chars
        { "fe80::1%eth0.100", { 0xfe80, 0, 0, 0, 0, 0, 0, 1 }, "eth0.100", 8, true },
        { "fe80::1%vlan123", { 0xfe80, 0, 0, 0, 0, 0, 0, 1 }, "vlan123", 7, true },
        { "fe80::1%br-lan", { 0xfe80, 0, 0, 0, 0, 0, 0, 1 }, "br-lan", 6, true },
        { "fe80::1%tun_vpn", { 0xfe80, 0, 0, 0, 0, 0, 0, 1 }, "tun_vpn", 7, true },

        // Zone ID with CIDR mask
        { "fe80::1/64%eth0", { 0xfe80, 0, 0, 0, 0, 0, 0, 1 }, "eth0", 4, true },

        // Zone ID with brackets (for port notation)
        { "[fe80::1%eth0]:8080", { 0xfe80, 0, 0, 0, 0, 0, 0, 1 }, "eth0", 4, true },

        // Long interface name (15 chars - max allowed)
        { "fe80::1%verylongifname", { 0xfe80, 0, 0, 0, 0, 0, 0, 1 }, "verylongifname", 14, true },
        { "fe80::1%verylongifnam15", { 0xfe80, 0, 0, 0, 0, 0, 0, 1 }, "verylongifnam15", 15, true },

        // Too long interface name (16+ chars - should fail per IFNAMSIZ)
        { "fe80::1%verylongifname16", { 0, 0, 0, 0, 0, 0, 0, 0 }, NULL, 0, false },

        // Empty interface name
        { "fe80::1%", { 0xfe80, 0, 0, 0, 0, 0, 0, 1 }, "", 0, false },
    };

    for (uint32_t i = 0; i < LENGTHOF(tests); ++i) {
        ipv6_address_full_t parsed;
        memset(&parsed, 0, sizeof(parsed));

        printf("test_zone_ids index: %u \"%s\"\n", i, tests[i].input);

        bool result = ipv6_from_str(tests[i].input, strlen(tests[i].input), &parsed);

        if (tests[i].should_succeed) {
            if (!result) {
                TEST_FAILED("  Expected parsing to succeed but it failed\n");
                continue;
            }

            // Verify address components
            bool addr_match = true;
            for (int j = 0; j < 8; ++j) {
                if (parsed.address.components[j] != tests[i].expected_addr[j]) {
                    addr_match = false;
                    break;
                }
            }

            if (!addr_match) {
                TEST_FAILED("  Address components don't match\n");
                continue;
            }

            // Verify interface name was captured
            if (parsed.iface == NULL) {
                TEST_FAILED("  Zone ID not captured\n");
                continue;
            }

            if (parsed.iface_len != tests[i].expected_iface_len) {
                TEST_FAILED("  Zone ID length mismatch: expected %u, got %u\n",
                    tests[i].expected_iface_len, parsed.iface_len);
                continue;
            }

            if (strncmp(parsed.iface, tests[i].expected_iface, parsed.iface_len) != 0) {
                TEST_FAILED("  Zone ID content mismatch: expected '%s', got '%.*s'\n",
                    tests[i].expected_iface, (int)parsed.iface_len, parsed.iface);
                continue;
            }

            printf("  Zone ID captured: %.*s (len=%u)\n",
                (int)parsed.iface_len, parsed.iface, parsed.iface_len);

            // Test round-trip conversion
            char buffer[IPV6_STRING_SIZE];
            size_t len = ipv6_to_str(&parsed, buffer, sizeof(buffer));
            if (len > 0) {
                printf("  Round-trip: %s\n", buffer);

                // Verify the output contains the zone ID
                const char* zone_marker = strchr(buffer, '%');
                if (zone_marker == NULL) {
                    TEST_FAILED("  Round-trip output missing zone ID\n");
                    continue;
                }

                // Verify zone ID matches
                zone_marker++; // skip '%'
                const char* zone_end = zone_marker;
                while (*zone_end && *zone_end != ']' && *zone_end != '/' && *zone_end != ' ') {
                    zone_end++;
                }

                size_t zone_len = zone_end - zone_marker;
                if (zone_len != tests[i].expected_iface_len ||
                    strncmp(zone_marker, tests[i].expected_iface, zone_len) != 0) {
                    TEST_FAILED("  Round-trip zone ID mismatch\n");
                    continue;
                }
            }

            TEST_PASSED();
        } else {
            // Should fail
            if (result) {
                TEST_FAILED("  Expected parsing to fail but it succeeded\n");
            } else {
                printf("  Correctly rejected invalid input\n");
                TEST_PASSED();
            }
        }
    }
}

//
// Test oversized input strings
//
static void test_oversized_input(test_status_t* status) {
    // Create a string longer than IPV6_STRING_SIZE (66)
    char oversized[100];
    memset(oversized, 'f', sizeof(oversized));
    oversized[0] = 'f';
    oversized[1] = 'f';
    oversized[2] = ':';
    oversized[3] = ':';
    oversized[sizeof(oversized)-1] = '\0';

    ipv6_address_full_t parsed;
    diag_test_capture_t capture;
    memset(&parsed, 0, sizeof(parsed));
    memset(&capture, 0, sizeof(capture));

    printf("test_oversized_input: length=%zu\n", strlen(oversized));

    if (ipv6_from_str_diag(oversized, strlen(oversized), &parsed,
                           test_parsing_diag_fn, &capture)) {
        TEST_FAILED("  oversized input should fail\n");
    } else {
        TEST_PASSED();
    }

    if (capture.event != IPV6_DIAG_STRING_SIZE_EXCEEDED) {
        TEST_FAILED("  expected STRING_SIZE_EXCEEDED event\n");
    } else {
        TEST_PASSED();
    }
}

//
// Test IPv4 embedding error cases
//
static void test_ipv4_embed_errors(test_status_t* status) {
    // Test actual error case: too many IPv4 octets in embedding
    diag_test_data_t tests[] = {
        { "::1.2.3.4.5", IPV6_DIAG_V4_BAD_COMPONENT_COUNT },
        { "::1.2.3.4.5.6", IPV6_DIAG_V4_BAD_COMPONENT_COUNT },
    };

    for (uint32_t i = 0; i < LENGTHOF(tests); ++i) {
        ipv6_address_full_t parsed;
        diag_test_capture_t capture;
        memset(&parsed, 0, sizeof(parsed));
        memset(&capture, 0, sizeof(capture));

        printf("test_ipv4_embed_errors index: %u \"%s\"\n", i, tests[i].input);

        if (ipv6_from_str_diag(tests[i].input, strlen(tests[i].input), &parsed,
                               test_parsing_diag_fn, &capture)) {
            TEST_FAILED("  too many IPv4 octets should fail\n");
        } else {
            TEST_PASSED();
        }

        if (capture.event != tests[i].expected_event) {
            TEST_FAILED("  expected event %u, got %u\n", tests[i].expected_event, capture.event);
        } else {
            TEST_PASSED();
        }
    }
}

//
// Test trailing whitespace
//
static void test_trailing_whitespace(test_status_t* status) {
    test_data_t tests[] = {
        { "[::1]:8080  ", { 0, 0, 0, 0, 0, 0, 0, 1 }, 8080, 0, IPV6_FLAG_HAS_PORT },
        { "::1  ", { 0, 0, 0, 0, 0, 0, 0, 1 }, 0, 0, 0 },
        { "ffff::1\t", { 0xffff, 0, 0, 0, 0, 0, 0, 1 }, 0, 0, 0 },
        { "[::1]\n", { 0, 0, 0, 0, 0, 0, 0, 1 }, 0, 0, 0 },
    };

    for (uint32_t i = 0; i < LENGTHOF(tests); ++i) {
        ipv6_address_full_t parsed;
        ipv6_address_full_t expected;
        memset(&parsed, 0, sizeof(parsed));
        memset(&expected, 0, sizeof(expected));

        printf("test_trailing_whitespace index: %u\n", i);

        if (!ipv6_from_str(tests[i].input, strlen(tests[i].input), &parsed)) {
            TEST_FAILED("  ipv6_from_str failed with trailing whitespace\n");
        } else {
            TEST_PASSED();
        }

        memcpy(&expected.address.components[0], &tests[i].components[0],
               sizeof(uint16_t) * IPV6_NUM_COMPONENTS);
        expected.port = tests[i].port;
        expected.mask = tests[i].mask;
        expected.flags = tests[i].flags;

        if (!compare_address(&parsed, &expected)) {
            TEST_FAILED("  address mismatch with trailing whitespace\n");
        } else {
            TEST_PASSED();
        }
    }
}

//
// Test mixed case hex
//
static void test_mixed_case_hex(test_status_t* status) {
    test_data_t tests[] = {
        { "FfFf::1", { 0xffff, 0, 0, 0, 0, 0, 0, 1 }, 0, 0, 0 },
        { "2001:Db8::AbCd", { 0x2001, 0xdb8, 0, 0, 0, 0, 0, 0xabcd }, 0, 0, 0 },
        { "::FfFf:1.2.3.4", { 0, 0, 0, 0, 0, 0xffff, 0x0102, 0x0304 }, 0, 0, IPV6_FLAG_IPV4_EMBED },
    };

    for (uint32_t i = 0; i < LENGTHOF(tests); ++i) {
        ipv6_address_full_t parsed;
        ipv6_address_full_t expected;
        memset(&parsed, 0, sizeof(parsed));
        memset(&expected, 0, sizeof(expected));

        printf("test_mixed_case_hex index: %u \"%s\"\n", i, tests[i].input);

        if (!ipv6_from_str(tests[i].input, strlen(tests[i].input), &parsed)) {
            TEST_FAILED("  ipv6_from_str failed for mixed case\n");
        } else {
            TEST_PASSED();
        }

        memcpy(&expected.address.components[0], &tests[i].components[0],
               sizeof(uint16_t) * IPV6_NUM_COMPONENTS);
        expected.port = tests[i].port;
        expected.mask = tests[i].mask;
        expected.flags = tests[i].flags;

        if (!compare_address(&parsed, &expected)) {
            TEST_FAILED("  mixed case address mismatch\n");
        } else {
            TEST_PASSED();
        }
    }
}

//
// Test ipv6_to_str edge cases
//
static void test_to_str_edge_cases(test_status_t* status) {
    ipv6_address_full_t addr;
    char buffer[100];

    // Test NULL output pointer
    memset(&addr, 0, sizeof(addr));
    addr.address.components[7] = 1;

    printf("test_to_str_edge_cases: NULL buffer\n");
    if (ipv6_to_str(&addr, NULL, 100) != 0) {
        TEST_FAILED("  ipv6_to_str should fail with NULL buffer\n");
    } else {
        TEST_PASSED();
    }

    // Test NULL input pointer
    printf("test_to_str_edge_cases: NULL input\n");
    if (ipv6_to_str(NULL, buffer, sizeof(buffer)) != 0) {
        TEST_FAILED("  ipv6_to_str should fail with NULL input\n");
    } else {
        TEST_PASSED();
    }

    // Test buffer too small
    printf("test_to_str_edge_cases: buffer too small\n");
    if (ipv6_to_str(&addr, buffer, 3) != 0) {
        TEST_FAILED("  ipv6_to_str should fail with tiny buffer\n");
    } else {
        TEST_PASSED();
    }
}

int main(void) {
    test_group_t test_groups[] = {
        { "test_uppercase_hex", test_uppercase_hex },
        { "test_zone_ids", test_zone_ids },
        { "test_oversized_input", test_oversized_input },
        { "test_ipv4_embed_errors", test_ipv4_embed_errors },
        { "test_trailing_whitespace", test_trailing_whitespace },
        { "test_mixed_case_hex", test_mixed_case_hex },
        { "test_to_str_edge_cases", test_to_str_edge_cases },
    };

    uint32_t total_failures = 0;
    uint32_t total_tests = 0;

    printf("=== IPv6 Parse Extended Test Suite ===\n\n");

    for (uint32_t i = 0; i < LENGTHOF(test_groups); ++i) {
        test_status_t status = { 0, };
        printf("%s\n===\n", test_groups[i].name);
        test_groups[i].func(&status);

        printf("\n%u/%u passed (%u failures).\n\n",
            (uint32_t)(status.total_tests - status.failed_count),
            status.total_tests,
            status.failed_count);

        total_tests += status.total_tests;
        total_failures += status.failed_count;
    }

    printf("======\n  total: %u/%u passed (%u failures).\n\n",
        (uint32_t)(total_tests - total_failures),
        total_tests,
        total_failures);

    return total_failures > 0 ? 1 : 0;
}
