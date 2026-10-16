/* NETROUTE — Global settings and navigation */

(() => {
    "use strict";

    const THEME_KEY = "netroute-theme";
    const MODE_KEY = "netroute-learning-mode";
    const ANIMATION_KEY = "netroute-animations";
    const SOUND_KEY = "netroute-sound";

    const THEMES = ["dark-neon", "light-network", "midnight-purple"];

    function getStoredValue(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch (error) {
            return fallback;
        }
    }

    function saveValue(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn("NETROUTE could not save this preference.", error);
        }
    }

    function getTheme() {
        const storedTheme = getStoredValue(THEME_KEY, "dark-neon");
        return THEMES.includes(storedTheme) ? storedTheme : "dark-neon";
    }

    function applyTheme(theme) {
        const selectedTheme = THEMES.includes(theme) ? theme : "dark-neon";

        document.documentElement.dataset.theme = selectedTheme;
        document.documentElement.style.colorScheme =
            selectedTheme === "light-network" ? "light" : "dark";

        saveValue(THEME_KEY, selectedTheme);

        document.dispatchEvent(
            new CustomEvent("netroute:themechange", {
                detail: { theme: selectedTheme }
            })
        );

        return selectedTheme;
    }

    function getPreferences() {
        return {
            theme: getTheme(),
            learningMode: getStoredValue(MODE_KEY, "beginner"),
            animations: getStoredValue(ANIMATION_KEY, "on"),
            sound: getStoredValue(SOUND_KEY, "off")
        };
    }

    function savePreference(name, value) {
        const keys = {
            learningMode: MODE_KEY,
            animations: ANIMATION_KEY,
            sound: SOUND_KEY
        };

        if (!Object.prototype.hasOwnProperty.call(keys, name)) {
            return;
        }

        const allowedValues = {
            learningMode: ["beginner", "technical"],
            animations: ["on", "reduced"],
            sound: ["on", "off"]
        };

        if (!allowedValues[name].includes(value)) {
            return;
        }

        saveValue(keys[name], value);

        if (name === "animations") {
            document.documentElement.dataset.animations = value;
        }

        document.dispatchEvent(
            new CustomEvent("netroute:preferencechange", {
                detail: { name, value }
            })
        );
    }

    function resetSettings() {
        applyTheme("dark-neon");
        savePreference("learningMode", "beginner");
        savePreference("animations", "on");
        savePreference("sound", "off");
    }

    // Apply saved settings as soon as this script runs.
    applyTheme(getTheme());

    const preferences = getPreferences();
    document.documentElement.dataset.animations = preferences.animations;

    // Public helper used by settings.js and other pages.
    window.NETROUTE_SETTINGS = {
        themes: THEMES.slice(),
        getTheme,
        applyTheme,
        getPreferences,
        savePreference,
        resetSettings
    };

    // Active navigation link.
    const currentPage =
        window.location.pathname.split("/").pop() || "index.html";

    const navLinks = document.querySelectorAll(
        ".main-nav .nav-link, .top-actions .utility-link"
    );

    navLinks.forEach(link => {
        const href = link.getAttribute("href");

        if (!href || href === "#") return;

        const linkPage = href.split("/").pop();

        if (linkPage === currentPage) {
            link.classList.add("active");
        } else {
            link.classList.remove("active");
        }
    });

    // Mobile navigation.
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mainNav = document.querySelector(".main-nav");

    if (mobileMenuBtn && mainNav) {
        function closeMobileMenu() {
            mainNav.classList.remove("open");
            mobileMenuBtn.setAttribute("aria-expanded", "false");
            mobileMenuBtn.setAttribute("aria-label", "Open menu");
        }

        mobileMenuBtn.addEventListener("click", () => {
            const isOpen = mainNav.classList.toggle("open");

            mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
            mobileMenuBtn.setAttribute(
                "aria-label",
                isOpen ? "Close menu" : "Open menu"
            );
        });

        mainNav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", closeMobileMenu);
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeMobileMenu();
            }
        });
    }
})();