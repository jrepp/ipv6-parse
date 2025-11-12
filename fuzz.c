/*
 * Copyright (c) 2017-2025 Jacob Repp <jacobrepp@gmail.com>
 *
 * SPDX-License-Identifier: MIT
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>

#ifdef _WIN32
    #include <windows.h>
#else
    #include <sys/time.h>
#endif

#include "ipv6.h"

#define MAX_INPUT_LENGTH 100
#define MAX_OUTPUT_LENGTH 200
#define NUM_ITERATIONS 1000

// Benchmark timing utilities
static double get_time_ms(void) {
#ifdef _WIN32
    LARGE_INTEGER frequency, counter;
    QueryPerformanceFrequency(&frequency);
    QueryPerformanceCounter(&counter);
    return (counter.QuadPart * 1000.0) / frequency.QuadPart;
#else
    struct timeval tv;
    gettimeofday(&tv, NULL);
    return tv.tv_sec * 1000.0 + tv.tv_usec / 1000.0;
#endif
}

char* generate_random_string(int length) {
    // Include all relevant characters for IPv6/IPv4 parsing including edge case chars
    const char* chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:.[]/%_-@#! \t\n";
    char* str = (char*)malloc((length + 1) * sizeof(char));
    for (int i = 0; i < length; i++) {
        int index = rand() % (int)strlen(chars);
        str[i] = chars[index];
    }
    str[length] = '\0';
    return str;
}

void fuzz_ipv6_from_str(int num_iterations, int verbose) {
    printf("Fuzzing ipv6_from_str with %d iterations:\n", num_iterations);

    int success_count = 0;
    double start_time = get_time_ms();

    for (int i = 0; i < num_iterations; i++) {
        int input_length = rand() % (MAX_INPUT_LENGTH + 1);
        char* input_string = generate_random_string(input_length);
        size_t input_bytes = strlen(input_string);

        ipv6_address_full_t ipv6_address;
        memset(&ipv6_address, 0, sizeof(ipv6_address_full_t));

        bool result = ipv6_from_str(input_string, input_bytes, &ipv6_address);

        if (result) {
            success_count++;
        }

        if (verbose && i < 10) {
            printf("  Input: %s -> %s\n", input_string, result ? "VALID" : "INVALID");
        }

        free(input_string);
    }

    double elapsed_ms = get_time_ms() - start_time;
    double ops_per_sec = (num_iterations / elapsed_ms) * 1000.0;

    printf("  Completed: %d iterations in %.2f ms\n", num_iterations, elapsed_ms);
    printf("  Success rate: %.1f%% (%d/%d valid)\n",
           (success_count * 100.0) / num_iterations, success_count, num_iterations);
    printf("  Performance: %.0f parses/sec (%.2f μs/parse)\n",
           ops_per_sec, (elapsed_ms * 1000.0) / num_iterations);
    printf("\n");
}

void fuzz_ipv6_to_str(int num_iterations, int verbose) {
    printf("Fuzzing ipv6_to_str with %d iterations:\n", num_iterations);

    int success_count = 0;
    double start_time = get_time_ms();

    for (int i = 0; i < num_iterations; i++) {
        ipv6_address_full_t ipv6_address;
        memset(&ipv6_address, 0, sizeof(ipv6_address_full_t));
        for (int j = 0; j < IPV6_NUM_COMPONENTS; j++) {
            ipv6_address.address.components[j] = rand() % 0xFFFF;
        }
        ipv6_address.mask = rand() % 129;
        ipv6_address.port = rand() % 0xFFFF;
        ipv6_address.flags = rand() % 0xFF;

        char output_string[MAX_OUTPUT_LENGTH];
        size_t output_bytes = ipv6_to_str(&ipv6_address, output_string, sizeof(output_string));

        if (output_bytes > 0) {
            success_count++;
        }

        if (verbose && i < 10) {
            printf("  Output: %s (%zu bytes)\n", output_string, output_bytes);
        }
    }

    double elapsed_ms = get_time_ms() - start_time;
    double ops_per_sec = (num_iterations / elapsed_ms) * 1000.0;

    printf("  Completed: %d iterations in %.2f ms\n", num_iterations, elapsed_ms);
    printf("  Success rate: %.1f%% (%d/%d)\n",
           (success_count * 100.0) / num_iterations, success_count, num_iterations);
    printf("  Performance: %.0f conversions/sec (%.2f μs/conversion)\n",
           ops_per_sec, (elapsed_ms * 1000.0) / num_iterations);
    printf("\n");
}

void fuzz_ipv6_compare(int num_iterations, int verbose) {
    printf("Fuzzing ipv6_compare with %d iterations:\n", num_iterations);

    int equal_count = 0;
    double start_time = get_time_ms();

    for (int i = 0; i < num_iterations; i++) {
        ipv6_address_full_t ipv6_address1;
        ipv6_address_full_t ipv6_address2;
        memset(&ipv6_address1, 0, sizeof(ipv6_address_full_t));
        memset(&ipv6_address2, 0, sizeof(ipv6_address_full_t));
        for (int j = 0; j < IPV6_NUM_COMPONENTS; j++) {
            ipv6_address1.address.components[j] = rand() % 0xFFFF;
            ipv6_address2.address.components[j] = rand() % 0xFFFF;
        }
        ipv6_address1.mask = rand() % 129;
        ipv6_address2.mask = rand() % 129;
        ipv6_address1.port = rand() % 0xFFFF;
        ipv6_address2.port = rand() % 0xFFFF;
        ipv6_address1.flags = rand() % 0xFF;
        ipv6_address2.flags = rand() % 0xFF;

        uint32_t ignore_flags = rand() % 0xFF;

        ipv6_compare_result_t result = ipv6_compare(&ipv6_address1, &ipv6_address2, ignore_flags);

        if (result == IPV6_COMPARE_OK) {
            equal_count++;
        }

        if (verbose && i < 10) {
            printf("  Compare result: %d\n", result);
        }
    }

    double elapsed_ms = get_time_ms() - start_time;
    double ops_per_sec = (num_iterations / elapsed_ms) * 1000.0;

    printf("  Completed: %d iterations in %.2f ms\n", num_iterations, elapsed_ms);
    printf("  Equal addresses: %.1f%% (%d/%d)\n",
           (equal_count * 100.0) / num_iterations, equal_count, num_iterations);
    printf("  Performance: %.0f comparisons/sec (%.2f μs/comparison)\n",
           ops_per_sec, (elapsed_ms * 1000.0) / num_iterations);
    printf("\n");
}

void fuzz_edge_cases(void) {
    printf("Testing edge cases:\n");

    // Edge case test inputs
    const char* edge_cases[] = {
        // Boundary values
        "0:0:0:0:0:0:0:0",
        "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff",

        // Zone ID edge cases
        "fe80::1%",                      // Empty zone ID
        "fe80::1%123456789012345",       // Long zone ID (15 chars - max)
        "fe80::1%1234567890123456",      // Too long zone ID (16 chars)
        "fe80::1%eth-0",                 // Zone ID with hyphen
        "fe80::1%eth_0",                 // Zone ID with underscore
        "fe80::1%0",                     // Numeric zone ID
        "[fe80::1%eth0]:8080",           // Zone ID with port
        "fe80::1/64%eth0",               // Zone ID with CIDR
        "[fe80::1/64%eth0]:8080",        // Zone ID with CIDR and port

        // CIDR edge cases
        "::/0",                          // Minimum CIDR
        "::1/128",                       // Maximum CIDR
        "::1/129",                       // Invalid CIDR (too large)
        "::1/999",                       // Invalid CIDR (way too large)
        "::1/-1",                        // Negative CIDR

        // Port edge cases
        "[::1]:0",                       // Port 0
        "[::1]:65535",                   // Maximum port
        "[::1]:65536",                   // Port too large
        "[::1]:99999",                   // Port way too large
        "[::1]:-1",                      // Negative port

        // Bracket edge cases
        "[::1",                          // Missing closing bracket
        "::1]",                          // Missing opening bracket
        "[[::1]]",                       // Double brackets
        "[::1]:8080",                    // Correct brackets with port
        "::1:8080",                      // No brackets (invalid for port)

        // Compression edge cases
        ":::",                           // Triple colon
        "1::2::3",                       // Multiple compressions
        "::1::2",                        // Multiple compressions
        "1:2:3:4:5:6:7:8:9",            // Too many components

        // IPv4-embedded edge cases
        "::ffff:256.0.0.1",             // IPv4 octet too large
        "::ffff:1.2.3",                 // IPv4 too few octets
        "::ffff:1.2.3.4.5",             // IPv4 too many octets
        "::192.168.1.1",                // IPv4 embed without ffff prefix
        "1:2:3:4:5:6:192.168.1.1",      // IPv4 embed at correct position
        "192.168.1.1:8080",             // IPv4 with port (no brackets)

        // Malformed inputs
        "",                              // Empty string
        ":",                             // Single colon
        "::",                            // Double colon only
        "g::1",                          // Invalid hex character
        "12345::1",                      // Component too long
        "  ::1  ",                       // Leading/trailing spaces
        "::1\n",                         // Newline in input
        "::1\t",                         // Tab in input

        // Very long inputs
        "1111:2222:3333:4444:5555:6666:7777:8888:9999:aaaa:bbbb:cccc",

        // Mixed notation stress tests
        "[::ffff:192.168.1.1/96]:8080", // IPv4-embed + CIDR + port
        "[2001:db8::1%eth0/64]:443",    // Full combo: address + zone + CIDR + port

        // Special characters
        "::1#comment",                   // Hash character
        "::1@host",                      // At symbol
        "::1!invalid",                   // Exclamation mark

        // Case sensitivity (should be case-insensitive)
        "FFFF::1",                       // Uppercase
        "FfFf::aAbB",                    // Mixed case

        // Leading zeros
        "0001:0002:0003::1",            // Leading zeros in components

        NULL
    };

    int test_num = 0;
    int passed = 0;
    int failed = 0;

    for (int i = 0; edge_cases[i] != NULL; i++) {
        test_num++;
        printf("Test %d: '%s'\n", test_num, edge_cases[i]);

        ipv6_address_full_t addr;
        memset(&addr, 0, sizeof(ipv6_address_full_t));

        bool result = ipv6_from_str(edge_cases[i], strlen(edge_cases[i]), &addr);

        printf("  Result: %s\n", result ? "VALID" : "INVALID");

        if (result) {
            // Try to convert back to string
            char output[IPV6_STRING_SIZE];
            size_t len = ipv6_to_str(&addr, output, sizeof(output));
            if (len > 0) {
                printf("  Round-trip: %s\n", output);
                passed++;
            } else {
                printf("  Round-trip failed\n");
                failed++;
            }
        } else {
            // Invalid input - this is expected for many edge cases
            passed++;
        }

        printf("---\n");
    }

    printf("Edge case testing complete: %d tests, %d passed, %d failed\n\n",
           test_num, passed, failed);
}

int main(int argc, const char **argv) {
    int num_iterations = NUM_ITERATIONS;
    int verbose = 0;

    // Allow overriding iterations via command line argument
    if (argc > 1) {
        num_iterations = atoi(argv[1]);
        if (num_iterations <= 0) {
            printf("Invalid iteration count: %s. Using default: %d\n", argv[1], NUM_ITERATIONS);
            num_iterations = NUM_ITERATIONS;
        }
    }

    // Check for verbose flag
    if (argc > 2 && strcmp(argv[2], "-v") == 0) {
        verbose = 1;
    }

    printf("========================================\n");
    printf("IPv6 Parser Fuzz Testing & Benchmarks\n");
    printf("========================================\n");
    printf("Iterations: %d\n", num_iterations);
    printf("Mode: %s\n\n", verbose ? "Verbose" : "Benchmark");

    srand((unsigned int)time(NULL));

    double total_start = get_time_ms();

    // Run targeted edge case tests first
    fuzz_edge_cases();

    // Then run random fuzz tests with benchmarks
    fuzz_ipv6_from_str(num_iterations, verbose);
    fuzz_ipv6_to_str(num_iterations, verbose);
    fuzz_ipv6_compare(num_iterations, verbose);

    double total_elapsed = get_time_ms() - total_start;

    printf("========================================\n");
    printf("Total test time: %.2f seconds\n", total_elapsed / 1000.0);
    printf("Total operations: %d\n", num_iterations * 3);
    printf("Overall rate: %.0f ops/sec\n", (num_iterations * 3) / (total_elapsed / 1000.0));
    printf("========================================\n");

    return 0;
}
