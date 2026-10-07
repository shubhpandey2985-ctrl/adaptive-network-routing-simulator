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
    Stack(const Stack&) = delete;
    Stack& operator=(const Stack&) = delete;

    bool isEmpty() const;

    void push(int router);

    int pop();

    void clear();
};

#endif
