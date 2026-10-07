#ifndef STACK_HPP
#define STACK_HPP

struct StackNode {
    int router;
    StackNode* next;

    explicit StackNode(int router)
        : router(router), next(nullptr) {}
};

class Stack {
private:
    StackNode* top;

public:
    Stack();
    ~Stack();

    bool isEmpty() const;

    void push(int router);

    int pop();

    void clear();
};

#endif