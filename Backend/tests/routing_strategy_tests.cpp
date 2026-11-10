#include "core/Network.hpp"
#include "algorithms/BFS.hpp"
#include "algorithms/DFS.hpp"
#include "algorithms/Dijkstra.hpp"
#include "algorithms/Adaptive.hpp"

#include <algorithm>
#include <cassert>
#include <iostream>
#include <memory>
#include <set>
#include <sstream>
#include <vector>

namespace {

bool isValidRoute(const Network &network, const std::vector<int> &route, int expectedSource, int expectedDestination)
{
    if (route.size() < 2) return false;
    if (route.front() != expectedSource || route.back() != expectedDestination) return false;

    for (size_t i = 1; i < route.size(); ++i)
    {
        int u = route[i - 1];
        int v = route[i];
        bool linkFound = false;
        for (const auto &neighbor : network.getNeighbors(u))
        {
            if (neighbor.first == v)
            {
                linkFound = true;
                break;
            }
        }
        if (!linkFound) return false;
    }
    return true;
}

int calculateRouteCost(const Network &network, const std::vector<int> &route)
{
    int total = 0;
    for (size_t i = 1; i < route.size(); ++i)
    {
        for (const auto &neighbor : network.getNeighbors(route[i - 1]))
        {
            if (neighbor.first == route[i])
            {
                total += neighbor.second;
                break;
            }
        }
    }
    return total;
}

} // namespace

