#ifndef ROUTER_HPP
#define ROUTER_HPP

#include <iostream>
#include <string>
#include <queue>
#include <vector>
#include "Packet.hpp"

using namespace std;

class Router {
private:
    int id;
    string name;
    bool active;
    queue<Packet> packetQueue;

public:
    Router();
    Router(int id, string name);

    int getId() const;
    string getName() const;
    bool isActive() const;

    void setActive(bool status);
    void addPacket(const Packet& packet);
    bool removePacket(Packet& packet);

    int getQueueSize() const;
    vector<Packet> getQueuedPackets() const;
    vector<Packet> drainPackets();

    void display() const;
};

#endif
