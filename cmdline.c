#include "ipv6.h"
#include "config.h"

#ifdef WIN32
#pragma warning(disable:4820) // padding warnings
#endif

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

int main (int argc, const char** argv) {
    if (argc < 2) {
        printf("usage: %s <address>\n", argv[0]);
        return 1;
    }

    {
        ipv6_address_full_t addr, addr2;
        const char* str = argv[1];
        if (!ipv6_from_str(str, strlen(str), &addr)) {
            printf("- failed to parse: '%s'\n", str);
            return 2;
        }

        char* buffer = (char*)alloca(IPV6_STRING_SIZE);
        if (!ipv6_to_str(&addr, buffer, sizeof(char) * IPV6_STRING_SIZE)) {
            printf("- failed to convert: '%s'\n", str);
            return 3;
        }

        if (!ipv6_from_str(buffer, strlen(buffer), &addr2)) {
            printf("- failed to roundtrip: '%s'\n", buffer);
            return 4;
        }

        if (0 != ipv6_compare(&addr, &addr2)) {
            printf("- failed to compare: '%s' != '%s'\n", str, buffer);
            return 5;
        }

        printf("OK (%s)\n", buffer);
    }

    return 0;
}

