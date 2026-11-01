#include "Simulation.hpp"

#include <iostream>
#include <fstream>
#include <algorithm>
#include <chrono>
#include <limits>
#include <stdexcept>

using namespace std;

Simulation::Simulation()
    : nextPacketId(1),
      totalPackets(0),
      deliveredPackets(0),
      lostPackets(0) {}

void Simulation::displayPath(const vector<int>& path) const {
    for (size_t i = 0; i < path.size(); i++) {
        cout << path[i];

        if (i + 1 < path.size())
            cout << " -> ";
    }
}

void Simulation::displayPacket(const Packet& packet) const {
    cout << "Packet ID: " << packet.getId()
         << " | Source: " << packet.getSource()
         << " | Destination: " << packet.getDestination()
         << " | Priority: " << packet.getPriority()
         << " | Status: "
         << (packet.isDelivered() ? "Delivered" : "Not delivered")
         << '\n';
}

void Simulation::addPacket() {
    int source, destination, priority;

    cout << "Enter source router ID: ";
    cin >> source;

    cout << "Enter destination router ID: ";
    cin >> destination;

    cout << "Enter priority (1 to 5): ";
    cin >> priority;

    if (!cin) {
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
        cout << "Invalid input.\n";
        return;
    }

    if (!network.findRouter(source) ||
        !network.findRouter(destination)) {
        cout << "Router does not exist.\n";
        return;
    }

    if (source == destination || priority < 1 || priority > 5) {
        cout << "Invalid packet information.\n";
        return;
    }

    Packet packet(nextPacketId, source, destination, priority);

    try {
        network.queuePacket(source, packet);

        cout << "Packet added successfully. Packet ID: "
             << nextPacketId << '\n';

        nextPacketId++;
        totalPackets++;
    }
    catch (const exception& e) {
        cout << e.what() << '\n';
    }
}

void Simulation::processPacket(Packet packet) {
    cout << "\nProcessing Packet " << packet.getId() << "...\n";

    try {
        vector<int> route = adaptive.findRoute(
            network,
            packet.getSource(),
            packet.getDestination()
        );

        packet.setRoute(route);
        packet.setDelivered(true);

        cout << "Packet delivered successfully!\n";
        cout << "Selected route: ";
        displayPath(route);
        cout << '\n';

        deliveredPackets++;
    }
    catch (const exception& e) {
        packet.setDelivered(false);
        cout << "Packet delivery failed: " << e.what() << '\n';

        lostPackets++;
    }

    packetHistory.push_back(packet);
}

void Simulation::processPendingPackets() {
    vector<Packet> packets = network.collectPendingPackets();

    if (packets.empty()) {
        cout << "No pending packets.\n";
        return;
    }

    stable_sort(
        packets.begin(),
        packets.end(),
        [](const Packet& a, const Packet& b) {
            return a.getPriority() > b.getPriority();
        }
    );

    cout << "\nProcessing " << packets.size()
         << " pending packets by priority...\n";

    for (const auto& packet : packets)
        processPacket(packet);
}

void Simulation::compareRoutingAlgorithms() {
    int source, destination;

    cout << "Enter source router: ";
    cin >> source;

    cout << "Enter destination router: ";
    cin >> destination;

    if (!cin) {
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
        cout << "Invalid input.\n";
        return;
    }

    RoutingStrategy* strategies[] = {
        &bfs, &dfs, &dijkstra, &adaptive
    };

    for (RoutingStrategy* strategy : strategies) {
        cout << "\n" << strategy->getName() << ":\n";

        try {
            auto start = chrono::steady_clock::now();

            vector<int> path = strategy->findRoute(
                network, source, destination);

            auto end = chrono::steady_clock::now();

            cout << "Path: ";
            displayPath(path);

            int cost = 0;

            for (size_t i = 1; i < path.size(); i++) {
                for (auto edge : network.getNeighbors(path[i - 1])) {
                    if (edge.first == path[i]) {
                        cost += edge.second;
                        break;
                    }
                }
            }

            double elapsed =
                chrono::duration<double, micro>(end - start).count();

            cout << "\nHops: " << path.size() - 1
                 << "\nTotal link cost: " << cost
                 << "\nExecution time: " << elapsed << " microseconds\n";
        }
        catch (const exception& e) {
            cout << e.what() << '\n';
        }
    }
}

void Simulation::failRouter() {
    int id;

    cout << "Enter router ID to fail: ";
    cin >> id;

    try {
        network.failRouter(id);
        cout << "Router failed successfully.\n";
    }
    catch (const exception& e) {
        cout << e.what() << '\n';
    }
}

