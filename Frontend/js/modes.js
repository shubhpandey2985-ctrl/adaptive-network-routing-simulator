
"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const toast = document.getElementById("modeToast");

    const unavailableModes = document.querySelectorAll(
        ".mode-unavailable"
    );

    let toastTimer = null;

    const modeMessages = {
        congestion:
            "Congestion Mode is coming soon. It will explore heavy network traffic.",

        disaster:
            "Disaster Mode is coming soon. It will explore network failures and recovery.",

        race:
            "Algorithm Race is coming soon. It will compare routing strategies."
    };

    function showToast(message) {
        if (!toast) return;

        // Cancel the previous notification timer.
        if (toastTimer) {
            clearTimeout(toastTimer);
        }

        toast.textContent = message;

        toast.classList.add("visible");

        toastTimer = setTimeout(() => {
            toast.classList.remove("visible");
        }, 3500);
    }

    unavailableModes.forEach((modeCard) => {

        modeCard.addEventListener("click", () => {

            const modeName = modeCard.dataset.mode;

            const message = modeMessages[modeName];

            if (message) {
                showToast(message);
            }

        });

    });

});
