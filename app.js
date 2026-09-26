"use strict";

const WEB_ME = {
    countries: [
        "Afghanistan",
        "Albania",
        "Algeria",
        "Andorra",
        "Angola",
        "Argentina",
        "Australia",
        "Austria",
        "Bahamas",
        "Bahrain",
        "Bangladesh",
        "Barbados",
        "Belgium",
        "Benin",
        "Botswana",
        "Brazil",
        "Bulgaria",
        "Burkina Faso",
        "Burundi",
        "Cameroon",
        "Canada",
        "Chad",
        "Chile",
        "China",
        "Colombia",
        "Congo",
        "Croatia",
        "Cyprus",
        "Czech Republic",
        "Denmark",
        "Egypt",
        "Ethiopia",
        "Finland",
        "France",
        "Gabon",
        "Gambia",
        "Georgia",
        "Germany",
        "Ghana",
        "Greece",
        "Guinea",
        "Guinea-Bissau",
        "India",
        "Indonesia",
        "Ireland",
        "Israel",
        "Italy",
        "Ivory Coast",
        "Jamaica",
        "Japan",
        "Jordan",
        "Kenya",
        "Kuwait",
        "Lebanon",
        "Liberia",
        "Libya",
        "Madagascar",
        "Malawi",
        "Malaysia",
        "Mali",
        "Malta",
        "Mauritania",
        "Mauritius",
        "Mexico",
        "Morocco",
        "Mozambique",
        "Namibia",
        "Netherlands",
        "New Zealand",
        "Niger",
        "Nigeria",
        "Norway",
        "Oman",
        "Pakistan",
        "Peru",
        "Philippines",
        "Poland",
        "Portugal",
        "Qatar",
        "Romania",
        "Rwanda",
        "Saudi Arabia",
        "Senegal",
        "Serbia",
        "Sierra Leone",
        "Singapore",
        "Slovakia",
        "Slovenia",
        "Somalia",
        "South Africa",
        "South Korea",
        "Spain",
        "Sri Lanka",
        "Sudan",
        "Sweden",
        "Switzerland",
        "Tanzania",
        "Thailand",
        "Togo",
        "Trinidad and Tobago",
        "Tunisia",
        "Turkey",
        "Uganda",
        "Ukraine",
        "United Arab Emirates",
        "United Kingdom",
        "United States",
        "Uruguay",
        "Venezuela",
        "Vietnam",
        "Zambia",
        "Zimbabwe"
    ],

    selectedCountry: "",
    businesses: [],
    filteredBusinesses: [],
    selectedBusiness: null,
    currentPage: 1,
    pageSize: 8,

    filters: {
        noWebsite: false,
        website: false,
        instagram: false,
        facebook: false,
        tiktok: false,
        linkedin: false,
        x: false,
        youtube: false,
        whatsapp: false,
        researchCompleted: false,
        rating: 0
    },

    savedLeads: [],
    searchRunning: false
};

const $ = id => document.getElementById(id);

