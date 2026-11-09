#ifndef SIMULATION_HPP
#define SIMULATION_HPP

#include "Network.hpp"
#include "RoutingStrategy.hpp"
#include <vector>

class Simulation {
private:
    Network network;

    BFSStrategy bfs;
    DFSStrategy dfs;
    DijkstraStrategy dijkstra;
    AdaptiveStrategy adaptive;

    vector<Packet> packetHistory;

    int nextPacketId;
    int totalPackets;
    int deliveredPackets;
    int lostPackets;

    void processPacket(Packet packet);

    void displayPath(const vector<int>& path) const;
    void displayPacket(const Packet& packet) const;

public:
    Simulation();

    void run();

    void addPacket();
    void processPendingPackets();

    void compareRoutingAlgorithms();

    void failRouter();
    void repairRouter();

    void failLink();
    void repairLink();

    void checkConnectivity();

    void displayStatistics() const;
    void displayPacketHistory() const;
    void displayPendingPackets() const;

    void saveDetailsToFile() const;
    void loadNetworkFromFile();
};

#endif
