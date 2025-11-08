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