const el = {
    countryButton: $("countryButton"),
    countryMenu: $("countryMenu"),
    countrySearch: $("countrySearch"),
    countryOptions: $("countryOptions"),

    areaInput: $("areaInput"),
    businessTypeInput: $("businessTypeInput"),
    searchButton: $("searchButton"),

    businessesFound: $("businessesFound"),
    noWebsiteFound: $("noWebsiteFound"),
    websiteFound: $("websiteFound"),
    researchCompleted: $("researchCompleted"),

    resultsTable: $("resultsTable"),
    resultsTableBody: $("resultsTableBody"),
    emptyState: $("emptyState"),
    loadingState: $("loadingState"),
    pagination: $("pagination"),
    activeFilters: $("activeFilters"),

    detailsPanel: $("detailsPanel"),
    closeDetails: $("closeDetails"),

    detailsBusinessName: $("detailsBusinessName"),
    detailsBusinessType: $("detailsBusinessType"),
    detailsWebsiteStatus: $("detailsWebsiteStatus"),
    detailsConfidence: $("detailsConfidence"),

    detailName: $("detailName"),
    detailType: $("detailType"),
    detailAddress: $("detailAddress"),
    detailRating: $("detailRating"),
    detailReviews: $("detailReviews"),
    detailHours: $("detailHours"),
    detailPhone: $("detailPhone"),
    detailWhatsapp: $("detailWhatsapp"),
    detailEmail: $("detailEmail"),
    detailMaps: $("detailMaps"),

    detailWebsiteStatusLarge: $("detailWebsiteStatusLarge"),
    websiteTitle: $("websiteTitle"),
    websiteReachable: $("websiteReachable"),
    websiteFinalUrl: $("websiteFinalUrl"),
    websiteEvidenceText: $("websiteEvidenceText"),

    socialInstagram: $("socialInstagram"),
    socialFacebook: $("socialFacebook"),
    socialTikTok: $("socialTikTok"),
    socialLinkedin: $("socialLinkedin"),
    socialX: $("socialX"),
    socialYoutube: $("socialYoutube"),

    instagramStatus: $("instagramStatus"),
    facebookStatus: $("facebookStatus"),
    tiktokStatus: $("tiktokStatus"),
    linkedinStatus: $("linkedinStatus"),
    xStatus: $("xStatus"),
    youtubeStatus: $("youtubeStatus"),

    detailResearchStatus: $("detailResearchStatus"),
    detailResearchReason: $("detailResearchReason"),
    detailDescription: $("detailDescription"),
    detailServices: $("detailServices"),

    detailBusinessStatus: $("detailBusinessStatus"),
    detailPriceLevel: $("detailPriceLevel"),
    detailResearchState: $("detailResearchState"),
    detailOpportunity: $("detailOpportunity"),
    detailSources: $("detailSources"),

    websiteBriefButton: $("websiteBriefButton"),
    saveLeadButton: $("saveLeadButton"),
    askWebMeButton: $("askWebMeButton"),
    openMapsButton: $("openMapsButton"),

    filterPanel: $("filterPanel"),
    closeFilter: $("closeFilter"),

    filterNoWebsite: $("filterNoWebsite"),
    filterWebsite: $("filterWebsite"),
    filterInstagram: $("filterInstagram"),
    filterFacebook: $("filterFacebook"),
    filterTikTok: $("filterTikTok"),
    filterLinkedin: $("filterLinkedin"),
    filterX: $("filterX"),
    filterYoutube: $("filterYoutube"),
    filterWhatsapp: $("filterWhatsapp"),
    ratingFilter: $("ratingFilter"),
    ratingValue: $("ratingValue"),
    filterResearchCompleted: $("filterResearchCompleted"),
    clearFilters: $("clearFilters"),
    applyFilters: $("applyFilters"),

    aiPanel: $("aiPanel"),
    openAi: $("openAi"),
    closeAi: $("closeAi"),
    aiContextName: $("aiContextName"),
    aiMessages: $("aiMessages"),
    aiInput: $("aiInput"),
    aiSend: $("aiSend")
};

document.addEventListener("DOMContentLoaded", startWebMe);

function startWebMe() {
    loadSavedLeads();
    buildCountryPicker();
    setupCountryPicker();
    setupSearch();
    setupFilters();
    setupDetails();
    setupAI();
    setupNavigation();
    setupExtraButtons();

    updateStats();
    renderResults();
}

function loadSavedLeads() {
    try {
        WEB_ME.savedLeads =
            JSON.parse(localStorage.getItem("webMeSavedLeads")) || [];
    } catch {
        WEB_ME.savedLeads = [];
    }
}

function saveLocalData() {
    localStorage.setItem(
        "webMeSavedLeads",
        JSON.stringify(WEB_ME.savedLeads)
    );
}

function buildCountryPicker() {
    if (!el.countryOptions) return;

    el.countryOptions.innerHTML = "";

    WEB_ME.countries.forEach(country => {
        const option = document.createElement("button");

        option.type = "button";
        option.className = "country-option";
        option.dataset.countryOption = country;
        option.textContent = country;

        option.addEventListener("click", () => {
            selectCountry(country);
        });

        el.countryOptions.appendChild(option);
    });
}

function setupCountryPicker() {
    if (el.countryButton) {
        el.countryButton.addEventListener("click", event => {
            event.stopPropagation();

            el.countryMenu?.classList.toggle("open");
            el.countryButton.classList.toggle("active");
        });
    }

    if (el.countrySearch) {
        el.countrySearch.addEventListener("input", () => {
            filterCountries(el.countrySearch.value);
        });
    }

    document.addEventListener("click", event => {
        if (
            el.countryMenu &&
            !el.countryMenu.contains(event.target) &&
            !el.countryButton?.contains(event.target)
        ) {
            closeCountryMenu();
        }
    });
}

function filterCountries(search) {
    const query = search.toLowerCase().trim();

    document.querySelectorAll("[data-country-option]").forEach(option => {
        const country = option.textContent.toLowerCase();

        option.style.display =
            !query || country.includes(query)
                ? ""
                : "none";
    });
}