int main()
{
    std::vector<std::unique_ptr<RoutingStrategy>> strategies;
    strategies.push_back(std::make_unique<BFSStrategy>());
    strategies.push_back(std::make_unique<DFSStrategy>());
    strategies.push_back(std::make_unique<DijkstraStrategy>());
    strategies.push_back(std::make_unique<AdaptiveStrategy>());

    // 1. Regression test: High router IDs
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
            // Expected
        }
    }

    // 2. Unreachable route testing with genuinely disconnected graphs
    {
        // 3-node graph: 1 <-> 2, but 3 is disconnected (isolated)
        Network disconnectedNet;
        std::istringstream serialized("3\n"
                                      "1 R1 1\n"
                                      "2 R2 1\n"
                                      "3 R3 1\n"
                                      "1\n"
                                      "1 2 5 1\n");
        disconnectedNet.loadNetwork(serialized);

        for (const auto &strat : strategies)
        {
            // Connected pair 1 -> 2 must succeed
            std::vector<int> route = strat->findRoute(disconnectedNet, 1, 2);
            if (!isValidRoute(disconnectedNet, route, 1, 2))
            {
                std::cerr << strat->getName() << " failed for connected pair in disconnected graph.\n";
                return 1;
            }

            // Disconnected pair 1 -> 3 must throw DestinationUnreachableException
            bool unreachableCaught = false;
            try
            {
                (void)strat->findRoute(disconnectedNet, 1, 3);
            }
            catch (const DestinationUnreachableException &)
            {
                unreachableCaught = true;
            }
            catch (...)
            {
                std::cerr << strat->getName() << " threw wrong exception for unreachable destination 3.\n";
                return 1;
            }
            if (!unreachableCaught)
            {
                std::cerr << strat->getName() << " returned route for unreachable destination 1 -> 3!\n";
                return 1;
            }

            // Reverse disconnected pair 3 -> 1 must also throw
            unreachableCaught = false;
            try
            {
                (void)strat->findRoute(disconnectedNet, 3, 1);
            }
            catch (const DestinationUnreachableException &)
            {
                unreachableCaught = true;
            }
            if (!unreachableCaught)
            {
                std::cerr << strat->getName() << " returned route for unreachable destination 3 -> 1!\n";
                return 1;
            }
        }
    }

    // 3. Dynamic link disconnection and reconnection on 8-router topology
    {
        Network net8;
        net8.initializeTopology(8);

        // Disconnect R8 completely by failing links (6,8) and (7,8)
        net8.failLink(6, 8);
        net8.failLink(7, 8);

        for (const auto &strat : strategies)
        {
            bool caught = false;
            try
            {
                (void)strat->findRoute(net8, 1, 8);
            }
            catch (const DestinationUnreachableException &)
            {
                caught = true;
            }
            if (!caught)
            {
                std::cerr << strat->getName() << " failed to detect unreachable R8 after link failures.\n";
                return 1;
            }
        }

        // Reconnect R8 by repairing link (6,8)
        net8.repairLink(6, 8);
        for (const auto &strat : strategies)
        {
            std::vector<int> route = strat->findRoute(net8, 1, 8);
            if (!isValidRoute(net8, route, 1, 8))
            {
                std::cerr << strat->getName() << " failed to route to R8 after link repair.\n";
                return 1;
            }
        }
    }

    // 4. Inactive router unreachability
    {
        Network net8;
        net8.initializeTopology(8);
        net8.failRouter(8);

        for (const auto &strat : strategies)
        {
            bool caught = false;
            try
            {
                (void)strat->findRoute(net8, 1, 8);
            }
            catch (const DestinationUnreachableException &)
            {
                caught = true;
            }
            if (!caught)
            {
                std::cerr << strat->getName() << " failed to detect inactive destination R8.\n";
                return 1;
            }
        }

        net8.repairRouter(8);
        net8.failRouter(1);
        for (const auto &strat : strategies)
        {
            bool caught = false;
            try
            {
                (void)strat->findRoute(net8, 1, 8);
            }
            catch (const DestinationUnreachableException &)
            {
                caught = true;
            }
            if (!caught)
            {
                std::cerr << strat->getName() << " failed to detect inactive source R1.\n";
                return 1;
            }
        }
    }

    // 5. Mandatory test matrix: 4 through 20 routers for all 4 algorithms
    for (int count = 4; count <= 20; ++count)
    {
        Network network;
        network.initializeTopology(count);

        if (static_cast<int>(network.getRouters().size()) != count)
        {
            std::cerr << "Topology router count mismatch for count = " << count << ".\n";
            return 1;
        }

        // Test route from 1 to count
        int dijkstraCost = -1;
        int bfsCost = -1;
        size_t bfsHops = 0;
        size_t dfsHops = 0;

        for (const auto &strat : strategies)
        {
            std::vector<int> route = strat->findRoute(network, 1, count);
            if (!isValidRoute(network, route, 1, count))
            {
                std::cerr << strat->getName() << " failed to find valid route for count = " << count << " (1 -> " << count << ").\n";
                return 1;
            }

            int cost = calculateRouteCost(network, route);
            if (strat->getName() == "Dijkstra") dijkstraCost = cost;
            if (strat->getName() == "BFS")
            {
                bfsCost = cost;
                bfsHops = route.size() - 1;
            }
            if (strat->getName() == "DFS") dfsHops = route.size() - 1;

            // Test reverse route (count -> 1)
            std::vector<int> revRoute = strat->findRoute(network, count, 1);
            if (!isValidRoute(network, revRoute, count, 1))
            {
                std::cerr << strat->getName() << " failed for reverse route count = " << count << " (" << count << " -> 1).\n";
                return 1;
            }

            // Test intermediate pair (2 -> count - 1)
            if (count >= 4)
            {
                std::vector<int> midRoute = strat->findRoute(network, 2, count - 1);
                if (!isValidRoute(network, midRoute, 2, count - 1))
                {
                    std::cerr << strat->getName() << " failed for intermediate route count = " << count << " (2 -> " << (count - 1) << ").\n";
                    return 1;
                }
            }
        }

        // Dijkstra cost must be <= BFS cost
        if (dijkstraCost > bfsCost)
        {
            std::cerr << "Dijkstra cost (" << dijkstraCost << ") > BFS cost (" << bfsCost << ") for count = " << count << ".\n";
            return 1;
        }

        // BFS hop count must be <= DFS hop count
        if (bfsHops > dfsHops)
        {
            std::cerr << "BFS hops (" << bfsHops << ") > DFS hops (" << dfsHops << ") for count = " << count << ".\n";
            return 1;
        }
    }

    std::cout << "All routing strategy tests (unreachable, disconnected, and 4-20 router matrix) passed successfully.\n";
    return 0;
}
