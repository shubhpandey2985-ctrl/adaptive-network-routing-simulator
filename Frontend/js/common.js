
/* NETROUTE — Global theme and navigation */

(() => {
    "use strict";

    if (window.__NETROUTE_COMMON_INITIALIZED__) {
        return;
    }

    window.__NETROUTE_COMMON_INITIALIZED__ = true;

    const THEME_KEY = "netroute-theme";

    const THEMES = [
        "dark-neon",
        "light-network",
        "midnight-purple"
    ];

    const DEFAULT_THEME = "dark-neon";

    /* Safely read localStorage */
    function getStoredValue(key, fallback) {
        try {
            const value = localStorage.getItem(key);
            return value === null ? fallback : value;
        } catch (error) {
            return fallback;
        }
    }

    /* Safely save localStorage */
    function saveValue(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {
            console.warn("NETROUTE could not save the theme.", error);
        }
    }

    /* Get saved theme */
    function getTheme() {
        const value = getStoredValue(THEME_KEY, DEFAULT_THEME);

        return THEMES.includes(value)
            ? value
            : DEFAULT_THEME;
    }

    /* Apply theme globally */
    function applyTheme(theme) {
        const selectedTheme = THEMES.includes(theme)
            ? theme
            : DEFAULT_THEME;

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

    /* Read current application appearance */
    function getPreferences() {
        return {
            theme: getTheme()
        };
    }

    /* Reset appearance to default */
    function resetSettings() {
        applyTheme(DEFAULT_THEME);
        return getPreferences();
    }

    /* Apply saved theme immediately */
    applyTheme(getTheme());

    /* Public API */
    window.NETROUTE_SETTINGS = {
        themes: THEMES.slice(),
        getTheme,
        applyTheme,
        getPreferences,
        resetSettings
    };

    /* Get current page name */
    function getCurrentPage() {
        const pathname = window.location.pathname;
        const filename = pathname.split("/").pop();

        return filename || "index.html";
    }

    /* Ensure navigation contains the required links */
    function completeNavigation(nav) {
        const requiredLinks = [
            { href: "index.html", label: "Home" },
            { href: "lab.html", label: "Network Lab" },
            { href: "learn.html", label: "Learn" },
            { href: "how-to-play.html", label: "How to Play" },
            { href: "settings.html", label: "Settings" }
        ];

        requiredLinks.forEach(({ href, label }) => {

            const exists = Array.from(
                nav.querySelectorAll("a")
            ).some(link => {
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

    /* Highlight current page in navigation */
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
     * Shared mobile navigation styling.
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

    /* Initialize shared navigation and mobile menu */
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
         * Capture click before older page-specific handlers.
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

        /* Close menu after selecting a navigation link */
        nav.addEventListener("click", event => {

            const link = event.target.closest("a");

            if (link && nav.contains(link)) {
                closeMenu();
            }

        });

        /* Close menu when clicking outside */
        document.addEventListener("click", event => {

            if (
                nav.classList.contains("open") &&
                !nav.contains(event.target) &&
                !menuButton.contains(event.target)
            ) {
                closeMenu();
            }

        });

        /* Close menu with Escape */
        document.addEventListener("keydown", event => {

            if (event.key === "Escape") {
                closeMenu();
            }

        });

        /* Close menu when returning to desktop width */
        window.addEventListener("resize", () => {

            if (window.innerWidth > 900) {
                closeMenu();
            }

        });

    }

    /* Wait until navigation elements exist */
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