function selectCountry(country) {
    WEB_ME.selectedCountry = country;

    if (el.countryButton) {
        el.countryButton.dataset.value = country;

        const label = el.countryButton.querySelector(
            "[data-country-label]"
        );

        if (label) {
            label.textContent = country;
        } else {
            const existingText =
                el.countryButton.querySelector(".country-label");

            if (existingText) {
                existingText.textContent = country;
            } else {
                el.countryButton.textContent = country;
            }
        }
    }

    if (el.countrySearch) {
        el.countrySearch.value = "";
        filterCountries("");
    }

    closeCountryMenu();
}

function closeCountryMenu() {
    el.countryMenu?.classList.remove("open");
    el.countryButton?.classList.remove("active");
}

function setupSearch() {
    el.searchButton?.addEventListener("click", runSearch);

    [el.areaInput, el.businessTypeInput].forEach(input => {
        input?.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                runSearch();
            }
        });
    });
}

async function runSearch() {
    if (WEB_ME.searchRunning) return;

    const country =
        WEB_ME.selectedCountry ||
        el.countryButton?.dataset.value ||
        "";

    const area = el.areaInput?.value.trim() || "";
    const businessType =
        el.businessTypeInput?.value.trim() || "";

    if (!country) {
        showToast("Select a country first.", "warning");
        openCountryPicker();
        return;
    }

    if (!businessType) {
        showToast("Enter a business type.", "warning");
        el.businessTypeInput?.focus();
        return;
    }

    WEB_ME.searchRunning = true;

    setSearchLoading(true);
    showLoading();

    await loadingStage("Finding businesses", 500);
    await loadingStage("Checking websites", 450);
    await loadingStage("Researching public presence", 450);
    await loadingStage("Verifying opportunities", 350);

    WEB_ME.businesses = createPreviewResults(
        country,
        area,
        businessType
    );

    WEB_ME.filteredBusinesses = [...WEB_ME.businesses];
    WEB_ME.currentPage = 1;

    hideLoading();
    setSearchLoading(false);

    updateStats();
    renderResults();

    showToast(
        `${WEB_ME.businesses.length} businesses found for preview.`,
        "success"
    );

    WEB_ME.searchRunning = false;
}

function createPreviewResults(country, area, businessType) {
    const locations = area
        ? [area]
        : [
            "Central Business District",
            "Main Commercial Area",
            "City Centre",
            "Market District",
            "Business District",
            "Industrial Area",
            "Town Centre",
            "Downtown"
        ];

    return locations.map((location, index) => ({
        id: `preview-${Date.now()}-${index}`,

        name: `${businessType} — Preview ${index + 1}`,
        type: businessType,
        address: `${location}, ${country}`,
        city: location,
        country,

        phone: "",
        whatsapp: "",
        email: "",

        website: index % 3 === 0
            ? `https://example.com/business-${index + 1}`
            : "",

        websiteReachable: index % 3 === 0,

        finalUrl: index % 3 === 0
            ? `https://example.com/business-${index + 1}`
            : "",

        rating: [4.8, 4.5, 4.2, 3.9, 4.6, 3.7, 4.1, 4.4][index],

        reviews: [231, 87, 54, 18, 126, 9, 73, 42][index],

        hours: "Not verified in preview",

        social: {
            instagram: index % 2 === 0
                ? "https://instagram.com/"
                : "",

            facebook: index % 3 === 0
                ? "https://facebook.com/"
                : "",

            tiktok: index % 4 === 0
                ? "https://tiktok.com/"
                : "",

            linkedin: index % 5 === 0
                ? "https://linkedin.com/"
                : "",

            x: "",
            youtube: index % 3 === 1
                ? "https://youtube.com/"
                : ""
        },

        researchCompleted: index % 2 === 0,

        research: {
            status: index % 2 === 0
                ? "Preview research"
                : "Not researched",

            reason:
                "This is interface preview information. Connect the backend APIs to perform real public-web research.",

            description:
                "Preview record only. No real business information is being claimed.",

            services: [
                "Business services will appear here after live research."
            ],

            businessStatus: "Not verified",

            priceLevel: "Not verified",

            opportunity:
                "Real opportunity analysis will be generated from verified public information.",

            sources: []
        },

        confidence: null,

        mapsUrl: ""
    }));
}

function loadingStage(name, time) {
    updateLoadingStage(name);

    return new Promise(resolve => {
        setTimeout(resolve, time);
    });
}

function showLoading() {
    if (!el.loadingState) return;

    el.loadingState.classList.remove("hidden");

    el.emptyState?.classList.add("hidden");
}

