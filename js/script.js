
"use strict";

/* ==========================================
   DUMPSTERRIFIC WEBSITE
   Shared settings, navigation, request wizard
   ========================================== */

const $ = (selector, root = document) =>
    root.querySelector(selector);

const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));


/* ==========================================
   NAVIGATION
   ========================================== */

function setupNavigation() {

    const menu = $("#sideMenu");
    const toggle = $("#menuToggle");
    const backdrop = $("#menuBackdrop");
    const closeButton = $("#closeMenu");

    if (!menu || !toggle || !backdrop) return;

    let previousFocus = null;

    function openMenu() {
        previousFocus = document.activeElement;

        menu.inert = false;
        menu.classList.add("open");
        backdrop.classList.add("visible");

        menu.setAttribute("aria-hidden", "false");
        toggle.setAttribute("aria-expanded", "true");

        document.body.classList.add("menu-open");
        closeButton?.focus();
    }

    function closeMenu() {
        menu.classList.remove("open");
        backdrop.classList.remove("visible");

        menu.setAttribute("aria-hidden", "true");
        toggle.setAttribute("aria-expanded", "false");

        document.body.classList.remove("menu-open");
        menu.inert = true;

        if (previousFocus instanceof HTMLElement) {
            previousFocus.focus();
        }
    }

    toggle.addEventListener("click", () => {
        if (menu.classList.contains("open")) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    closeButton?.addEventListener("click", closeMenu);
    backdrop.addEventListener("click", closeMenu);

    document.addEventListener("keydown", event => {

        if (!menu.classList.contains("open")) return;

        if (event.key === "Escape") {
            closeMenu();
            return;
        }

        if (event.key !== "Tab") return;

        const focusable = $$(
            'a[href], button:not([disabled])',
            menu
        );

        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (
            event.shiftKey &&
            document.activeElement === first
        ) {
            event.preventDefault();
            last.focus();
        } else if (
            !event.shiftKey &&
            document.activeElement === last
        ) {
            event.preventDefault();
            first.focus();
        }
    });

    menu.inert = true;

    const page = document.body.dataset.page;

    $$("[data-page-link]").forEach(link => {
        const active = link.dataset.pageLink === page;

        link.classList.toggle("active", active);

        if (active) {
            link.setAttribute("aria-current", "page");
        }
    });
}


/* ==========================================
   COPYRIGHT YEAR
   ========================================== */

function setupCopyright() {

    const year = new Date().getFullYear();

    const element = $("#year");

    if (element) {
        element.textContent = year;
    }

    $$("[data-year]").forEach(item => {
        item.textContent = year;
    });
}


/* ==========================================
   SHARED CONFIG.JSON
   ========================================== */

async function loadConfig() {

    try {
        const url = new URL(
            "config.json",
            document.baseURI
        );

        const response = await fetch(url.href, {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error(
                "Configuration HTTP " + response.status
            );
        }

        const config = await response.json();

        applyConfig(config);

    } catch (error) {
        console.error(
            "[Dumpsterrific] Unable to load config:",
            error
        );
    }
}


function applyConfig(config) {

    const business = config.business || {};
    const branding = config.branding || {};
    const hours = config.hours || {};
    const socials = config.socials || {};

    // Primary brand color
    if (
        /^#[0-9a-f]{6}$/i.test(
            branding.primaryColor || ""
        )
    ) {
        document.documentElement.style.setProperty(
            "--green",
            branding.primaryColor
        );
    }

    // Logos
    const logos = {
        "[data-mini-logo]": branding.miniLogo,
        "[data-full-logo]": branding.logoWhite,
        '[data-logo="mini"]': branding.miniLogo,
        '[data-logo="white"]': branding.logoWhite,
        '[data-logo="standard"]': branding.logo
    };

    Object.entries(logos).forEach(([selector, path]) => {

        if (!path) return;

        $$(selector).forEach(image => {
            image.src = path;
        });
    });

    // Business name
    $$("[data-business-name]").forEach(element => {
        element.textContent =
            business.name || "Dumpsterrific";
    });

    // Service area
    $$("[data-service-area]").forEach(element => {
        element.textContent =
            business.serviceArea || "Northwest Missouri";
    });

    // Phone
    const phone = String(
        business.phone || ""
    ).trim();

    $$("[data-phone], [data-business-phone]")
        .forEach(element => {
            element.textContent =
                phone || "Phone unavailable";
        });

    $$("[data-phone-link], [data-business-phone]")
        .forEach(element => {

            if (phone) {
                element.href =
                    "tel:" + phone.replace(/[^\d+]/g, "");
            } else {
                element.removeAttribute("href");
            }
        });

    // Email
    const email = String(
        business.email || ""
    ).trim();

    $$("[data-email], [data-business-email]")
        .forEach(element => {
            element.textContent = email;
        });

    $$("[data-email-link], [data-business-email]")
        .forEach(element => {

            if (email) {
                element.href = "mailto:" + email;
                element.hidden = false;
            } else {
                element.removeAttribute("href");
                element.hidden = true;
            }
        });

    renderBusinessHours(hours);
    renderSocialLinks(socials);
}


/* ==========================================
   BUSINESS HOURS
   ========================================== */

function renderBusinessHours(hours) {

    const days = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ];

    $$("[data-hours-list], [data-business-hours]")
        .forEach(container => {

            container.replaceChildren();

            days.forEach(day => {

                const row = document.createElement("div");
                row.className = "hours-row";

                const label = document.createElement("span");
                label.textContent = day;

                const value = document.createElement("strong");
                value.textContent =
                    hours[day] || "Not listed";

                row.append(label, value);
                container.appendChild(row);
            });
        });
}


/* ==========================================
   SOCIAL LINKS
   ========================================== */

function renderSocialLinks(socials) {

    $$("[data-social-links]").forEach(container => {

        container.replaceChildren();

        Object.entries(socials).forEach(
            ([platform, url]) => {

                if (
                    typeof url !== "string" ||
                    !/^https?:\/\//i.test(url)
                ) {
                    return;
                }

                const link = document.createElement("a");

                link.className = "social-link";
                link.href = url;
                link.target = "_blank";
                link.rel = "noopener noreferrer";

                link.textContent =
                    platform.charAt(0).toUpperCase() +
                    platform.slice(1) + " ↗";

                container.appendChild(link);
            }
        );

        container.hidden =
            container.children.length === 0;
    });
}


/* ==========================================
   DATE AND TIME FORMATTING
   ========================================== */

function ordinalSuffix(day) {

    if (day >= 11 && day <= 13) {
        return "th";
    }

    switch (day % 10) {
        case 1: return "st";
        case 2: return "nd";
        case 3: return "rd";
        default: return "th";
    }
}


function formatDate(value) {

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) {
        return "Not specified";
    }

    const [year, month, day] =
        value.split("-").map(Number);

    // Local noon avoids UTC date shifts.
    const date = new Date(year, month - 1, day, 12);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month - 1 ||
        date.getDate() !== day
    ) {
        return "Invalid date";
    }

    const weekday = new Intl.DateTimeFormat(
        "en-US",
        { weekday: "long" }
    ).format(date);

    const monthName = new Intl.DateTimeFormat(
        "en-US",
        { month: "long" }
    ).format(date);

    return (
        weekday + ", " +
        monthName + " " +
        day + ordinalSuffix(day) + ", " +
        year
    );
}


