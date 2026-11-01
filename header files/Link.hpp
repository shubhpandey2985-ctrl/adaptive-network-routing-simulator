#ifndef LINK_HPP
#define LINK_HPP

class Link {
private:
    int source, destination, cost;
    bool active;

public:
    Link();
    Link(int source, int destination, int cost);

    int getSource() const;
    int getDestination() const;
    int getCost() const;
    bool isActive() const;

    void setActive(bool status);
};

#endif