function hideLoading() {
    el.loadingState?.classList.add("hidden");
}

function updateLoadingStage(stage) {
    if (!el.loadingState) return;

    const stageText =
        el.loadingState.querySelector("[data-loading-stage]");

    if (stageText) {
        stageText.textContent = stage;
    }

    document.querySelectorAll("[data-stage]").forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.stage === stage
        );
    });
}

function setSearchLoading(loading) {
    if (!el.searchButton) return;

    if (loading) {
        el.searchButton.disabled = true;
        el.searchButton.dataset.originalText =
            el.searchButton.textContent;

        el.searchButton.textContent = "Searching...";
    } else {
        el.searchButton.disabled = false;

        el.searchButton.textContent =
            el.searchButton.dataset.originalText ||
            "Search Businesses";
    }
}

function renderResults() {
    if (!el.resultsTableBody) return;

    el.resultsTableBody.innerHTML = "";

    if (!WEB_ME.filteredBusinesses.length) {
        el.resultsTable?.classList.add("hidden");
        el.emptyState?.classList.remove("hidden");
        renderPagination();
        return;
    }

    el.resultsTable?.classList.remove("hidden");
    el.emptyState?.classList.add("hidden");

    const start =
        (WEB_ME.currentPage - 1) *
        WEB_ME.pageSize;

    const end =
        start +
        WEB_ME.pageSize;

    WEB_ME.filteredBusinesses
        .slice(start, end)
        .forEach(business => {
            el.resultsTableBody.appendChild(
                createBusinessRow(business)
            );
        });

    renderPagination();
    renderActiveFilters();
}

function createBusinessRow(business) {
    const row = document.createElement("tr");

    const website = business.website;

    const websiteLabel = website
        ? "Website found"
        : "No website";

    const websiteClass = website
        ? "status-success"
        : "status-danger";

    row.innerHTML = `
        <td>
            <div class="business-cell">
                <div class="business-avatar">
                    ${escapeHTML(initials(business.name))}
                </div>

                <div>
                    <div class="business-name">
                        ${escapeHTML(business.name)}
                    </div>

                    <div class="business-subtext">
                        ${escapeHTML(business.type)}
                    </div>
                </div>
            </div>
        </td>

        <td>
            ${escapeHTML(business.type)}
        </td>

        <td>
            ${escapeHTML(business.address)}
        </td>

        <td>
            <span class="status-badge ${websiteClass}">
                ${websiteLabel}
            </span>
        </td>

        <td>
            ${business.rating.toFixed(1)}
        </td>

        <td>
            ${business.reviews.toLocaleString()}
        </td>

        <td>
            <div class="online-presence">
                ${presenceHTML(business)}
            </div>
        </td>

        <td>
            <button
                type="button"
                class="table-action-button"
                data-view-id="${escapeAttribute(business.id)}"
            >
                View
            </button>
        </td>
    `;

    row.querySelector("[data-view-id]")
        ?.addEventListener("click", () => {
            openDetails(business);
        });

    return row;
}

function presenceHTML(business) {
    const platforms = [];

    if (business.social.instagram) platforms.push("Instagram");
    if (business.social.facebook) platforms.push("Facebook");
    if (business.social.tiktok) platforms.push("TikTok");
    if (business.social.linkedin) platforms.push("LinkedIn");
    if (business.social.x) platforms.push("X");
    if (business.social.youtube) platforms.push("YouTube");

    if (!platforms.length) {
        return `<span class="presence-none">None found</span>`;
    }

    return platforms
        .slice(0, 3)
        .map(
            platform =>
                `<span class="presence-item">${platform}</span>`
        )
        .join("");
}

function renderPagination() {
    if (!el.pagination) return;

    el.pagination.innerHTML = "";

    const totalPages = Math.ceil(
        WEB_ME.filteredBusinesses.length /
        WEB_ME.pageSize
    );

    if (totalPages <= 1) return;

    const previous = paginationButton(
        "Previous",
        WEB_ME.currentPage > 1,
        () => {
            WEB_ME.currentPage--;
            renderResults();
        }
    );

    el.pagination.appendChild(previous);

    for (let page = 1; page <= totalPages; page++) {
        const button = paginationButton(
            String(page),
            true,
            () => {
                WEB_ME.currentPage = page;
                renderResults();
            }
        );

        if (page === WEB_ME.currentPage) {
            button.classList.add("active");
        }

        el.pagination.appendChild(button);
    }

    const next = paginationButton(
        "Next",
        WEB_ME.currentPage < totalPages,
        () => {
            WEB_ME.currentPage++;
            renderResults();
        }
    );

    el.pagination.appendChild(next);
}

