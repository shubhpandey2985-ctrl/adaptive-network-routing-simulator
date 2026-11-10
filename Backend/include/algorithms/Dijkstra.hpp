#ifndef NETROUTE_DIJKSTRA_HPP
#define NETROUTE_DIJKSTRA_HPP
#include "core/RoutingStrategy.hpp"
class DijkstraStrategy : public RoutingStrategy {
public:
    std::vector<int> findRoute(const Network&, int source, int destination) override;
    std::string getName() const override;
};
#endif
