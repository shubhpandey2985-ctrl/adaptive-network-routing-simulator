#include "algorithms/Adaptive.hpp"
#include "algorithms/BFS.hpp"
#include "algorithms/Dijkstra.hpp"
#include <algorithm>
#include <limits>
#include <map>
#include <queue>
#include <set>
#include <stack>
#include <vector>

using namespace std;
string AdaptiveStrategy::getName() const
{
    return "Adaptive";
}

// This strategy only compares the existing BFS and Dijkstra candidates.
// It scores each as total link cost + 0.25 per hop and picks the lower score
// (BFS wins ties). It has no traffic, queue, latency, or congestion model.
vector<int> AdaptiveStrategy::findRoute(const Network &network, int source, int destination)
{

    BFSStrategy bfs;
    DijkstraStrategy dijkstra;

    vector<int> bfsPath;
    vector<int> dijkstraPath;

    try
    {
        bfsPath = bfs.findRoute(network, source, destination);
    }
    catch (const DestinationUnreachableException &)
    {
        // The other candidate may still be available for a future strategy.
    }

    try
    {
        dijkstraPath = dijkstra.findRoute(network, source, destination);
    }
    catch (const DestinationUnreachableException &)
    {
        // Only expected unreachability is a candidate failure. Invalid router
        // IDs and unexpected errors must remain visible to the caller.
    }

    if (bfsPath.empty() && dijkstraPath.empty())
        throw DestinationUnreachableException();

    if (bfsPath.empty())
        return dijkstraPath;

    if (dijkstraPath.empty())
        return bfsPath;

    auto calculateCost = [&network](const vector<int> &path) {
        int total = 0;

        for (size_t i = 1; i < path.size(); i++)
        {
            for (auto edge : network.getNeighbors(path[i - 1]))
            {
                if (edge.first == path[i])
                {
                    total += edge.second;
                    break;
                }
            }
        }

        return total;
    };

    double bfsScore = calculateCost(bfsPath) + 0.25 * (bfsPath.size() - 1);

    double dijkstraScore = calculateCost(dijkstraPath) + 0.25 * (dijkstraPath.size() - 1);

    return (bfsScore <= dijkstraScore) ? bfsPath : dijkstraPath;
}