function paginationButton(label, enabled, action) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "pagination-button";
    button.textContent = label;
    button.disabled = !enabled;

    if (enabled) {
        button.addEventListener("click", action);
    }

    return button;
}

function updateStats() {
    const data = WEB_ME.filteredBusinesses;

    const total = data.length;

    const noWebsite = data.filter(
        business => !business.website
    ).length;

    const website = data.filter(
        business => Boolean(business.website)
    ).length;

    const researched = data.filter(
        business => business.researchCompleted
    ).length;

    setText(el.businessesFound, total);
    setText(el.noWebsiteFound, noWebsite);
    setText(el.websiteFound, website);
    setText(el.researchCompleted, researched);
}

function setupDetails() {
    el.closeDetails?.addEventListener(
        "click",
        closeDetails
    );

    el.saveLeadButton?.addEventListener(
        "click",
        toggleSavedLead
    );

    el.openMapsButton?.addEventListener(
        "click",
        openMaps
    );

    el.websiteBriefButton?.addEventListener(
        "click",
        generateBrief
    );

    el.askWebMeButton?.addEventListener(
        "click",
        openAI
    );
}

function openDetails(business) {
    WEB_ME.selectedBusiness = business;

    populateDetails(business);

    el.detailsPanel?.classList.add("open");
    document.body.classList.add("details-open");
}

function closeDetails() {
    el.detailsPanel?.classList.remove("open");
    document.body.classList.remove("details-open");
}

function populateDetails(business) {
    setText(
        el.detailsBusinessName,
        business.name
    );

    setText(
        el.detailsBusinessType,
        business.type
    );

    setText(
        el.detailsWebsiteStatus,
        business.website
            ? "Website found"
            : "No website"
    );

    setText(
        el.detailsConfidence,
        "Preview"
    );

    setText(el.detailName, business.name);
    setText(el.detailType, business.type);
    setText(el.detailAddress, business.address);
    setText(el.detailRating, business.rating.toFixed(1));
    setText(
        el.detailReviews,
        business.reviews.toLocaleString()
    );
    setText(el.detailHours, business.hours);
    setText(
        el.detailPhone,
        business.phone || "Not available"
    );
    setText(
        el.detailWhatsapp,
        business.whatsapp || "Not found"
    );
    setText(
        el.detailEmail,
        business.email || "Not found"
    );

    if (el.detailMaps) {
        if (business.mapsUrl) {
            el.detailMaps.href = business.mapsUrl;
            el.detailMaps.classList.remove("disabled");
        } else {
            el.detailMaps.href = "#";
            el.detailMaps.classList.add("disabled");
        }
    }

    setText(
        el.detailWebsiteStatusLarge,
        business.website
            ? "Website found"
            : "No website found"
    );

    setText(
        el.websiteTitle,
        business.website || "No website found"
    );

    setText(
        el.websiteReachable,
        business.website
            ? "Preview only"
            : "No website found"
    );

    if (el.websiteFinalUrl) {
        if (business.website) {
            el.websiteFinalUrl.href =
                business.website;

            el.websiteFinalUrl.textContent =
                business.website;
        } else {
            el.websiteFinalUrl.href = "#";
            el.websiteFinalUrl.textContent =
                "No website";
        }
    }

    setText(
        el.websiteEvidenceText,
        "Live website verification will be connected through the backend."
    );

    setSocial(
        el.socialInstagram,
        business.social.instagram
    );

    setSocial(
        el.socialFacebook,
        business.social.facebook
    );

    setSocial(
        el.socialTikTok,
        business.social.tiktok
    );

    setSocial(
        el.socialLinkedin,
        business.social.linkedin
    );

    setSocial(
        el.socialX,
        business.social.x
    );

    setSocial(
        el.socialYoutube,
        business.social.youtube
    );

    setSocialStatus(
        el.instagramStatus,
        business.social.instagram
    );

    setSocialStatus(
        el.facebookStatus,
        business.social.facebook
    );

    setSocialStatus(
        el.tiktokStatus,
        business.social.tiktok
    );

    setSocialStatus(
        el.linkedinStatus,
        business.social.linkedin
    );

    setSocialStatus(
        el.xStatus,
        business.social.x
    );

    setSocialStatus(
        el.youtubeStatus,
        business.social.youtube
    );

    setText(
        el.detailResearchStatus,
        business.research.status
    );

    setText(
        el.detailResearchReason,
        business.research.reason
    );

    setText(
        el.detailDescription,
        business.research.description
    );

    setText(
        el.detailServices,
        business.research.services.join(", ")
    );

    setText(
        el.detailBusinessStatus,
        business.research.businessStatus
    );

    setText(
        el.detailPriceLevel,
        business.research.priceLevel
    );

    setText(
        el.detailResearchState,
        business.research.status
    );

    setText(
        el.detailOpportunity,
        business.research.opportunity
    );

    renderSources(business.research.sources);

    updateSaveButton();
}

