const routers =
    document.querySelectorAll(".router");

const links =
    document.querySelectorAll(".link");

const packet =
    document.getElementById("packet");

const packetTag =
    document.querySelector(".packet-tag");

const sendBtn =
    document.getElementById("sendBtn");

const failBtn =
    document.getElementById("failBtn");

const resetBtn =
    document.getElementById("resetBtn");

const toast =
    document.getElementById("toast");

const explainTitle =
    document.getElementById("explainTitle");

const explainText =
    document.getElementById("explainText");

const conceptPill =
    document.getElementById("conceptPill");

const coachText =
    document.getElementById("coachText");

const cost =
    document.getElementById("cost");

const delivered =
    document.getElementById("delivered");

const xp =
    document.getElementById("xp");

let failed = false;


/* ================= TOAST ================= */

function showToast(message) {

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(() => {

        toast.classList.remove("show");

    }, 2200);

}


/* ================= EXPLANATION ================= */

function setExplanation(
    title,
    text,
    concept,
    coach
) {

    explainTitle.textContent = title;

    explainText.innerHTML = text;

    conceptPill.textContent =
        "CONCEPT · " + concept;

    coachText.textContent =
        "“" + coach + "”";

}


/* ================= CLEAR PACKET ================= */

function clearAnimation() {

    packet.classList.remove("travel");

    packetTag.classList.remove("travel");

    /*
        Force browser to restart CSS animation.
    */

    void packet.offsetWidth;

}


/* ================= SEND PACKET ================= */

sendBtn.addEventListener(
    "click",
    () => {

        clearAnimation();

        packet.classList.add("travel");

        packetTag.classList.add("travel");

        delivered.textContent = "01";

        xp.textContent =
            failed ? "220" : "170";


        if (failed) {

            setExplanation(

                "Packet found a new route!",

                `
                R2 is unavailable,
                so the network avoids it
                and sends the packet through

                <b>
                R1 → R4 → R5 → R3 → R6
                </b>.
                `,

                "ADAPTIVE ROUTING",

                "I lost a router and somehow the packet still made it."

            );

        }

        else {

            setExplanation(

                "Packet delivered!",

                `
                The packet followed the current
                route from <b>R1</b> toward
                destination <b>R6</b>.

                Next, try breaking R2.
                `,

                "PACKET ROUTING",

                "Tiny box travelled across the network. Success!"

            );

        }


        showToast(
            "📦 Packet launched!"
        );

    }
);


/* ================= FAIL ROUTER ================= */

failBtn.addEventListener(
    "click",
    () => {

        if (failed) return;

        failed = true;


        /*
            R2 is now failed.
        */

        document
            .querySelector(
                '[data-router="R2"]'
            )
            .classList.add("failed");


        /*
            Break links connected to R2.
        */

        document
            .querySelector(
                '[data-link="R1-R2"]'
            )
            .classList.add("failed");


        document
            .querySelector(
                '[data-link="R2-R3"]'
            )
            .classList.add("failed");


        /*
            Highlight alternate route.
        */

        document
            .querySelector(
                '[data-link="R1-R4"]'
            )
            .classList.add("active");


        document
            .querySelector(
                '[data-link="R4-R5"]'
            )
            .classList.add("active");


        document
            .querySelector(
                '[data-link="R5-R3"]'
            )
            .classList.add("active");


        document
            .querySelector(
                '[data-link="R3-R6"]'
            )
            .classList.add("active");


        document
            .querySelector(".old-route")
            .classList.add("show");


        document
            .querySelector(".new-route")
            .classList.add("show");


        cost.textContent = "08";

        xp.textContent = "200";


        setExplanation(

            "💥 Router R2 is down!",

            `
            The old route is broken.

            The routing system can now
            search the remaining graph
            for another available path.
            `,

            "FAILURE RECOVERY",

            "WHO PRESSED THE BIG RED BUTTON?!"

        );


        showToast(
            "⚠ R2 failure detected — recalculating..."
        );

    }
);


/* ================= RESET ================= */

resetBtn.addEventListener(
    "click",
    () => {

        failed = false;


        routers.forEach(
            router =>
                router.classList.remove("failed")
        );


        links.forEach(
            link =>
                link.classList.remove(
                    "failed",
                    "active"
                )
        );


        document
            .querySelector(".old-route")
            .classList.remove("show");


        document
            .querySelector(".new-route")
            .classList.remove("show");


        clearAnimation();


        cost.textContent = "05";

        delivered.textContent = "00";

        xp.textContent = "120";


        setExplanation(

            "The network is calm... for now.",

            `
            Click <b>SEND PACKET</b>
            to watch a packet travel
            from R1 to R6.

            Try breaking R2 after that.
            `,

            "ROUTING",

            "Please don't destroy anything. I just fixed it."

        );


        showToast(
            "↻ Network reset"
        );

    }
);


/* ================= ROUTER CLICK ================= */

routers.forEach(
    router => {

        router.addEventListener(
            "click",
            () => {

                const id =
                    router.dataset.router;


                /*
                    For our prototype,
                    clicking R2 means
                    destroying R2.
                */

                if (
                    id === "R2" &&
                    !failed
                ) {

                    failBtn.click();

                }

                else {

                    showToast(
                        id + " is online"
                    );

                }

            }
        );

    }
);


/* ================= BEGINNER / TECHNICAL ================= */

document
    .querySelectorAll(
        ".mode-toggle button"
    )
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(
                        ".mode-toggle button"
                    )
                    .forEach(
                        b =>
                            b.classList.remove(
                                "active"
                            )
                    );


                button.classList.add("active");


                if (
                    button.dataset.mode ===
                    "technical"
                ) {

                    document
                        .getElementById(
                            "heroText"
                        )
                        .textContent =
                        "Interactive weighted-graph simulation: observe path selection, failure recovery and adaptive rerouting.";


                    setExplanation(

                        "Technical mode enabled",

                        `
                        The visualizer now uses
                        networking and algorithm
                        terminology.

                        The C/C++ backend can later
                        supply real path and cost data.
                        `,

                        "TECHNICAL MODE",

                        "Fine. We can use words like adjacency list now."

                    );

                }

                else {

                    document
                        .getElementById(
                            "heroText"
                        )
                        .textContent =
                        "Send a packet across the network. Break a router. Watch the network adapt.";

                }

            }
        );

    });


/* ================= SOUND BUTTON ================= */

document
    .getElementById("soundBtn")
    .addEventListener(
        "click",
        () => {

            showToast(
                "🔊 Sound will be added later"
            );

        }
    );