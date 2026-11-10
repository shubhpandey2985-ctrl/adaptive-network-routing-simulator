#include "core/RoutingStrategy.hpp"
#include <algorithm>
#include <map>
#include <vector>
std::vector<int> RoutingStrategy::buildPath(int source, int destination, const std::map<int,int>& parent) {
    std::vector<int> path;
    if (source == destination) return {source};
    if (!parent.count(destination)) return path;
    int current = destination;
    while (current != source) { path.push_back(current); if (!parent.count(current)) return {}; current = parent.at(current); }
    path.push_back(source); std::reverse(path.begin(), path.end()); return path;
}
void RoutingStrategy::validateEndpoints(const Network& network, int source, int destination) {
    if (!network.findRouter(source) || !network.findRouter(destination)) throw RouterNotFoundException();
    if (!network.isRouterActive(source) || !network.isRouterActive(destination)) throw DestinationUnreachableException();
}