function setSocial(element, url) {
    if (!element) return;

    if (url) {
        element.href = url;
        element.target = "_blank";
        element.rel = "noopener noreferrer";
        element.classList.remove("disabled");
    } else {
        element.href = "#";
        element.classList.add("disabled");
        element.removeAttribute("target");
    }
}

function setSocialStatus(element, url) {
    if (!element) return;

    element.textContent =
        url ? "Found" : "Not found";

    element.classList.toggle(
        "active",
        Boolean(url)
    );
}

function renderSources(sources) {
    if (!el.detailSources) return;

    el.detailSources.innerHTML = "";

    if (!sources.length) {
        el.detailSources.innerHTML =
            `<span class="muted-text">No sources available.</span>`;
        return;
    }

    sources.forEach(source => {
        const item = document.createElement("a");

        item.href =
            typeof source === "string"
                ? source
                : source.url || "#";

        item.textContent =
            typeof source === "string"
                ? source
                : source.title || "Source";

        item.target = "_blank";
        item.rel = "noopener noreferrer";
        item.className = "source-link";

        el.detailSources.appendChild(item);
    });
}

function toggleSavedLead() {
    const business = WEB_ME.selectedBusiness;

    if (!business) return;

    const exists =
        WEB_ME.savedLeads.some(
            lead => lead.id === business.id
        );

    if (exists) {
        WEB_ME.savedLeads =
            WEB_ME.savedLeads.filter(
                lead => lead.id !== business.id
            );

        showToast(
            "Lead removed from saved leads.",
            "info"
        );
    } else {
        WEB_ME.savedLeads.push(business);

        showToast(
            "Lead saved successfully.",
            "success"
        );
    }

    saveLocalData();
    updateSaveButton();
}

function updateSaveButton() {
    if (!el.saveLeadButton) return;

    const business = WEB_ME.selectedBusiness;

    if (!business) return;

    const saved =
        WEB_ME.savedLeads.some(
            lead => lead.id === business.id
        );

    el.saveLeadButton.textContent =
        saved
            ? "Remove Saved Lead"
            : "Save Lead";

    el.saveLeadButton.classList.toggle(
        "saved",
        saved
    );
}

function openMaps() {
    const business = WEB_ME.selectedBusiness;

    if (!business) return;

    if (business.mapsUrl) {
        window.open(
            business.mapsUrl,
            "_blank"
        );
        return;
    }

    const query =
        encodeURIComponent(
            `${business.name} ${business.address}`
        );

    window.open(
        `https://www.google.com/maps/search/?api=1&query=${query}`,
        "_blank"
    );
}

function generateBrief() {
    if (!WEB_ME.selectedBusiness) {
        showToast(
            "Open a business first.",
            "warning"
        );
        return;
    }

    const opportunity =
        "Website intelligence and opportunity analysis will appear here after the live research backend is connected.";

    WEB_ME.selectedBusiness.research.opportunity =
        opportunity;

    setText(
        el.detailOpportunity,
        opportunity
    );

    showToast(
        "Preview brief generated.",
        "success"
    );
}

function setupFilters() {
    document.querySelectorAll(
        "[data-filter-open]"
    ).forEach(button => {
        button.addEventListener(
            "click",
            openFilters
        );
    });

    el.closeFilter?.addEventListener(
        "click",
        closeFilters
    );

    el.applyFilters?.addEventListener(
        "click",
        applyFilters
    );

    el.clearFilters?.addEventListener(
        "click",
        clearFilters
    );

    connectFilter(
        el.filterNoWebsite,
        "noWebsite"
    );

    connectFilter(
        el.filterWebsite,
        "website"
    );

    connectFilter(
        el.filterInstagram,
        "instagram"
    );

    connectFilter(
        el.filterFacebook,
        "facebook"
    );

    connectFilter(
        el.filterTikTok,
        "tiktok"
    );

    connectFilter(
        el.filterLinkedin,
        "linkedin"
    );

    connectFilter(
        el.filterX,
        "x"
    );

    connectFilter(
        el.filterYoutube,
        "youtube"
    );

    connectFilter(
        el.filterWhatsapp,
        "whatsapp"
    );

    connectFilter(
        el.filterResearchCompleted,
        "researchCompleted"
    );

    el.ratingFilter?.addEventListener(
        "input",
        () => {
            WEB_ME.filters.rating =
                Number(el.ratingFilter.value);

            if (el.ratingValue) {
                el.ratingValue.textContent =
                    WEB_ME.filters.rating
                        ? `${WEB_ME.filters.rating}+`
                        : "Any rating";
            }
        }
    );
}

