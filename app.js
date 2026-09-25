const API_BASE_URL = "https://web-me-lead-finder.onrender.com";

const countries = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica",
  "Croatia","Cuba","Cyprus","Czech Republic","Democratic Republic of the Congo","Denmark","Djibouti","Dominica","Dominican Republic","Ecuador",
  "Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland","France",
  "Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea","Guinea-Bissau",
  "Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland",
  "Israel","Italy","Ivory Coast","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait",
  "Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
  "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico",
  "Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru",
  "Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman",
  "Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","Sao Tome and Principe",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia",
  "South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
  "Taiwan","Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey",
  "Turkmenistan","Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu",
  "Vatican City","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"
];

let searchResults = [];
let filteredResults = [];
let selectedCountry = "";
let currentPage = 1;
let pageSize = 10;
let activeBusiness = null;
let aiMessages = [];

let currentFilters = {
  noWebsite: false,
  instagram: false,
  facebook: false,
  whatsapp: false,
  minRating: 0
};

const elements = {
  countryPicker: document.querySelector(".country-picker"),
  countryInput: document.querySelector("#countryInput"),
  countryDropdown: document.querySelector("#countryDropdown"),
  areaInput: document.querySelector("#areaInput"),
  businessTypeInput: document.querySelector("#businessTypeInput"),
  searchButton: document.querySelector("#searchButton"),
  resultsContainer: document.querySelector("#resultsContainer"),
  businessesFound: document.querySelector("#businessesFound"),
  noWebsiteFound: document.querySelector("#noWebsiteFound"),
  websiteFound: document.querySelector("#websiteFound"),
  researchCompleted: document.querySelector("#researchCompleted"),
  resultCount: document.querySelector("#resultCount"),
  filterButton: document.querySelector("#filterButton"),
  filterCount: document.querySelector("#filterCount"),
  exportButton: document.querySelector("#exportButton"),
  detailsPanel: document.querySelector("#detailsPanel"),
  detailsOverlay: document.querySelector("#detailsOverlay"),
  filterPanel: document.querySelector("#filterPanel"),
  filterOverlay: document.querySelector("#filterOverlay"),
  closeDetails: document.querySelector("#closeDetails"),
  closeFilter: document.querySelector("#closeFilter"),
  applyFilters: document.querySelector("#applyFilters"),
  clearFilters: document.querySelector("#clearFilters"),
  toastContainer: document.querySelector("#toastContainer"),
  sortSelect: document.querySelector("#sortSelect"),
  pageNumber: document.querySelector("#pageNumber"),
  previousPage: document.querySelector("#previousPage"),
  nextPage: document.querySelector("#nextPage"),
  progressBar: document.querySelector("#progressBar"),
  progressPercent: document.querySelector("#progressPercent"),
  progressStageText: document.querySelector("#progressStageText"),
  usageProgress: document.querySelector("#usageProgress"),
  usageCount: document.querySelector("#usageCount"),
  sidebar: document.querySelector(".sidebar"),
  mobileMenu: document.querySelector("#mobileMenu")
};

function escapeHtml(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getInitials(name) {
  if (!name) return "?";

  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(word => word[0])
    .join("")
    .toUpperCase();
}

function normalizeBusiness(business) {
  const source = business || {};

  return {
    id: source.id || source.placeId || crypto.randomUUID(),
    name: source.name || "Unknown business",
    type: source.type || source.businessType || "Business",
    address: source.address || source.formattedAddress || "",
    country: source.country || "",
    region: source.region || source.state || "",
    city: source.city || "",
    area: source.area || "",
    phone: source.phone || source.nationalPhoneNumber || source.internationalPhoneNumber || "",
    whatsapp: source.whatsapp || "",
    email: source.email || "",
    website: source.website || source.websiteUri || "",
    websiteStatus: source.websiteStatus || "unknown",
    websiteEvidence: source.websiteEvidence || "",
    googleMapsUrl: source.googleMapsUrl || source.googleMapsUri || "",
    rating: Number(source.rating || 0),
    reviews: Number(source.reviews || source.userRatingCount || 0),
    hours: source.hours || source.openingHours || [],
    instagram: source.instagram || "",
    facebook: source.facebook || "",
    tiktok: source.tiktok || "",
    linkedin: source.linkedin || "",
    x: source.x || source.twitter || "",
    youtube: source.youtube || "",
    otherSocials: Array.isArray(source.otherSocials) ? source.otherSocials : [],
    directories: Array.isArray(source.directories) ? source.directories : [],
    researchSources: Array.isArray(source.researchSources) ? source.researchSources : [],
    researchCompleted: Boolean(source.researchCompleted),
    researchSummary: source.researchSummary || "",
    opportunity: source.opportunity || "",
    aiNotes: source.aiNotes || "",
    category: source.category || "",
    image: source.image || source.photoUrl || ""
  };
}

function renderCountryOptions(search = "") {
  const query = search.trim().toLowerCase();

  const matches = countries.filter(country =>
    country.toLowerCase().includes(query)
  );

  if (!matches.length) {
    elements.countryDropdown.innerHTML = `
      <div class="country-empty">No countries found</div>
    `;
    return;
  }

  elements.countryDropdown.innerHTML = matches.map(country => `
    <button type="button" class="country-option ${country === selectedCountry ? "selected" : ""}" data-country="${escapeHtml(country)}">
      ${escapeHtml(country)}
    </button>
  `).join("");
}

function openCountryPicker() {
  elements.countryPicker?.classList.add("open");
  renderCountryOptions(elements.countryInput.value);
}

function closeCountryPicker() {
  elements.countryPicker?.classList.remove("open");
}

function selectCountry(country) {
  selectedCountry = country;
  elements.countryInput.value = country;
  closeCountryPicker();
}

function showToast(title, message, type = "info") {
  if (!elements.toastContainer) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const icon = type === "error"
    ? "!"
    : type === "success"
      ? "✓"
      : "i";

  toast.innerHTML = `
    <div class="toast-icon">
      <span>${icon}</span>
    </div>
    <div class="toast-content">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(message)}</span>
    </div>
  `;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(8px)";

    setTimeout(() => toast.remove(), 250);
  }, 4000);
}

