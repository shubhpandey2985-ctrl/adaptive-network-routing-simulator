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

        const currentThemeLabel = document.getElementById(
            "currentThemeLabel"
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

        /* Theme names shown to the user */
        const themeNames = {
            "dark-neon": "DARK NEON",
            "light-network": "LIGHT NETWORK",
            "midnight-purple": "MIDNIGHT PURPLE"
        };

        /* Show an inline feedback message */
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

        /* Update the selected theme card and label */
        function updateThemeCards(selectedTheme) {
            const validTheme = settings.themes.includes(
                selectedTheme
            )
                ? selectedTheme
                : "dark-neon";

            themeCards.forEach((card) => {
                const isSelected =
                    card.dataset.themeChoice === validTheme;

                card.classList.toggle("active", isSelected);
                card.classList.toggle("selected", isSelected);

                /* Correct state for radio buttons */
                card.setAttribute(
                    "aria-checked",
                    String(isSelected)
                );

                card.setAttribute(
                    "aria-pressed",
                    String(isSelected)
                );
            });

            /* Update the visible current-theme label */
            if (currentThemeLabel) {
                currentThemeLabel.textContent =
                    themeNames[validTheme];
            }
        }

        /* Load all saved settings */
        function loadSettings() {
            const preferences = settings.getPreferences();

            updateThemeCards(preferences.theme);

            if (learningMode) {
                learningMode.value =
                    preferences.learningMode;
            }

            if (animationMode) {
                animationMode.value =
                    preferences.animations;
            }

            if (soundMode) {
                soundMode.value =
                    preferences.sound;
            }

            document.documentElement.dataset.animations =
                preferences.animations;
        }

        /* Theme selection */
        themeCards.forEach((card) => {
            card.addEventListener("click", () => {
                const selectedTheme =
                    card.dataset.themeChoice;

                if (!settings.themes.includes(selectedTheme)) {
                    return;
                }

                settings.applyTheme(selectedTheme);

                updateThemeCards(selectedTheme);

                showFeedback(
                    `${themeNames[selectedTheme]} theme applied.`
                );
            });
        });

        /* Learning mode */
        if (learningMode) {
            learningMode.addEventListener("change", () => {
                settings.savePreference(
                    "learningMode",
                    learningMode.value
                );

                showFeedback("Learning mode saved.");
            });
        }

        /* Animation preference */
        if (animationMode) {
            animationMode.addEventListener("change", () => {
                settings.savePreference(
                    "animations",
                    animationMode.value
                );

                showFeedback("Animation preference saved.");
            });
        }

        /* Sound preference */
        if (soundMode) {
            soundMode.addEventListener("change", () => {
                settings.savePreference(
                    "sound",
                    soundMode.value
                );

                showFeedback("Sound preference saved.");
            });
        }

        /* Reset all settings */
        if (resetButton) {
            resetButton.addEventListener("click", (event) => {
                event.preventDefault();

                settings.resetSettings();

                loadSettings();

                showFeedback(
                    "Settings restored to defaults."
                );
            });
        }

        /* Keep the settings page synchronized with theme
           changes made elsewhere in NETROUTE */
        document.addEventListener(
            "netroute:themechange",
            (event) => {
                if (event.detail && event.detail.theme) {
                    updateThemeCards(event.detail.theme);
                }
            }
        );

        /* Initialize page with saved preferences */
        loadSettings();
    });
})();