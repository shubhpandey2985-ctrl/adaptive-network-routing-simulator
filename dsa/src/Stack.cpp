#include "../include/Stack.hpp"

Stack::Stack()
    : top(nullptr) {
}

Stack::~Stack() {
    clear();
}

bool Stack::isEmpty() const {
    return top == nullptr;
}

void Stack::push(int router) {
    StackNode* newNode = new StackNode(router);

    newNode->next = top;
    top = newNode;
}

int Stack::pop() {
    if (isEmpty()) {
        return -1;
    }

    StackNode* temp = top;
    int router = temp->router;

    top = top->next;

    delete temp;

    return router;
}

void Stack::clear() {
    while (!isEmpty()) {
        pop();
    }
}