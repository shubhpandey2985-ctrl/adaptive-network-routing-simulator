#ifndef LINKED_LIST_H
#define LINKED_LIST_H

typedef struct AdjNode {
    int router;
    int cost;
    struct AdjNode* next;
} AdjNode;

AdjNode* createNode(int router, int cost);
void freeList(AdjNode* head);

#endif