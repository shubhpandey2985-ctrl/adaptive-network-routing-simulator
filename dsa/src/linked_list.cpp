#include <stdlib.h>
#include "../include/linked_list.h"

AdjNode* createNode(int router, int cost) {
    AdjNode* newNode = malloc(sizeof(AdjNode));

    if (newNode == NULL) {
        return NULL;
    }

    newNode->router = router;
    newNode->cost = cost;
    newNode->next = NULL;

    return newNode;
}

void freeList(AdjNode* head) {
    while (head != NULL) {
        AdjNode* temp = head;
        head = head->next;
        free(temp);
    }
}
