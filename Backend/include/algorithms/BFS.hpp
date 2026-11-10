#ifndef NETROUTE_BFS_HPP
#define NETROUTE_BFS_HPP
#include "core/RoutingStrategy.hpp"
class BFSStrategy : public RoutingStrategy {
public:
    std::vector<int> findRoute(const Network&, int source, int destination) override;
    std::string getName() const override;
};
#endif