void Simulation::repairRouter() {
    int id;

    cout << "Enter router ID to repair: ";
    cin >> id;

    try {
        network.repairRouter(id);
        cout << "Router repaired successfully.\n";
    }
    catch (const exception& e) {
        cout << e.what() << '\n';
    }
}

void Simulation::failLink() {
    int a, b;

    cout << "Enter the two router IDs of the link: ";
    cin >> a >> b;

    try {
        network.failLink(a, b);
        cout << "Link failed successfully.\n";
    }
    catch (const exception& e) {
        cout << e.what() << '\n';
    }
}

void Simulation::repairLink() {
    int a, b;

    cout << "Enter the two router IDs of the link: ";
    cin >> a >> b;

    try {
        network.repairLink(a, b);
        cout << "Link repaired successfully.\n";
    }
    catch (const exception& e) {
        cout << e.what() << '\n';
    }
}

void Simulation::checkConnectivity() {
    int source, destination;

    cout << "Enter source router: ";
    cin >> source;

    cout << "Enter destination router: ";
    cin >> destination;

    if (!cin) {
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
        cout << "Invalid input.\n";
        return;
    }

    if (!network.findRouter(source) ||
        !network.findRouter(destination)) {
        cout << "Router does not exist.\n";
        return;
    }

    cout << (network.isConnected(source, destination)
        ? "A route exists between the routers.\n"
        : "No route exists between the routers.\n");
}

void Simulation::displayStatistics() const {
    cout << "\n========== STATISTICS ==========\n";
    cout << "Total packets created: " << totalPackets << '\n';
    cout << "Delivered packets: " << deliveredPackets << '\n';
    cout << "Lost packets: " << lostPackets << '\n';
    cout << "Pending packets: "
         << network.getPendingPackets().size() << '\n';
}

void Simulation::displayPacketHistory() const {
    if (packetHistory.empty()) {
        cout << "No packet history available.\n";
        return;
    }

    cout << "\n========== PACKET HISTORY ==========\n";

    for (const auto& packet : packetHistory) {
        displayPacket(packet);

        if (!packet.getRoute().empty()) {
            cout << "Route: ";
            displayPath(packet.getRoute());
            cout << '\n';
        }
    }
}

void Simulation::displayPendingPackets() const {
    vector<Packet> packets = network.getPendingPackets();

    if (packets.empty()) {
        cout << "No pending packets.\n";
        return;
    }

    cout << "\n========== PENDING PACKETS ==========\n";

    for (const auto& packet : packets)
        displayPacket(packet);
}
void Simulation::saveDetailsToFile() const {
    ofstream out("network_data.txt");

    if (!out) {
        cout << "Unable to open save file.\n";
        return;
    }

    out << "SIMULATION_DATA\n";

    network.saveNetwork(out);

    out << "STATISTICS\n";
    out << totalPackets << ' '
        << deliveredPackets << ' '
        << lostPackets << ' '
        << nextPacketId << '\n';

    out << "HISTORY\n";
    out << packetHistory.size() << '\n';

    for (const auto& packet : packetHistory) {
        vector<int> route = packet.getRoute();

        out << packet.getId() << ' '
            << packet.getSource() << ' '
            << packet.getDestination() << ' '
            << packet.getPriority() << ' '
            << packet.isDelivered() << ' '
            << route.size();

        for (int router : route)
            out << ' ' << router;

        out << '\n';
    }

    vector<Packet> pending = network.getPendingPackets();

    out << "PENDING\n";
    out << pending.size() << '\n';

    for (const auto& packet : pending) {
        out << packet.getId() << ' '
            << packet.getSource() << ' '
            << packet.getDestination() << ' '
            << packet.getPriority() << '\n';
    }

    out.close();

    cout << "Simulation saved successfully in network_data.txt\n";
}