function setProgress(percent, text) {
  const safePercent = Math.max(0, Math.min(100, percent));

  if (elements.progressBar) {
    elements.progressBar.style.width = `${safePercent}%`;
  }

  if (elements.progressPercent) {
    elements.progressPercent.textContent = `${Math.round(safePercent)}%`;
  }

  if (elements.progressStageText) {
    elements.progressStageText.textContent = text;
  }
}

function showLoading() {
  elements.resultsContainer.innerHTML = `
    <div class="loading-state">
      <div class="loading-visual">
        <div class="loading-spinner"></div>
        <div class="loading-core">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m20 20-4-4"></path>
          </svg>
        </div>
      </div>

      <h3>Researching businesses</h3>

      <p id="loadingDescription">
        Finding real businesses and checking their public online presence.
      </p>

      <div class="progress-area">
        <div class="progress-label">
          <span id="progressStageText">Finding businesses</span>
          <strong id="progressPercent">0%</strong>
        </div>

        <div class="progress-track">
          <div class="progress-bar" id="progressBar"></div>
        </div>
      </div>

      <div class="loading-stages">
        <div class="loading-stage active" data-stage="1">
          <div class="stage-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <circle cx="11" cy="11" r="7"></circle>
              <path d="m20 20-4-4"></path>
            </svg>
          </div>
          <span>Find businesses</span>
        </div>

        <div class="loading-stage" data-stage="2">
          <div class="stage-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M3 12h18"></path>
              <path d="M12 3v18"></path>
              <circle cx="12" cy="12" r="9"></circle>
            </svg>
          </div>
          <span>Check websites</span>
        </div>

        <div class="loading-stage" data-stage="3">
          <div class="stage-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M4 4h16v16H4z"></path>
              <path d="M8 9h8M8 13h5"></path>
            </svg>
          </div>
          <span>Research online</span>
        </div>

        <div class="loading-stage" data-stage="4">
          <div class="stage-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="m5 12 4 4L19 6"></path>
            </svg>
          </div>
          <span>Verify leads</span>
        </div>
      </div>
    </div>
  `;

  return {
    progressBar: document.querySelector("#progressBar"),
    progressPercent: document.querySelector("#progressPercent"),
    progressStageText: document.querySelector("#progressStageText")
  };
}

function updateLoadingStage(stageNumber, percent, text) {
  document.querySelectorAll(".loading-stage").forEach(stage => {
    const stageValue = Number(stage.dataset.stage);

    stage.classList.remove("active", "complete");

    if (stageValue < stageNumber) {
      stage.classList.add("complete");
    }

    if (stageValue === stageNumber) {
      stage.classList.add("active");
    }
  });

  setProgress(percent, text);
}

