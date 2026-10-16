
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const $ = (id) => document.getElementById(id);

    const elements = {
        routerCount: $("routerCount"),
        linkCount: $("linkCount"),
        deliveredCount: $("deliveredCount"),
        failedCount: $("failedCount"),

        topologySelect: $("topologySelect"),
        algorithmSelect: $("algorithmSelect"),
        sourceSelect: $("sourceSelect"),
        destinationSelect: $("destinationSelect"),
        prioritySelect: $("prioritySelect"),

        failureRouterSelect: $("failureRouterSelect"),
        failureLinkSelect: $("failureLinkSelect"),

        simulateBtn: $("simulateBtn"),
        resetBtn: $("resetBtn"),
        failRouterBtn: $("failRouterBtn"),
        repairRouterBtn: $("repairRouterBtn"),
        breakLinkBtn: $("breakLinkBtn"),
        restoreLinkBtn: $("restoreLinkBtn"),
        compareBtn: $("compareBtn"),

        networkSvg: $("networkSvg"),
        linksLayer: $("linksLayer"),
        packetsLayer: $("packetsLayer"),
        routersLayer: $("routersLayer"),
        networkViewport: $("networkViewport"),

        routeSummary: $("routeSummary"),
        routerDetails: $("routerDetails"),
        eventLog: $("eventLog"),

        comparisonPanel: $("comparisonPanel"),
        comparisonResults: $("comparisonResults"),
        closeComparisonBtn: $("closeComparisonBtn"),
        clearLogBtn: $("clearLogBtn"),

        zoomInBtn: $("zoomInBtn"),
        zoomOutBtn: $("zoomOutBtn"),
        zoomResetBtn: $("zoomResetBtn")
    };

    const requiredIds = [
        "topologySelect", "algorithmSelect", "sourceSelect",
        "destinationSelect", "networkSvg", "linksLayer",
        "packetsLayer", "routersLayer", "simulateBtn",
        "resetBtn", "routeSummary", "routerDetails", "eventLog"
    ];

    const missingIds = requiredIds.filter((id) => !$(id));

    if (missingIds.length) {
        console.error("NETROUTE Lab: Missing HTML elements:", missingIds);
        return;
    }

    const SVG_NS = "http://www.w3.org/2000/svg";

    const BASE_POSITIONS = {
        R1: { x: 105, y: 105 },
        R2: { x: 300, y: 75 },
        R3: { x: 505, y: 100 },
        R4: { x: 695, y: 170 },
        R5: { x: 115, y: 355 },
        R6: { x: 315, y: 410 },
        R7: { x: 520, y: 360 },
        R8: { x: 690, y: 400 }
    };

    const BASE_LINKS = [
        { a: "R1", b: "R2", cost: 4 },
        { a: "R1", b: "R5", cost: 2 },
        { a: "R2", b: "R3", cost: 3 },
        { a: "R2", b: "R6", cost: 5 },
        { a: "R3", b: "R4", cost: 2 },
        { a: "R3", b: "R7", cost: 4 },
        { a: "R4", b: "R8", cost: 3 },
        { a: "R5", b: "R6", cost: 2 },
        { a: "R6", b: "R7", cost: 3 },
        { a: "R7", b: "R8", cost: 2 },
        { a: "R5", b: "R7", cost: 7 }
    ];

    const state = {
        routerCount: 8,
        routers: [],
        links: [],
        failedRouters: new Set(),
        brokenLinks: new Set(),
        selectedRouter: null,
        source: "R1",
        destination: "R8",
        route: [],
        delivered: 0,
        zoom: 1,
        packetAnimation: null,
        animationTimers: [],
        simulationNumber: 0
    };

    function svgElement(tag, attributes = {}, textContent = null) {
        const node = document.createElementNS(SVG_NS, tag);

        Object.entries(attributes).forEach(([key, value]) => {
            node.setAttribute(key, String(value));
        });

        if (textContent !== null) {
            node.textContent = textContent;
        }

        return node;
    }

    function linkKey(a, b) {
        return [a, b].sort().join("-");
    }

    function getRouter(id) {
        return state.routers.find((router) => router.id === id);
    }

    function getLink(a, b) {
        return state.links.find(
            (link) =>
                (link.a === a && link.b === b) ||
                (link.a === b && link.b === a)
        );
    }

    function isLinkAvailable(link) {
        return (
            !state.brokenLinks.has(linkKey(link.a, link.b)) &&
            !state.failedRouters.has(link.a) &&
            !state.failedRouters.has(link.b)
        );
    }

    function activeLinks() {
        return state.links.filter(isLinkAvailable);
    }

    function neighbors(routerId) {
        return activeLinks()
            .filter((link) => link.a === routerId || link.b === routerId)
            .map((link) => ({
                id: link.a === routerId ? link.b : link.a,
                cost: link.cost,
                link
            }));
    }

    function logEvent(message, type = "info") {
        const empty = elements.eventLog.querySelector(".log-empty");
        if (empty) empty.remove();

        const entry = document.createElement("div");
        entry.className = `log-entry ${type}`;

        const time = document.createElement("span");
        time.className = "log-time";
        time.textContent = new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        const messageNode = document.createElement("span");
        messageNode.className = "log-message";
        messageNode.textContent = message;

        entry.append(time, messageNode);
        elements.eventLog.prepend(entry);

        while (elements.eventLog.children.length > 80) {
            elements.eventLog.lastElementChild.remove();
        }
    }

    function setSummary(title, message, type = "info") {
        elements.routeSummary.className = `route-summary ${type}`;

        const icon = elements.routeSummary.querySelector(".summary-icon");
        const strong = elements.routeSummary.querySelector("strong");
        const paragraph = elements.routeSummary.querySelector("p");

        if (icon) {
            icon.textContent =
                type === "success" ? "✓" :
                type === "error" ? "!" : "↗";
        }

        if (strong) strong.textContent = title;
        if (paragraph) paragraph.textContent = message;
    }

    function updateMetrics() {
        elements.routerCount.textContent = state.routers.length;
        elements.linkCount.textContent = activeLinks().length;
        elements.deliveredCount.textContent = state.delivered;
        elements.failedCount.textContent = state.failedRouters.size;
    }

    function initializeNetwork(count) {
        cancelPacketAnimation();

        state.routerCount = count;
        state.routers = Object.keys(BASE_POSITIONS)
            .slice(0, count)
            .map((id) => ({
                id,
                x: BASE_POSITIONS[id].x,
                y: BASE_POSITIONS[id].y
            }));

        const routerIds = new Set(state.routers.map((router) => router.id));

        state.links = BASE_LINKS
            .filter((link) => routerIds.has(link.a) && routerIds.has(link.b))
            .map((link) => ({ ...link }));

        state.failedRouters.clear();
        state.brokenLinks.clear();
        state.route = [];
        state.selectedRouter = null;

        const availableIds = state.routers.map((router) => router.id);

        if (!availableIds.includes(state.source)) {
            state.source = availableIds[0];
        }

        if (
            !availableIds.includes(state.destination) ||
            state.destination === state.source
        ) {
            state.destination = availableIds[availableIds.length - 1];
        }

        renderAll();
        updateMetrics();

        logEvent(`Loaded network with ${count} routers and ${state.links.length} links.`);
        setSummary(
            "Network ready",
            "Choose a source, destination, and routing algorithm to simulate a packet."
        );
    }

    function renderAll() {
        renderSelects();
        renderLinks();
        renderRouters();
        renderRouterDetails(state.selectedRouter);
        renderFailureLinkOptions();
    }

    function renderSelects() {
        const routerIds = state.routers.map((router) => router.id);

        const previousSource = state.source;
        const previousDestination = state.destination;
        const previousFailureRouter = elements.failureRouterSelect
            ? elements.failureRouterSelect.value
            : "";

        fillSelect(elements.sourceSelect, routerIds, previousSource, (id) =>
            state.failedRouters.has(id)
        );

        fillSelect(elements.destinationSelect, routerIds, previousDestination, (id) =>
            state.failedRouters.has(id)
        );

        if (elements.failureRouterSelect) {
            // Failed routers remain available here so they can be repaired.
            fillSelect(
                elements.failureRouterSelect,
                routerIds,
                previousFailureRouter,
                () => false
            );
        }

        state.source = elements.sourceSelect.value;
        state.destination = elements.destinationSelect.value;
    }

    function fillSelect(select, values, preferredValue, isDisabled) {
        if (!select) return;

        const previous = values.includes(preferredValue)
            ? preferredValue
            : values[0];

        select.replaceChildren();

        values.forEach((value) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = state.failedRouters.has(value)
                ? `${value} (Failed)`
                : value;
            option.disabled = Boolean(isDisabled(value));
            select.appendChild(option);
        });

        if (
            previous &&
            values.includes(previous) &&
            !isDisabled(previous)
        ) {
            select.value = previous;
        } else {
            const firstUsable = values.find((value) => !isDisabled(value));
            if (firstUsable) select.value = firstUsable;
        }
    }

    function renderFailureLinkOptions() {
        if (!elements.failureLinkSelect) return;

        const previous = elements.failureLinkSelect.value;
        elements.failureLinkSelect.replaceChildren();

        state.links.forEach((link) => {
            const key = linkKey(link.a, link.b);
            const broken = state.brokenLinks.has(key);
            const option = document.createElement("option");

            option.value = key;
            option.textContent =
                `${link.a} ↔ ${link.b} · Cost ${link.cost}` +
                (broken ? " (Broken)" : "");

            elements.failureLinkSelect.appendChild(option);
        });

        if (state.links.some((link) => linkKey(link.a, link.b) === previous)) {
            elements.failureLinkSelect.value = previous;
        }
    }

    function renderLinks() {
        elements.linksLayer.replaceChildren();

        state.links.forEach((link) => {
            const from = getRouter(link.a);
            const to = getRouter(link.b);

            if (!from || !to) return;

            const key = linkKey(link.a, link.b);
            const broken = !isLinkAvailable(link);
            const isBrokenManually = state.brokenLinks.has(key);
            const isRouteLink = state.route.some(
                (step, index) =>
                    index < state.route.length - 1 &&
                    linkKey(step, state.route[index + 1]) === key
            );

            const group = svgElement("g", {
                class: "link-group",
                "data-link": key
            });

            const line = svgElement("line", {
                x1: from.x,
                y1: from.y,
                x2: to.x,
                y2: to.y,
                class:
                    "network-link" +
                    (isRouteLink && !broken ? " route-link" : "") +
                    (broken ? " failed-link" : ""),
                "data-link": key
            });

            group.appendChild(line);

            const middleX = (from.x + to.x) / 2;
            const middleY = (from.y + to.y) / 2;

            const label = svgElement("text", {
                x: middleX,
                y: middleY - 8,
                class:
                    "link-cost" +
                    (isRouteLink && !broken ? " route-cost" : "") +
                    (broken ? " failed-cost" : "")
            }, String(link.cost));

            group.appendChild(label);
            elements.linksLayer.appendChild(group);
        });
    }

    function renderRouters() {
        elements.routersLayer.replaceChildren();

        // Computer endpoints are visual aids only. Routing still starts
        // and ends at routers in this frontend demonstration.
        renderComputerEndpoint(35, 230, "SOURCE PC", "R1");
        renderComputerEndpoint(765, 250, "DESTINATION PC", "R8");

        state.routers.forEach((router) => {
            const failed = state.failedRouters.has(router.id);
            const isSelected = state.selectedRouter === router.id;
            const isSource = state.source === router.id;
            const isDestination = state.destination === router.id;

            const classes = [
                "router-node",
                failed ? "failed" : "",
                isSelected ? "selected" : "",
                isSource ? "source-node" : "",
                isDestination ? "destination-node" : ""
            ].filter(Boolean).join(" ");

            const group = svgElement("g", {
                class: classes,
                transform: `translate(${router.x}, ${router.y})`,
                tabindex: "0",
                role: "button",
                "aria-label": `${router.id}${failed ? ", failed" : ""}`,
                "data-router": router.id
            });

            // Router antennas
            group.appendChild(svgElement("line", {
                x1: -13, y1: -14, x2: -18, y2: -27,
                class: "router-antenna"
            }));

            group.appendChild(svgElement("line", {
                x1: 13, y1: -14, x2: 18, y2: -27,
                class: "router-antenna"
            }));

            group.appendChild(svgElement("circle", {
                cx: -18, cy: -28, r: 2.7,
                fill: failed ? "#fb7185" : "#818cf8"
            }));

            group.appendChild(svgElement("circle", {
                cx: 18, cy: -28, r: 2.7,
                fill: failed ? "#fb7185" : "#818cf8"
            }));

            // Router body
            group.appendChild(svgElement("rect", {
                x: -29, y: -17, width: 58, height: 34,
                rx: 7, class: "router-shell"
            }));

            group.appendChild(svgElement("rect", {
                x: -25, y: -13, width: 50, height: 8,
                rx: 3, class: "router-top"
            }));

            // Ports
            [-17, -7, 3, 13].forEach((x) => {
                group.appendChild(svgElement("rect", {
                    x, y: 7, width: 6, height: 4, rx: 1,
                    class: "router-port"
                }));
            });

            // Status indicator
            group.appendChild(svgElement("circle", {
                cx: 20, cy: -9, r: 2.5,
                class: "router-led"
            }));

            group.appendChild(svgElement("text", {
                x: 0, y: 37, class: "router-label"
            }, router.id));

            const status = failed
                ? "FAILED"
                : isSource
                    ? "SOURCE"
                    : isDestination
                        ? "DESTINATION"
                        : "ONLINE";

            group.appendChild(svgElement("text", {
                x: 0, y: 50, class: "router-sub-label"
            }, status));

            group.addEventListener("click", () => selectRouter(router.id));

            group.addEventListener("keydown", (event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    selectRouter(router.id);
                }
            });

            elements.routersLayer.appendChild(group);
        });
    }

    function renderComputerEndpoint(x, y, label, routerId) {
        const group = svgElement("g", {
            class: "computer-endpoint",
            "aria-label": `${label}, illustrative endpoint`
        });

        const target = getRouter(routerId);

        if (target) {
            const startX = x < target.x ? x + 15 : x - 15;

            group.appendChild(svgElement("line", {
                x1: startX,
                y1: y,
                x2: target.x + (x < target.x ? -30 : 30),
                y2: target.y,
                class: "endpoint-link"
            }));
        }

        group.appendChild(svgElement("rect", {
            x: x - 14, y: y - 12,
            width: 28, height: 21,
            rx: 3, class: "computer-icon"
        }));

        group.appendChild(svgElement("rect", {
            x: x - 10, y: y - 8,
            width: 20, height: 13,
            rx: 1, class: "computer-screen"
        }));

        group.appendChild(svgElement("path", {
            d: `M ${x} ${y + 9} v 5 m -6 0 h 12`,
            class: "computer-stand"
        }));

        group.appendChild(svgElement("text", {
            x, y: y + 29, class: "endpoint-label"
        }, label));

        elements.routersLayer.appendChild(group);
    }

    function selectRouter(routerId) {
        state.selectedRouter = routerId;
        renderRouters();
        renderRouterDetails(routerId);
    }

    function renderRouterDetails(routerId) {
        if (!elements.routerDetails) return;

        if (!routerId) {
            elements.routerDetails.innerHTML =
                '<p class="empty-state">Select a router in the network to see its details.</p>';
            return;
        }

        const router = getRouter(routerId);
        if (!router) return;

        const failed = state.failedRouters.has(routerId);

        const availableNeighbors = neighbors(routerId);
        const allNeighbors = state.links
            .filter((link) => link.a === routerId || link.b === routerId)
            .map((link) => {
                const other = link.a === routerId ? link.b : link.a;
                return {
                    id: other,
                    cost: link.cost,
                    active: isLinkAvailable(link)
                };
            });

        const statusText = failed ? "Failed" : "Operational";

        const neighborsMarkup = allNeighbors.length
            ? allNeighbors.map((neighbor) => `
                <span class="neighbor-chip ${neighbor.active ? "" : "inactive"}">
                    ${neighbor.id} · ${neighbor.cost}
                    ${neighbor.active ? "" : " · Offline"}
                </span>
            `).join("")
            : '<span class="empty-state">No connected routers.</span>';

        elements.routerDetails.innerHTML = `
            <div class="router-detail-top">
                <div class="router-detail-icon" aria-hidden="true">⌘</div>
                <div>
                    <h3>${router.id}</h3>
                    <p>Network routing device</p>
                    <span class="device-status ${failed ? "failed" : ""}">
                        ${statusText}
                    </span>
                </div>
            </div>

            <div class="router-detail-stats">
                <div class="router-detail-stat">
                    <span>Total links</span>
                    <strong>${allNeighbors.length}</strong>
                </div>
                <div class="router-detail-stat">
                    <span>Active links</span>
                    <strong>${availableNeighbors.length}</strong>
                </div>
                <div class="router-detail-stat">
                    <span>Route member</span>
                    <strong>${state.route.includes(routerId) ? "Yes" : "No"}</strong>
                </div>
            </div>

            <p class="neighbor-heading">CONNECTED ROUTERS</p>
            <div class="neighbor-list">${neighborsMarkup}</div>
        `;
    }

    function findBFS(source, destination) {
        if (
            state.failedRouters.has(source) ||
            state.failedRouters.has(destination)
        ) {
            return null;
        }

        const queue = [source];
        const previous = new Map([[source, null]]);

        while (queue.length) {
            const current = queue.shift();

            if (current === destination) break;

            neighbors(current).forEach(({ id }) => {
                if (!previous.has(id)) {
                    previous.set(id, current);
                    queue.push(id);
                }
            });
        }

        if (!previous.has(destination)) return null;

        const path = [];
        let current = destination;

        while (current !== null) {
            path.unshift(current);
            current = previous.get(current);
        }

        return path;
    }

    function findDijkstra(source, destination) {
        if (
            state.failedRouters.has(source) ||
            state.failedRouters.has(destination)
        ) {
            return null;
        }

        const distances = new Map();
        const previous = new Map();
        const unvisited = new Set(state.routers.map((router) => router.id));

        state.routers.forEach((router) => {
            distances.set(router.id, Infinity);
        });

        distances.set(source, 0);

        while (unvisited.size) {
            let current = null;
            let bestDistance = Infinity;

            unvisited.forEach((id) => {
                const distance = distances.get(id);

                if (distance < bestDistance) {
                    bestDistance = distance;
                    current = id;
                }
            });

            if (current === null || bestDistance === Infinity) break;
            if (current === destination) break;

            unvisited.delete(current);

            neighbors(current).forEach(({ id, cost }) => {
                if (!unvisited.has(id)) return;

                const candidate = bestDistance + cost;

                if (candidate < distances.get(id)) {
                    distances.set(id, candidate);
                    previous.set(id, current);
                }
            });
        }

        if (source !== destination && !previous.has(destination)) {
            return null;
        }

        const path = [];
        let current = destination;

        while (current !== undefined) {
            path.unshift(current);

            if (current === source) break;

            current = previous.get(current);
        }

        if (path[0] !== source) return null;

        return path;
    }

    function calculatePath(algorithm, source, destination) {
        // This is the Phase 2 browser demo. Adaptive routing is represented
        // by shortest-path recalculation over currently active links.
        if (algorithm === "bfs") {
            return findBFS(source, destination);
        }

        return findDijkstra(source, destination);
    }

    function calculatePathCost(path) {
        if (!path || path.length < 2) return path ? 0 : Infinity;

        let cost = 0;

        for (let i = 0; i < path.length - 1; i++) {
            const link = getLink(path[i], path[i + 1]);

            if (!link || !isLinkAvailable(link)) {
                return Infinity;
            }

            cost += link.cost;
        }

        return cost;
    }

    function describePath(path) {
        return path ? path.join(" → ") : "No available route";
    }

    function simulateRoute() {
        cancelPacketAnimation();

        state.source = elements.sourceSelect.value;
        state.destination = elements.destinationSelect.value;

        const algorithm = elements.algorithmSelect.value;
        const priority = elements.prioritySelect
            ? elements.prioritySelect.value
            : "normal";

        if (state.source === state.destination) {
            setSummary(
                "Choose different routers",
                "The source and destination must be different.",
                "error"
            );
            logEvent("Simulation stopped: source and destination are identical.", "warning");
            return;
        }

        if (
            state.failedRouters.has(state.source) ||
            state.failedRouters.has(state.destination)
        ) {
            setSummary(
                "Endpoint unavailable",
                "Repair the failed source or destination router first.",
                "error"
            );
            return;
        }

        const path = calculatePath(algorithm, state.source, state.destination);

        if (!path) {
            state.route = [];
            renderLinks();
            renderRouters();

            setSummary(
                "No route available",
                "The destination cannot be reached using the current active links.",
                "error"
            );

            logEvent(
                `No route found from ${state.source} to ${state.destination}.`,
                "error"
            );

            return;
        }

        state.route = path;

        const cost = calculatePathCost(path);
        const hops = Math.max(0, path.length - 1);

        renderLinks();
        renderRouters();
        renderRouterDetails(state.selectedRouter);

        const algorithmName = getAlgorithmName(algorithm);

        setSummary(
            "Route calculated",
            `${describePath(path)} · ${hops} hop(s) · Cost ${cost} · ${algorithmName} · ${priority} priority`
        );

        logEvent(
            `${algorithmName}: ${describePath(path)} (cost ${cost}, ${hops} hops, ${priority} priority).`,
            "success"
        );

        state.simulationNumber++;
        animatePackets(path);
    }

    function getAlgorithmName(algorithm) {
        const names = {
            bfs: "BFS",
            dijkstra: "Dijkstra",
            adaptive: "Adaptive Routing Demo"
        };

        return names[algorithm] || algorithm;
    }

    function animatePackets(path) {
        const points = path.map((id) => getRouter(id)).filter(Boolean);

        if (points.length < 2) {
            state.delivered++;
            updateMetrics();
            return;
        }

        const packet = svgElement("circle", {
            cx: points[0].x,
            cy: points[0].y,
            r: 6,
            class: "packet-dot"
        });

        elements.packetsLayer.replaceChildren(packet);

        const duration = elements.prioritySelect &&
            elements.prioritySelect.value === "critical"
            ? 260
            : elements.prioritySelect &&
              elements.prioritySelect.value === "high"
                ? 380
                : 520;

        let index = 0;

        function moveNext() {
            if (index >= points.length - 1) {
                elements.packetsLayer.replaceChildren();
                state.delivered++;
                updateMetrics();

                setSummary(
                    "Packet delivered",
                    `Packet reached ${path[path.length - 1]} successfully in ${path.length - 1} hop(s).`,
                    "success"
                );

                logEvent(
                    `Packet delivered successfully at ${path[path.length - 1]}.`,
                    "success"
                );

                renderRouterDetails(state.selectedRouter);
                return;
            }

            const from = points[index];
            const to = points[index + 1];
            const started = performance.now();

            function frame(now) {
                if (!packet.isConnected) return;

                const progress = Math.min((now - started) / duration, 1);

                packet.setAttribute(
                    "cx",
                    from.x + (to.x - from.x) * progress
                );

                packet.setAttribute(
                    "cy",
                    from.y + (to.y - from.y) * progress
                );

                if (progress < 1) {
                    state.packetAnimation = requestAnimationFrame(frame);
                } else {
                    index++;
                    moveNext();
                }
            }

            state.packetAnimation = requestAnimationFrame(frame);
        }

        moveNext();
    }

    function cancelPacketAnimation() {
        if (state.packetAnimation !== null) {
            cancelAnimationFrame(state.packetAnimation);
            state.packetAnimation = null;
        }

        state.animationTimers.forEach(clearTimeout);
        state.animationTimers = [];

        if (elements.packetsLayer) {
            elements.packetsLayer.replaceChildren();
        }
    }

    function failSelectedRouter() {
        if (!elements.failureRouterSelect) return;

        const routerId = elements.failureRouterSelect.value;

        if (!routerId) return;

        if (state.failedRouters.has(routerId)) {
            logEvent(`${routerId} is already failed.`, "warning");
            return;
        }

        state.failedRouters.add(routerId);
        state.route = [];

        if (state.source === routerId) {
            state.source = state.routers.find(
                (router) => !state.failedRouters.has(router.id)
            )?.id || state.source;
        }

        if (state.destination === routerId) {
            state.destination = [...state.routers].reverse().find(
                (router) => !state.failedRouters.has(router.id)
            )?.id || state.destination;
        }

        renderAll();
        updateMetrics();

        logEvent(`${routerId} failed. Routes through this router are unavailable.`, "error");

        setSummary(
            "Router failure simulated",
            `${routerId} is offline. Run the simulation again to calculate a route around the failure.`,
            "error"
        );
    }

    function repairSelectedRouter() {
        if (!elements.failureRouterSelect) return;

        const routerId = elements.failureRouterSelect.value;

        if (!routerId) return;

        if (!state.failedRouters.has(routerId)) {
            logEvent(`${routerId} is already operational.`, "warning");
            return;
        }

        state.failedRouters.delete(routerId);
        state.route = [];

        renderAll();
        updateMetrics();

        logEvent(`${routerId} repaired and returned to the network.`, "success");

        setSummary(
            "Router repaired",
            `${routerId} is back online. Run a new simulation to calculate the route.`,
            "success"
        );
    }

    function breakSelectedLink() {
        if (!elements.failureLinkSelect) return;

        const key = elements.failureLinkSelect.value;
        if (!key) return;

        if (state.brokenLinks.has(key)) {
            logEvent(`Link ${key.replace("-", " ↔ ")} is already broken.`, "warning");
            return;
        }

        state.brokenLinks.add(key);
        state.route = [];

        renderAll();
        updateMetrics();

        logEvent(`Link ${key.replace("-", " ↔ ")} broken.`, "error");

        setSummary(
            "Link failure simulated",
            "The connection is offline. Run the simulation to search for an alternative route.",
            "error"
        );
    }

    function restoreSelectedLink() {
        if (!elements.failureLinkSelect) return;

        const key = elements.failureLinkSelect.value;
        if (!key) return;

        if (!state.brokenLinks.has(key)) {
            logEvent(`Link ${key.replace("-", " ↔ ")} is already active.`, "warning");
            return;
        }

        state.brokenLinks.delete(key);
        state.route = [];

        renderAll();
        updateMetrics();

        logEvent(`Link ${key.replace("-", " ↔ ")} restored.`, "success");

        setSummary(
            "Link restored",
            "The connection is active again. Run a new simulation to calculate the route.",
            "success"
        );
    }

    function compareAlgorithms() {
        const source = elements.sourceSelect.value;
        const destination = elements.destinationSelect.value;

        if (source === destination) {
            setSummary(
                "Choose different routers",
                "Select different source and destination routers before comparing.",
                "error"
            );
            return;
        }

        const algorithms = ["bfs", "dijkstra", "adaptive"];
        elements.comparisonResults.replaceChildren();

        algorithms.forEach((algorithm) => {
            const path = calculatePath(algorithm, source, destination);
            const cost = calculatePathCost(path);
            const name = getAlgorithmName(algorithm);

            const row = document.createElement("div");
            row.className = "comparison-row";

            const top = document.createElement("div");
            top.className = "comparison-row-top";

            const title = document.createElement("strong");
            title.textContent = name;

            const costNode = document.createElement("span");
            costNode.className = "comparison-cost";
            costNode.textContent = path ? `Cost: ${cost}` : "No route";

            top.append(title, costNode);

            const description = document.createElement("p");
            description.textContent = path
                ? `${describePath(path)} · ${path.length - 1} hop(s)`
                : "No available path under the current network conditions.";

            row.append(top, description);
            elements.comparisonResults.appendChild(row);
        });

        elements.comparisonPanel.classList.remove("hidden");

        logEvent(
            `Compared BFS, Dijkstra, and Adaptive Routing Demo from ${source} to ${destination}.`
        );
    }

    function resetNetwork() {
        cancelPacketAnimation();

        state.failedRouters.clear();
        state.brokenLinks.clear();
        state.route = [];
        state.delivered = 0;
        state.selectedRouter = null;
        state.zoom = 1;
        state.source = "R1";
        state.destination = "R8";

        if (elements.topologySelect) {
            state.routerCount = Number(elements.topologySelect.value) || 8;
        }

        if (elements.comparisonPanel) {
            elements.comparisonPanel.classList.add("hidden");
        }

        if (elements.networkViewport) {
            elements.networkViewport.style.transform = "scale(1)";
        }

        initializeNetwork(state.routerCount);

        logEvent("Network reset to its initial state.");
    }

    function setZoom(nextZoom) {
        state.zoom = Math.min(1.5, Math.max(0.65, nextZoom));

        if (elements.networkViewport) {
            elements.networkViewport.style.transform = `scale(${state.zoom})`;
        }

        if (elements.zoomResetBtn) {
            elements.zoomResetBtn.textContent =
                `${Math.round(state.zoom * 100)}%`;
        }
    }

    elements.simulateBtn.addEventListener("click", simulateRoute);
    elements.resetBtn.addEventListener("click", resetNetwork);

    if (elements.failRouterBtn) {
        elements.failRouterBtn.addEventListener("click", failSelectedRouter);
    }

    if (elements.repairRouterBtn) {
        elements.repairRouterBtn.addEventListener("click", repairSelectedRouter);
    }

    if (elements.breakLinkBtn) {
        elements.breakLinkBtn.addEventListener("click", breakSelectedLink);
    }

    if (elements.restoreLinkBtn) {
        elements.restoreLinkBtn.addEventListener("click", restoreSelectedLink);
    }

    if (elements.compareBtn) {
        elements.compareBtn.addEventListener("click", compareAlgorithms);
    }

    if (elements.closeComparisonBtn) {
        elements.closeComparisonBtn.addEventListener("click", () => {
            elements.comparisonPanel.classList.add("hidden");
        });
    }

    if (elements.clearLogBtn) {
        elements.clearLogBtn.addEventListener("click", () => {
            elements.eventLog.replaceChildren();

            const empty = document.createElement("p");
            empty.className = "log-empty";
            empty.textContent = "Your simulation events will appear here.";

            elements.eventLog.appendChild(empty);
        });
    }

    if (elements.zoomInBtn) {
        elements.zoomInBtn.addEventListener("click", () => {
            setZoom(state.zoom + 0.1);
        });
    }

    if (elements.zoomOutBtn) {
        elements.zoomOutBtn.addEventListener("click", () => {
            setZoom(state.zoom - 0.1);
        });
    }

    if (elements.zoomResetBtn) {
        elements.zoomResetBtn.addEventListener("click", () => {
            setZoom(1);
        });
    }

    elements.topologySelect.addEventListener("change", () => {
        const count = Number(elements.topologySelect.value);

        if ([6, 7, 8].includes(count)) {
            initializeNetwork(count);
        }
    });

    elements.sourceSelect.addEventListener("change", () => {
        state.source = elements.sourceSelect.value;

        if (state.source === state.destination) {
            const alternative = state.routers.find(
                (router) =>
                    router.id !== state.source &&
                    !state.failedRouters.has(router.id)
            );

            if (alternative) {
                state.destination = alternative.id;
            }
        }

        state.route = [];
        renderSelects();
        renderLinks();
        renderRouters();
        renderRouterDetails(state.selectedRouter);
    });

    elements.destinationSelect.addEventListener("change", () => {
        state.destination = elements.destinationSelect.value;

        if (state.destination === state.source) {
            const alternative = state.routers.find(
                (router) =>
                    router.id !== state.destination &&
                    !state.failedRouters.has(router.id)
            );

            if (alternative) {
                state.source = alternative.id;
            }
        }

        state.route = [];
        renderSelects();
        renderLinks();
        renderRouters();
        renderRouterDetails(state.selectedRouter);
    });

    initializeNetwork(8);
});