void Simulation::loadNetworkFromFile() {
    ifstream in("network_data.txt");

    if (!in) {
        cout << "Save file not found.\n";
        return;
    }

    try {
        string marker;

        if (!(in >> marker) || marker != "SIMULATION_DATA")
            throw runtime_error("Invalid simulation file.");

        Network newNetwork;
        newNetwork.loadNetwork(in);

        if (!(in >> marker) || marker != "STATISTICS")
            throw runtime_error("Statistics section missing.");

        int newTotal, newDelivered, newLost, newNextId;

        if (!(in >> newTotal >> newDelivered >>
              newLost >> newNextId) ||
            newTotal < 0 || newDelivered < 0 ||
            newLost < 0 || newNextId < 1 ||
            newDelivered + newLost > newTotal) {
            throw runtime_error("Invalid statistics data.");
        }

        if (!(in >> marker) || marker != "HISTORY")
            throw runtime_error("History section missing.");

        int historyCount;

        if (!(in >> historyCount) ||
            historyCount < 0 || historyCount > 100000) {
            throw runtime_error("Invalid history count.");
        }

        vector<Packet> newHistory;

        for (int i = 0; i < historyCount; i++) {
            int id, source, destination, priority;
            int delivered, routeSize;

            if (!(in >> id >> source >> destination >>
                  priority >> delivered >> routeSize)) {
                throw runtime_error("Invalid packet history.");
            }

            if (id <= 0 || priority < 1 || priority > 5 ||
                (delivered != 0 && delivered != 1) ||
                routeSize < 0 || routeSize > 1000) {
                throw runtime_error("Invalid packet history entry.");
            }

            Packet packet(id, source, destination, priority);
            packet.setDelivered(delivered != 0);

            vector<int> route;

            for (int j = 0; j < routeSize; j++) {
                int routerId;

                if (!(in >> routerId))
                    throw runtime_error("Invalid packet route.");

                route.push_back(routerId);
            }

            packet.setRoute(route);
            newHistory.push_back(packet);
        }

        if (!(in >> marker) || marker != "PENDING")
            throw runtime_error("Pending section missing.");

        int pendingCount;

        if (!(in >> pendingCount) ||
            pendingCount < 0 || pendingCount > 100000) {
            throw runtime_error("Invalid pending packet count.");
        }

        for (int i = 0; i < pendingCount; i++) {
            int id, source, destination, priority;

            if (!(in >> id >> source >> destination >> priority))
                throw runtime_error("Invalid pending packet.");

            if (id <= 0 || priority < 1 || priority > 5 ||
                !newNetwork.findRouter(source) ||
                !newNetwork.findRouter(destination) ||
                source == destination) {
                throw runtime_error("Invalid pending packet entry.");
            }

            Packet packet(id, source, destination, priority);
            newNetwork.queuePacket(source, packet);
        }

        network = newNetwork;
        packetHistory = newHistory;

        totalPackets = newTotal;
        deliveredPackets = newDelivered;
        lostPackets = newLost;
        nextPacketId = newNextId;

        cout << "Simulation loaded successfully.\n";
    }
    catch (const exception& e) {
        cout << "Loading failed: " << e.what() << '\n';
    }
}

void Simulation::run() {
    int choice;

    do {
        cout << "\n========== ADAPTIVE NETWORK ROUTING "
             << "& FAILURE RECOVERY SIMULATOR ==========\n";

        cout << "1. Display Network\n";
        cout << "2. Add Packet\n";
        cout << "3. Process Pending Packets\n";
        cout << "4. Compare Routing Algorithms\n";
        cout << "5. Fail Router\n";
        cout << "6. Repair Router\n";
        cout << "7. Fail Link\n";
        cout << "8. Repair Link\n";
        cout << "9. Check Connectivity\n";
        cout << "10. Display Statistics\n";
        cout << "11. Packet History\n";
        cout << "12. Display Pending Packets\n";
        cout << "13. Save Simulation\n";
        cout << "14. Load Simulation\n";
        cout << "0. Exit\n";

        cout << "\nEnter your choice: ";
        cin >> choice;

        if (!cin) {
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Please enter a valid number.\n";
            continue;
        }

        try {
            switch (choice) {
                case 1:
                    network.displayNetwork();
                    break;

                case 2:
                    addPacket();
                    break;

                case 3:
                    processPendingPackets();
                    break;

                case 4:
                    compareRoutingAlgorithms();
                    break;

                case 5:
                    failRouter();
                    break;

                case 6:
                    repairRouter();
                    break;

                case 7:
                    failLink();
                    break;

                case 8:
                    repairLink();
                    break;

                case 9:
                    checkConnectivity();
                    break;

                case 10:
                    displayStatistics();
                    break;

                case 11:
                    displayPacketHistory();
                    break;

                case 12:
                    displayPendingPackets();
                    break;

                case 13:
                    saveDetailsToFile();
                    break;

                case 14:
                    loadNetworkFromFile();
                    break;

                case 0:
                    cout << "Exiting simulator. Thank you!\n";
                    break;

                default:
                    cout << "Invalid choice. Try again.\n";
            }
        }
        catch (const exception& e) {
            cout << "Error: " << e.what() << '\n';
        }

    } while (choice != 0);
}
