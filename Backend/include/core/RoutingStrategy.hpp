#ifndef ROUTING_STRATEGY_HPP
#define ROUTING_STRATEGY_HPP
#include "Network.hpp"
#include <map>
#include <string>
#include <vector>
class RoutingStrategy {
public:
    virtual std::vector<int> findRoute(const Network&, int source, int destination) = 0;
    virtual std::string getName() const = 0;
    virtual ~RoutingStrategy() = default;
protected:
    static std::vector<int> buildPath(int source, int destination, const std::map<int,int>& parent);
    static void validateEndpoints(const Network&, int source, int destination);
};
#endif
