#include "Network.hpp"
#include <queue>
#include <set>

Network::Network() {
    initializeDefaultNetwork();
}

void Network::initializeDefaultNetwork() {
    routers.clear();
    links.clear();

    for (int i = 1; i <= 8; i++)
        routers.emplace_back(i, "R" + to_string(i));

    int data[12][3] = {
        {1,2,2}, {1,3,5}, {2,3,1}, {2,4,3},
        {3,5,2}, {4,5,2}, {4,6,4}, {5,6,1},
        {5,7,3}, {6,8,2}, {7,8,1}, {3,7,5}
    };

    for (auto& edge : data)
        links.emplace_back(edge[0], edge[1], edge[2]);

    rebuildGraph();
}

void Network::rebuildGraph() {
    graph.clear();

    for (const auto& router : routers)
        graph[router.getId()] = {};

    for (const auto& link : links) {
        if (!link.isActive())
            continue;

        const Router* a = findRouter(link.getSource());
        const Router* b = findRouter(link.getDestination());

        if (a && b && a->isActive() && b->isActive()) {
            graph[link.getSource()].push_back(
                {link.getDestination(), link.getCost()});

            graph[link.getDestination()].push_back(
                {link.getSource(), link.getCost()});
        }
    }
}

Router* Network::findRouter(int id) {
    for (auto& router : routers)
        if (router.getId() == id)
            return &router;

    return nullptr;
}

const Router* Network::findRouter(int id) const {
    for (const auto& router : routers)
        if (router.getId() == id)
            return &router;

    return nullptr;
}

void Network::displayNetwork() const {
    cout << "\n========== NETWORK ==========\n";

    for (const auto& router : routers)
        router.display();

    cout << "\nLinks:\n";

    for (const auto& link : links) {
        cout << link.getSource() << " <-> "
             << link.getDestination()
             << " | Cost: " << link.getCost()
             << " | " << (link.isActive() ? "Active" : "Failed")
             << '\n';
    }
}

void Network::failRouter(int id) {
    Router* router = findRouter(id);
    if (!router) throw RouterNotFoundException();

    router->setActive(false);
    rebuildGraph();
}

void Network::repairRouter(int id) {
    Router* router = findRouter(id);
    if (!router) throw RouterNotFoundException();

    router->setActive(true);
    rebuildGraph();
}

void Network::failLink(int source, int destination) {
    for (auto& link : links) {
        if ((link.getSource() == source &&
             link.getDestination() == destination) ||
            (link.getSource() == destination &&
             link.getDestination() == source)) {
            link.setActive(false);
            rebuildGraph();
            return;
        }
    }

    throw LinkNotFoundException();
}

void Network::repairLink(int source, int destination) {
    for (auto& link : links) {
        if ((link.getSource() == source &&
             link.getDestination() == destination) ||
            (link.getSource() == destination &&
             link.getDestination() == source)) {
            link.setActive(true);
            rebuildGraph();
            return;
        }
    }

    throw LinkNotFoundException();
}

vector<pair<int, int>> Network::getNeighbors(int id) const {
    auto it = graph.find(id);
    if (it == graph.end())
        throw RouterNotFoundException();

    return it->second;
}

bool Network::isRouterActive(int id) const {
    const Router* router = findRouter(id);
    return router && router->isActive();
}

bool Network::isConnected(int source, int destination) const {
    if (!isRouterActive(source) || !isRouterActive(destination))
        return false;

    queue<int> q;
    set<int> visited;

    q.push(source);
    visited.insert(source);

    while (!q.empty()) {
        int current = q.front();
        q.pop();

        if (current == destination)
            return true;

        for (auto neighbor : getNeighbors(current)) {
            if (!visited.count(neighbor.first)) {
                visited.insert(neighbor.first);
                q.push(neighbor.first);
            }
        }
    }

    return false;
}

void Network::queuePacket(int routerId, const Packet& packet) {
    Router* router = findRouter(routerId);
    if (!router) throw RouterNotFoundException();

    router->addPacket(packet);
}

vector<Packet> Network::getPendingPackets() const {
    vector<Packet> result;

    for (const auto& router : routers) {
        auto packets = router.getQueuedPackets();

        for (const auto& packet : packets)
            result.push_back(packet);
    }

    return result;
}

vector<Packet> Network::collectPendingPackets() {
    vector<Packet> result;

    for (auto& router : routers) {
        auto packets = router.drainPackets();

        for (const auto& packet : packets)
            result.push_back(packet);
    }

    return result;
}

void Network::saveNetwork(ostream& out) const {
    out << routers.size() << '\n';

    for (const auto& router : routers)
        out << router.getId() << ' '
            << router.getName() << ' '
            << router.isActive() << '\n';

    out << links.size() << '\n';

    for (const auto& link : links)
        out << link.getSource() << ' '
            << link.getDestination() << ' '
            << link.getCost() << ' '
            << link.isActive() << '\n';
}

void Network::loadNetwork(istream& in) {
    vector<Router> newRouters;
    vector<Link> newLinks;

    int routerCount, linkCount;

    if (!(in >> routerCount) || routerCount < 1 || routerCount > 1000)
        throw runtime_error("Invalid router data in save file.");

    for (int i = 0; i < routerCount; i++) {
        int id, active;
        string name;

        if (!(in >> id >> name >> active) ||
            id <= 0 || (active != 0 && active != 1))
            throw runtime_error("Invalid router entry.");

        Router router(id, name);
        router.setActive(active != 0);
        newRouters.push_back(router);
    }

    if (!(in >> linkCount) || linkCount < 0 || linkCount > 10000)
        throw runtime_error("Invalid link data in save file.");

    for (int i = 0; i < linkCount; i++) {
        int a, b, cost, active;

        if (!(in >> a >> b >> cost >> active) ||
            a == b || cost <= 0 || (active != 0 && active != 1))
            throw runtime_error("Invalid link entry.");

        bool foundA = false, foundB = false;

        for (const auto& r : newRouters) {
            if (r.getId() == a) foundA = true;
            if (r.getId() == b) foundB = true;
        }

        if (!foundA || !foundB)
            throw runtime_error("Link refers to an unknown router.");

        Link link(a, b, cost);
        link.setActive(active != 0);
        newLinks.push_back(link);
    }

    routers = newRouters;
    links = newLinks;
    rebuildGraph();
}
