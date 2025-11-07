# IPv6-Parse Test Coverage Analysis

## Current Coverage Status
- **Lines executed:** 89.45% of 455 lines
- **Branches executed:** 98.83% of 256 branches
- **Branches taken at least once:** 80.08% of 256 branches

## Uncovered Areas Identified

### 1. Uppercase Hexadecimal Digits (ipv6.c:271-273)
- **Location:** `read_hexidecimal_token()` function
- **Missing:** Handling of uppercase hex digits 'A'-'F'
- **Test needed:** Addresses with uppercase hex like "FFFF::1" or "2001:DB8::1"

### 2. Interface/Zone ID Support (ipv6.c:495-498, 567-580)
- **Location:** STATE_IFACE handling in state machine
- **Missing:** Zone ID parsing (e.g., "fe80::1%eth0")
- **Test needed:** Addresses with zone IDs like "fe80::1%eth0", "[fe80::1%lo0]:8080"

### 3. CIDR Mask in STATE_NONE (ipv6.c:421-423)
- **Location:** Direct CIDR without leading address component
- **Missing:** Edge case where CIDR appears immediately
- **Test needed:** Malformed addresses starting with '/'

### 4. IPv4 Embedding Error Paths (ipv6.c:821-823)
- **Location:** Validation of IPv4 octet count in embedding
- **Missing:** Test for incomplete IPv4 embedding (< 4 octets)
- **Test needed:** Addresses like "::ffff:1.2.3" (only 3 octets)

### 5. String Size Exceeded (ipv6.c:723-725)
- **Location:** Input validation for oversized strings
- **Missing:** Test with input > IPV6_STRING_SIZE (66 chars)
- **Test needed:** Very long address strings

### 6. Token Validation Edge Cases (ipv6.c:276-277)
- **Location:** Invalid characters in hex tokens
- **Missing:** Error handling for invalid hex in token
- **Test needed:** Addresses with invalid characters after validation

### 7. Zero-run Move Count Validation (ipv6.c:854, 858)
- **Location:** Zero-run expansion validation
- **Missing:** Invalid move_count and target validation
- **Test needed:** Edge cases in :: expansion logic

### 8. Whitespace in STATE_POST_ADDR (ipv6.c:783-784)
- **Location:** Whitespace handling after ']'
- **Missing:** Addresses with trailing whitespace after brackets
- **Test needed:** "[::1]:8080  " (with trailing spaces)

### 9. Invalid Input After Various States (ipv6.c:605, 562, 507)
- **Location:** Invalid transitions in state machine
- **Missing:** Various invalid character sequences
- **Test needed:** Malformed addresses triggering these paths

## Recommended Additional Tests

### High Priority
1. Uppercase hex digits: "FFFF::ABCD", "2001:DB8::1"
2. Zone IDs: "fe80::1%eth0", "[fe80::1%lo0]:8080"
3. Oversized input: Strings > 66 characters
4. Incomplete IPv4 embed: "::ffff:1.2.3", "::1.2"

### Medium Priority  
5. Trailing whitespace: "[::1]:8080  ", "::1  "
6. Invalid state transitions
7. Edge cases in zero-run expansion

### Low Priority (Error paths)
8. Various malformed inputs to cover remaining error handling branches
