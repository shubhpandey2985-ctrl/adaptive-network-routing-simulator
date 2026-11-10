# NETROUTE — Adaptive Network Routing Simulator

NETROUTE is an educational project with a browser interface, a C++ REST backend, a standalone C++ CLI simulator, and a separate data-structures module. These are distinct implementations: **the browser frontend is not yet integrated with the C++ REST API and does not currently call it.**

## Repository layout

```text
.
├── Frontend/          # Existing browser application (HTML, CSS, JavaScript)
├── Backend/           # C++17 REST API, core, session manager, API docs
├── dsa/               # Separate data-structures examples and demo/tests
├── header files/      # Headers for the standalone CLI simulator
├── cpp files/         # Standalone CLI sources, including main.cpp
├── README.md
├── network_data.txt   # CLI save/load data file
├── PPT.tex            # Project presentation source
└── Report.tex         # Project report source
```

## Browser frontend

Open `Frontend/index.html` in a browser or serve the `Frontend/` directory with a static web server. The frontend retains its existing client-side behavior and is independent of the C++ backend. Connecting the frontend to the API is a separate future task.

## C++ REST backend

The backend uses C++17, CMake, cpp-httplib, and nlohmann-json through the existing vcpkg installation. It creates in-memory simulation sessions, supports router counts from 4 to 20, and provides routes for routing, packets, failures/repairs, comparisons, metrics, events, and reset. **There is no MySQL integration; session state is lost when the server stops.**

From the repository root in PowerShell, configure and build with the installed MSVC toolchain and vcpkg packages:

```powershell
cmake -S .\Backend -B .\Backend\build `
  -DCMAKE_TOOLCHAIN_FILE="C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake" `
  -DVCPKG_TARGET_TRIPLET=x64-windows

cmake --build .\Backend\build --config Release
```

Start the service:

```powershell
.\Backend\build\Release\netroute_backend.exe
```

It listens on `http://127.0.0.1:8080` by default. Set `NETROUTE_PORT` before launch to select another port. Check that it is running:

```powershell
Invoke-RestMethod http://127.0.0.1:8080/api/v1/health
```

The complete endpoint contract, request examples, response fields, and Adaptive strategy description are in [`Backend/API.md`](Backend/API.md).

With the backend running, verify the REST workflows and packet metric cases with PowerShell 7:

```powershell
.\Backend\tests\verify_api.ps1
ctest --test-dir .\Backend\build -C Release --output-on-failure
```

## Standalone C++ CLI simulator

The original command-line simulator remains separate from `Backend/`. From the repository root, compile it with a C++17 compiler such as `g++`:

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

Run it from the repository root so save/load uses `network_data.txt` there:

```sh
./netroute
```

On Windows, run `netroute.exe`. The CLI presents a numbered menu.

## DSA module and project assets

`dsa/` contains a separate educational C++ module with graph, linked-list, queue, stack, and router code plus its demo/test program. It is not linked into either simulator. `PPT.tex` and `Report.tex` are the project presentation and report sources.

All components simulate networks locally; they do not configure real routers or transmit network traffic.
