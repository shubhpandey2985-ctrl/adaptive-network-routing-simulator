
/* NETROUTE — Settings page */

(() => {
    "use strict";

    document.addEventListener("DOMContentLoaded", () => {
        const settings = window.NETROUTE_SETTINGS;

        if (!settings) {
            console.error(
                "NETROUTE settings are unavailable. Check that common.js loads before settings.js."
            );
            return;
        }

        const themeCards = document.querySelectorAll(
            "[data-theme-choice]"
        );

        const learningMode = document.getElementById(
            "learningMode"
        );

        const animationMode = document.getElementById(
            "animationMode"
        );

        const soundMode = document.getElementById(
            "soundMode"
        );

        const resetButton = document.getElementById(
            "resetSettings"
        );

        const feedback = document.getElementById(
            "settingsFeedback"
        );

        let feedbackTimeout;

        // Display one inline feedback message without browser alerts.
        function showFeedback(message) {
            if (!feedback) return;

            window.clearTimeout(feedbackTimeout);

            feedback.textContent = message;
            feedback.classList.add("show");
            feedback.setAttribute("role", "status");
            feedback.setAttribute("aria-live", "polite");

            feedbackTimeout = window.setTimeout(() => {
                feedback.classList.remove("show");
            }, 3000);
        }

        // Highlight the currently selected theme.
        function updateThemeCards(selectedTheme) {
            themeCards.forEach((card) => {
                const isSelected =
                    card.dataset.themeChoice === selectedTheme;

                card.classList.toggle("active", isSelected);
                card.classList.toggle("selected", isSelected);

                card.setAttribute(
                    "aria-pressed",
                    String(isSelected)
                );
            });
        }

        // Load saved preferences into the settings controls.
        function loadSettings() {
            const preferences = settings.getPreferences();

            updateThemeCards(preferences.theme);

            if (learningMode) {
                learningMode.value = preferences.learningMode;
            }

            if (animationMode) {
                animationMode.value = preferences.animations;
            }

            if (soundMode) {
                soundMode.value = preferences.sound;
            }

            document.documentElement.dataset.animations =
                preferences.animations;
        }

        // Theme selection.
        themeCards.forEach((card) => {
            card.addEventListener("click", () => {
                const selectedTheme = card.dataset.themeChoice;

                if (!settings.themes.includes(selectedTheme)) {
                    return;
                }

                settings.applyTheme(selectedTheme);
                updateThemeCards(selectedTheme);

                showFeedback("Theme updated successfully.");
            });
        });

        // Learning mode selection.
        if (learningMode) {
            learningMode.addEventListener("change", () => {
                settings.savePreference(
                    "learningMode",
                    learningMode.value
                );

                showFeedback("Learning mode saved.");
            });
        }

        // Animation preference.
        if (animationMode) {
            animationMode.addEventListener("change", () => {
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
                settings.savePreference(
                    "sound",
                    soundMode.value
                );

                showFeedback("Sound preference saved.");
            });
        }

        // Reset all settings to their defaults.
        if (resetButton) {
            resetButton.addEventListener("click", (event) => {
                event.preventDefault();

                settings.resetSettings();
                loadSettings();

                // Only one feedback call; no alert() is used.
                showFeedback("Settings restored to defaults.");
            });
        }

        // Keep theme selection in sync if changed elsewhere.
        document.addEventListener(
            "netroute:themechange",
            (event) => {
                if (event.detail?.theme) {
                    updateThemeCards(event.detail.theme);
                }
            }
        );

        loadSettings();
    });
})();
