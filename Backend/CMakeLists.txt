
cmake_minimum_required(VERSION 3.25)

project(NETROUTE_BACKEND VERSION 1.0.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_EXTENSIONS OFF)

find_package(httplib CONFIG REQUIRED)
find_package(nlohmann_json CONFIG REQUIRED)

add_executable(netroute_backend
    src/server_main.cpp
    src/api/ApiServer.cpp
    src/core/Link.cpp
    src/core/Network.cpp
    src/core/Packet.cpp
    src/core/Router.cpp
    src/core/RoutingStrategy.cpp
    src/services/SimulationManager.cpp
)

target_include_directories(netroute_backend PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}/include
    ${CMAKE_CURRENT_SOURCE_DIR}/include/core
)

target_link_libraries(netroute_backend PRIVATE
    httplib::httplib
    nlohmann_json::nlohmann_json
)

if(MSVC)
    target_compile_options(netroute_backend PRIVATE /W4 /permissive- /EHsc)
endif()
