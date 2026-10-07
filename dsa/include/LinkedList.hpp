#ifndef LINKED_LIST_HPP
#define LINKED_LIST_HPP

struct AdjNode {
    int router;
    int cost;
    AdjNode* next;

    AdjNode(int router, int cost)
        : router(router), cost(cost), next(nullptr) {}
};

class LinkedList {
private:
    AdjNode* head;

public:
    LinkedList();
    ~LinkedList();

    void insert(int router, int cost);
    void print() const;
    void clear();

    AdjNode* getHead() const;
};

#endif