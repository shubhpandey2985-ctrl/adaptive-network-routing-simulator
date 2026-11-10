
#include "api/ApiServer.hpp"
#include "core/Network.hpp"
#include "core/Packet.hpp"
#include "algorithms/BFS.hpp"
#include "algorithms/DFS.hpp"
#include "algorithms/Dijkstra.hpp"
#include "algorithms/Adaptive.hpp"
#include "services/SimulationManager.hpp"
#include <algorithm>
#include <chrono>
#include <memory>
#include <mutex>
#include <nlohmann/json.hpp>
#include <stdexcept>
#include <string>

using json = nlohmann::json;
namespace
{
SimulationManager manager;

void send(httplib::Response &r, int status, const json &body)
{
    r.status = status;
    r.set_content(body.dump(), "application/json; charset=utf-8");
}
json body(const httplib::Request &q)
{
    if (q.body.empty())
        throw std::invalid_argument("Request body must be valid JSON.");
    return json::parse(q.body);
}
json objectBody(const httplib::Request &q)
{
    auto value = body(q);
    if (!value.is_object())
        throw std::invalid_argument("Request body must be a JSON object.");
    return value;
}
int integer(const json &b, const char *key)
{
    if (!b.contains(key) || !b[key].is_number_integer())
        throw std::invalid_argument(std::string(key) + " must be an integer.");
    return b[key].get<int>();
}
int optionalInteger(const json &b, const char *key, int fallback)
{
    return b.contains(key) ? integer(b, key) : fallback;
}
std::string stringValue(const json &b, const char *key, const std::string &fallback)
{
    if (!b.contains(key))
        return fallback;
    if (!b[key].is_string())
        throw std::invalid_argument(std::string(key) + " must be a string.");
    return b[key].get<std::string>();
}
int queryInt(const httplib::Request &q, const char *key, int fallback)
{
    if (!q.has_param(key))
        return fallback;
    try
    {
        size_t n = 0;
        auto v = q.get_param_value(key);
        int x = std::stoi(v, &n);
        if (n != v.size())
            throw std::invalid_argument("invalid");
        return x;
    }
    catch (...)
    {
        throw std::invalid_argument(std::string(key) + " must be an integer.");
    }
}
json topology(const Network &n)
{
    json routers = json::array(), links = json::array();
    for (const auto &r : n.getRouters())
        routers.push_back({{"id", r.getId()}, {"name", r.getName()}, {"active", r.isActive()}});
    for (const auto &l : n.getLinks())
        links.push_back({{"source", l.getSource()},
                         {"destination", l.getDestination()},
                         {"cost", l.getCost()},
                         {"active", l.isActive()}});
    return {{"name", "NETROUTE default topology"},
            {"routerCount", routers.size()},
            {"linkCount", links.size()},
            {"routers", routers},
            {"links", links}};
}
std::unique_ptr<RoutingStrategy> makeStrategy(const std::string &a)
{
    if (a == "BFS" || a == "bfs")
        return std::make_unique<BFSStrategy>();
    if (a == "DFS" || a == "dfs")
        return std::make_unique<DFSStrategy>();
    if (a == "Dijkstra" || a == "dijkstra")
        return std::make_unique<DijkstraStrategy>();
    if (a == "Adaptive" || a == "adaptive")
        return std::make_unique<AdaptiveStrategy>();
    throw std::invalid_argument("algorithm must be BFS, DFS, Dijkstra, or Adaptive.");
}
int cost(const Network &n, const std::vector<int> &path)
{
    int total = 0;
    for (size_t i = 1; i < path.size(); ++i)
    {
        bool found = false;
        for (const auto &e : n.getNeighbors(path[i - 1]))
            if (e.first == path[i])
            {
                total += e.second;
                found = true;
                break;
            }
        if (!found)
            throw std::runtime_error("Route contains an inactive link.");
    }
    return total;
}
json route(const Network &n, int source, int destination, const std::string &name)
{
    auto s = makeStrategy(name);
    auto t = std::chrono::steady_clock::now();
    auto p = s->findRoute(n, source, destination);
    double ms = std::chrono::duration<double, std::milli>(std::chrono::steady_clock::now() - t).count();
    return {{"algorithm", s->getName()}, {"route", p},
            {"cost", cost(n, p)},        {"hops", p.size() ? p.size() - 1 : 0},
            {"executionTimeMs", ms},     {"reachable", true}};
}
json metrics(const SimulationSession &s)
{
    const auto totalCreated = s.packets.size();
    const auto pending = s.network.getPendingPackets().size();
    const int processed = s.delivered + s.lost;
    const double deliveryRate =
        processed == 0 ? 0.0 : 100.0 * static_cast<double>(s.delivered) / static_cast<double>(processed);
    return {{"totalPackets", totalCreated},
            {"pendingPackets", pending},
            {"deliveredPackets", s.delivered},
            {"lostPackets", s.lost},
            {"deliveryRate", deliveryRate}};
}
void addEvent(SimulationSession &s, const std::string &type, json detail)
{
    s.events.push_back({{"type", type}, {"detail", detail}});
}
void cors(httplib::Response &r)
{
    r.set_header("Access-Control-Allow-Origin", "*");
    r.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    r.set_header("Access-Control-Allow-Headers", "Content-Type, Authorization");
}
} // namespace

