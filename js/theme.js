(function () {
    const STORAGE_KEY = "campusmarket-theme";

    const THEMES = [
        { id: "light", label: "Light", swatch: "#ffffff" },
        { id: "dark", label: "Dark", swatch: "#1c1f28" },
        { id: "pink", label: "Pink", swatch: "#e85a8c" },
        { id: "blue", label: "Blue", swatch: "#2f6fed" }
    ];

    function getSavedTheme() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (THEMES.some(function (theme) {
                return theme.id === saved;
            })) {
                return saved;
            }
        } catch (error) {
            // Ignore storage errors and fall back to light.
        }

        return "light";
    }

    function applyTheme(themeId) {
        document.documentElement.setAttribute("data-theme", themeId);

        try {
            localStorage.setItem(STORAGE_KEY, themeId);
        } catch (error) {
            // Theme still applies for this page load.
        }

        document.querySelectorAll("[data-theme-value]").forEach(function (button) {
            button.classList.toggle(
                "is-active",
                button.getAttribute("data-theme-value") === themeId
            );
        });
    }

    applyTheme(getSavedTheme());

    function findMountPoint() {
        return document.getElementById("themePickerHost") ||
            document.querySelector("nav .navbar-collapse .d-flex") ||
            document.querySelector("nav .container-fluid") ||
            document.querySelector(".d-flex.justify-content-between.align-items-center");
    }

    function closePicker(picker) {
        const toggle = picker.querySelector(".theme-picker-toggle");
        const menu = picker.querySelector(".theme-picker-menu");

        if (!toggle || !menu) {
            return;
        }

        toggle.setAttribute("aria-expanded", "false");
        menu.hidden = true;
    }

    function mountPicker() {
        if (document.getElementById("themePicker")) {
            return;
        }

        const mountPoint = findMountPoint();
        if (!mountPoint) {
            return;
        }

        const picker = document.createElement("div");
        picker.id = "themePicker";
        picker.className = "theme-picker";

        picker.innerHTML =
            '<button type="button" class="theme-picker-toggle" aria-haspopup="true" aria-expanded="false" aria-label="Choose a theme">' +
            '<i class="bi bi-palette-fill"></i>' +
            '<span class="theme-picker-label">Theme</span>' +
            "</button>" +
            '<div class="theme-picker-menu" hidden>' +
            THEMES.map(function (theme) {
                return (
                    '<button type="button" class="theme-option" data-theme-value="' +
                    theme.id +
                    '">' +
                    '<span class="theme-swatch" style="background:' +
                    theme.swatch +
                    ';"></span>' +
                    theme.label +
                    "</button>"
                );
            }).join("") +
            "</div>";

        mountPoint.prepend(picker);

        const toggle = picker.querySelector(".theme-picker-toggle");
        const menu = picker.querySelector(".theme-picker-menu");

        toggle.addEventListener("click", function (event) {
            event.stopPropagation();
            const open = menu.hidden;
            menu.hidden = !open;
            toggle.setAttribute("aria-expanded", open ? "true" : "false");
        });

        picker.querySelectorAll("[data-theme-value]").forEach(function (button) {
            button.addEventListener("click", function () {
                applyTheme(button.getAttribute("data-theme-value"));
                closePicker(picker);
            });
        });

        document.addEventListener("click", function (event) {
            if (!picker.contains(event.target)) {
                closePicker(picker);
            }
        });

        applyTheme(getSavedTheme());
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", mountPicker);
    } else {
        mountPicker();
    }
}());
