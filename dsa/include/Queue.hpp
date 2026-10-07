#ifndef QUEUE_HPP
#define QUEUE_HPP

struct QueueNode {
    int router;
    QueueNode* next;

    explicit QueueNode(int router)
        : router(router), next(nullptr) {}
};

class Queue {
private:
    QueueNode* front;
    QueueNode* rear;

public:
    Queue();
    ~Queue();

    bool isEmpty() const;

    void enqueue(int router);

    int dequeue();

    void clear();
};

#endif