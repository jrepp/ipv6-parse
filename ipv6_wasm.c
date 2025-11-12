/*
 * Copyright (c) 2017-2025 Jacob Repp <jacobrepp@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * WebAssembly bindings for ipv6-parse library
 *
 * This file provides efficient, idiomatic JavaScript exports for the ipv6-parse
 * library. The API is designed to minimize WASM boundary crossings by returning
 * all parsed data in a single call via a packed structure.
 *
 * Design principles:
 * - No global state (all functions are stateless)
 * - Single call to get all data (pack into struct)
 * - JavaScript layer provides idiomatic API
 * - Cache-friendly data structures
 */

#include "ipv6.h"
#include <string.h>
#include <stdio.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

/**
 * Packed result structure for efficient data transfer to JavaScript
 *
 * Total size: 80 bytes (cache-line friendly)
 * Designed for single-copy read from JavaScript via heap access
 */
typedef struct {
    uint16_t components[8];  // 16 bytes - address components in network byte order
    uint16_t port;           // 2 bytes  - port number (0 if not specified)
    uint16_t pad0;           // 2 bytes  - alignment padding
    uint32_t mask;           // 4 bytes  - CIDR mask bits (0 if not specified)
    uint32_t flags;          // 4 bytes  - feature flags (IPV6_FLAG_*)
    char formatted[48];      // 48 bytes - RFC 5952 formatted address string
    char zone[16];           // 16 bytes - zone ID / interface name
} ipv6_parse_result_t;

/**
 * Parse an IPv6/IPv4 address and return all data in one call
 *
 * This is the primary API function. It parses the input address and populates
 * the result structure with all parsed data, minimizing WASM boundary crossings.
 *
 * @param input  - Input address string (e.g., "::1", "[::1]:8080", "fe80::1%eth0")
 * @param result - Pointer to result structure (allocated by JavaScript)
 * @return 1 on success, 0 on parse failure
 *
 * Example from JavaScript:
 *   const resultPtr = Module._malloc(80); // sizeof(ipv6_parse_result_t)
 *   const success = Module.ccall('ipv6_parse_full', 'number',
 *                                ['string', 'number'], [address, resultPtr]);
 */
EMSCRIPTEN_KEEPALIVE
int ipv6_parse_full(const char* input, ipv6_parse_result_t* result) {
    if (!input || !result) {
        return 0;
    }

    // Parse address using core library
    ipv6_address_full_t addr;
    memset(&addr, 0, sizeof(addr));
    memset(result, 0, sizeof(ipv6_parse_result_t));

    size_t len = strlen(input);
    if (!ipv6_from_str(input, len, &addr)) {
        return 0;  // Parse failed
    }

    // Pack all data into result structure for single-copy transfer
    memcpy(result->components, addr.address.components, sizeof(result->components));
    result->port = addr.port;
    result->mask = addr.mask;
    result->flags = addr.flags;

    // Format the address according to RFC 5952
    ipv6_to_str(&addr, result->formatted, sizeof(result->formatted));

    // Copy zone ID if present
    if (addr.iface_len > 0 && addr.iface_len < sizeof(result->zone)) {
        memcpy(result->zone, addr.iface, addr.iface_len);
        result->zone[addr.iface_len] = '\0';
    }

    return 1;  // Success
}

/**
 * Compare two addresses for equality (stateless)
 *
 * @param addr1        - First address string
 * @param addr2        - Second address string
 * @param ignore_flags - Flags to ignore in comparison (bitwise OR of IPV6_FLAG_*)
 * @return 0 if equal (IPV6_COMPARE_OK), non-zero otherwise
 *
 * Common ignore_flags:
 *   0x01 - Ignore port (IPV6_FLAG_HAS_PORT)
 *   0x02 - Ignore CIDR mask (IPV6_FLAG_HAS_MASK)
 *   0x04 - Ignore IPv4 embed format (IPV6_FLAG_IPV4_EMBED)
 */
EMSCRIPTEN_KEEPALIVE
int ipv6_compare_str(const char* addr1, const char* addr2, uint32_t ignore_flags) {
    if (!addr1 || !addr2) {
        return -1;  // Invalid input
    }

    ipv6_address_full_t a1, a2;
    memset(&a1, 0, sizeof(a1));
    memset(&a2, 0, sizeof(a2));

    // Parse both addresses
    if (!ipv6_from_str(addr1, strlen(addr1), &a1)) {
        return -1;  // First address invalid
    }
    if (!ipv6_from_str(addr2, strlen(addr2), &a2)) {
        return -1;  // Second address invalid
    }

    // Use core library comparison
    return ipv6_compare(&a1, &a2, ignore_flags);
}

/**
 * Get library version string
 *
 * @return Version string (e.g., "1.2.1-wasm")
 */
EMSCRIPTEN_KEEPALIVE
const char* ipv6_version() {
    return "1.2.1-wasm";
}

/**
 * Get size of result structure
 *
 * Helper for JavaScript to allocate the correct amount of memory.
 * @return sizeof(ipv6_parse_result_t) in bytes
 */
EMSCRIPTEN_KEEPALIVE
int ipv6_result_size() {
    return sizeof(ipv6_parse_result_t);
}
