/* Mobile navigation */
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mainNav = document.querySelector(".main-nav");

if (mobileMenuBtn && mainNav) {
    mobileMenuBtn.addEventListener("click", () => {
        const isOpen = mainNav.classList.toggle("mobile-open");

        mobileMenuBtn.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        mobileMenuBtn.textContent = isOpen ? "✕" : "☰";
    });
}


/* Close mobile menu */
document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
        if (!mainNav || !mobileMenuBtn) return;

        mainNav.classList.remove("mobile-open");

        mobileMenuBtn.setAttribute(
            "aria-expanded",
            "false"
        );

        mobileMenuBtn.textContent = "☰";
    });
});


/* Network preview */
const previewPacket =
    document.getElementById("previewPacket");

const networkEvent =
    document.getElementById("networkEvent");

const networkRoute =
    document.getElementById("networkRoute");

const networkMessage =
    document.getElementById("networkMessage");


const previewRouters = {
    R1: document.querySelector(".router-one"),
    R2: document.querySelector(".router-two"),
    R3: document.querySelector(".router-three"),
    R4: document.querySelector(".router-four"),
    R5: document.querySelector(".router-five"),
    R6: document.querySelector(".router-six")
};


const previewLinks = {
    "R1-R2": document.querySelector(".link-r1-r2"),
    "R2-R3": document.querySelector(".link-r2-r3"),
    "R1-R4": document.querySelector(".link-r1-r4"),
    "R4-R5": document.querySelector(".link-r4-r5"),
    "R5-R3": document.querySelector(".link-r5-r3"),
    "R3-R6": document.querySelector(".link-r3-r6"),
    "R5-R6": document.querySelector(".link-r5-r6")
};


/* SVG coordinates */
const routerPositions = {
    R1: [110, 230],
    R2: [280, 115],
    R3: [500, 150],
    R4: [285, 355],
    R5: [505, 330],
    R6: [695, 240]
};


const normalRoute = [
    "R1",
    "R2",
    "R3",
    "R6"
];


const recoveryRoute = [
    "R1",
    "R4",
    "R5",
    "R3",
    "R6"
];


let packetAnimation = null;


/* Clear network state */
function clearNetworkState() {
    Object.values(previewRouters).forEach((router) => {
        if (!router) return;

        router.classList.remove(
            "failed",
            "recovered"
        );
    });

    Object.values(previewLinks).forEach((link) => {
        if (!link) return;

        link.classList.remove(
            "active",
            "recovery",
            "failed"
        );
    });

    networkEvent.classList.remove(
        "failure",
        "recovery"
    );

    networkRoute.classList.remove(
        "recovery"
    );

    networkMessage.classList.remove(
        "failure",
        "recovery"
    );
}


/* Put packet at a router */
function setPacketPosition(routerName) {
    if (!previewPacket) return;

    const position =
        routerPositions[routerName];

    if (!position) return;

    previewPacket.setAttribute(
        "cx",
        position[0]
    );

    previewPacket.setAttribute(
        "cy",
        position[1]
    );
}


/* Move packet along a route */
function movePacket(route, segmentDuration, callback) {
    if (!previewPacket || route.length < 2) {
        if (callback) callback();
        return;
    }

    if (packetAnimation) {
        cancelAnimationFrame(packetAnimation);
    }

    let segmentIndex = 0;
    let startTime = null;

    setPacketPosition(route[0]);

    function animate(timestamp) {
        if (!startTime) {
            startTime = timestamp;
        }

        const elapsed =
            timestamp - startTime;

        const progress =
            Math.min(
                elapsed / segmentDuration,
                1
            );

        const start =
            routerPositions[
                route[segmentIndex]
            ];

        const end =
            routerPositions[
                route[segmentIndex + 1]
            ];

        const x =
            start[0] +
            (end[0] - start[0]) *
            progress;

        const y =
            start[1] +
            (end[1] - start[1]) *
            progress;

        previewPacket.setAttribute(
            "cx",
            x
        );

        previewPacket.setAttribute(
            "cy",
            y
        );

        if (progress >= 1) {
            segmentIndex++;

            if (
                segmentIndex >=
                route.length - 1
            ) {
                if (callback) {
                    callback();
                }

                return;
            }

            startTime = timestamp;
        }

        packetAnimation =
            requestAnimationFrame(animate);
    }

    packetAnimation =
        requestAnimationFrame(animate);
}


/* Normal route */
function highlightNormalRoute() {
    previewLinks["R1-R2"].classList.add("active");
    previewLinks["R2-R3"].classList.add("active");
    previewLinks["R3-R6"].classList.add("active");
}


/* Recovery route */
function highlightRecoveryRoute() {
    previewLinks["R1-R4"].classList.add("recovery");
    previewLinks["R4-R5"].classList.add("recovery");
    previewLinks["R5-R3"].classList.add("recovery");
    previewLinks["R3-R6"].classList.add("recovery");
}


/* Normal routing scene */
function showNormalScene() {
    clearNetworkState();

    networkEvent.textContent =
        "NORMAL ROUTE";

    networkRoute.textContent =
        "R1 → R2 → R3 → R6";

    networkMessage.textContent =
        "PACKET DELIVERED";

    highlightNormalRoute();

    movePacket(
        normalRoute,
        650,
        () => {
            setTimeout(
                showFailureScene,
                900
            );
        }
    );
}


/* Router failure scene */
function showFailureScene() {
    clearNetworkState();

    setPacketPosition("R1");

    previewRouters.R2.classList.add(
        "failed"
    );

    previewLinks["R1-R2"].classList.add(
        "failed"
    );

    previewLinks["R2-R3"].classList.add(
        "failed"
    );

    networkEvent.textContent =
        "ROUTER FAILURE";

    networkEvent.classList.add(
        "failure"
    );

    networkRoute.textContent =
        "R2 OFFLINE";

    networkMessage.textContent =
        "ROUTE BROKEN";

    networkMessage.classList.add(
        "failure"
    );

    setTimeout(
        showRecoveryScene,
        1300
    );
}


/* Adaptive recovery scene */
function showRecoveryScene() {
    clearNetworkState();

    setPacketPosition("R1");

    previewRouters.R2.classList.add(
        "failed"
    );

    previewRouters.R4.classList.add(
        "recovered"
    );

    previewRouters.R5.classList.add(
        "recovered"
    );

    previewLinks["R1-R2"].classList.add(
        "failed"
    );

    previewLinks["R2-R3"].classList.add(
        "failed"
    );

    highlightRecoveryRoute();

    networkEvent.textContent =
        "ADAPTIVE RECOVERY";

    networkEvent.classList.add(
        "recovery"
    );

    networkRoute.textContent =
        "R1 → R4 → R5 → R3 → R6";

    networkRoute.classList.add(
        "recovery"
    );

    networkMessage.textContent =
        "NEW ROUTE FOUND";

    networkMessage.classList.add(
        "recovery"
    );

    movePacket(
        recoveryRoute,
        600,
        () => {
            setTimeout(
                showNormalScene,
                1100
            );
        }
    );
}


/* Start animation */
if (
    previewPacket &&
    networkEvent &&
    networkRoute &&
    networkMessage
) {
    showNormalScene();
}