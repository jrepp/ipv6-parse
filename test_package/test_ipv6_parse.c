#include <stdio.h>
#include <string.h>
#include <ipv6.h>

int main(void) {
    ipv6_address_full_t addr;
    const char *test_addr = "2001:db8::1";

    if (ipv6_from_str(test_addr, strlen(test_addr), &addr)) {
        char buffer[IPV6_STRING_SIZE];
        ipv6_to_str(&addr, buffer, sizeof(buffer));
        printf("Successfully parsed IPv6 address: %s\n", buffer);
        return 0;
    }

    printf("Failed to parse IPv6 address\n");
    return 1;
}
