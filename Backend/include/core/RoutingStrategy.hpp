#ifndef ROUTING_STRATEGY_HPP
#define ROUTING_STRATEGY_HPP

#include "Network.hpp"
#include <vector>
#include <string>

using namespace std;

class RoutingStrategy {
public:
    virtual vector<int> findRoute(
        const Network& network, int source, int destination) = 0;

    virtual string getName() const = 0;
    virtual ~RoutingStrategy() {}
};

class BFSStrategy : public RoutingStrategy {
public:
    vector<int> findRoute(
        const Network& network, int source, int destination) override;

    string getName() const override;
};

class DFSStrategy : public RoutingStrategy {
public:
    vector<int> findRoute(
        const Network& network, int source, int destination) override;

    string getName() const override;
};

class DijkstraStrategy : public RoutingStrategy {
public:
    vector<int> findRoute(
        const Network& network, int source, int destination) override;

    string getName() const override;
};

class AdaptiveStrategy : public RoutingStrategy {
public:
    vector<int> findRoute(
        const Network& network, int source, int destination) override;

    string getName() const override;
};

#endif