function connectFilter(element, name) {
    element?.addEventListener(
        "change",
        () => {
            WEB_ME.filters[name] =
                element.checked;
        }
    );
}

function openFilters() {
    el.filterPanel?.classList.add("open");
    document.body.classList.add("filter-open");
}

function closeFilters() {
    el.filterPanel?.classList.remove("open");
    document.body.classList.remove("filter-open");
}

function applyFilters() {
    WEB_ME.filteredBusinesses =
        WEB_ME.businesses.filter(business => {
            if (
                WEB_ME.filters.noWebsite &&
                business.website
            ) {
                return false;
            }

            if (
                WEB_ME.filters.website &&
                !business.website
            ) {
                return false;
            }

            if (
                WEB_ME.filters.instagram &&
                !business.social.instagram
            ) {
                return false;
            }

            if (
                WEB_ME.filters.facebook &&
                !business.social.facebook
            ) {
                return false;
            }

            if (
                WEB_ME.filters.tiktok &&
                !business.social.tiktok
            ) {
                return false;
            }

            if (
                WEB_ME.filters.linkedin &&
                !business.social.linkedin
            ) {
                return false;
            }

            if (
                WEB_ME.filters.x &&
                !business.social.x
            ) {
                return false;
            }

            if (
                WEB_ME.filters.youtube &&
                !business.social.youtube
            ) {
                return false;
            }

            if (
                WEB_ME.filters.whatsapp &&
                !business.whatsapp
            ) {
                return false;
            }

            if (
                WEB_ME.filters.researchCompleted &&
                !business.researchCompleted
            ) {
                return false;
            }

            if (
                WEB_ME.filters.rating &&
                business.rating <
                WEB_ME.filters.rating
            ) {
                return false;
            }

            return true;
        });

    WEB_ME.currentPage = 1;

    updateStats();
    renderResults();
    closeFilters();

    showToast(
        `${WEB_ME.filteredBusinesses.length} result(s) match your filters.`,
        "info"
    );
}

function clearFilters() {
    WEB_ME.filters = {
        noWebsite: false,
        website: false,
        instagram: false,
        facebook: false,
        tiktok: false,
        linkedin: false,
        x: false,
        youtube: false,
        whatsapp: false,
        researchCompleted: false,
        rating: 0
    };

    [
        el.filterNoWebsite,
        el.filterWebsite,
        el.filterInstagram,
        el.filterFacebook,
        el.filterTikTok,
        el.filterLinkedin,
        el.filterX,
        el.filterYoutube,
        el.filterWhatsapp,
        el.filterResearchCompleted
    ].forEach(input => {
        if (input) input.checked = false;
    });

    if (el.ratingFilter) {
        el.ratingFilter.value = 0;
    }

    if (el.ratingValue) {
        el.ratingValue.textContent =
            "Any rating";
    }

    WEB_ME.filteredBusinesses =
        [...WEB_ME.businesses];

    WEB_ME.currentPage = 1;

    updateStats();
    renderResults();
}

function renderActiveFilters() {
    if (!el.activeFilters) return;

    el.activeFilters.innerHTML = "";

    const names = {
        noWebsite: "No website",
        website: "Website",
        instagram: "Instagram",
        facebook: "Facebook",
        tiktok: "TikTok",
        linkedin: "LinkedIn",
        x: "X",
        youtube: "YouTube",
        whatsapp: "WhatsApp",
        researchCompleted: "Research completed"
    };

    Object.keys(names).forEach(key => {
        if (!WEB_ME.filters[key]) return;

        const tag =
            document.createElement("span");

        tag.className = "filter-tag";
        tag.textContent = names[key];

        el.activeFilters.appendChild(tag);
    });

    if (WEB_ME.filters.rating) {
        const tag =
            document.createElement("span");

        tag.className = "filter-tag";
        tag.textContent =
            `${WEB_ME.filters.rating}+ rating`;

        el.activeFilters.appendChild(tag);
    }
}

