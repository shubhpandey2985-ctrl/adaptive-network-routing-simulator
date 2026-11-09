const mobileMenuBtn = document.getElementById("mobileMenuBtn");

if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener("click", () => {
        document.querySelector(".main-nav")?.classList.toggle("open");
    });
}


/* Learning progress */

const modules = [...document.querySelectorAll(".learn-module")];
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

function updateProgress() {
    const viewportPoint = window.innerHeight * 0.45;

    let current = 1;

    modules.forEach((module, index) => {
        if (module.getBoundingClientRect().top <= viewportPoint) {
            current = index + 1;
        }
    });

    const percent = Math.min((current / modules.length) * 100, 100);

    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }

    if (progressText) {
        progressText.textContent =
            `${String(Math.min(current, 7)).padStart(2, "0")} / 07`;
    }
}

window.addEventListener("scroll", updateProgress);
updateProgress();


/* Module 1: network concepts */

const conceptPanel = document.getElementById("conceptPanel");
const networkNodes = document.querySelectorAll(".network-node");
const networkHotspots = document.querySelectorAll(".network-hotspot");
const networkEdges = document.querySelectorAll(".network-edge");

const concepts = {
    router: {
        kicker: "ROUTER",
        title: "The decision point",
        text: "A router forwards packets toward their destination by considering available routes through the network."
    },

    link: {
        kicker: "LINK",
        title: "The connection",
        text: "A link connects two routers. In a routing model, a link can have properties such as cost, latency or status."
    },

    packet: {
        kicker: "PACKET",
        title: "The traveller",
        text: "A packet is a unit of data that moves through the network from a source toward a destination."
    },

    destination: {
        kicker: "DESTINATION",
        title: "Where we're going",
        text: "The destination is the endpoint the packet is trying to reach."
    }
};

function showConcept(type) {
    const concept = concepts[type];

    if (!conceptPanel || !concept) {
        return;
    }

    conceptPanel.innerHTML = `
        <span class="concept-kicker">${concept.kicker}</span>
        <h3>${concept.title}</h3>
        <p>${concept.text}</p>
    `;

    networkNodes.forEach(node => {
        node.classList.toggle(
            "active",
            node.dataset.concept === type
        );
    });

    networkEdges.forEach(edge => {
        const highlighted = type === "link";

        edge.classList.toggle("highlight", highlighted);

        edge.style.stroke = highlighted
            ? "#00f5d4"
            : "";

        edge.style.strokeWidth = highlighted
            ? "4"
            : "";

        edge.style.filter = highlighted
            ? "drop-shadow(0 0 7px #00f5d4)"
            : "";

        edge.style.opacity = highlighted
            ? "1"
            : "";
    });
}


/* Module 1 packet animation */

const conceptNetwork = document.getElementById("basicNetwork");
const conceptSvg = conceptNetwork?.querySelector("svg");

let conceptPacket = null;
let conceptPacketRunning = false;
let conceptPacketFrame = null;

const conceptPacketRoute = [
    { x: 120, y: 215 },
    { x: 300, y: 95 },
    { x: 500, y: 145 },
    { x: 690, y: 215 }
];

function createConceptPacket() {
    if (!conceptSvg) {
        return null;
    }

    if (conceptPacket) {
        conceptPacket.remove();
    }

    conceptPacket = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
    );

    conceptPacket.setAttribute("r", "7");
    conceptPacket.setAttribute(
        "cx",
        conceptPacketRoute[0].x
    );
    conceptPacket.setAttribute(
        "cy",
        conceptPacketRoute[0].y
    );

    conceptPacket.classList.add("learning-packet");
    conceptPacket.style.pointerEvents = "none";

    conceptSvg.appendChild(conceptPacket);

    return conceptPacket;
}

