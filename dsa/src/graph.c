#include <stdio.h>
#include <stdlib.h>
#include "../include/graph.h"

Graph* createGraph(int numRouters) {
    if (numRouters <= 0) {
        return NULL;
    }

    Graph* graph = malloc(sizeof(Graph));

    if (graph == NULL) {
        return NULL;
    }

    graph->numRouters = numRouters;

    graph->adjacencyList = calloc(numRouters, sizeof(AdjNode*));

    if (graph->adjacencyList == NULL) {
        free(graph);
        return NULL;
    }

    return graph;
}

void addEdge(Graph* graph, int source, int destination, int cost) {
    if (graph == NULL) {
        return;
    }

    if (source < 0 || source >= graph->numRouters ||
        destination < 0 || destination >= graph->numRouters) {
        return;
    }

    if (cost < 0) {
        return;
    }

    AdjNode* newNode = createNode(destination, cost);

    if (newNode == NULL) {
        return;
    }

    newNode->next = graph->adjacencyList[source];
    graph->adjacencyList[source] = newNode;
}

void printGraph(const Graph* graph) {
    if (graph == NULL) {
        return;
    }

    for (int i = 0; i < graph->numRouters; i++) {
        printf("Router %d:", i);

        AdjNode* current = graph->adjacencyList[i];

        while (current != NULL) {
            printf(" -> Router %d (cost: %d)",
                   current->router,
                   current->cost);

            current = current->next;
        }

        printf("\n");
    }
}

void freeGraph(Graph* graph) {
    if (graph == NULL) {
        return;
    }

    for (int i = 0; i < graph->numRouters; i++) {
        freeList(graph->adjacencyList[i]);
    }

    free(graph->adjacencyList);
    free(graph);
}