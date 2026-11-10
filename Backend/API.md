# NETROUTE REST API (v1)

Base URL: `http://127.0.0.1:8080/api/v1`. JSON request and response bodies use UTF-8. The server permits cross-origin requests; set `NETROUTE_PORT` to choose a different listening port.

Simulation state is held in memory and is lost when the backend restarts. Router counts are limited to 4–20. The 8-router default retains the original topology and costs.

## Endpoints

| Method and path | Purpose |
| --- | --- |
| `GET /health` | Server health and version. |
| `GET /topologies/default?routers=8` | Topology description; `routers` defaults to 8. |
| `POST /simulations` | Create a session. Body: `{"routerCount":8}`; omitted count defaults to 8. Returns `201` with `id`, topology, and metrics. |
| `GET /simulations/{id}` | Session topology, metrics, complete packet history, and event history. |
| `POST /simulations/{id}/reset` | Restore the selected topology and clear packets, events, and counters. |
| `POST /simulations/{id}/route` | Find a route. Body: `{"source":1,"destination":8,"algorithm":"Dijkstra"}`. Algorithms: `BFS`, `DFS`, `Dijkstra`, `Adaptive`. |
| `POST /simulations/{id}/packets` | Enqueue packets. Body: `{"source":1,"destination":8,"priority":2,"count":1}`. Priority is 1–10 and count is 1–100. Returns `201`. |
| `GET /simulations/{id}/packets` | Return complete packet history and count. |
| `GET /simulations/{id}/packets/pending` | Return packets still queued at routers. |
| `POST /simulations/{id}/packets/process` | Process queued packets using the chosen algorithm. Body may be `{}` or `{"algorithm":"Dijkstra"}`. Returns processed packets and updated metrics. |
| `POST /simulations/{id}/routers/fail` | Body: `{"routerId":5}`. |
| `POST /simulations/{id}/routers/repair` | Body: `{"routerId":5}`. |
| `POST /simulations/{id}/links/fail` | Body: `{"source":1,"destination":2}`. |
| `POST /simulations/{id}/links/repair` | Body: `{"source":1,"destination":2}`. |
| `POST /simulations/{id}/compare` | Compare all four algorithms. Body: `{"source":1,"destination":8}`. |
| `GET /simulations/{id}/metrics` | Created, pending, delivered, and lost counts, plus processed-packet delivery rate. |
| `GET /simulations/{id}/events` | Session event log. |

Topology responses contain `name`, `routerCount`, `linkCount`, `routers` (`id`, `name`, `active`) and `links` (`source`, `destination`, `cost`, `active`). Route results contain `algorithm`, router ID `route`, `cost`, `hops`, measured route-search `executionTimeMs`, and `reachable`.

Metrics use the following definitions:

- `totalPackets`: all packets created in the session, including pending packets.
- `pendingPackets`: packets still in router queues.
- `deliveredPackets`: packets successfully processed and routed.
- `lostPackets`: packets processed when no route is available.
- `deliveryRate`: `deliveredPackets / (deliveredPackets + lostPackets) * 100`; it is `0` before any packet is processed.

Packet `priority` is validated and retained as metadata; it does not affect scheduling. Processing drains router queues in router-ID order and keeps FIFO order within each router. Packets are removed from queues when processed, so a second processing request will not process them again. Creating a packet at a known but failed source router is allowed; processing it marks it lost because an inactive endpoint cannot route. Packets to inactive or disconnected destinations are likewise marked lost when processed.

For endpoints that consume a JSON body, malformed JSON, invalid fields, algorithms, router counts, and router IDs return HTTP `400` with `{"error":"..."}`. A single-route request with unreachable endpoints returns `400`. Unknown simulation IDs return HTTP `404`. Algorithm comparison returns HTTP `200` with a per-algorithm `reachable: false` result when valid router IDs have no path. Packet history records `pending`, `delivered`, or `lost` status; creation, processing, and failure/repair actions append events. Reset clears packet history, queues, counters, and events.

The API serializes access to simulation state with a mutex. Separate simulation IDs have independent topology, queues, history, counters, and events.

## Adaptive strategy behavior

Adaptive routing runs the existing BFS and Dijkstra implementations, then scores each candidate as total link cost plus `0.25` per hop. It selects the lower score, with BFS winning ties. The simulator has no traffic, queue congestion, or latency model, so this strategy is **not congestion-aware**.