function showEmptyState() {
  elements.resultsContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-visual">
        <div class="empty-ring ring-one"></div>
        <div class="empty-ring ring-two"></div>

        <div class="empty-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <circle cx="11" cy="11" r="7"></circle>
            <path d="m20 20-4-4"></path>
          </svg>
        </div>
      </div>

      <h3>No leads found yet</h3>

      <p>
        Choose a country, add an area and business type, then start a real business research search.
      </p>

      <div class="empty-points">
        <span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m5 12 4 4L19 6"></path>
          </svg>
          Real businesses
        </span>

        <span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m5 12 4 4L19 6"></path>
          </svg>
          Website verification
        </span>

        <span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m5 12 4 4L19 6"></path>
          </svg>
          Public contact research
        </span>
      </div>
    </div>
  `;
}

function updateStats() {
  const total = searchResults.length;

  const noWebsite = searchResults.filter(item =>
    item.websiteStatus === "no-website"
  ).length;

  const websiteFound = searchResults.filter(item =>
    item.websiteStatus === "website-found"
  ).length;

  const researched = searchResults.filter(item =>
    item.researchCompleted
  ).length;

  if (elements.businessesFound) {
    elements.businessesFound.textContent = total;
  }

  if (elements.noWebsiteFound) {
    elements.noWebsiteFound.textContent = noWebsite;
  }

  if (elements.websiteFound) {
    elements.websiteFound.textContent = websiteFound;
  }

  if (elements.researchCompleted) {
    elements.researchCompleted.textContent = researched;
  }

  if (elements.usageCount) {
    elements.usageCount.textContent = `${total} researched`;
  }

  if (elements.usageProgress) {
    const percentage = Math.min((total / 100) * 100, 100);
    elements.usageProgress.style.width = `${percentage}%`;
  }
}

function websiteStatusClass(status) {
  if (status === "no-website") return "no-website";
  if (status === "website-found") return "website-found";
  if (status === "possible") return "possible";
  return "unknown";
}

function websiteStatusLabel(status) {
  if (status === "no-website") return "No website found";
  if (status === "website-found") return "Website found";
  if (status === "possible") return "Possible website";
  return "Unable to verify";
}

function renderResults() {
  filteredResults = applyCurrentFilters(searchResults);

  const sorted = sortResults(filteredResults);

  const totalPages = Math.max(
    1,
    Math.ceil(sorted.length / pageSize)
  );

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start =
    (currentPage - 1) * pageSize;

  const pageResults =
    sorted.slice(
      start,
      start + pageSize
    );

  if (elements.resultCount) {
    elements.resultCount.textContent =
      sorted.length;
  }

  if (!pageResults.length) {
    showNoFilteredResults();
    updatePagination();
    return;
  }

  elements.resultsContainer.innerHTML = `
    <div class="table-wrapper">
      <table class="results-table">
        <thead>
          <tr>
            <th>BUSINESS</th>
            <th>TYPE</th>
            <th>LOCATION</th>
            <th>CONTACT</th>
            <th>WEBSITE STATUS</th>
            <th></th>
          </tr>
        </thead>

        <tbody>
          ${pageResults
            .map(renderBusinessRow)
            .join("")}
        </tbody>
      </table>
    </div>

    <div class="table-footer">
      <span>
        Showing ${start + 1}-${Math.min(
          start + pageResults.length,
          sorted.length
        )}
        of ${sorted.length}
      </span>

      <div class="pagination">
        <button
          class="page-button ${currentPage === 1 ? "disabled" : ""}"
          id="previousPage"
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="m15 18-6-6 6-6"></path>
          </svg>
        </button>

        <button class="page-number active" type="button">
          ${currentPage}
        </button>

        <button
          class="page-button ${currentPage >= totalPages ? "disabled" : ""}"
          id="nextPage"
          type="button"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="m9 18 6-6-6-6"></path>
          </svg>
        </button>
      </div>
    </div>
  `;

  document
    .querySelectorAll(".view-details-button")
    .forEach(button => {
      button.addEventListener("click", () => {
        const id = button.dataset.id;

        const business =
          searchResults.find(
            item => item.id === id
          );

        if (business) {
          openBusinessDetails(
            business
          );
        }
      });
    });

  document
    .querySelector("#previousPage")
    ?.addEventListener(
      "click",
      () => {
        if (currentPage > 1) {
          currentPage--;
          renderResults();
        }
      }
    );

  document
    .querySelector("#nextPage")
    ?.addEventListener(
      "click",
      () => {
        if (
          currentPage <
          totalPages
        ) {
          currentPage++;
          renderResults();
        }
      }
    );
}

function renderBusinessRow(business) {
  const location = [
    business.area,
    business.city,
    business.region,
    business.country
  ]
    .filter(Boolean)
    .join(", ");

  return `
    <tr>
      <td>
        <div class="business-cell">
          <div class="business-avatar">
            ${escapeHtml(
              getInitials(
                business.name
              )
            )}
          </div>

          <div class="business-info">
            <strong
              title="${escapeHtml(
                business.name
              )}"
            >
              ${escapeHtml(
                business.name
              )}
            </strong>

            <span>
              ${
                business.rating
                  ? `${business.rating} rating · ${business.reviews} reviews`
                  : "Researching public data"
              }
            </span>
          </div>
        </div>
      </td>

      <td>
        <div class="type-cell">
          ${escapeHtml(
            business.type ||
            business.category ||
            "Business"
          )}
        </div>
      </td>

      <td>
        <div class="location-cell">
          ${escapeHtml(
            location ||
            business.address ||
            "Location unavailable"
          )}
        </div>
      </td>

      <td>
        <div class="contact-cell">
          ${
            business.phone
              ? `<a class="phone-link" href="tel:${escapeHtml(
                  business.phone
                )}">${escapeHtml(
                  business.phone
                )}</a>`
              : "Not found"
          }
        </div>
      </td>

      <td>
        <span class="website-status ${websiteStatusClass(
          business.websiteStatus
        )}">
          <span class="status-small-dot"></span>
          ${escapeHtml(
            websiteStatusLabel(
              business.websiteStatus
            )
          )}
        </span>
      </td>

      <td>
        <button
          type="button"
          class="view-details-button"
          data-id="${escapeHtml(
            business.id
          )}"
        >
          View details

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path d="M9 18l6-6-6-6"></path>
          </svg>
        </button>
      </td>
    </tr>
  `;
}

function showNoFilteredResults() {
  elements.resultsContainer.innerHTML = `
    <div class="empty-state">
      <div class="empty-visual">
        <div class="empty-ring ring-one"></div>
        <div class="empty-ring ring-two"></div>

        <div class="empty-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M3 6h18"></path>
            <path d="M8 6v14h8V6"></path>
            <path d="M10 3h4"></path>
          </svg>
        </div>
      </div>

      <h3>No leads match your filters</h3>

      <p>
        Change the filters or clear them to see the businesses found by the research.
      </p>
    </div>
  `;
}

function applyCurrentFilters(results) {
  return results.filter(business => {
    if (
      currentFilters.noWebsite &&
      business.websiteStatus !== "no-website"
    ) {
      return false;
    }

    if (
      currentFilters.instagram &&
      !business.instagram
    ) {
      return false;
    }

    if (
      currentFilters.facebook &&
      !business.facebook
    ) {
      return false;
    }

    if (
      currentFilters.whatsapp &&
      !business.whatsapp
    ) {
      return false;
    }

    if (
      Number(business.rating || 0) <
      Number(
        currentFilters.minRating || 0
      )
    ) {
      return false;
    }

    return true;
  });
}

function sortResults(results) {
  const sort =
    elements.sortSelect?.value ||
    "relevance";

  const copy = [...results];

  if (sort === "rating") {
    return copy.sort(
      (a, b) =>
        Number(b.rating || 0) -
        Number(a.rating || 0)
    );
  }

  if (sort === "reviews") {
    return copy.sort(
      (a, b) =>
        Number(b.reviews || 0) -
        Number(a.reviews || 0)
    );
  }

  if (sort === "name") {
    return copy.sort(
      (a, b) =>
        a.name.localeCompare(
          b.name
        )
    );
  }

  return copy;
}

function updatePagination() {
  const total =
    Math.ceil(
      filteredResults.length /
        pageSize
    );

  if (elements.pageNumber) {
    elements.pageNumber.textContent =
      currentPage;
  }

  if (elements.previousPage) {
    elements.previousPage.classList.toggle(
      "disabled",
      currentPage <= 1
    );
  }

  if (elements.nextPage) {
    elements.nextPage.classList.toggle(
      "disabled",
      currentPage >=
        Math.max(1, total)
    );
  }
}

function renderSocialCard(
  name,
  url,
  shortName
) {
  return `
    ${
      url
        ? `<a
            class="social-card"
            href="${escapeHtml(url)}"
            target="_blank"
            rel="noopener noreferrer"
          >`
        : `<div class="social-card unavailable">`
    }

      <div class="social-symbol">
        ${escapeHtml(shortName)}
      </div>

      <span>
        <strong>${escapeHtml(name)}</strong>

        <small>
          ${
            url
              ? "Public profile found"
              : "Not found"
          }
        </small>
      </span>

    ${
      url
        ? "</a>"
        : "</div>"
    }
  `;
}

function renderHours(hours) {
  if (!hours) {
    return "Not available";
  }

  if (Array.isArray(hours)) {
    if (!hours.length) {
      return "Not available";
    }

    return hours
      .map(item =>
        escapeHtml(item)
      )
      .join("<br>");
  }

  if (typeof hours === "object") {
    return Object.entries(hours)
      .map(
        ([day, value]) =>
          `${escapeHtml(
            day
          )}: ${escapeHtml(
            value
          )}`
      )
      .join("<br>");
  }

  return escapeHtml(hours);
}

function openBusinessDetails(business) {
  activeBusiness = business;

  const websiteLabel =
    websiteStatusLabel(
      business.websiteStatus
    );

  const location = [
    business.area,
    business.city,
    business.region,
    business.country
  ]
    .filter(Boolean)
    .join(", ");

  const sources = [
    ...(business.researchSources || []),
    ...(business.directories || [])
  ];

  elements.detailsPanel.innerHTML = `
    <div class="details-header">
      <div class="details-heading">
        <div class="section-kicker">
          BUSINESS PROFILE
        </div>

        <h2 title="${escapeHtml(
          business.name
        )}">
          ${escapeHtml(
            business.name
          )}
        </h2>

        <p>
          ${escapeHtml(
            business.type ||
            business.category ||
            "Business"
          )}
        </p>
      </div>

      <button
        type="button"
        class="close-details"
        id="closeDetailsButton"
        aria-label="Close"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="m6 6 12 12M18 6 6 18"></path>
        </svg>
      </button>
    </div>

    <div class="details-scroll">

      <div class="details-status-card">
        <div class="details-status-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <circle cx="12" cy="12" r="9"></circle>
            <path d="m8 12 2.5 2.5L16 9"></path>
          </svg>
        </div>

        <div class="details-status-content">
          <span>
            WEBSITE RESEARCH RESULT
          </span>

          <strong>
            ${escapeHtml(
              websiteLabel
            )}
          </strong>

          <p>
            ${escapeHtml(
              business.websiteEvidence ||
              "Website research has been completed."
            )}
          </p>
        </div>
      </div>

      <section class="details-section">
        <div class="details-section-title">
          BUSINESS INFORMATION
        </div>

        <div class="details-grid">
          <div class="detail-item">
            <span>Business name</span>
            <strong>
              ${escapeHtml(
                business.name
              )}
            </strong>
          </div>

          <div class="detail-item">
            <span>Business type</span>
            <strong>
              ${escapeHtml(
                business.type ||
                business.category ||
                "Business"
              )}
            </strong>
          </div>

          <div class="detail-item detail-full">
            <span>Address</span>
            <strong>
              ${escapeHtml(
                business.address ||
                location ||
                "Not available"
              )}
            </strong>
          </div>

          <div class="detail-item">
            <span>Rating</span>
            <strong>
              ${
                business.rating
                  ? `${escapeHtml(
                      business.rating
                    )} / 5`
                  : "Not available"
              }
            </strong>
          </div>

          <div class="detail-item">
            <span>Reviews</span>
            <strong>
              ${
                business.reviews
                  ? escapeHtml(
                      business.reviews
                    )
                  : "Not available"
              }
            </strong>
          </div>

          <div class="detail-item detail-full">
            <span>Business hours</span>
            <strong>
              ${renderHours(
                business.hours
              )}
            </strong>
          </div>
        </div>
      </section>

      <section class="details-section">
        <div class="details-section-title">
          CONTACT INFORMATION
        </div>

        <div class="contact-list">

          <div class="contact-row">
            <div class="contact-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5.15 12.8 19.8 19.8 0 0 1 2.08 4.18 2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.34 1.78.65 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6.27 6.27l1.27-1.26a2 2 0 0 1 2.11-.45c.85.31 1.73.53 2.63.65A2 2 0 0 1 22 16.92z"></path>
              </svg>
            </div>

            <div>
              <span>Phone</span>

              ${
                business.phone
                  ? `<a href="tel:${escapeHtml(
                      business.phone
                    )}">
                      ${escapeHtml(
                        business.phone
                      )}
                    </a>`
                  : `<strong>Not found</strong>`
              }
            </div>
          </div>

          <div class="contact-row">
            <div class="contact-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 9.3 9.3 0 0 1-4.2-1L3 20l1.4-4.4A8.2 8.2 0 0 1 3 11.5a8.5 8.5 0 1 1 18 0Z"></path>
              </svg>
            </div>

            <div>
              <span>WhatsApp</span>

              ${
                business.whatsapp
                  ? `<a
                      href="${escapeHtml(
                        business.whatsapp
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      ${escapeHtml(
                        business.whatsapp
                      )}
                    </a>`
                  : `<strong>Not found</strong>`
              }
            </div>
          </div>

          <div class="contact-row">
            <div class="contact-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <rect
                  x="3"
                  y="5"
                  width="18"
                  height="14"
                  rx="2"
                ></rect>

                <path d="m3 7 9 6 9-6"></path>
              </svg>
            </div>

            <div>
              <span>Public email</span>

              ${
                business.email
                  ? `<a href="mailto:${escapeHtml(
                      business.email
                    )}">
                      ${escapeHtml(
                        business.email
                      )}
                    </a>`
                  : `<strong>Not found</strong>`
              }
            </div>
          </div>

          <div class="contact-row">
            <div class="contact-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path d="M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12Z"></path>
                <circle
                  cx="12"
                  cy="9"
                  r="2.2"
                ></circle>
              </svg>
            </div>

            <div>
              <span>Google Maps</span>

              ${
                business.googleMapsUrl
                  ? `<a
                      href="${escapeHtml(
                        business.googleMapsUrl
                      )}"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open business location
                    </a>`
                  : `<strong>Not available</strong>`
              }
            </div>
          </div>

        </div>
      </section>

      <section class="details-section">
        <div class="details-section-title">
          PUBLIC SOCIAL PROFILES
        </div>

        <div class="social-grid">
          ${renderSocialCard(
            "Instagram",
            business.instagram,
            "IG"
          )}

          ${renderSocialCard(
            "Facebook",
            business.facebook,
            "FB"
          )}

          ${renderSocialCard(
            "TikTok",
            business.tiktok,
            "TK"
          )}

          ${renderSocialCard(
            "LinkedIn",
            business.linkedin,
            "IN"
          )}

          ${renderSocialCard(
            "X / Twitter",
            business.x,
            "X"
          )}

          ${renderSocialCard(
            "YouTube",
            business.youtube,
            "YT"
          )}
        </div>
      </section>

      ${
        business.otherSocials?.length
          ? `
            <section class="details-section">
              <div class="details-section-title">
                OTHER PUBLIC PROFILES
              </div>

              <div class="contact-list">
                ${business.otherSocials
                  .map(
                    (url, index) => `
                      <div class="contact-row">
                        <div class="contact-icon">
                          <span>${index + 1}</span>
                        </div>

                        <div>
                          <span>
                            PUBLIC PROFILE
                          </span>

                          <a
                            href="${escapeHtml(
                              url
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            ${escapeHtml(
                              url
                            )}
                          </a>
                        </div>
                      </div>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
          : ""
      }

      <section class="details-section">
        <div class="details-section-title">
          WEBSITE RESEARCH
        </div>

        <div class="research-finding">
          <div class="finding-row">
            <div class="finding-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                ></circle>

                <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"></path>
              </svg>
            </div>

            <div>
              <span>WEBSITE</span>

              <strong>
                ${
                  business.website
                    ? escapeHtml(
                        business.website
                      )
                    : "No website currently identified"
                }
              </strong>
            </div>
          </div>

          <div class="finding-description">
            ${escapeHtml(
              business.websiteEvidence ||
              "Website research has been completed."
            )}
          </div>
        </div>
      </section>

      <section class="details-section">
        <div class="details-section-title">
          AI BUSINESS INTELLIGENCE
        </div>

        <div class="intelligence-card">

          <div class="intelligence-row">
            <span>RESEARCH SUMMARY</span>

            <p>
              ${escapeHtml(
                business.researchSummary ||
                "No AI summary available."
              )}
            </p>
          </div>

          <div class="intelligence-row">
            <span>WEBSITE OPPORTUNITY</span>

            <p>
              ${escapeHtml(
                business.opportunity ||
                "No website opportunity assessment available."
              )}
            </p>
          </div>

          ${
            business.aiNotes
              ? `
                <div class="intelligence-row">
                  <span>
                    ADDITIONAL NOTES
                  </span>

                  <p>
                    ${escapeHtml(
                      business.aiNotes
                    )}
                  </p>
                </div>
              `
              : ""
          }

        </div>
      </section>

      ${
        sources.length
          ? `
            <section class="details-section">
              <div class="details-section-title">
                RESEARCH SOURCES
              </div>

              <div class="contact-list">
                ${sources
                  .map(
                    (source, index) => {
                      if (
                        typeof source ===
                        "string"
                      ) {
                        return `
                          <div class="contact-row">
                            <div class="contact-icon">
                              <span>
                                ${index + 1}
                              </span>
                            </div>

                            <div>
                              <span>
                                PUBLIC SOURCE
                              </span>

                              <strong>
                                ${escapeHtml(
                                  source
                                )}
                              </strong>
                            </div>
                          </div>
                        `;
                      }

                      return `
                        <div class="contact-row">
                          <div class="contact-icon">
                            <span>
                              ${index + 1}
                            </span>
                          </div>

                          <div>
                            <span>
                              ${escapeHtml(
                                source.type ||
                                "PUBLIC SOURCE"
                              )}
                            </span>

                            ${
                              source.url
                                ? `<a
                                    href="${escapeHtml(
                                      source.url
                                    )}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    ${escapeHtml(
                                      source.title ||
                                      source.url
                                    )}
                                  </a>`
                                : `<strong>
                                    ${escapeHtml(
                                      source.title ||
                                      source.name ||
                                      "Source"
                                    )}
                                  </strong>`
                            }
                          </div>
                        </div>
                      `;
                    }
                  )
                  .join("")}
              </div>
            </section>
          `
          : ""
      }

      <section class="details-section">
        <div class="details-section-title">
          WEB ME AI
        </div>

        <div class="opportunity-card">
          <div class="opportunity-header">
            <div class="opportunity-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path d="M4 5h16v14H4z"></path>
                <path d="M8 9h8M8 13h5"></path>
              </svg>
            </div>

            <div>
              <strong>
                Discuss this business with Web Me
              </strong>

              <span>
                Ask questions about this lead using the research collected above.
              </span>
            </div>
          </div>

          <button
            type="button"
            class="primary-wide-button"
            id="sendBusinessToAIButton"
          >
            Send to Web Me AI

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M5 12h14"></path>
              <path d="m13 6 6 6-6 6"></path>
            </svg>
          </button>
        </div>
      </section>

      <section class="details-section">
        <div class="details-section-title">
          WEBSITE CREATION OPPORTUNITY
        </div>

        <div class="opportunity-card">
          <div class="opportunity-header">
            <div class="opportunity-icon">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              >
                <path d="M4 5h16v14H4z"></path>
                <path d="M8 9h8M8 13h5"></path>
              </svg>
            </div>

            <div>
              <strong>
                Research this business before contacting them
              </strong>

              <span>
                Use the information above to understand what they may need.
              </span>
            </div>
          </div>

          <button
            type="button"
            class="primary-wide-button"
            id="createWebsiteButton"
          >
            Create website plan

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M5 12h14"></path>
              <path d="m13 6 6 6-6 6"></path>
            </svg>
          </button>
        </div>
      </section>

    </div>

    <div class="details-footer">
      ${
        business.googleMapsUrl
          ? `
            <a
              class="secondary-wide-button"
              href="${escapeHtml(
                business.googleMapsUrl
              )}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Maps
            </a>
          `
          : `
            <button
              class="secondary-wide-button"
              type="button"
              disabled
            >
              Maps unavailable
            </button>
          `
      }

      <button
        type="button"
        class="primary-wide-button"
        id="saveLeadButton"
      >
        Save lead
      </button>
    </div>
  `;

  elements.detailsPanel.classList.add(
    "open"
  );

  elements.detailsOverlay.classList.remove(
    "hidden"
  );

  document.body.style.overflow =
    "hidden";

  document
    .querySelector(
      "#closeDetailsButton"
    )
    ?.addEventListener(
      "click",
      closeBusinessDetails
    );

  document
    .querySelector(
      "#saveLeadButton"
    )
    ?.addEventListener(
      "click",
      () => saveLead(business)
    );

  document
    .querySelector(
      "#createWebsiteButton"
    )
    ?.addEventListener(
      "click",
      () =>
        createWebsitePlan(
          business
        )
    );

  document
    .querySelector(
      "#sendBusinessToAIButton"
    )
    ?.addEventListener(
      "click",
      () => {
        openWebMeAI(business);
      }
    );
}

function closeBusinessDetails() {
  elements.detailsPanel.classList.remove(
    "open"
  );

  elements.detailsOverlay.classList.add(
    "hidden"
  );

  if (
    !elements.filterPanel?.classList.contains(
      "open"
    )
  ) {
    document.body.style.overflow =
      "";
  }

  activeBusiness = null;
}

function saveLead(business) {
  const saved =
    JSON.parse(
      localStorage.getItem(
        "webMeSavedLeads"
      ) || "[]"
    );

  const exists = saved.some(
    item =>
      item.id === business.id
  );

  if (!exists) {
    saved.push(business);

    localStorage.setItem(
      "webMeSavedLeads",
      JSON.stringify(saved)
    );

    showToast(
      "Lead saved",
      `${business.name} was added to your saved leads.`,
      "success"
    );
  } else {
    showToast(
      "Already saved",
      "This business is already in your saved leads."
    );
  }
}

async function createWebsitePlan(
  business
) {
  showToast(
    "Website planning",
    "Web Me is creating the website plan."
  );

  if (!API_BASE_URL) {
    return;
  }

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/api/research/website-plan`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            business
          })
        }
      );

    if (!response.ok) {
      throw new Error(
        "Website planning request failed"
      );
    }

    const data =
      await response.json();

    if (data.plan) {
      activeBusiness.websitePlan =
        data.plan;

      showToast(
        "Website plan ready",
        "Web Me generated a website opportunity plan.",
        "success"
      );
    }
  } catch {
    showToast(
      "Website plan failed",
      "The AI website planning request could not be completed.",
      "error"
    );
  }
}

