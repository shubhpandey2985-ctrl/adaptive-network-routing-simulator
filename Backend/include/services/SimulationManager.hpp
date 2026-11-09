#ifndef SIMULATION_MANAGER_HPP
#define SIMULATION_MANAGER_HPP

#include "core/Network.hpp"
#include <nlohmann/json.hpp>
#include <memory>
#include <mutex>
#include <string>
#include <unordered_map>

struct SimulationSession {
    explicit SimulationSession(int count) : routerCount(count) { network.initializeTopology(count); }
    Network network;
    int routerCount;
    int nextPacketId = 1;
    int delivered = 0;
    int lost = 0;
    nlohmann::json packets = nlohmann::json::array();
    nlohmann::json events = nlohmann::json::array();
};

class SimulationManager {
public:
    std::shared_ptr<SimulationSession> create(int routerCount, std::string& id);
    std::shared_ptr<SimulationSession> find(const std::string& id) const;
    std::mutex& stateMutex();
private:
    mutable std::mutex sessionsMutex_;
    std::mutex stateMutex_;
    std::unordered_map<std::string, std::shared_ptr<SimulationSession>> sessions_;
    unsigned long long nextId_ = 1;
};

#endif
