#ifndef PACKET_HPP
#define PACKET_HPP

#include <vector>
using namespace std;

class Packet {
private:
    int id, source, destination, priority;
    bool delivered;
    vector<int> route;

public:
    Packet();
    Packet(int id, int source, int destination, int priority);

    int getId() const;
    int getSource() const;
    int getDestination() const;
    int getPriority() const;
    bool isDelivered() const;

    void setDelivered(bool status);
    void setRoute(const vector<int>& path);
    vector<int> getRoute() const;
};

#endif