function ensureAIInterface() {
  if (
    document.querySelector(
      "#webMeAI"
    )
  ) {
    return;
  }

  const ai = document.createElement(
    "aside"
  );

  ai.id = "webMeAI";

  ai.innerHTML = `
    <div class="web-me-ai-header">
      <div>
        <span>WEB ME</span>
        <strong>AI Research Assistant</strong>
      </div>

      <button
        type="button"
        id="webMeAIClose"
        aria-label="Close Web Me AI"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="m6 6 12 12M18 6 6 18"></path>
        </svg>
      </button>
    </div>

    <div
      class="web-me-ai-context"
      id="webMeAIContext"
    >
      <span>No business selected</span>
    </div>

    <div
      class="web-me-ai-messages"
      id="webMeAIMessages"
    ></div>

    <form
      class="web-me-ai-form"
      id="webMeAIForm"
    >
      <textarea
        id="webMeAIInput"
        rows="1"
        placeholder="Ask Web Me anything about your research..."
      ></textarea>

      <button
        type="submit"
        id="webMeAISend"
        aria-label="Send"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
        >
          <path d="m22 2-7 20-4-9-9-4Z"></path>
          <path d="M22 2 11 13"></path>
        </svg>
      </button>
    </form>
  `;

  document.body.appendChild(ai);

  document
    .querySelector(
      "#webMeAIClose"
    )
    ?.addEventListener(
      "click",
      closeWebMeAI
    );

  document
    .querySelector(
      "#webMeAIForm"
    )
    ?.addEventListener(
      "submit",
      event => {
        event.preventDefault();
        sendWebMeAIMessage();
      }
    );

  document
    .querySelector(
      "#webMeAIInput"
    )
    ?.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter" &&
          !event.shiftKey
        ) {
          event.preventDefault();
          sendWebMeAIMessage();
        }
      }
    );
}

