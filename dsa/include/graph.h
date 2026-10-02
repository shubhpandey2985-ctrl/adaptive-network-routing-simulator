#ifndef GRAPH_H
#define GRAPH_H

#include "linked_list.h"

typedef struct Graph {
    int numRouters;
    AdjNode** adjacencyList;
} Graph;

Graph* createGraph(int numRouters);

void addEdge(Graph* graph, int source, int destination, int cost);

void printGraph(Graph* graph);

void freeGraph(Graph* graph);

#endif