function animateConceptPacket(from, to, duration) {
    return new Promise(resolve => {
        const start = performance.now();

        function frame(now) {
            if (!conceptPacketRunning || !conceptPacket) {
                resolve();
                return;
            }

            const progress = Math.min(
                (now - start) / duration,
                1
            );

            const eased =
                progress < 0.5
                    ? 2 * progress * progress
                    : 1 -
                      Math.pow(-2 * progress + 2, 2) / 2;

            const x =
                from.x +
                (to.x - from.x) * eased;

            const y =
                from.y +
                (to.y - from.y) * eased;

            conceptPacket.setAttribute("cx", x);
            conceptPacket.setAttribute("cy", y);

            if (progress < 1) {
                conceptPacketFrame =
                    requestAnimationFrame(frame);
            } else {
                resolve();
            }
        }

        conceptPacketFrame =
            requestAnimationFrame(frame);
    });
}

async function runConceptPacketLoop() {
    if (!conceptPacket || !conceptPacketRunning) {
        return;
    }

    while (conceptPacketRunning) {
        for (
            let i = 0;
            i < conceptPacketRoute.length - 1;
            i++
        ) {
            if (!conceptPacketRunning) {
                return;
            }

            await animateConceptPacket(
                conceptPacketRoute[i],
                conceptPacketRoute[i + 1],
                1100
            );

            await new Promise(resolve =>
                setTimeout(resolve, 180)
            );
        }

        for (
            let i = conceptPacketRoute.length - 1;
            i > 0;
            i--
        ) {
            if (!conceptPacketRunning) {
                return;
            }

            await animateConceptPacket(
                conceptPacketRoute[i],
                conceptPacketRoute[i - 1],
                1100
            );

            await new Promise(resolve =>
                setTimeout(resolve, 180)
            );
        }
    }
}

function startConceptPacketAnimation() {
    if (conceptPacketRunning) {
        return;
    }

    const packet = createConceptPacket();

    if (!packet) {
        return;
    }

    conceptPacketRunning = true;

    packet.setAttribute(
        "cx",
        conceptPacketRoute[0].x
    );

    packet.setAttribute(
        "cy",
        conceptPacketRoute[0].y
    );

    runConceptPacketLoop();
}

function stopConceptPacketAnimation() {
    conceptPacketRunning = false;

    if (conceptPacketFrame) {
        cancelAnimationFrame(conceptPacketFrame);
        conceptPacketFrame = null;
    }

    if (conceptPacket) {
        conceptPacket.remove();
        conceptPacket = null;
    }
}

networkNodes.forEach(node => {
    node.addEventListener("click", () => {
        stopConceptPacketAnimation();

        showConcept(
            node.dataset.concept || "router"
        );
    });
});

networkHotspots.forEach(hotspot => {
    hotspot.addEventListener("click", () => {
        const type =
            hotspot.dataset.concept ||
            hotspot.dataset.type;

        if (type === "packet") {
            showConcept("packet");
            startConceptPacketAnimation();
            return;
        }

        stopConceptPacketAnimation();
        showConcept(type);
    });
});


/* Module 2: packet journey */

const playPacket = document.getElementById("playPacket");
const learningPacket = document.getElementById("learningPacket");

const packetStatus =
    document.getElementById("packetStatus");

const packetTitle =
    document.getElementById("packetTitle");

const packetDescription =
    document.getElementById("packetDescription");

const packetStops = [
    {
        x: 90,
        y: 150,
        status: "SOURCE",
        title: "I'm leaving R1.",
        description:
            "The packet starts at its source and needs to reach R6."
    },

    {
        x: 270,
        y: 80,
        status: "HOP 01",
        title: "R2 received me.",
        description:
            "This router is one hop along the selected path."
    },

    {
        x: 480,
        y: 150,
        status: "HOP 02",
        title: "Another hop.",
        description:
            "The packet continues through the network toward its destination."
    },

    {
        x: 700,
        y: 150,
        status: "DELIVERED",
        title: "Made it to R6.",
        description:
            "The packet reached its destination."
    }
];

let packetPlaying = false;

function wait(ms) {
    return new Promise(resolve =>
        setTimeout(resolve, ms)
    );
}

