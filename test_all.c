#include "ipv6.h"
#include "ipv6_config.h"
#include "ipv6_test_config.h"

#ifdef HAVE_STDIO_H
#include <stdio.h>
#endif

// Declare the main functions from each test suite
extern int test_main(void);  // from test.c - we'll rename main
extern int test_extended_main(void);  // from test_extended.c - we'll rename main

int main(void) {
    int result = 0;

    printf("=================\n");
    printf("Running Original Test Suite\n");
    printf("=================\n\n");
    result |= test_main();

    printf("\n\n");
    printf("=================\n");
    printf("Running Extended Test Suite\n");
    printf("=================\n\n");
    result |= test_extended_main();

    printf("\n\n");
    printf("=================\n");
    printf("All Tests Complete\n");
    printf("=================\n");

    return result;
}
