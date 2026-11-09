
#include "api/ApiServer.hpp"

#include <iostream>
#include <cstdlib>
#include <string>

int main() {

    httplib::Server server;

    configureRoutes(server);

    const char* host = "127.0.0.1";
    int port = 8080;
    if (const char* configured = std::getenv("NETROUTE_PORT")) {
        try {
            size_t used = 0;
            port = std::stoi(configured, &used);
            if (used != std::string(configured).size() || port < 1 || port > 65535)
                throw std::invalid_argument("invalid port");
        } catch (...) {
            std::cerr << "NETROUTE_PORT must be an integer from 1 to 65535.\n";
            return 2;
        }
    }

    std::cout << "NETROUTE Backend starting...\n";
    std::cout << "Server: http://" << host << ":" << port << '\n';

    if (!server.listen(host, port)) {
        std::cerr << "Failed to start NETROUTE backend.\n";
        return 1;
    }

    return 0;
}
