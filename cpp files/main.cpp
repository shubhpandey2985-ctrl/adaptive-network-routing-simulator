#include <iostream>
#include "Simulation.hpp"

using namespace std;

int main() {
    cout << "============================================\n";
    cout << "  ADAPTIVE NETWORK ROUTING SIMULATOR\n";
    cout << "  Failure Recovery and Packet Management\n";
    cout << "============================================\n";

    Simulation simulation;
    simulation.run();

    return 0;
}
#include "Router.cpp"
#include "Link.cpp"
#include "Packet.cpp"
#include "Network.cpp"
#include "RoutingStrategy.cpp"
#include "Simulation.cpp"
