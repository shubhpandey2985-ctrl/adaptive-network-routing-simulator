#include <iostream>

#include "../include/LinkedList.hpp"
#include "../include/Graph.hpp"
#include "../include/Queue.hpp"
#include "../include/Stack.hpp"
#include "../include/Router.hpp"

int main() {

    std::cout << "===== DSA MODULE TEST =====\n\n";

    // -------------------------
    // Linked List Test
    // -------------------------
    std::cout << "--- Linked List Test ---\n";

    LinkedList list;

    list.insert(1, 10);
    list.insert(2, 20);
    list.insert(3, 30);

    std::cout << "Adjacency List:";
    list.print();
    std::cout << "\n\n";


    // -------------------------
    // Queue Test
    // -------------------------
    std::cout << "--- Queue Test ---\n";

    Queue queue;

    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);

    std::cout << "Dequeued: " << queue.dequeue() << '\n';
    std::cout << "Dequeued: " << queue.dequeue() << '\n';
    std::cout << "Dequeued: " << queue.dequeue() << '\n';
    std::cout << "Queue empty: "
              << (queue.isEmpty() ? "Yes" : "No") << "\n\n";


    // -------------------------
    // Stack Test
    // -------------------------
    std::cout << "--- Stack Test ---\n";

    Stack stack;

    stack.push(1);
    stack.push(2);
    stack.push(3);

    std::cout << "Popped: " << stack.pop() << '\n';
    std::cout << "Popped: " << stack.pop() << '\n';
    std::cout << "Popped: " << stack.pop() << '\n';
    std::cout << "Stack empty: "
              << (stack.isEmpty() ? "Yes" : "No") << "\n\n";


    // -------------------------
    // Router Test
    // -------------------------
    std::cout << "--- Router Test ---\n";

    Router router(5);

    std::cout << "Router ID: "
              << router.getId() << "\n\n";


    // -------------------------
    // Graph Test
    // -------------------------
    std::cout << "--- Graph Test ---\n";

    Graph graph(4);

    graph.addEdge(0, 1, 10);
    graph.addEdge(0, 2, 5);
    graph.addEdge(1, 2, 2);
    graph.addEdge(1, 3, 1);
    graph.addEdge(2, 3, 7);

    std::cout << "Network topology:\n";
    graph.printGraph();

    std::cout << "\nNumber of routers: "
              << graph.getNumRouters() << '\n';


    std::cout << "\n===== ALL BASIC DSA TESTS COMPLETED =====\n";

    return 0;
}
