#include "RoutingStrategy.hpp"
#include <algorithm>
#include <limits>
#include <map>
#include <queue>
#include <set>
#include <stack>

using namespace std;

static vector<int> buildPath(int source, int destination, const map<int, int> &parent)
{

    vector<int> path;

    if (source == destination)
        return {source};

    if (!parent.count(destination))
        return path;

    int current = destination;

    while (current != source)
    {
        path.push_back(current);

        if (!parent.count(current))
            return {};

        current = parent.at(current);
    }

    path.push_back(source);
    reverse(path.begin(), path.end());

    return path;
}

static void validateEndpoints(const Network &network, int source, int destination)
{

    if (!network.findRouter(source) || !network.findRouter(destination))
        throw RouterNotFoundException();

    if (!network.isRouterActive(source) || !network.isRouterActive(destination))
        throw DestinationUnreachableException();
}

string BFSStrategy::getName() const
{
    return "BFS";
}

vector<int> BFSStrategy::findRoute(const Network &network, int source, int destination)
{

    validateEndpoints(network, source, destination);

    queue<int> q;
    set<int> visited;
    map<int, int> parent;

    q.push(source);
    visited.insert(source);

    while (!q.empty())
    {
        int current = q.front();
        q.pop();

        if (current == destination)
            break;

        for (auto edge : network.getNeighbors(current))
        {
            int next = edge.first;

            if (!visited.count(next))
            {
                visited.insert(next);
                parent[next] = current;
                q.push(next);
            }
        }
    }

    vector<int> path = buildPath(source, destination, parent);

    if (path.empty())
        throw DestinationUnreachableException();

    return path;
}

string DFSStrategy::getName() const
{
    return "DFS";
}

vector<int> DFSStrategy::findRoute(const Network &network, int source, int destination)
{

    validateEndpoints(network, source, destination);

    stack<int> st;
    set<int> visited;
    map<int, int> parent;

    st.push(source);
    visited.insert(source);

    while (!st.empty())
    {
        int current = st.top();
        st.pop();

        if (current == destination)
            break;

        auto neighbors = network.getNeighbors(current);

        for (auto it = neighbors.rbegin(); it != neighbors.rend(); ++it)
        {
            int next = it->first;

            if (!visited.count(next))
            {
                visited.insert(next);
                parent[next] = current;
                st.push(next);
            }
        }
    }

    vector<int> path = buildPath(source, destination, parent);

    if (path.empty())
        throw DestinationUnreachableException();

    return path;
}

string DijkstraStrategy::getName() const
{
    return "Dijkstra";
}

vector<int> DijkstraStrategy::findRoute(const Network &network, int source, int destination)
{

    validateEndpoints(network, source, destination);

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

    vector<int> path = buildPath(source, destination, parent);

    if (path.empty())
        throw DestinationUnreachableException();

    return path;
}

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
