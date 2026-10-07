#include <iostream>
#include "../include/Graph.hpp"

Graph::Graph(int numRouters)
    : numRouters(numRouters), adjacencyList(nullptr) {

    if (numRouters <= 0) {
        this->numRouters = 0;
        return;
    }

    adjacencyList = new LinkedList[numRouters];
}

Graph::~Graph() {
    delete[] adjacencyList;
}

void Graph::addEdge(int source, int destination, int cost) {
    if (source < 0 || source >= numRouters ||
        destination < 0 || destination >= numRouters) {
        return;
    }

    if (cost < 0) {
        return;
    }

    adjacencyList[source].insert(destination, cost);
}

void Graph::printGraph() const {
    if (adjacencyList == nullptr) {
        return;
    }

    for (int i = 0; i < numRouters; ++i) {
        std::cout << "Router " << i << ":";

        adjacencyList[i].print();

        std::cout << '\n';
    }
}

int Graph::getNumRouters() const {
    return numRouters;
}
