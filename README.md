# adaptive-network-routing-simulator
NETROUTE: Adaptive Network Routing Simulator

NETROUTE is an educational network-routing project with two separate implementations: a browser-based interactive network lab and a C++ command-line simulator. Both let you explore packet routes and network failures, but the browser pages do not call or depend on the C++ program.

## Features

### Browser network lab

- View a simulated network of 6, 7, or 8 routers.
- Select source and destination routers and simulate a packet route.
- Choose Breadth-First Search (BFS), Dijkstra, or Adaptive routing.
- View the selected route, hop count, route cost, and simulation events.
- Fail and repair routers or links, then calculate a route under the changed conditions.
- Compare the routes reported by the three algorithms.
- Change the visual theme and save theme/learning preferences in browser local storage.
- Explore the learning page, packet animations, and how-to-play guide.

The Modes page includes unavailable mode cards, and the navigation links to a Quiz page that is not present in this archive.

### C++ command-line simulator

- Starts with a predefined network of eight routers and weighted links.
- Displays the network and sends packets between routers.
- Calculates routes with BFS, Dijkstra, and an Adaptive strategy (Dijkstra with a BFS fallback).
- Simulates router and link failures and repairs.
- Checks network connectivity and compares routing results.
- Reports packet totals, delivery/loss counts, and rates.
- Saves and loads network state and packet history in `network_data.txt`.

The `dsa/` folder contains a separate C++ data-structure module with graph, linked-list, queue, stack, and router classes, plus a small demonstration/test program. It is not the implementation used by the main command-line simulator.

## Repository structure

```text
.
├── index.html                 # Browser app home page
├── lab.html                   # Interactive browser network lab
├── learn.html                 # Learning modules and algorithm walkthroughs
├── modes.html                 # Simulation mode page
├── how-to-play.html           # User guide
├── settings.html              # Theme and learning settings
├── css/                       # Page styles
├── js/                        # Browser behavior and simulations
├── header files/              # C++ simulator headers
├── cpp files/                 # C++ simulator implementation and main()
├── dsa/
│   ├── include/               # Standalone DSA module headers
│   ├── src/                   # Standalone DSA module implementation
│   └── tests/                 # DSA demonstration/test program
└── .vscode/                   # Optional VS Code C++ configuration
```

## Run the browser version

No package installation or build step is required. Open `index.html` in a modern browser, or serve the repository directory with a local static web server and visit its `index.html`. The app is made from HTML, CSS, and JavaScript and has no backend service. The pages load Google Fonts from the internet; the core interface can still be opened without them.

## Build and run the C++ version

Install a C++17 compiler such as `g++`. From the repository root, compile the command-line simulator:

```sh
g++ -std=c++17 -I"header files" \
  "cpp files/main.cpp" \
  "cpp files/Link.cpp" \
  "cpp files/Network.cpp" \
  "cpp files/Packet.cpp" \
  "cpp files/Router.cpp" \
  "cpp files/RoutingStrategy.cpp" \
  "cpp files/Simulation.cpp" \
  -o netroute
```

Run it from the repository root so save/load uses `network_data.txt` in that directory:

```sh
./netroute
```

On Windows, run the generated `netroute.exe` instead. The program presents a numbered menu for its operations.

## Technologies

- **Browser interface:** HTML, CSS, and vanilla JavaScript
- **Command-line simulator:** C++17 and the standard library
- **DSA module:** C++ source and headers

## Scope and notes

This is a simulation and learning project; it does not configure real routers or transmit network traffic. The browser lab and command-line simulator maintain their own simulation state. The browser project has no package manifest or automated build pipeline in the supplied repository.
