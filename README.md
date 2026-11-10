# NETROUTE — Adaptive Network Routing Simulator

NETROUTE consists of an existing browser frontend and a C++ REST backend with automated tests. The frontend retains its current client-side behavior and is not connected to the REST API.

## Repository layout

.
├── Frontend/          Existing browser application
├── Backend/           C++17 REST API, shared core, routing algorithms, and tests
├── README.md
├── PPT.tex
└── Report.tex

## Browser frontend

Open Frontend/index.html in a browser or serve the Frontend/ directory with a static web server. The frontend remains independent of the C++ backend.

## C++ REST backend

The backend uses C++17, CMake, cpp-httplib, and nlohmann-json through the existing vcpkg installation. It creates in-memory simulation sessions, supports router counts from 4 to 20, and provides endpoints for routing, packets, failures and repairs, comparisons, metrics, events, and reset. MySQL is not integrated; session state is lost when the server stops.

From the repository root in PowerShell, configure and build with the installed MSVC toolchain and vcpkg packages:

    cmake -S .\Backend -B .\Backend\build -DCMAKE_TOOLCHAIN_FILE="C:/dev/vcpkg/scripts/buildsystems/vcpkg.cmake" -DVCPKG_TARGET_TRIPLET=x64-windows
    cmake --build .\Backend\build --config Release

Start the service:

    .\Backend\build\Release\netroute_backend.exe

It listens on http://127.0.0.1:8080 by default. Set NETROUTE_PORT before launch to select another port. Check that it is running:

    Invoke-RestMethod http://127.0.0.1:8080/api/v1/health

The endpoint contract, request examples, response fields, and Adaptive strategy behavior are documented in Backend/API.md.

Run the API verification script with PowerShell 7 and CTest:

    pwsh -NoProfile -File .\Backend\tests\verify_api.ps1
    ctest --test-dir .\Backend\build -C Release --output-on-failure

The backend simulates networks locally; it does not configure real routers or transmit network traffic.
