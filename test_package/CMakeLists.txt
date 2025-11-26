cmake_minimum_required(VERSION 3.12)
project(test_ipv6_parse C)

find_package(ipv6-parse REQUIRED)

add_executable(test_ipv6_parse test_ipv6_parse.c)
target_link_libraries(test_ipv6_parse ipv6-parse::ipv6-parse)
