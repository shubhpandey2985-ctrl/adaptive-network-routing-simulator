#ifndef NETROUTE_ADAPTIVE_HPP
#define NETROUTE_ADAPTIVE_HPP
#include "core/RoutingStrategy.hpp"
class AdaptiveStrategy : public RoutingStrategy {
public:
    std::vector<int> findRoute(const Network&, int source, int destination) override;
    std::string getName() const override;
};
#endif
