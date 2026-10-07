#ifndef GRAPH_HPP
#define GRAPH_HPP

#include "LinkedList.hpp"

class Graph {
private:
    int numRouters;
    LinkedList* adjacencyList;

public:
    explicit Graph(int numRouters);

    ~Graph();

    void addEdge(int source, int destination, int cost);

    void printGraph() const;

    int getNumRouters() const;
};

#endif
