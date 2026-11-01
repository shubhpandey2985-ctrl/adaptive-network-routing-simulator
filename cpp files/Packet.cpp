#include "Packet.hpp"

Packet::Packet()
    : id(0), source(0), destination(0),
      priority(1), delivered(false) {}

Packet::Packet(int id, int source, int destination, int priority)
    : id(id), source(source), destination(destination),
      priority(priority), delivered(false) {}

int Packet::getId() const { return id; }
int Packet::getSource() const { return source; }
int Packet::getDestination() const { return destination; }
int Packet::getPriority() const { return priority; }
bool Packet::isDelivered() const { return delivered; }

void Packet::setDelivered(bool status) {
    delivered = status;
}

void Packet::setRoute(const vector<int>& path) {
    route = path;
}

vector<int> Packet::getRoute() const {
    return route;
}