async function playPacketJourney() {
    if (packetPlaying || !learningPacket) {
        return;
    }

    packetPlaying = true;

    playPacket.disabled = true;

    learningPacket.style.transition =
        "cx 0.9s cubic-bezier(.2,.7,.2,1), cy 0.9s cubic-bezier(.2,.7,.2,1)";

    for (const stop of packetStops) {
        learningPacket.setAttribute(
            "cx",
            stop.x
        );

        learningPacket.setAttribute(
            "cy",
            stop.y
        );

        packetStatus.textContent =
            stop.status;

        packetTitle.textContent =
            stop.title;

        packetDescription.textContent =
            stop.description;

        await wait(1000);
    }

    learningPacket.style.transition = "none";

    playPacket.disabled = false;
    packetPlaying = false;
}

if (playPacket) {
    playPacket.addEventListener(
        "click",
        playPacketJourney
    );
}


/* Module 3: path comparison */

const pathOptions =
    document.querySelectorAll(".path-option");

const pathMessage =
    document.getElementById("pathMessage");

const pathEdges =
    document.querySelectorAll(".path-edge");

function highlightSelectedPath(path) {
    pathEdges.forEach(edge => {
        const isTop =
            !edge.classList.contains("alternate");

        const selected =
            (path === "top" && isTop) ||
            (path === "bottom" && !isTop);

        edge.classList.toggle(
            "active",
            selected
        );

        edge.style.strokeWidth =
            selected ? "5" : "";

        edge.style.filter =
            selected
                ? "drop-shadow(0 0 8px #00f5d4)"
                : "";

        edge.style.opacity =
            selected ? "1" : "0.28";
    });
}

function selectPath(option) {
    if (!option) {
        return;
    }

    pathOptions.forEach(item => {
        item.classList.remove("active");
    });

    option.classList.add("active");

    const path = option.dataset.path;

    highlightSelectedPath(path);

    if (pathMessage) {
        if (path === "top") {
            pathMessage.textContent =
                "Path A costs 2 + 2 + 1 = 5. The route is currently tied with Path B.";
        } else {
            pathMessage.textContent =
                "Path B costs 3 + 1 + 1 = 5. It currently has the same total cost as Path A.";
        }
    }
}

pathOptions.forEach(option => {
    option.addEventListener(
        "click",
        () => selectPath(option)
    );
});

const defaultPath =
    [...pathOptions].find(option =>
        option.classList.contains("active")
    ) || pathOptions[0];

selectPath(defaultPath);

/* Module 4: Failure recovery */

const failRouter = document.getElementById("failRouter");
const resetFailure = document.getElementById("resetFailure");
const failureR2 = document.getElementById("failureR2");
const failurePacket = document.getElementById("failurePacket");
const failureState = document.getElementById("failureState");
const failureTitle = document.getElementById("failureTitle");
const failureDescription = document.getElementById("failureDescription");

let routerFailed = false;
let routeTimer = null;

const normalRoute = [
    { x: 100, y: 190 },
    { x: 290, y: 90 },
    { x: 500, y: 190 },
    { x: 700, y: 190 }
];

const recoveryRoute = [
    { x: 100, y: 190 },
    { x: 290, y: 290 },
    { x: 500, y: 190 },
    { x: 700, y: 190 }
];

let routeIndex = 0;

function movePacket() {
    const route = routerFailed ? recoveryRoute : normalRoute;

    routeIndex++;

    if (routeIndex >= route.length) {
        routeIndex = 0;
    }

    const point = route[routeIndex];

    failurePacket.setAttribute("cx", point.x);
    failurePacket.setAttribute("cy", point.y);

    routeTimer = setTimeout(movePacket, 850);
}

function startRouteLoop() {
    clearTimeout(routeTimer);

    routeIndex = 0;

    /* Always start from R1 */
    failurePacket.setAttribute("cx", "100");
    failurePacket.setAttribute("cy", "190");

    routeTimer = setTimeout(movePacket, 850);
}

