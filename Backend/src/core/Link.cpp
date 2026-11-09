#include "Link.hpp"

Link::Link()
    : source(0), destination(0), cost(1), active(true) {}

Link::Link(int source, int destination, int cost)
    : source(source), destination(destination),
      cost(cost), active(true) {}

int Link::getSource() const { return source; }
int Link::getDestination() const { return destination; }
int Link::getCost() const { return cost; }
bool Link::isActive() const { return active; }

void Link::setActive(bool status) {
    active = status;
}
