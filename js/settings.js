/* NETROUTE — Settings page */

document.addEventListener("DOMContentLoaded", () => {
    "use strict";

    const settings = window.NETROUTE_SETTINGS;

    const themeCards = document.querySelectorAll("[data-theme-choice]");
    const currentThemeLabel = document.getElementById("currentThemeLabel");
    const learningMode = document.getElementById("learningMode");
    const animationMode = document.getElementById("animationMode");
    const soundMode = document.getElementById("soundMode");
    const resetButton = document.getElementById("resetSettings");
    const feedback = document.getElementById("settingsFeedback");

    const themeNames = {
        "dark-neon": "DARK NEON",
        "light-network": "LIGHT NETWORK",
        "midnight-purple": "MIDNIGHT PURPLE"
    };

    let feedbackTimeout;

    function showFeedback(message) {
        if (!feedback) return;

        feedback.textContent = message;

        window.clearTimeout(feedbackTimeout);

        feedbackTimeout = window.setTimeout(() => {
            feedback.textContent = "";
        }, 3000);
    }

    function updateThemeSelection(theme) {
        themeCards.forEach(card => {
            const selected = card.dataset.themeChoice === theme;

            card.setAttribute("aria-checked", String(selected));
            card.tabIndex = selected ? 0 : -1;
        });

        if (currentThemeLabel) {
            currentThemeLabel.textContent =
                themeNames[theme] || themeNames["dark-neon"];
        }
    }

    function loadPreferences() {
        if (!settings) {
            showFeedback(
                "Settings could not initialize. Check js/common.js."
            );
            console.error(
                "NETROUTE_SETTINGS is missing. Check that js/common.js loads successfully before js/settings.js."
            );
            return;
        }

        const preferences = settings.getPreferences();

        updateThemeSelection(preferences.theme);

        if (learningMode) {
            learningMode.value = preferences.learningMode;
        }

        if (animationMode) {
            animationMode.value = preferences.animations;
        }

        if (soundMode) {
            soundMode.value = preferences.sound;
        }
    }

    // Theme selection.
    themeCards.forEach(card => {
        card.addEventListener("click", () => {
            if (!settings) {
                showFeedback("Theme system unavailable. Check the Console.");
                return;
            }

            const selectedTheme = card.dataset.themeChoice;

            const appliedTheme = settings.applyTheme(selectedTheme);

            updateThemeSelection(appliedTheme);

            showFeedback(
                `${themeNames[appliedTheme]} theme selected and saved.`
            );
        });

        card.addEventListener("keydown", event => {
            const keys = [
                "ArrowLeft",
                "ArrowRight",
                "ArrowUp",
                "ArrowDown"
            ];

            if (!keys.includes(event.key)) return;

            event.preventDefault();

            const cards = Array.from(themeCards);
            const currentIndex = cards.indexOf(card);
            const forward =
                event.key === "ArrowRight" ||
                event.key === "ArrowDown";

            const nextIndex =
                (currentIndex + (forward ? 1 : -1) + cards.length) %
                cards.length;

            cards[nextIndex].focus();
            cards[nextIndex].click();
        });
    });

    // Learning mode preference.
    if (learningMode) {
        learningMode.addEventListener("change", () => {
            if (!settings) return;

            settings.savePreference(
                "learningMode",
                learningMode.value
            );

            showFeedback("Learning preference saved.");
        });
    }

    // Animation preference.
    if (animationMode) {
        animationMode.addEventListener("change", () => {
            if (!settings) return;

            settings.savePreference(
                "animations",
                animationMode.value
            );

            showFeedback("Animation preference saved.");
        });
    }

    // Sound preference.
    if (soundMode) {
        soundMode.addEventListener("change", () => {
            if (!settings) return;

            settings.savePreference("sound", soundMode.value);

            showFeedback("Sound preference saved.");
        });
    }

    // Restore default settings.
    if (resetButton) {
        resetButton.addEventListener("click", () => {
            if (!settings) return;

            const confirmed = window.confirm(
                "Reset all NETROUTE settings to their defaults?"
            );

            if (!confirmed) return;

            settings.resetSettings();
            loadPreferences();

            showFeedback("Settings restored to defaults.");
        });
    }

    // Keep the selection indicator synchronized with global theme changes.
    document.addEventListener("netroute:themechange", event => {
        updateThemeSelection(event.detail.theme);
    });

    loadPreferences();
});