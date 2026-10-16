
/* NETROUTE — Global settings and navigation */

(() => {
    "use strict";

    if (window.__NETROUTE_COMMON_INITIALIZED__) {
        return;
    }
    window.__NETROUTE_COMMON_INITIALIZED__ = true;

    const THEME_KEY = "netroute-theme";
    const MODE_KEY = "netroute-learning-mode";
    const ANIMATION_KEY = "netroute-animations";
    const SOUND_KEY = "netroute-sound";

    const THEMES = [
        "dark-neon",
        "light-network",
        "midnight-purple"
    ];

    const DEFAULTS = {
        theme: "dark-neon",
        learningMode: "beginner",
        animations: "on",
        sound: "off"
    };

    /* Safely read localStorage. */
    function getStoredValue(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch (error) {
            return fallback;
        }
    }

    /* Safely save localStorage. */
    function saveValue(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn("NETROUTE could not save a preference.", error);
        }
    }

    /* Get the saved theme. */
    function getTheme() {
        const value = getStoredValue(THEME_KEY, DEFAULTS.theme);
        return THEMES.includes(value) ? value : DEFAULTS.theme;
    }

    /* Apply the theme globally. */
    function applyTheme(theme) {
        const selectedTheme = THEMES.includes(theme)
            ? theme
            : DEFAULTS.theme;

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

    /* Read saved preferences. */
    function getPreferences() {
        const learningMode = getStoredValue(
            MODE_KEY,
            DEFAULTS.learningMode
        );

        const animations = getStoredValue(
            ANIMATION_KEY,
            DEFAULTS.animations
        );

        const sound = getStoredValue(
            SOUND_KEY,
            DEFAULTS.sound
        );

        return {
            theme: getTheme(),
            learningMode: ["beginner", "technical"].includes(learningMode)
                ? learningMode
                : DEFAULTS.learningMode,
            animations: ["on", "reduced"].includes(animations)
                ? animations
                : DEFAULTS.animations,
            sound: ["on", "off"].includes(sound)
                ? sound
                : DEFAULTS.sound
        };
    }

    /* Save a supported preference. */
    function savePreference(name, value) {
        const settings = {
            learningMode: {
                key: MODE_KEY,
                values: ["beginner", "technical"]
            },
            animations: {
                key: ANIMATION_KEY,
                values: ["on", "reduced"]
            },
            sound: {
                key: SOUND_KEY,
                values: ["on", "off"]
            }
        };

        const setting = settings[name];

        if (!setting || !setting.values.includes(value)) {
            return;
        }

        saveValue(setting.key, value);

        if (name === "animations") {
            document.documentElement.dataset.animations = value;
        }

        document.dispatchEvent(
            new CustomEvent("netroute:preferencechange", {
                detail: { name, value }
            })
        );
    }

    /* Restore defaults without displaying an alert. */
    function resetSettings() {
        applyTheme(DEFAULTS.theme);
        savePreference("learningMode", DEFAULTS.learningMode);
        savePreference("animations", DEFAULTS.animations);
        savePreference("sound", DEFAULTS.sound);

        return getPreferences();
    }

    /* Apply saved settings immediately. */
    applyTheme(getTheme());

    const savedPreferences = getPreferences();

    document.documentElement.dataset.animations =
        savedPreferences.animations;

    /* Public API used by settings.js and other pages. */
    window.NETROUTE_SETTINGS = {
        themes: THEMES.slice(),
        getTheme,
        applyTheme,
        getPreferences,
        savePreference,
        resetSettings
    };

    /* Current page name. */
    function getCurrentPage() {
        const pathname = window.location.pathname;
        const filename = pathname.split("/").pop();
        return filename || "index.html";
    }

    /* Ensure every main navigation contains all seven links. */
    function completeNavigation(nav) {
        const requiredLinks = [
            { href: "index.html", label: "Home" },
            { href: "lab.html", label: "Network Lab" },
            { href: "modes.html", label: "Modes" },
            { href: "learn.html", label: "Learn" },
            { href: "quiz.html", label: "Quiz" },
            { href: "how-to-play.html", label: "How to Play" },
            { href: "settings.html", label: "Settings" }
        ];

        requiredLinks.forEach(({ href, label }) => {
            const exists = Array.from(nav.querySelectorAll("a")).some(link => {
                const linkHref = link.getAttribute("href");
                return linkHref &&
                    linkHref.split("/").pop() === href;
            });

            if (!exists) {
                const link = document.createElement("a");
                link.href = href;
                link.className = "nav-link";
                link.textContent = label;
                nav.appendChild(link);
            }
        });
    }

    /* Highlight the current page in navigation. */
    function updateActiveLinks() {
        const currentPage = getCurrentPage();

        document.querySelectorAll(
            ".main-nav .nav-link, .top-actions .utility-link"
        ).forEach(link => {
            const href = link.getAttribute("href");
            const linkPage = href ? href.split("/").pop() : "";

            const isCurrent = linkPage === currentPage;

            link.classList.toggle("active", isCurrent);

            if (isCurrent) {
                link.setAttribute("aria-current", "page");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    /*
     * Supply mobile navigation styling from this shared file.
     * This prevents older page-specific CSS from hiding the open menu.
     */
    function installNavigationStyles() {
        if (document.getElementById("netroute-navigation-fix")) {
            return;
        }

        const style = document.createElement("style");
        style.id = "netroute-navigation-fix";

        style.textContent = `
            @media (max-width: 900px) {
                .topbar {
                    position: relative;
                    z-index: 1000;
                }

                .top-actions {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .mobile-menu-btn {
                    display: inline-flex !important;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    position: relative;
                    z-index: 1002;
                    cursor: pointer;
                }

                .main-nav {
                    display: none !important;
                    position: absolute !important;
                    top: calc(100% + 8px);
                    left: 0;
                    right: 0;
                    width: auto;
                    max-height: calc(100vh - 100px);
                    overflow-y: auto;
                    flex-direction: column !important;
                    align-items: stretch !important;
                    gap: 4px !important;
                    padding: 12px !important;
                    margin: 0 !important;
                    border: 1px solid var(--line, rgba(255,255,255,.15));
                    border-radius: 14px;
                    background: var(--bg, #0b1020);
                    background-color: var(--bg, #0b1020);
                    box-shadow: 0 16px 40px rgba(0,0,0,.4);
                    z-index: 1001;
                    box-sizing: border-box;
                }

                .main-nav.open {
                    display: flex !important;
                }

                .main-nav .nav-link {
                    display: block !important;
                    width: 100%;
                    padding: 12px 14px !important;
                    box-sizing: border-box;
                    text-align: left;
                }

                .top-actions .utility-link {
                    display: none !important;
                }
            }

            @media (min-width: 901px) {
                .main-nav {
                    display: flex;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* Set up shared navigation and the mobile menu. */
    function initializeNavigation() {
        const nav = document.querySelector(".main-nav");
        const menuButton = document.getElementById("mobileMenuBtn");

        installNavigationStyles();

        if (!nav) {
            return;
        }

        if (!nav.id) {
            nav.id = "main-navigation";
        }

        if (menuButton) {
            menuButton.setAttribute("aria-controls", nav.id);
        }

        completeNavigation(nav);
        updateActiveLinks();

        if (!menuButton) {
            return;
        }

        function closeMenu() {
            nav.classList.remove("open");

            menuButton.setAttribute("aria-expanded", "false");
            menuButton.setAttribute("aria-label", "Open navigation");
            menuButton.textContent = "☰";
        }

        function openMenu() {
            nav.classList.add("open");

            menuButton.setAttribute("aria-expanded", "true");
            menuButton.setAttribute("aria-label", "Close navigation");
            menuButton.textContent = "×";
        }

        /*
         * Capture the click before older target/bubble handlers in
         * page-specific scripts can toggle the menu a second time.
         */
        menuButton.addEventListener("click", event => {
            event.preventDefault();
            event.stopImmediatePropagation();

            if (nav.classList.contains("open")) {
                closeMenu();
            } else {
                openMenu();
            }
        }, true);

        nav.addEventListener("click", event => {
            const link = event.target.closest("a");

            if (link && nav.contains(link)) {
                closeMenu();
            }
        });

        document.addEventListener("click", event => {
            if (
                nav.classList.contains("open") &&
                !nav.contains(event.target) &&
                !menuButton.contains(event.target)
            ) {
                closeMenu();
            }
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeMenu();
            }
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > 900) {
                closeMenu();
            }
        });
    }

    /* Wait until the navigation elements exist. */
    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            initializeNavigation,
            { once: true }
        );
    } else {
        initializeNavigation();
    }
})();
