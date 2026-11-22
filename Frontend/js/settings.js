
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

        /* Show inline feedback */
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

        /* Update selected theme card and label */
        function updateThemeCards(selectedTheme) {

            const validTheme = settings.themes.includes(selectedTheme)
                ? selectedTheme
                : "dark-neon";

            themeCards.forEach((card) => {

                const isSelected =
                    card.dataset.themeChoice === validTheme;

                card.classList.toggle("active", isSelected);
                card.classList.toggle("selected", isSelected);

                card.setAttribute(
                    "aria-checked",
                    String(isSelected)
                );

                card.setAttribute(
                    "aria-pressed",
                    String(isSelected)
                );

            });

            if (currentThemeLabel) {
                currentThemeLabel.textContent =
                    themeNames[validTheme];
            }
        }

        /* Load currently saved theme */
        function loadSettings() {
            const preferences = settings.getPreferences();
            updateThemeCards(preferences.theme);
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

        /* Reset theme to default */
        if (resetButton) {

            resetButton.addEventListener("click", (event) => {

                event.preventDefault();

                settings.applyTheme("dark-neon");

                loadSettings();

                showFeedback(
                    "Theme restored to Dark Neon."
                );

            });

        }

        /* Keep theme cards synchronized with changes elsewhere */
        document.addEventListener(
            "netroute:themechange",
            (event) => {

                if (event.detail && event.detail.theme) {
                    updateThemeCards(event.detail.theme);
                }

            }
        );

        /* Initialize */
        loadSettings();

    });

})();
