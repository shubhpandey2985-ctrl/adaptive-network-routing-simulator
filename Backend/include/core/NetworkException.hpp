#ifndef NETWORK_EXCEPTION_HPP
#define NETWORK_EXCEPTION_HPP

#include <stdexcept>
using namespace std;

class RouterNotFoundException : public runtime_error {
public:
    RouterNotFoundException()
        : runtime_error("Router not found.") {}
};

class LinkNotFoundException : public runtime_error {
public:
    LinkNotFoundException()
        : runtime_error("Link not found.") {}
};

class DestinationUnreachableException : public runtime_error {
public:
    DestinationUnreachableException()
        : runtime_error("Destination is unreachable.") {}
};

class InvalidPacketException : public runtime_error {
public:
    InvalidPacketException()
        : runtime_error("Invalid packet information.") {}
};

#endif
