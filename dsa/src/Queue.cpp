#include "../include/Queue.hpp"

Queue::Queue()
    : front(nullptr), rear(nullptr) {
}

Queue::~Queue() {
    clear();
}

bool Queue::isEmpty() const {
    return front == nullptr;
}

void Queue::enqueue(int router) {
    QueueNode* newNode = new QueueNode(router);

    if (rear == nullptr) {
        front = newNode;
        rear = newNode;
        return;
    }

    rear->next = newNode;
    rear = newNode;
}

int Queue::dequeue() {
    if (isEmpty()) {
        return -1;
    }

    QueueNode* temp = front;
    int router = temp->router;

    front = front->next;

    if (front == nullptr) {
        rear = nullptr;
    }

    delete temp;

    return router;
}

void Queue::clear() {
    while (!isEmpty()) {
        dequeue();
    }
}