function setupAI() {
    el.openAi?.addEventListener(
        "click",
        openAI
    );

    el.closeAi?.addEventListener(
        "click",
        closeAI
    );

    el.aiSend?.addEventListener(
        "click",
        sendAI
    );

    el.aiInput?.addEventListener(
        "keydown",
        event => {
            if (
                event.key === "Enter" &&
                !event.shiftKey
            ) {
                event.preventDefault();
                sendAI();
            }
        }
    );
}

function openAI() {
    el.aiPanel?.classList.add("open");
    document.body.classList.add("ai-open");

    setText(
        el.aiContextName,
        WEB_ME.selectedBusiness?.name ||
        "General research"
    );

    if (
        el.aiMessages &&
        !el.aiMessages.children.length
    ) {
        addAIMessage(
            "assistant",
            "Hi, I'm Web Me. Ask me anything about the business you're researching."
        );
    }

    el.aiInput?.focus();
}

function closeAI() {
    el.aiPanel?.classList.remove("open");
    document.body.classList.remove("ai-open");
}

function sendAI() {
    const message =
        el.aiInput?.value.trim();

    if (!message) return;

    addAIMessage(
        "user",
        message
    );

    el.aiInput.value = "";

    setTimeout(() => {
        let answer =
            "I'm ready to perform this research when the live Web Me backend is connected.";

        if (
            message.toLowerCase().includes("website")
        ) {
            answer =
                "I can check website availability, reachability, public evidence and online presence once live web research is connected.";
        }

        if (
            message.toLowerCase().includes("lead")
        ) {
            answer =
                "I can help identify business opportunities from verified public information once the live research engine is connected.";
        }

        addAIMessage(
            "assistant",
            answer
        );
    }, 500);
}

function addAIMessage(role, message) {
    if (!el.aiMessages) return;

    const messageElement =
        document.createElement("div");

    messageElement.className =
        `ai-message ${role}`;

    messageElement.innerHTML = `
        <div class="ai-message-content">
            ${escapeHTML(message)}
        </div>
    `;

    el.aiMessages.appendChild(
        messageElement
    );

    el.aiMessages.scrollTop =
        el.aiMessages.scrollHeight;
}

function setupNavigation() {
    document.querySelectorAll(
        "[data-section]"
    ).forEach(item => {
        item.addEventListener(
            "click",
            event => {
                const target =
                    item.dataset.section;

                if (!target) return;

                document.querySelectorAll(
                    "[data-section]"
                ).forEach(nav => {
                    nav.classList.remove(
                        "active"
                    );
                });

                item.classList.add("active");

                document.querySelectorAll(
                    "[data-section-content]"
                ).forEach(section => {
                    section.classList.remove(
                        "active"
                    );
                });

                document.querySelector(
                    `[data-section-content="${target}"]`
                )?.classList.add("active");
            }
        );
    });
}

function setupExtraButtons() {
    document.addEventListener(
        "click",
        event => {
            const action =
                event.target.closest(
                    "[data-action]"
                );

            if (!action) return;

            const type =
                action.dataset.action;

            if (type === "close-details") {
                closeDetails();
            }

            if (type === "close-filter") {
                closeFilters();
            }

            if (type === "close-ai") {
                closeAI();
            }

            if (type === "open-filter") {
                openFilters();
            }

            if (type === "open-ai") {
                openAI();
            }
        }
    );

    document.addEventListener(
        "keydown",
        event => {
            if (event.key === "Escape") {
                closeDetails();
                closeFilters();
                closeAI();
                closeCountryMenu();
            }

            if (
                (event.ctrlKey ||
                    event.metaKey) &&
                event.key.toLowerCase() === "k"
            ) {
                event.preventDefault();
                el.businessTypeInput?.focus();
            }
        }
    );
}

function openCountryPicker() {
    el.countryMenu?.classList.add("open");
    el.countryButton?.classList.add("active");
}

function showToast(message, type = "info") {
    let container =
        document.querySelector(
            ".toast-container"
        );

    if (!container) {
        container =
            document.createElement("div");

        container.className =
            "toast-container";

        document.body.appendChild(
            container
        );
    }

    const toast =
        document.createElement("div");

    toast.className =
        `toast toast-${type}`;

    toast.textContent = message;

    container.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 250);
    }, 3000);
}

function setText(element, value) {
    if (!element) return;

    element.textContent =
        value === undefined ||
        value === null ||
        value === ""
            ? "—"
            : String(value);
}

function initials(name) {
    const words =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (!words.length) return "WM";

    if (words.length === 1) {
        return words[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        words[0][0] +
        words[words.length - 1][0]
    ).toUpperCase();
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
    return escapeHTML(value);
}
