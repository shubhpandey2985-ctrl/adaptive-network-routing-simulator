#include <iostream>
#include "../include/LinkedList.hpp"

LinkedList::LinkedList()
    : head(nullptr) {
}

LinkedList::~LinkedList() {
    clear();
}

void LinkedList::insert(int router, int cost) {
    AdjNode* newNode = new AdjNode(router, cost);

    newNode->next = head;
    head = newNode;
}

void LinkedList::print() const {
    AdjNode* current = head;

    while (current != nullptr) {
        std::cout << " -> Router " << current->router
                  << " (cost: " << current->cost << ")";

        current = current->next;
    }
}

void LinkedList::clear() {
    AdjNode* current = head;

    while (current != nullptr) {
        AdjNode* next = current->next;
        delete current;
        current = next;
    }

    head = nullptr;
}

const AdjNode* LinkedList::getHead() const {
    return head;
}
