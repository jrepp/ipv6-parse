#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include "ipv6.h"

#define MAX_INPUT_LENGTH 100
#define MAX_OUTPUT_LENGTH 200
#define NUM_ITERATIONS 1000

char* generate_random_string(int length) {
    const char* chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:.";
    char* str = (char*)malloc((length + 1) * sizeof(char));
    for (int i = 0; i < length; i++) {
        int index = rand() % (int)strlen(chars);
        str[i] = chars[index];
    }
    str[length] = '\0';
    return str;
}

void fuzz_ipv6_from_str(int num_iterations) {
    printf("Fuzzing ipv6_from_str:\n");
    for (int i = 0; i < num_iterations; i++) {
        int input_length = rand() % (MAX_INPUT_LENGTH + 1);
        char* input_string = generate_random_string(input_length);
        size_t input_bytes = strlen(input_string);

        ipv6_address_full_t ipv6_address;
        memset(&ipv6_address, 0, sizeof(ipv6_address_full_t));

        bool result = ipv6_from_str(input_string, input_bytes, &ipv6_address);

        printf("Input: %s\n", input_string);
        printf("Parsing result: %s\n", result ? "true" : "false");
        printf("Parsed address: ");
        for (int j = 0; j < IPV6_NUM_COMPONENTS; j++) {
            printf("%x ", ipv6_address.address.components[j]);
        }
        printf("\n");
        printf("Mask: %u\n", ipv6_address.mask);
        printf("Port: %u\n", ipv6_address.port);
        printf("Flags: %u\n", ipv6_address.flags);
        printf("---\n");

        free(input_string);
    }
    printf("\n");
}

void fuzz_ipv6_to_str(int num_iterations) {
    printf("Fuzzing ipv6_to_str:\n");
    for (int i = 0; i < num_iterations; i++) {
        ipv6_address_full_t ipv6_address;
        for (int j = 0; j < IPV6_NUM_COMPONENTS; j++) {
            ipv6_address.address.components[j] = rand() % 0xFFFF;
        }
        ipv6_address.mask = rand() % 129;
        ipv6_address.port = rand() % 0xFFFF;
        ipv6_address.flags = rand() % 0xFF;

        char output_string[MAX_OUTPUT_LENGTH];
        size_t output_bytes = ipv6_to_str(&ipv6_address, output_string, sizeof(output_string));

        printf("Generated address:\n");
        for (int j = 0; j < IPV6_NUM_COMPONENTS; j++) {
            printf("%x ", ipv6_address.address.components[j]);
        }
        printf("\n");
        printf("Mask: %u\n", ipv6_address.mask);
        printf("Port: %u\n", ipv6_address.port);
        printf("Flags: %u\n", ipv6_address.flags);
        printf("Output string: %s\n", output_string);
        printf("Output bytes: %zu\n", output_bytes);
        printf("---\n");
    }
    printf("\n");
}

void fuzz_ipv6_compare(int num_iterations) {
    printf("Fuzzing ipv6_compare:\n");
    for (int i = 0; i < num_iterations; i++) {
        ipv6_address_full_t ipv6_address1;
        ipv6_address_full_t ipv6_address2;
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

        printf("Address 1: ");
        for (int j = 0; j < IPV6_NUM_COMPONENTS; j++) {
            printf("%x ", ipv6_address1.address.components[j]);
        }
        printf("\n");
        printf("Mask 1: %u\n", ipv6_address1.mask);
        printf("Port 1: %u\n", ipv6_address1.port);
        printf("Flags 1: %u\n", ipv6_address1.flags);

        printf("Address 2: ");
        for (int j = 0; j < IPV6_NUM_COMPONENTS; j++) {
            printf("%x ", ipv6_address2.address.components[j]);
        }
        printf("\n");
        printf("Mask 2: %u\n", ipv6_address2.mask);
        printf("Port 2: %u\n", ipv6_address2.port);
        printf("Flags 2: %u\n", ipv6_address2.flags);

        printf("Ignore flags: %u\n", ignore_flags);
        printf("Comparison result: %d\n", result);
        printf("---\n");
    }
    printf("\n");
}

int main(int argc, const char **argv) {
    (void)argc; (void)argv;

    srand(time(NULL));

    fuzz_ipv6_from_str(NUM_ITERATIONS);
    fuzz_ipv6_to_str(NUM_ITERATIONS);
    fuzz_ipv6_compare(NUM_ITERATIONS);

    return 0;
}