function openWebMeAI(
  business = null
) {
  ensureAIInterface();

  const ai =
    document.querySelector(
      "#webMeAI"
    );

  ai.classList.add(
    "open"
  );

  if (business) {
    activeBusiness =
      business;

    const context =
      document.querySelector(
        "#webMeAIContext"
      );

    if (context) {
      context.innerHTML = `
        <span>BUSINESS CONTEXT</span>
        <strong>
          ${escapeHtml(
            business.name
          )}
        </strong>
      `;
    }

    if (!aiMessages.length) {
      addAIMessage(
        "assistant",
        `I've added ${business.name} to the conversation. Ask me anything about this business or the research we found.`
      );
    }
  } else if (!aiMessages.length) {
    addAIMessage(
      "assistant",
      "I'm Web Me. Ask me about your current business research, leads, websites, or anything in the data you've collected."
    );
  }

  setTimeout(() => {
    document
      .querySelector(
        "#webMeAIInput"
      )
      ?.focus();
  }, 100);
}

function closeWebMeAI() {
  document
    .querySelector(
      "#webMeAI"
    )
    ?.classList.remove(
      "open"
    );
}

function addAIMessage(
  role,
  content
) {
  ensureAIInterface();

  aiMessages.push({
    role,
    content
  });

  const container =
    document.querySelector(
      "#webMeAIMessages"
    );

  if (!container) return;

  const message =
    document.createElement(
      "div"
    );

  message.className =
    `web-me-ai-message ${role}`;

  message.innerHTML = `
    <div class="web-me-ai-message-label">
      ${
        role === "user"
          ? "YOU"
          : "WEB ME"
      }
    </div>

    <div class="web-me-ai-message-content">
      ${formatAIText(
        content
      )}
    </div>
  `;

  container.appendChild(
    message
  );

  container.scrollTop =
    container.scrollHeight;
}

