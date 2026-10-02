#include <stdio.h>
#include "../include/graph.h"

int main() {

    Graph* graph = createGraph(4);

    addEdge(graph, 0, 1, 4);
    addEdge(graph, 0, 2, 2);
    addEdge(graph, 1, 3, 3);
    addEdge(graph, 2, 3, 2);

    printGraph(graph);

    freeGraph(graph);

    return 0;
}