function failNetwork() {
    if (routerFailed) return;

    routerFailed = true;

    clearTimeout(routeTimer);

    /* Restart failed route from R1 */
    routeIndex = 0;

    failurePacket.setAttribute("cx", "100");
    failurePacket.setAttribute("cy", "190");

    failureR2.classList.add("failed");

    failureState.innerHTML = `
        <span class="status-dot" style="background:#ff5c9a"></span>
        ROUTE INTERRUPTED
    `;

    failureState.style.color = "var(--learn-pink)";

    failureTitle.textContent = "R2 is offline.";

    failureDescription.textContent =
        "The original route is affected. The network now needs another available path.";

    /*
       Give the user a moment to see R2 fail,
       then start the recovery route.
    */
    setTimeout(() => {
        if (!routerFailed) return;

        failureState.innerHTML = `
            <span class="status-dot"></span>
            RECOVERY ROUTE ACTIVE
        `;

        failureState.style.color = "var(--learn-green)";

        failureTitle.textContent = "Traffic is being rerouted.";

        failureDescription.textContent =
            "The packet is now avoiding R2 and using another available path.";

        movePacket();
    }, 700);
}

function resetNetwork() {
    routerFailed = false;

    clearTimeout(routeTimer);

    failureR2.classList.remove("failed");

    failureState.innerHTML = `
        <span class="status-dot"></span>
        NETWORK HEALTHY
    `;

    failureState.style.color = "var(--learn-green)";

    failureTitle.textContent = "Everything looks fine.";

    failureDescription.textContent =
        "The packet has a working route to its destination.";

    /* Restart normal route from R1 */
    startRouteLoop();
}

if (failRouter) {
    failRouter.addEventListener("click", failNetwork);
}

if (resetFailure) {
    resetFailure.addEventListener("click", resetNetwork);
}

/* Start normal route loop */
startRouteLoop();


/* Module 6: Dijkstra steps */

const algorithmSteps =
    document.querySelectorAll(
        ".algorithm-step"
    );

const nextDijkstra =
    document.getElementById(
        "nextDijkstra"
    );

const dNodes =
    document.querySelectorAll(
        ".d-node"
    );

const dEdges =
    document.querySelectorAll(
        ".d-edge"
    );

let algorithmStep = 0;

function renderAlgorithmStep() {
    algorithmSteps.forEach(
        (step, index) => {
            step.classList.toggle(
                "active",
                index === algorithmStep
            );
        }
    );

    dNodes.forEach(node => {
        node.classList.remove(
            "active"
        );
    });

    dEdges.forEach(edge => {
        edge.classList.remove(
            "active"
        );
    });

    if (algorithmStep === 0) {
        dNodes[0]?.classList.add(
            "active"
        );
    }

    if (algorithmStep === 1) {
        dNodes[0]?.classList.add(
            "active"
        );

        dNodes[1]?.classList.add(
            "active"
        );

        dNodes[2]?.classList.add(
            "active"
        );

        dEdges[0]?.classList.add(
            "active"
        );

        dEdges[1]?.classList.add(
            "active"
        );
    }

    if (algorithmStep === 2) {
        dNodes[0]?.classList.add(
            "active"
        );

        dNodes[1]?.classList.add(
            "active"
        );

        dEdges[0]?.classList.add(
            "active"
        );
    }

    if (algorithmStep === 3) {
        dNodes.forEach(node => {
            node.classList.add(
                "active"
            );
        });

        dEdges.forEach(edge => {
            edge.classList.add(
                "active"
            );
        });
    }

    if (nextDijkstra) {
        nextDijkstra.textContent =
            algorithmStep ===
            algorithmSteps.length - 1
                ? "RESTART STEPS ↻"
                : "NEXT STEP →";
    }
}

if (nextDijkstra) {
    nextDijkstra.addEventListener(
        "click",
        () => {
            algorithmStep++;

            if (
                algorithmStep >=
                algorithmSteps.length
            ) {
                algorithmStep = 0;
            }

            renderAlgorithmStep();
        }
    );
}

renderAlgorithmStep();


/* Reveal animations */

const revealElements =
    document.querySelectorAll(
        ".learn-module, .network-learning-panel, .packet-panel, .path-lab, .failure-lab, .cost-card, .dijkstra-lab, .recovery-flow, .learn-finale"
    );

const observer =
    new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add(
                        "revealed"
                    );
                }
            });
        },
        {
            threshold: 0.12
        }
    );

revealElements.forEach(element => {
    element.classList.add("reveal");
    observer.observe(element);
});