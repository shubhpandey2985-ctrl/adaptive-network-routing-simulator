#ifndef QUEUE_H
#define QUEUE_H

typedef struct QueueNode {
    int router;
    struct QueueNode* next;
} QueueNode;

typedef struct Queue {
    QueueNode* front;
    QueueNode* rear;
} Queue;

Queue* createQueue(void);

int isQueueEmpty(const Queue* queue);

void enqueue(Queue* queue, int router);

int dequeue(Queue* queue);

void freeQueue(Queue* queue);

#endif