function formatTime(value) {

    if (!/^\d{2}:\d{2}$/.test(value || "")) {
        return "Not specified";
    }

    const [hour, minute] =
        value.split(":").map(Number);

    if (
        hour < 0 || hour > 23 ||
        minute < 0 || minute > 59
    ) {
        return "Invalid time";
    }

    const hour12 = hour % 12 || 12;

    return (
        hour12 + ":" +
        String(minute).padStart(2, "0") +
        (hour >= 12 ? " PM" : " AM")
    );
}


function todayISO() {

    const date = new Date();

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function dumpsterDescription(size) {

    const options = {
        "18": "18 Yard Dumpster - $350",
        "24": "24 Yard Dumpster - $400",
        "30": "30 Yard Dumpster - $450",
        "unsure": "Not sure yet"
    };

    return options[size] || "Not selected";
}


/* ==========================================
   REQUEST FORM HELPERS
   ========================================== */

function getValue(data, name) {
    return String(data.get(name) || "").trim();
}


function setFormStatus(message, error = false) {

    const status = $("#formStatus");

    if (!status) return;

    status.textContent = message;

    status.style.color = error
        ? "#ff9b91"
        : "var(--green, #89bb27)";
}


function getDeliverySchedule(data) {

    const date = formatDate(
        getValue(data, "preferred_delivery_date")
    );

    if (
        getValue(data, "delivery_time_preference") !== "window"
    ) {
        return date + " | Any time";
    }

    const earliest = formatTime(
        getValue(data, "earliest_time")
    );

    const latest = formatTime(
        getValue(data, "latest_time")
    );

    return date + " | " + earliest + " - " + latest;
}


function getServiceAddress(data) {

    return [
        getValue(data, "delivery_address"),
        getValue(data, "delivery_city"),
        "MO " + getValue(data, "delivery_zip")
    ].join(", ");
}


/* ==========================================
   FORMATTED FORMSPREE NOTIFICATIONS
   ========================================== */

function buildRequestSummary(data) {

    const value = name => getValue(data, name);

    const isTrash =
        value("service_type") === "trash";

    const header = isTrash
        ? "WEEKLY TRASH PICKUP SIGNUP"
        : "DUMPSTER RENTAL REQUEST";

    const lines = [
        "DUMPSTERRIFIC - " + header,
        "======================================",
        "",
        "CUSTOMER INFORMATION",
        "--------------------------------------",
        "Name: " + value("name"),
        "Phone: " + value("phone"),
        "Email: " + value("email"),
        "",
        "SERVICE ADDRESS",
        "--------------------------------------",
        getServiceAddress(data),
        "",
        "SERVICE DETAILS",
        "--------------------------------------"
    ];

    if (isTrash) {

        lines.push(
            "Service: Weekly Trash Pickup",
            "Advertised Rate: $30 / Month",
            "Pickup Day: Tuesday",
            "Preferred Start: " +
                formatDate(value("trash_start_date")),
            "Number of Trash Cans: " +
                value("trash_cans")
        );

    } else {

        lines.push(
            "Service: Dumpster Rental",
            "Dumpster: " +
                dumpsterDescription(value("dumpster")),
            "Rental Period: " +
                value("rental_period"),
            "Material Type: " +
                value("materials"),
            "Preferred Delivery: " +
                getDeliverySchedule(data),
            "Delivery / Placement Instructions: " +
                (value("placement") || "Not specified")
        );
    }

    lines.push(
        "",
        "ADDITIONAL NOTES",
        "--------------------------------------",
        value("message") || "No additional notes.",
        "",
        "======================================",
        "Inquiry only - service not yet confirmed."
    );

    return lines.join("\n");
}


/* ==========================================
   FORMSPREE ERROR HANDLING
   ========================================== */

function formspreeError(data, status) {

    if (status === 429) {
        return "Too many requests. Please try again later.";
    }

    if (data && Array.isArray(data.errors)) {

        const messages = data.errors
            .map(item => item.message)
            .filter(Boolean);

        if (messages.length) {
            return messages.join(" ");
        }
    }

    if (data && typeof data.error === "string") {
        return data.error;
    }

    return (
        "Your request could not be submitted. " +
        "Please try again or call Dumpsterrific."
    );
}


/* ==========================================
   MULTI-STEP SERVICE REQUEST WIZARD
   ========================================== */

function setupRequestWizard() {

    const form = $("#rentalForm");

    if (!form || form.dataset.initialized === "true") {
        return;
    }

    form.dataset.initialized = "true";

    const steps = $$(".wizard-step", form);

    const progressItems = $$(".wizard-progress-item", form);

    const nextButton = $("#wizardNext");
    const backButton = $("#wizardBack");
    const submitButton = $("#submitRental");

    const dumpsterPanel = $("#dumpsterFields");
    const trashPanel = $("#trashFields");

    const earliest = $("#earliestTime");
    const latest = $("#latestTime");
    const timeWindowFields = $("#timeWindowFields");

    const deliveryDate = $("#deliveryDate");
    const trashStart = $("#trashStart");

    const serviceRadios = $$(
        'input[name="service_type"]',
        form
    );

    const successPanel = $("#formSuccess");

    if (
        steps.length !== 4 ||
        !nextButton ||
        !backButton ||
        !submitButton
    ) {
        console.error("Request wizard markup is incomplete.");
        return;
    }

    let currentStep = 0;
    let submitting = false;

    // Track which fields are normally required.
    [
        dumpsterPanel,
        trashPanel
    ].forEach(panel => {

        if (!panel) return;

        $$("input, select, textarea", panel)
            .forEach(field => {

                field.dataset.requiredOriginally =
                    field.required ? "true" : "false";
            });
    });


    /* --------------------------------------
       SELECTED SERVICE
       -------------------------------------- */

    function selectedService() {

        return $(
            'input[name="service_type"]:checked',
            form
        )?.value || "";
    }


    /* --------------------------------------
       ENABLE/DISABLE SERVICE FIELDS
       -------------------------------------- */

    function togglePanel(panel, enabled) {

        if (!panel) return;

        panel.hidden = !enabled;

        $$("input, select, textarea", panel)
            .forEach(field => {

                field.disabled = !enabled;

                field.required =
                    enabled &&
                    field.dataset.requiredOriginally === "true";
            });
    }


    /* --------------------------------------
       DELIVERY TIME WINDOW
       -------------------------------------- */

    function updateTimeWindow() {

        if (
            !earliest ||
            !latest ||
            !timeWindowFields
        ) {
            return;
        }

        const useWindow =
            selectedService() === "dumpster" &&
            $("#timeWindow")?.checked;

        timeWindowFields.hidden = !useWindow;

        earliest.disabled = !useWindow;
        latest.disabled = !useWindow;

        earliest.required = !!useWindow;
        latest.required = !!useWindow;

        earliest.setCustomValidity("");
        latest.setCustomValidity("");
    }


    function validateTimeWindow() {

        if (
            selectedService() !== "dumpster" ||
            !$("#timeWindow")?.checked
        ) {
            return true;
        }

        if (!earliest || !latest) {
            return false;
        }

        latest.setCustomValidity("");

        if (
            earliest.value &&
            latest.value &&
            earliest.value >= latest.value
        ) {
            latest.setCustomValidity(
                "Latest delivery time must be " +
                "after earliest delivery time."
            );

            return false;
        }

        return true;
    }


    /* --------------------------------------
       CHANGE SERVICE
       -------------------------------------- */

    function updateService() {

        const service = selectedService();

        togglePanel(
            dumpsterPanel,
            service === "dumpster"
        );

        togglePanel(
            trashPanel,
            service === "trash"
        );

        updateTimeWindow();
    }


    serviceRadios.forEach(radio => {
        radio.addEventListener(
            "change",
            updateService
        );
    });

    $$(
        'input[name="delivery_time_preference"]',
        form
    ).forEach(radio => {
        radio.addEventListener(
            "change",
            updateTimeWindow
        );
    });

    [earliest, latest].forEach(input => {
        input?.addEventListener(
            "input",
            validateTimeWindow
        );
        input?.addEventListener(
            "change",
            validateTimeWindow
        );
    });


    /* --------------------------------------
       MINIMUM REQUESTED DATES
       -------------------------------------- */

    function updateDateMinimums() {

        const today = todayISO();

        if (deliveryDate) {
            deliveryDate.min = today;
        }

        if (trashStart) {
            trashStart.min = today;
        }
    }


    /* --------------------------------------
       PRESELECT VIA URL
       -------------------------------------- */

    const params = new URLSearchParams(
        window.location.search
    );

    const requestedService = params.get("service");
    const rental = params.get("rental") ||
                   params.get("dumpster");

    if (
        requestedService === "trash" ||
        requestedService === "dumpster"
    ) {
        const radio = $(
            `input[name="service_type"][value="${requestedService}"]`,
            form
        );

        if (radio) radio.checked = true;

    } else if (
        ["18", "24", "30", "unsure"].includes(rental)
    ) {
        const radio = $(
            'input[name="service_type"][value="dumpster"]',
            form
        );

        if (radio) radio.checked = true;
    }

    if (
        ["18", "24", "30", "unsure"].includes(rental)
    ) {
        const dumpsterSelect = $("#dumpster");

        if (dumpsterSelect) {
            dumpsterSelect.value = rental;
        }
    }

    updateService();
    updateDateMinimums();


    /* --------------------------------------
       SHOW CURRENT STEP
       -------------------------------------- */

    function showStep(stepNumber) {

        currentStep = Math.max(
            0,
            Math.min(stepNumber, steps.length - 1)
        );

        steps.forEach((step, index) => {
            step.hidden = index !== currentStep;
        });

        progressItems.forEach((item, index) => {

            item.classList.toggle(
                "active",
                index === currentStep
            );

            item.classList.toggle(
                "completed",
                index < currentStep
            );

            if (index === currentStep) {
                item.setAttribute("aria-current", "step");
            } else {
                item.removeAttribute("aria-current");
            }
        });

        backButton.hidden = currentStep === 0;
        nextButton.hidden = currentStep === 3;
        submitButton.hidden = currentStep !== 3;

        setFormStatus("");

        if (currentStep === 3) {
            renderRequestReview();
        }
    }


    /* --------------------------------------
       VALIDATE A SINGLE STEP
       -------------------------------------- */

    function validateStep(index) {

        const step = steps[index];

        if (!step) return false;

        if (index === 0 && !selectedService()) {

            setFormStatus(
                "Please select a service to continue.",
                true
            );

            return false;
        }

        if (index === 2) {

            updateDateMinimums();

            if (!validateTimeWindow()) {
                latest?.reportValidity();
                return false;
            }
        }

        const fields = $$(
            "input, select, textarea",
            step
        );

        for (const field of fields) {

            if (field.disabled) continue;

            // Skip controls inside hidden panels.
            if (field.closest("[hidden]")) continue;

            if (!field.checkValidity()) {

                field.reportValidity();
                field.focus();

                return false;
            }
        }

        return true;
    }


    /* --------------------------------------
       REVIEW SUMMARY
       -------------------------------------- */

    function addReviewRow(container, label, value) {

        const row = document.createElement("div");
        row.className = "wizard-summary-row";

        const labelElement = document.createElement("span");
        labelElement.textContent = label;

        const valueElement = document.createElement("strong");
        valueElement.textContent = value || "Not specified";

        row.append(labelElement, valueElement);
        container.appendChild(row);
    }


    function renderRequestReview() {

        const container = $("#requestReview");

        if (!container) return;

        container.replaceChildren();

        const data = new FormData(form);

        const value = name => getValue(data, name);

        const isTrash = selectedService() === "trash";

        addReviewRow(
            container,
            "Service",
            isTrash ? "Weekly Trash Pickup" : "Dumpster Rental"
        );

        addReviewRow(
            container,
            "Name",
            value("name")
        );

        addReviewRow(
            container,
            "Phone",
            value("phone")
        );

        addReviewRow(
            container,
            "Email",
            value("email")
        );

        addReviewRow(
            container,
            "Address",
            getServiceAddress(data)
        );

        if (isTrash) {

            addReviewRow(
                container,
                "Monthly Price",
                "$30 advertised"
            );

            addReviewRow(
                container,
                "Pickup Day",
                "Tuesday"
            );

            addReviewRow(
                container,
                "Preferred Start",
                formatDate(value("trash_start_date"))
            );

            addReviewRow(
                container,
                "Trash Cans",
                value("trash_cans")
            );

        } else {

            addReviewRow(
                container,
                "Dumpster",
                dumpsterDescription(value("dumpster"))
            );

            addReviewRow(
                container,
                "Rental Period",
                value("rental_period")
            );

            addReviewRow(
                container,
                "Materials",
                value("materials")
            );

            addReviewRow(
                container,
                "Delivery",
                getDeliverySchedule(data)
            );

            addReviewRow(
                container,
                "Placement",
                value("placement") || "Not specified"
            );
        }
    }


    /* --------------------------------------
       NEXT / BACK BUTTONS
       -------------------------------------- */

    nextButton.addEventListener("click", () => {

        if (!validateStep(currentStep)) return;

        showStep(currentStep + 1);
    });

    backButton.addEventListener("click", () => {
        showStep(currentStep - 1);
    });


    /* --------------------------------------
       FORM SUBMISSION
       -------------------------------------- */

    form.addEventListener("submit", async event => {

        event.preventDefault();

        if (submitting) return;

        // Verify every step before submitting.
        for (let index = 0; index < steps.length; index++) {

            if (!validateStep(index)) {
                showStep(index);
                validateStep(index);
                return;
            }
        }

        const endpoint = form.action;

        if (
            !endpoint.startsWith("https://formspree.io/f/") ||
            endpoint.includes("REPLACE_WITH_FORM_ID")
        ) {
            setFormStatus(
                "Formspree has not been configured yet.",
                true
            );
            return;
        }

        const data = new FormData(form);
        const service = selectedService();
        const customer = getValue(data, "name");

        const isTrash = service === "trash";

        const subject = isTrash
            ? "Dumpsterrific - Trash Pickup Signup - " + customer
            : "Dumpsterrific - Dumpster Request - " +
                dumpsterDescription(getValue(data, "dumpster")) +
                " - " + customer;

        const summary = buildRequestSummary(data);

        // Submit the clean formatted notification.
        const payload = new FormData();

        payload.append("subject", subject);

        payload.append(
            "Service Requested",
            isTrash ? "Weekly Trash Pickup" : "Dumpster Rental"
        );

        payload.append("name", customer);
        payload.append("email", getValue(data, "email"));
        payload.append("phone", getValue(data, "phone"));

        payload.append(
            "Service Request Details",
            summary
        );

        payload.append(
            "_gotcha",
            getValue(data, "_gotcha")
        );

        submitting = true;

        submitButton.disabled = true;
        submitButton.textContent = "Submitting...";

        backButton.disabled = true;

        setFormStatus("Submitting your request...");

        try {

            const response = await fetch(endpoint, {
                method: "POST",
                body: payload,
                headers: {
                    Accept: "application/json"
                }
            });

            const result = await response.json()
                .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    formspreeError(result, response.status)
                );
            }

            form.hidden = true;
            form.style.display = "none";

            if (successPanel) {
                successPanel.hidden = false;

                successPanel.scrollIntoView({
                    behavior: "smooth",
                    block: "center"
                });
            }

        } catch (error) {

            console.error(
                "[Dumpsterrific] Submission error:",
                error
            );

            setFormStatus(
                error instanceof TypeError
                    ? "Unable to connect to Formspree. " +
                      "Please check your connection and try again."
                    : error.message,
                true
            );

        } finally {

            submitting = false;
            submitButton.disabled = false;
            submitButton.textContent = "Submit Request →";
            backButton.disabled = false;
        }
    });


    // Start with service selection.
    showStep(0);
}


/* ==========================================
   INITIALIZATION
   ========================================== */

async function initialize() {

    setupNavigation();
    setupCopyright();
    setupRequestWizard();

    await loadConfig();
}

if (document.readyState === "loading") {

    document.addEventListener(
        "DOMContentLoaded",
        initialize
    );

} else {

    initialize();
}
