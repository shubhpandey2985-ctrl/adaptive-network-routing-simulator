#include "../include/Router.hpp"

Router::Router(int id)
    : id(id) {
}

int Router::getId() const {
    return id;
}