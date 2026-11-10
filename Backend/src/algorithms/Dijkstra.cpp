#include "algorithms/Dijkstra.hpp"
#include <algorithm>
#include <limits>
#include <map>
#include <queue>
#include <set>
#include <stack>
#include <vector>

using namespace std;
string DijkstraStrategy::getName() const
{
    return "Dijkstra";
}

vector<int> DijkstraStrategy::findRoute(const Network &network, int source, int destination)
{

    RoutingStrategy::validateEndpoints(network, source, destination);

    const int INF = numeric_limits<int>::max();

    map<int, int> distance;
    map<int, int> parent;

    for (const auto &router : network.getRouters())
        distance.emplace(router.getId(), INF);

    distance[source] = 0;

    using Node = pair<int, int>;
    priority_queue<Node, vector<Node>, greater<Node>> pq;

    pq.push({0, source});

    while (!pq.empty())
    {
        auto current = pq.top();
        pq.pop();

        int cost = current.first;
        int router = current.second;

        if (cost != distance[router])
            continue;

        if (router == destination)
            break;

        for (auto edge : network.getNeighbors(router))
        {
            int next = edge.first;
            int weight = edge.second;

            if (cost <= INF - weight && cost + weight < distance[next])
            {

                distance[next] = cost + weight;
                parent[next] = router;

                pq.push({distance[next], next});
            }
        }
    }

    vector<int> path = RoutingStrategy::buildPath(source, destination, parent);

    if (path.empty())
        throw DestinationUnreachableException();

    return path;
}
