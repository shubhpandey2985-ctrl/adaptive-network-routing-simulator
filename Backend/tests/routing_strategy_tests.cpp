#include "core/Network.hpp"
#include "algorithms/Dijkstra.hpp"
#include "algorithms/Adaptive.hpp"

#include <iostream>
#include <sstream>
#include <vector>

int main()
{
    Network network;
    std::istringstream serialized("2\n"
                                  "1201 R1201 1\n"
                                  "2001 R2001 1\n"
                                  "1\n"
                                  "1201 2001 7 1\n");
    network.loadNetwork(serialized);

    DijkstraStrategy dijkstra;
    const std::vector<int> actual = dijkstra.findRoute(network, 1201, 2001);
    if (actual != std::vector<int>{1201, 2001})
    {
        std::cerr << "Dijkstra failed for router IDs above 1000.\n";
        return 1;
    }

    AdaptiveStrategy adaptive;
    try
    {
        (void)adaptive.findRoute(network, 99, 2001);
        std::cerr << "Adaptive should preserve invalid-router errors.\n";
        return 1;
    }
    catch (const RouterNotFoundException &)
    {
        // Expected: adaptive candidate selection must not swallow this error.
    }
    catch (...)
    {
        std::cerr << "Adaptive returned the wrong error for an invalid router.\n";
        return 1;
    }

    std::cout << "Routing strategy regression tests passed.\n";
    return 0;
}
