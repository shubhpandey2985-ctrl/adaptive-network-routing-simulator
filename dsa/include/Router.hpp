#ifndef ROUTER_HPP
#define ROUTER_HPP

class Router {
private:
    int id;

public:
    explicit Router(int id);

    int getId() const;
};

#endif