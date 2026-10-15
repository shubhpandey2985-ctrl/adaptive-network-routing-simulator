/* Global navigation */

const currentPage = window.location.pathname.split("/").pop() || "index.html";

const navLinks = document.querySelectorAll(".main-nav .nav-link, .top-actions .utility-link");

navLinks.forEach(link => {
    const href = link.getAttribute("href");

    if (!href || href === "#") {
        return;
    }

    const linkPage = href.split("/").pop();

    if (linkPage === currentPage) {
        link.classList.add("active");
    } else {
        link.classList.remove("active");
    }
});


/* Mobile navigation */

const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mainNav = document.querySelector(".main-nav");

if (mobileMenuBtn && mainNav) {

    mobileMenuBtn.addEventListener("click", () => {

        const isOpen = mainNav.classList.toggle("open");

        mobileMenuBtn.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        mobileMenuBtn.setAttribute(
            "aria-label",
            isOpen ? "Close menu" : "Open menu"
        );

    });


    mainNav.querySelectorAll("a").forEach(link => {

        link.addEventListener("click", () => {

            mainNav.classList.remove("open");

            mobileMenuBtn.setAttribute(
                "aria-expanded",
                "false"
            );

            mobileMenuBtn.setAttribute(
                "aria-label",
                "Open menu"
            );

        });

    });


    document.addEventListener("keydown", event => {

        if (event.key === "Escape") {

            mainNav.classList.remove("open");

            mobileMenuBtn.setAttribute(
                "aria-expanded",
                "false"
            );

            mobileMenuBtn.setAttribute(
                "aria-label",
                "Open menu"
            );

        }

    });

}