function formatAIText(
  text
) {
  return escapeHtml(
    text || ""
  )
    .replace(
      /\*\*(.*?)\*\*/g,
      "<strong>$1</strong>"
    )
    .replace(
      /\n/g,
      "<br>"
    );
}

async function sendWebMeAIMessage() {
  const input =
    document.querySelector(
      "#webMeAIInput"
    );

  const sendButton =
    document.querySelector(
      "#webMeAISend"
    );

  if (!input) return;

  const message =
    input.value.trim();

  if (!message) {
    return;
  }

  input.value = "";

  addAIMessage(
    "user",
    message
  );

  if (sendButton) {
    sendButton.disabled =
      true;
  }

  const typing =
    document.createElement(
      "div"
    );

  typing.className =
    "web-me-ai-message assistant web-me-ai-typing";

  typing.innerHTML = `
    <div class="web-me-ai-message-label">
      WEB ME
    </div>

    <div class="web-me-ai-message-content">
      Thinking...
    </div>
  `;

  const container =
    document.querySelector(
      "#webMeAIMessages"
    );

  container?.appendChild(
    typing
  );

  if (container) {
    container.scrollTop =
      container.scrollHeight;
  }

  try {
    const response =
      await fetch(
        `${API_BASE_URL}/api/ai/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            messages:
              aiMessages.slice(
                -20
              ),
            business:
              activeBusiness,
            searchResults:
              searchResults
          })
        }
      );

    if (!response.ok) {
      throw new Error(
        "AI request failed"
      );
    }

    const data =
      await response.json();

    typing.remove();

    const reply =
      data.reply ||
      "I couldn't produce a response from the available research.";

    addAIMessage(
      "assistant",
      reply
    );
  } catch (error) {
    typing.remove();

    addAIMessage(
      "assistant",
      "I couldn't connect to Web Me AI right now. Please check the backend deployment and try again."
    );
  } finally {
    if (sendButton) {
      sendButton.disabled =
        false;
    }

    input.focus();
  }
}

function validateSearch() {
  const country =
    selectedCountry ||
    elements.countryInput.value.trim();

  const area =
    elements.areaInput.value.trim();

  const businessType =
    elements.businessTypeInput.value.trim();

  if (!country) {
    showToast(
      "Country required",
      "Select a country before starting the search.",
      "error"
    );

    return false;
  }

  if (!area) {
    showToast(
      "Area required",
      "Enter a city, region, state, district or local area.",
      "error"
    );

    return false;
  }

  if (!businessType) {
    showToast(
      "Business type required",
      "Enter the type of business or organization you want to find.",
      "error"
    );

    return false;
  }

  return true;
}

async function performSearch() {
  if (!validateSearch()) {
    return;
  }

  const country =
    selectedCountry ||
    elements.countryInput.value.trim();

  const area =
    elements.areaInput.value.trim();

  const businessType =
    elements.businessTypeInput.value.trim();

  elements.searchButton.disabled =
    true;

  showLoading();

  const loadingElements = {
    progressBar:
      document.querySelector(
        "#progressBar"
      ),
    progressPercent:
      document.querySelector(
        "#progressPercent"
      ),
    progressStageText:
      document.querySelector(
        "#progressStageText"
      )
  };

  function localProgress(
    percent,
    text
  ) {
    if (
      loadingElements.progressBar
    ) {
      loadingElements.progressBar.style.width =
        `${percent}%`;
    }

    if (
      loadingElements.progressPercent
    ) {
      loadingElements.progressPercent.textContent =
        `${percent}%`;
    }

    if (
      loadingElements.progressStageText
    ) {
      loadingElements.progressStageText.textContent =
        text;
    }

    document
      .querySelectorAll(
        ".loading-stage"
      )
      .forEach(stage => {
        const number =
          Number(
            stage.dataset.stage
          );

        stage.classList.remove(
          "active",
          "complete"
        );

        if (
          number <
          Math.ceil(
            percent / 25
          )
        ) {
          stage.classList.add(
            "complete"
          );
        }

        if (
          number ===
          Math.ceil(
            percent / 25
          )
        ) {
          stage.classList.add(
            "active"
          );
        }
      });
  }

  try {
    localProgress(
      10,
      "Finding businesses"
    );

    const response =
      await fetch(
        `${API_BASE_URL}/api/search`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            country,
            area,
            businessType,
            research: true
          })
        }
      );

    localProgress(
      35,
      "Collecting business information"
    );

    if (!response.ok) {
      const errorText =
        await response.text();

      throw new Error(
        errorText ||
        "Search request failed"
      );
    }

    const data =
      await response.json();

    localProgress(
      60,
      "Researching public online presence"
    );

    await wait(300);

    localProgress(
      80,
      "Checking websites and social profiles"
    );

    await wait(300);

    searchResults =
      Array.isArray(
        data.results
      )
        ? data.results.map(
            normalizeBusiness
          )
        : [];

    localProgress(
      100,
      "Research completed"
    );

    await wait(250);

    currentPage = 1;

    updateStats();

    renderResults();

    if (!searchResults.length) {
      showToast(
        "No businesses found",
        "Try a broader area or a different business type."
      );
    } else {
      showToast(
        "Research complete",
        `${searchResults.length} businesses were returned.`,
        "success"
      );
    }
  } catch (error) {
    console.error(error);

    searchResults = [];

    updateStats();

    elements.resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-visual">
          <div class="empty-ring ring-one"></div>
          <div class="empty-ring ring-two"></div>

          <div class="empty-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M12 9v4"></path>
              <path d="M12 17h.01"></path>
              <path d="M10.3 3.8 2.7 17a2 2 0 0 0 1.74 3h15.12a2 2 0 0 0 1.74-3L13.7 3.8a2 2 0 0 0-3.4 0Z"></path>
            </svg>
          </div>
        </div>

        <h3>
          Search could not be completed
        </h3>

        <p>
          ${escapeHtml(
            error.message ||
            "Check that your backend is running and that the search endpoint is available."
          )}
        </p>
      </div>
    `;

    showToast(
      "Search failed",
      "The frontend could not complete the search.",
      "error"
    );
  } finally {
    elements.searchButton.disabled =
      false;
  }
}

async function exportCSV() {
  const results =
    applyCurrentFilters(
      searchResults
    );

  if (!results.length) {
    showToast(
      "Nothing to export",
      "Run a search or change your filters first.",
      "error"
    );

    return;
  }

  const headers = [
    "Business Name",
    "Business Type",
    "Country",
    "Region",
    "City",
    "Area",
    "Address",
    "Phone",
    "WhatsApp",
    "Email",
    "Website",
    "Website Status",
    "Google Maps",
    "Rating",
    "Reviews",
    "Instagram",
    "Facebook",
    "TikTok",
    "LinkedIn",
    "X",
    "YouTube",
    "Research Summary",
    "Website Opportunity"
  ];

  const rows =
    results.map(item => [
      item.name,
      item.type,
      item.country,
      item.region,
      item.city,
      item.area,
      item.address,
      item.phone,
      item.whatsapp,
      item.email,
      item.website,
      websiteStatusLabel(
        item.websiteStatus
      ),
      item.googleMapsUrl,
      item.rating,
      item.reviews,
      item.instagram,
      item.facebook,
      item.tiktok,
      item.linkedin,
      item.x,
      item.youtube,
      item.researchSummary,
      item.opportunity
    ]);

  const csv = [
    headers,
    ...rows
  ]
    .map(row =>
      row
        .map(
          value =>
            `"${String(
              value ?? ""
            ).replaceAll(
              '"',
              '""'
            )}"`
        )
        .join(",")
    )
    .join("\n");

  const blob =
    new Blob(
      [csv],
      {
        type:
          "text/csv;charset=utf-8;"
      }
    );

  const url =
    URL.createObjectURL(
      blob
    );

  const link =
    document.createElement(
      "a"
    );

  link.href = url;

  link.download =
    `web-me-leads-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

  document.body.appendChild(
    link
  );

  link.click();

  link.remove();

  URL.revokeObjectURL(
    url
  );

  showToast(
    "CSV exported",
    `${results.length} leads were exported successfully.`,
    "success"
  );
}

function openFilterPanel() {
  elements.filterPanel.classList.add(
    "open"
  );

  elements.filterOverlay.classList.remove(
    "hidden"
  );

  document.body.style.overflow =
    "hidden";
}

function closeFilterPanel() {
  elements.filterPanel.classList.remove(
    "open"
  );

  elements.filterOverlay.classList.add(
    "hidden"
  );

  if (
    !elements.detailsPanel.classList.contains(
      "open"
    )
  ) {
    document.body.style.overflow =
      "";
  }
}

function updateFilterCount() {
  let count = 0;

  if (currentFilters.noWebsite) {
    count++;
  }

  if (currentFilters.instagram) {
    count++;
  }

  if (currentFilters.facebook) {
    count++;
  }

  if (currentFilters.whatsapp) {
    count++;
  }

  if (
    currentFilters.minRating >
    0
  ) {
    count++;
  }

  if (elements.filterCount) {
    elements.filterCount.textContent =
      count;
  }
}

function readFilterInputs() {
  const noWebsite =
    document.querySelector(
      "#filterNoWebsite"
    );

  const instagram =
    document.querySelector(
      "#filterInstagram"
    );

  const facebook =
    document.querySelector(
      "#filterFacebook"
    );

  const whatsapp =
    document.querySelector(
      "#filterWhatsapp"
    );

  const minRating =
    document.querySelector(
      "#minRating"
    );

  return {
    noWebsite:
      noWebsite
        ? noWebsite.checked
        : false,

    instagram:
      instagram
        ? instagram.checked
        : false,

    facebook:
      facebook
        ? facebook.checked
        : false,

    whatsapp:
      whatsapp
        ? whatsapp.checked
        : false,

    minRating:
      minRating
        ? Number(
            minRating.value
          )
        : 0
  };
}

function applyFilters() {
  currentFilters =
    readFilterInputs();

  currentPage = 1;

  updateFilterCount();

  closeFilterPanel();

  renderResults();
}

function clearFilters() {
  currentFilters = {
    noWebsite: false,
    instagram: false,
    facebook: false,
    whatsapp: false,
    minRating: 0
  };

  const noWebsite =
    document.querySelector(
      "#filterNoWebsite"
    );

  const instagram =
    document.querySelector(
      "#filterInstagram"
    );

  const facebook =
    document.querySelector(
      "#filterFacebook"
    );

  const whatsapp =
    document.querySelector(
      "#filterWhatsapp"
    );

  const minRating =
    document.querySelector(
      "#minRating"
    );

  if (noWebsite) {
    noWebsite.checked =
      false;
  }

  if (instagram) {
    instagram.checked =
      false;
  }

  if (facebook) {
    facebook.checked =
      false;
  }

  if (whatsapp) {
    whatsapp.checked =
      false;
  }

  if (minRating) {
    minRating.value = 0;
  }

  updateFilterCount();

  currentPage = 1;

  renderResults();
}

function wait(ms) {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}

function initializeEvents() {
  renderCountryOptions();

  ensureAIInterface();

  elements.countryInput?.addEventListener(
    "focus",
    openCountryPicker
  );

  elements.countryInput?.addEventListener(
    "input",
    event => {
      selectedCountry = "";

      openCountryPicker();

      renderCountryOptions(
        event.target.value
      );
    }
  );

  elements.countryDropdown?.addEventListener(
    "click",
    event => {
      const option =
        event.target.closest(
          ".country-option"
        );

      if (!option) {
        return;
      }

      selectCountry(
        option.dataset.country
      );
    }
  );

  document.addEventListener(
    "click",
    event => {
      if (
        !elements.countryPicker?.contains(
          event.target
        )
      ) {
        closeCountryPicker();
      }
    }
  );

  elements.searchButton?.addEventListener(
    "click",
    performSearch
  );

  elements.businessTypeInput?.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Enter"
      ) {
        performSearch();
      }
    }
  );

  elements.areaInput?.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Enter"
      ) {
        performSearch();
      }
    }
  );

  elements.filterButton?.addEventListener(
    "click",
    openFilterPanel
  );

  elements.closeFilter?.addEventListener(
    "click",
    closeFilterPanel
  );

  elements.filterOverlay?.addEventListener(
    "click",
    closeFilterPanel
  );

  elements.applyFilters?.addEventListener(
    "click",
    applyFilters
  );

  elements.clearFilters?.addEventListener(
    "click",
    clearFilters
  );

  elements.exportButton?.addEventListener(
    "click",
    exportCSV
  );

  elements.sortSelect?.addEventListener(
    "change",
    () => {
      currentPage = 1;
      renderResults();
    }
  );

  elements.detailsOverlay?.addEventListener(
    "click",
    closeBusinessDetails
  );

  elements.closeDetails?.addEventListener(
    "click",
    closeBusinessDetails
  );

  elements.mobileMenu?.addEventListener(
    "click",
    () => {
      elements.sidebar?.classList.toggle(
        "open"
      );
    }
  );

  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Escape"
      ) {
        closeCountryPicker();
        closeFilterPanel();
        closeBusinessDetails();
        closeWebMeAI();
        elements.sidebar?.classList.remove(
          "open"
        );
      }
    }
  );
}

initializeEvents();
updateStats();
updateFilterCount();
showEmptyState();