void configureRoutes(httplib::Server &server)
{
    server.Options(R"(.*)", [](const httplib::Request &, httplib::Response &r) { r.status = 204; });
    server.set_post_routing_handler([](const httplib::Request &, httplib::Response &r) { cors(r); });
    server.Get("/api/v1/health", [](const httplib::Request &, httplib::Response &r) {
        send(r, 200,
             {{"success", true},
              {"message", "NETROUTE backend is running"},
              {"service", "NETROUTE API"},
              {"version", "1.0.0"}});
    });
    server.Get("/api/v1/topologies/default", [](const httplib::Request &q, httplib::Response &r) {
        try
        {
            Network n;
            n.initializeTopology(queryInt(q, "routers", 8));
            send(r, 200, topology(n));
        }
        catch (const std::exception &e)
        {
            send(r, 400, {{"error", e.what()}});
        }
    });
    server.Post("/api/v1/simulations", [](const httplib::Request &q, httplib::Response &r) {
        try
        {
            auto b = objectBody(q);
            int count = b.contains("routerCount") ? integer(b, "routerCount") : 8;
            if (count < 4 || count > 20)
                throw std::invalid_argument("routerCount must be between 4 and 20.");
            std::string id;
            auto s = manager.create(count, id);
            std::lock_guard<std::mutex> guard(manager.stateMutex());
            send(r, 201, {{"id", id}, {"topology", topology(s->network)}, {"metrics", metrics(*s)}});
        }
        catch (const std::exception &e)
        {
            send(r, 400, {{"error", e.what()}});
        }
    });
    server.Get(R"(/api/v1/simulations/([A-Za-z0-9_-]+))", [](const httplib::Request &q, httplib::Response &r) {
        try
        {
            auto s = manager.find(q.matches[1]);
            std::lock_guard<std::mutex> g(manager.stateMutex());
            send(r, 200,
                 {{"id", q.matches[1]},
                  {"topology", topology(s->network)},
                  {"metrics", metrics(*s)},
                  {"packets", s->packets},
                  {"events", s->events}});
        }
        catch (const std::out_of_range &e)
        {
            send(r, 404, {{"error", e.what()}});
        }
    });
    server.Post(R"(/api/v1/simulations/([A-Za-z0-9_-]+)/reset)", [](const httplib::Request &q, httplib::Response &r) {
        try
        {
            auto s = manager.find(q.matches[1]);
            std::lock_guard<std::mutex> g(manager.stateMutex());
            s->network.initializeTopology(s->routerCount);
            s->nextPacketId = 1;
            s->delivered = s->lost = 0;
            s->packets = json::array();
            s->events = json::array();
            send(r, 200, {{"id", q.matches[1]}, {"reset", true}, {"metrics", metrics(*s)}});
        }
        catch (const std::out_of_range &e)
        {
            send(r, 404, {{"error", e.what()}});
        }
    });
    server.Post(R"(/api/v1/simulations/([A-Za-z0-9_-]+)/route)", [](const httplib::Request &q, httplib::Response &r) {
        try
        {
            auto b = objectBody(q);
            int a = integer(b, "source"), d = integer(b, "destination");
            auto alg = stringValue(b, "algorithm", "Dijkstra");
            auto s = manager.find(q.matches[1]);
            std::lock_guard<std::mutex> g(manager.stateMutex());
            send(r, 200, route(s->network, a, d, alg));
        }
        catch (const std::out_of_range &e)
        {
            send(r, 404, {{"error", e.what()}});
        }
        catch (const std::exception &e)
        {
            send(r, 400, {{"error", e.what()}});
        }
    });
    server.Post(R"(/api/v1/simulations/([A-Za-z0-9_-]+)/packets)", [](const httplib::Request &q, httplib::Response &r) {
        try
        {
            auto b = objectBody(q);
            int a = integer(b, "source"), d = integer(b, "destination"), priority = optionalInteger(b, "priority", 1),
                count = optionalInteger(b, "count", 1);
            if (priority < 1 || priority > 10 || count < 1 || count > 100)
                throw std::invalid_argument("priority must be 1-10 and count 1-100.");
            auto s = manager.find(q.matches[1]);
            std::lock_guard<std::mutex> g(manager.stateMutex());
            if (!s->network.findRouter(a) || !s->network.findRouter(d))
                throw std::invalid_argument("source and destination must identify routers in this simulation.");
            json made = json::array();
            for (int i = 0; i < count; ++i)
            {
                Packet p(s->nextPacketId++, a, d, priority);
                s->network.queuePacket(a, p);
                json item = {{"id", p.getId()},       {"source", a},         {"destination", d},
                             {"priority", priority},  {"status", "pending"}, {"delivered", false},
                             {"route", json::array()}};
                s->packets.push_back(item);
                made.push_back(item);
            }
            addEvent(*s, "packets_created", {{"count", count}});
            send(r, 201,
                 {{"packets", made},
                  {"pendingPackets", s->network.getPendingPackets().size()},
                  {"metrics", metrics(*s)}});
        }
        catch (const std::out_of_range &e)
        {
            send(r, 404, {{"error", e.what()}});
        }
        catch (const std::exception &e)
        {
            send(r, 400, {{"error", e.what()}});
        }
    });
    server.Get(R"(/api/v1/simulations/([A-Za-z0-9_-]+)/packets/pending)",
               [](const httplib::Request &q, httplib::Response &r) {
                   try
                   {
                       auto s = manager.find(q.matches[1]);
                       std::lock_guard<std::mutex> g(manager.stateMutex());
                       json pending = json::array();
                       for (const auto &p : s->network.getPendingPackets())
                           pending.push_back({{"id", p.getId()},
                                              {"source", p.getSource()},
                                              {"destination", p.getDestination()},
                                              {"priority", p.getPriority()}});
                       send(r, 200, {{"pendingPackets", pending}});
                   }
                   catch (const std::out_of_range &e)
                   {
                       send(r, 404, {{"error", e.what()}});
                   }
               });
    server.Get(R"(/api/v1/simulations/([A-Za-z0-9_-]+)/packets)", [](const httplib::Request &q, httplib::Response &r) {
        try
        {
            auto s = manager.find(q.matches[1]);
            std::lock_guard<std::mutex> g(manager.stateMutex());
            send(r, 200, {{"packets", s->packets}, {"count", s->packets.size()}});
        }
        catch (const std::out_of_range &e)
        {
            send(r, 404, {{"error", e.what()}});
        }
    });
    server.Post(R"(/api/v1/simulations/([A-Za-z0-9_-]+)/packets/process)",
                [](const httplib::Request &q, httplib::Response &r) {
                    try
                    {
                        auto b = q.body.empty() ? json::object() : objectBody(q);
                        auto algorithm = stringValue(b, "algorithm", "Dijkstra");
                        makeStrategy(algorithm);
                        auto s = manager.find(q.matches[1]);
                        std::lock_guard<std::mutex> g(manager.stateMutex());
                        auto pending = s->network.collectPendingPackets();
                        json processed = json::array();
                        for (auto &p : pending)
                        {
                            auto it = std::find_if(s->packets.begin(), s->packets.end(),
                                                   [&](const json &x) { return x.value("id", -1) == p.getId(); });
                            try
                            {
                                auto result = route(s->network, p.getSource(), p.getDestination(), algorithm);
                                p.setRoute(result["route"].get<std::vector<int>>());
                                p.setDelivered(true);
                                ++s->delivered;
                                if (it != s->packets.end())
                                {
                                    (*it)["status"] = "delivered";
                                    (*it)["delivered"] = true;
                                    (*it)["route"] = p.getRoute();
                                    (*it)["cost"] = result["cost"];
                                    (*it)["algorithm"] = algorithm;
                                    processed.push_back(*it);
                                }
                            }
                            catch (const std::exception &e)
                            {
                                ++s->lost;
                                if (it != s->packets.end())
                                {
                                    (*it)["status"] = "lost";
                                    (*it)["delivered"] = false;
                                    (*it)["error"] = e.what();
                                    processed.push_back(*it);
                                }
                            }
                        }
                        addEvent(*s, "packets_processed", {{"count", pending.size()}, {"algorithm", algorithm}});
                        send(r, 200, {{"packets", processed}, {"metrics", metrics(*s)}});
                    }
                    catch (const std::out_of_range &e)
                    {
                        send(r, 404, {{"error", e.what()}});
                    }
                    catch (const std::exception &e)
                    {
                        send(r, 400, {{"error", e.what()}});
                    }
                });
    auto failure = [](const httplib::Request &q, httplib::Response &r, bool repair, bool isRouter) {
        try
        {
            auto b = objectBody(q);
            auto s = manager.find(q.matches[1]);
            std::lock_guard<std::mutex> g(manager.stateMutex());
            if (isRouter)
            {
                int id = integer(b, "routerId");
                if (repair)
                    s->network.repairRouter(id);
                else
                    s->network.failRouter(id);
                addEvent(*s, repair ? "router_repaired" : "router_failed", {{"routerId", id}});
            }
            else
            {
                int a = integer(b, "source"), d = integer(b, "destination");
                if (repair)
                    s->network.repairLink(a, d);
                else
                    s->network.failLink(a, d);
                addEvent(*s, repair ? "link_repaired" : "link_failed", {{"source", a}, {"destination", d}});
            }
            send(r, 200, {{"topology", topology(s->network)}, {"metrics", metrics(*s)}});
        }
        catch (const std::out_of_range &e)
        {
            send(r, 404, {{"error", e.what()}});
        }
        catch (const std::exception &e)
        {
            send(r, 400, {{"error", e.what()}});
        }
    };
    server.Post(R"(/api/v1/simulations/([A-Za-z0-9_-]+)/routers/fail)",
                [failure](const auto &q, auto &r) { failure(q, r, false, true); });
    server.Post(R"(/api/v1/simulations/([A-Za-z0-9_-]+)/routers/repair)",
                [failure](const auto &q, auto &r) { failure(q, r, true, true); });
    server.Post(R"(/api/v1/simulations/([A-Za-z0-9_-]+)/links/fail)",
                [failure](const auto &q, auto &r) { failure(q, r, false, false); });
    server.Post(R"(/api/v1/simulations/([A-Za-z0-9_-]+)/links/repair)",
                [failure](const auto &q, auto &r) { failure(q, r, true, false); });
    server.Get(R"(/api/v1/simulations/([A-Za-z0-9_-]+)/metrics)", [](const auto &q, auto &r) {
        try
        {
            auto s = manager.find(q.matches[1]);
            std::lock_guard<std::mutex> g(manager.stateMutex());
            send(r, 200, metrics(*s));
        }
        catch (const std::out_of_range &e)
        {
            send(r, 404, {{"error", e.what()}});
        }
    });
    server.Get(R"(/api/v1/simulations/([A-Za-z0-9_-]+)/events)", [](const auto &q, auto &r) {
        try
        {
            auto s = manager.find(q.matches[1]);
            std::lock_guard<std::mutex> g(manager.stateMutex());
            send(r, 200, {{"events", s->events}});
        }
        catch (const std::out_of_range &e)
        {
            send(r, 404, {{"error", e.what()}});
        }
    });
    server.Post(R"(/api/v1/simulations/([A-Za-z0-9_-]+)/compare)", [](const httplib::Request &q, httplib::Response &r) {
        try
        {
            auto b = objectBody(q);
            int a = integer(b, "source"), d = integer(b, "destination");
            auto s = manager.find(q.matches[1]);
            std::lock_guard<std::mutex> g(manager.stateMutex());
            if (!s->network.findRouter(a) || !s->network.findRouter(d))
                throw std::invalid_argument("source and destination must identify routers in this simulation.");
            json out = json::array();
            for (const char *name : {"BFS", "DFS", "Dijkstra", "Adaptive"})
                try
                {
                    out.push_back(route(s->network, a, d, name));
                }
                catch (const DestinationUnreachableException &e)
                {
                    out.push_back({{"algorithm", name}, {"reachable", false}, {"error", e.what()}});
                }
            send(r, 200, {{"results", out}});
        }
        catch (const std::out_of_range &e)
        {
            send(r, 404, {{"error", e.what()}});
        }
        catch (const std::exception &e)
        {
            send(r, 400, {{"error", e.what()}});
        }
    });
}
