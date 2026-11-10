#ifndef NETROUTE_DFS_HPP
#define NETROUTE_DFS_HPP
#include "core/RoutingStrategy.hpp"
class DFSStrategy : public RoutingStrategy {
public:
    std::vector<int> findRoute(const Network&, int source, int destination) override;
    std::string getName() const override;
};
#endif
