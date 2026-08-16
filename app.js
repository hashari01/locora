```javascript
const API_URL = "https://locora-api.onrender.com";

/* =========================================================
   LOCORA LOCATION SYSTEM
========================================================= */

let selectedLocation = null;
let searchTimer = null;
let searchRequestId = 0;


/* =========================================================
   GET ELEMENTS
========================================================= */

function getSearchInput() {
    return document.getElementById("searchInput");
}

function getSuggestions() {
    return document.getElementById("locationSuggestions");
}

function getStatus() {
    return document.getElementById("searchStatus");
}


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    const input = getSearchInput();

    if (!input) {
        console.warn("Locora: #searchInput was not found.");
        return;
    }

    selectedLocation = loadSavedLocation();

    createLocationUI();

    /*
     * If a location was already selected,
     * restore it into the search box.
     */

    if (selectedLocation) {

        input.value =
            selectedLocation.name ||
            selectedLocation.displayName ||
            "";

        updateSelectedStatus();
    }


    /*
     * Typing in the search box.
     */

    input.addEventListener(
        "input",
        handleLocationTyping
    );


    /*
     * Focus search box.
     */

    input.addEventListener(
        "focus",
        () => {

            const value =
                input.value.trim();

            if (value.length >= 2) {

                searchLocations(value);

            } else {

                showCurrentLocationButton();
            }
        }
    );


    /*
     * Keyboard controls.
     */

    input.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {

                hideSuggestions();

                return;
            }


            if (event.key === "Enter") {

                event.preventDefault();

                const first =
                    document.querySelector(
                        ".location-suggestion"
                    );

                if (first) {

                    first.click();

                } else {

                    searchLocora();
                }
            }
        }
    );


    /*
     * Make sure the UI exists.
     */

    showCurrentLocationButton();
});


/* =========================================================
   CREATE LOCATION UI
========================================================= */

function createLocationUI() {

    const input =
        getSearchInput();

    if (!input) {
        return;
    }


    const searchBox =
        input.closest(".search-box");


    if (!searchBox) {

        console.warn(
            "Locora: .search-box was not found."
        );

        return;
    }


    /*
     * Suggestions container.
     */

    let suggestions =
        document.getElementById(
            "locationSuggestions"
        );


    if (!suggestions) {

        suggestions =
            document.createElement("div");

        suggestions.id =
            "locationSuggestions";

        suggestions.className =
            "location-suggestions";


        /*
         * Put suggestions directly
         * below the search box.
         */

        searchBox.insertAdjacentElement(
            "afterend",
            suggestions
        );
    }


    /*
     * Current location button.
     */

    let currentLocationButton =
        document.getElementById(
            "currentLocationButton"
        );


    if (!currentLocationButton) {

        currentLocationButton =
            document.createElement("button");

        currentLocationButton.id =
            "currentLocationButton";

        currentLocationButton.type =
            "button";

        currentLocationButton.className =
            "current-location-button";

        currentLocationButton.innerHTML =
            "📍 Use my current location";


        currentLocationButton.addEventListener(
            "click",
            useCurrentLocation
        );


        /*
         * Put current-location button
         * directly below search suggestions.
         */

        suggestions.insertAdjacentElement(
            "afterend",
            currentLocationButton
        );
    }


    addLocationStyles();
}


/* =========================================================
   LOCATION TYPING
========================================================= */

function handleLocationTyping(event) {

    const input =
        event.target;

    const value =
        input.value.trim();


    /*
     * User changed the selected location.
     */

    if (
        selectedLocation &&
        value !== selectedLocation.name &&
        value !== selectedLocation.searchValue
    ) {

        selectedLocation = null;

        localStorage.removeItem(
            "locoraSelectedLocation"
        );
    }


    clearTimeout(searchTimer);


    /*
     * Empty search.
     */

    if (!value) {

        hideSuggestions();

        showCurrentLocationButton();

        return;
    }


    /*
     * Too short.
     */

    if (value.length < 2) {

        hideSuggestions();

        return;
    }


    /*
     * Wait until user stops typing.
     */

    searchTimer =
        setTimeout(
            () => {

                searchLocations(value);

            },
            300
        );
}


/* =========================================================
   SEARCH LOCATIONS
========================================================= */

async function searchLocations(query) {

    const suggestions =
        getSuggestions();


    if (!suggestions) {
        return;
    }


    const cleanQuery =
        String(query || "").trim();


    if (cleanQuery.length < 2) {

        hideSuggestions();

        return;
    }


    /*
     * Create unique request ID.
     *
     * This prevents an older API request
     * from replacing newer results.
     */

    const requestId =
        ++searchRequestId;


    /*
     * Show loading.
     */

    suggestions.innerHTML = `
        <div class="location-loading">
            <span class="location-spinner"></span>
            Searching for "${escapeHtml(cleanQuery)}"...
        </div>
    `;


    suggestions.classList.add(
        "visible"
    );


    showCurrentLocationButton();


    try {

        const response =
            await fetch(
                `${API_URL}/search?q=${encodeURIComponent(cleanQuery)}`,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        /*
         * Ignore old request.
         */

        if (
            requestId !== searchRequestId
        ) {

            return;
        }


        if (!response.ok) {

            throw new Error(
                `API returned ${response.status}`
            );
        }


        const data =
            await response.json();


        if (
            !data ||
            data.success !== true ||
            !Array.isArray(data.results)
        ) {

            throw new Error(
                "Invalid API response."
            );
        }


        const results =
            data.results;


        /*
         * No results.
         */

        if (results.length === 0) {

            suggestions.innerHTML = `
                <div class="location-empty">

                    <div class="location-empty-icon">
                        🔍
                    </div>

                    <strong>
                        No locations found
                    </strong>

                    <span>
                        Try searching for a city, state, country, or address.
                    </span>

                </div>
            `;

            return;
        }


        /*
         * Render results.
         */

        suggestions.innerHTML =
            results
                .map(
                    (location, index) =>
                        createSuggestion(
                            location,
                            index
                        )
                )
                .join("");


        /*
         * Attach click events.
         */

        suggestions
            .querySelectorAll(
                ".location-suggestion"
            )
            .forEach(
                button => {

                    button.addEventListener(
                        "click",
                        () => {

                            const index =
                                Number(
                                    button.dataset.index
                                );


                            const location =
                                results[index];


                            selectLocation(
                                location,
                                cleanQuery
                            );
                        }
                    );
                }
            );


    } catch (error) {

        /*
         * Ignore old requests.
         */

        if (
            requestId !== searchRequestId
        ) {

            return;
        }


        console.error(
            "Locora location search error:",
            error
        );


        suggestions.innerHTML = `
            <div class="location-error">

                <div class="location-error-icon">
                    ⚠️
                </div>

                <strong>
                    Search temporarily unavailable
                </strong>

                <span>
                    Please check your connection and try again.
                </span>

            </div>
        `;
    }
}


/* =========================================================
   CREATE LOCATION SUGGESTION
========================================================= */

function createSuggestion(
    location,
    index
) {

    const name =
        location.name ||
        location.displayName ||
        "Unknown location";


    const displayName =
        location.displayName ||
        name;


    const type =
        location.type ||
        "location";


    const category =
        location.category ||
        "";


    return `
        <button
            type="button"
            class="location-suggestion"
            data-index="${index}"
        >

            <span class="suggestion-icon">
                📍
            </span>


            <span class="suggestion-content">

                <strong>
                    ${escapeHtml(name)}
                </strong>


                <small>
                    ${escapeHtml(displayName)}
                </small>


                <span class="suggestion-type">
                    ${escapeHtml(
                        formatLocationType(
                            type,
                            category
                        )
                    )}
                </span>

            </span>


            <span class="suggestion-arrow">
                →
            </span>

        </button>
    `;
}


/* =========================================================
   FORMAT LOCATION TYPE
========================================================= */

function formatLocationType(
    type,
    category
) {

    const value =
        category ||
        type ||
        "location";


    return String(value)
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            letter =>
                letter.toUpperCase()
        );
}


/* =========================================================
   SELECT LOCATION
========================================================= */

function selectLocation(
    location,
    originalSearch
) {

    const latitude =
        Number(location.latitude);

    const longitude =
        Number(location.longitude);


    if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
    ) {

        console.error(
            "Locora: Invalid coordinates.",
            location
        );

        return;
    }


    selectedLocation = {

        name:
            location.name ||
            originalSearch,

        displayName:
            location.displayName ||
            location.name ||
            originalSearch,

        latitude,

        longitude,

        searchValue:
            originalSearch,

        isCurrentLocation:
            false
    };


    /*
     * Save location.
     */

    saveSelectedLocation();


    /*
     * Put selected location
     * into search bar.
     */

    const input =
        getSearchInput();


    if (input) {

        input.value =
            selectedLocation.name;

        input.blur();
    }


    /*
     * Hide dropdown.
     */

    hideSuggestions();


    /*
     * Update status.
     */

    updateSelectedStatus();


    /*
     * Update search button.
     */

    const searchButton =
        document.getElementById(
            "searchButton"
        );


    if (searchButton) {

        searchButton.textContent =
            "Explore";
    }


    /*
     * Update result element
     * if it exists.
     */

    updateLocationResult();
}


/* =========================================================
   CURRENT LOCATION
========================================================= */

function useCurrentLocation() {

    const status =
        getStatus();


    const button =
        document.getElementById(
            "currentLocationButton"
        );


    if (!navigator.geolocation) {

        if (status) {

            status.textContent =
                "Your browser does not support location services.";
        }

        return;
    }


    /*
     * Loading state.
     */

    if (button) {

        button.disabled =
            true;

        button.innerHTML =
            `
            <span class="location-spinner"></span>
            Finding your location...
            `;
    }


    if (status) {

        status.textContent =
            "Allow location access to find your current location.";
    }


    navigator.geolocation.getCurrentPosition(

        position => {

            const latitude =
                Number(
                    position.coords.latitude
                );


            const longitude =
                Number(
                    position.coords.longitude
                );


            reverseGeocode(
                latitude,
                longitude
            );
        },


        error => {

            console.error(
                "Locora geolocation error:",
                error
            );


            if (status) {

                if (
                    error.code ===
                    error.PERMISSION_DENIED
                ) {

                    status.textContent =
                        "Location access was denied. Please allow location access in your browser.";

                } else if (
                    error.code ===
                    error.TIMEOUT
                ) {

                    status.textContent =
                        "Location request timed out. Please try again.";

                } else {

                    status.textContent =
                        "Unable to find your current location. Please try again.";
                }
            }


            resetCurrentLocationButton();
        },


        {
            enableHighAccuracy:
                true,

            timeout:
                15000,

            maximumAge:
                60000
        }
    );
}


/* =========================================================
   REVERSE GEOCODE
========================================================= */

async function reverseGeocode(
    latitude,
    longitude
) {

    const status =
        getStatus();


    try {

        /*
         * Use your own API.
         *
         * This avoids making the browser
         * call Nominatim directly.
         */

        const url =
            `${API_URL}/reverse?lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`;


        const response =
            await fetch(
                url,
                {
                    method: "GET",
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `Reverse API returned ${response.status}`
            );
        }


        const data =
            await response.json();


        const displayName =
            data.displayName ||
            data.display_name ||
            "Current location";


        const name =
            data.name ||
            data.city ||
            data.address?.city ||
            data.address?.town ||
            data.address?.village ||
            data.address?.state ||
            "Current location";


        selectedLocation = {

            name,

            displayName,

            latitude,

            longitude,

            searchValue:
                "current-location",

            isCurrentLocation:
                true
        };


        saveSelectedLocation();


        const input =
            getSearchInput();


        if (input) {

            input.value =
                name;

            input.blur();
        }


        hideSuggestions();


        updateSelectedStatus();

        updateLocationResult();


        /*
         * Go to Explore.
         */

        setTimeout(
            () => {

                goToExplore();

            },
            400
        );


    } catch (error) {

        console.error(
            "Locora reverse geocoding error:",
            error
        );


        /*
         * We still have valid coordinates.
         * Save them even if the name lookup fails.
         */

        selectedLocation = {

            name:
                "Current location",

            displayName:
                "Current location",

            latitude,

            longitude,

            searchValue:
                "current-location",

            isCurrentLocation:
                true
        };


        saveSelectedLocation();


        const input =
            getSearchInput();


        if (input) {

            input.value =
                "Current location";

            input.blur();
        }


        hideSuggestions();


        if (status) {

            status.textContent =
                "Location found. Opening Explore...";
        }


        updateLocationResult();


        setTimeout(
            () => {

                goToExplore();

            },
            500
        );


    } finally {

        resetCurrentLocationButton();
    }
}


/* =========================================================
   SEARCH BUTTON
========================================================= */

function searchLocora() {

    const input =
        getSearchInput();


    if (!input) {
        return;
    }


    /*
     * Already selected.
     */

    if (selectedLocation) {

        goToExplore();

        return;
    }


    const value =
        input.value.trim();


    if (!value) {

        const status =
            getStatus();


        if (status) {

            status.textContent =
                "Type a location first.";
        }


        input.focus();

        return;
    }


    /*
     * Search and show choices.
     */

    searchLocations(value);
}


/* =========================================================
   GO TO EXPLORE
========================================================= */

function goToExplore() {

    /*
     * First check memory variable.
     */

    if (
        selectedLocation &&
        Number.isFinite(
            Number(selectedLocation.latitude)
        ) &&
        Number.isFinite(
            Number(selectedLocation.longitude)
        )
    ) {

        saveSelectedLocation();

    } else {

        /*
         * Try localStorage.
         */

        const saved =
            loadSavedLocation();


        if (saved) {

            selectedLocation =
                saved;

        } else {

            const status =
                getStatus();


            if (status) {

                status.textContent =
                    "Please select a location first.";
            }


            return;
        }
    }


    /*
     * Go to explore page.
     */

    window.location.href =
        "explore.html";
}


/* =========================================================
   SAVE LOCATION
========================================================= */

function saveSelectedLocation() {

    if (!selectedLocation) {
        return;
    }


    try {

        localStorage.setItem(
            "locoraSelectedLocation",
            JSON.stringify(
                selectedLocation
            )
        );

    } catch (error) {

        console.error(
            "Locora: Could not save location.",
            error
        );
    }
}


/* =========================================================
   LOAD SAVED LOCATION
========================================================= */

function loadSavedLocation() {

    try {

        const saved =
            localStorage.getItem(
                "locoraSelectedLocation"
            );


        if (!saved) {
            return null;
        }


        const location =
            JSON.parse(saved);


        const latitude =
            Number(location.latitude);


        const longitude =
            Number(location.longitude);


        if (
            !Number.isFinite(latitude) ||
            !Number.isFinite(longitude)
        ) {

            localStorage.removeItem(
                "locoraSelectedLocation"
            );

            return null;
        }


        return {

            ...location,

            latitude,

            longitude
        };


    } catch (error) {

        console.error(
            "Locora: Invalid saved location.",
            error
        );


        localStorage.removeItem(
            "locoraSelectedLocation"
        );


        return null;
    }
}


/* =========================================================
   UPDATE SELECTED STATUS
========================================================= */

function updateSelectedStatus() {

    const status =
        getStatus();


    if (!status || !selectedLocation) {
        return;
    }


    if (
        selectedLocation.isCurrentLocation
    ) {

        status.innerHTML = `
            📍 Using your current location
            <strong>
                ${escapeHtml(
                    selectedLocation.displayName ||
                    selectedLocation.name
                )}
            </strong>
        `;

    } else {

        status.innerHTML = `
            📍 Selected location:
            <strong>
                ${escapeHtml(
                    selectedLocation.displayName ||
                    selectedLocation.name
                )}
            </strong>
        `;
    }
}


/* =========================================================
   UPDATE LOCATION RESULT
========================================================= */

function updateLocationResult() {

    const locationResult =
        document.getElementById(
            "locationResult"
        );


    if (
        !locationResult ||
        !selectedLocation
    ) {

        return;
    }


    locationResult.innerHTML = `

        <strong>
            📍 ${escapeHtml(
                selectedLocation.displayName ||
                selectedLocation.name
            )}
        </strong>

        <small>
            ${Number(
                selectedLocation.latitude
            ).toFixed(5)}
            ,
            ${Number(
                selectedLocation.longitude
            ).toFixed(5)}
        </small>

    `;


    locationResult.classList.add(
        "visible"
    );
}


/* =========================================================
   SHOW CURRENT LOCATION BUTTON
========================================================= */

function showCurrentLocationButton() {

    const button =
        document.getElementById(
            "currentLocationButton"
        );


    if (!button) {
        return;
    }


    button.style.display =
        "flex";
}


/* =========================================================
   RESET CURRENT LOCATION BUTTON
========================================================= */

function resetCurrentLocationButton() {

    const button =
        document.getElementById(
            "currentLocationButton"
        );


    if (!button) {
        return;
    }


    button.disabled =
        false;


    button.innerHTML =
        "📍 Use my current location";


    button.style.display =
        "flex";
}


/* =========================================================
   HIDE SUGGESTIONS
========================================================= */

function hideSuggestions() {

    const suggestions =
        getSuggestions();


    if (!suggestions) {
        return;
    }


    suggestions.classList.remove(
        "visible"
    );
}


/* =========================================================
   CLICK OUTSIDE
========================================================= */

document.addEventListener(
    "click",
    event => {

        const suggestions =
            getSuggestions();


        const input =
            getSearchInput();


        const button =
            document.getElementById(
                "currentLocationButton"
            );


        if (
            !suggestions ||
            !input
        ) {

            return;
        }


        if (
            !suggestions.contains(
                event.target
            ) &&
            event.target !== input &&
            (!button ||
                !button.contains(
                    event.target
                ))
        ) {

            hideSuggestions();
        }
    }
);


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHtml(value) {

    return String(value)

        .replaceAll(
            "&",
            "&amp;"
        )

        .replaceAll(
            "<",
            "&lt;"
        )

        .replaceAll(
            ">",
            "&gt;"
        )

        .replaceAll(
            '"',
            "&quot;"
        )

        .replaceAll(
            "'",
            "&#039;"
        );
}


/* =========================================================
   LOCATION CSS
========================================================= */

function addLocationStyles() {

    if (
        document.getElementById(
            "locoraLocationStyles"
        )
    ) {

        return;
    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "locoraLocationStyles";


    style.textContent = `

        .location-suggestions {
            width: 100%;
            max-width: 760px;
            margin: 8px auto 0;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 16px;
            overflow: hidden;
            display: none;
            box-shadow:
                0 15px 40px rgba(0,0,0,0.10);
            position: relative;
            z-index: 1000;
        }


        .location-suggestions.visible {
            display: block;
        }


        .location-suggestion {
            width: 100%;
            border: none;
            border-bottom: 1px solid #f0f1f3;
            background: #ffffff;
            padding: 15px 16px;
            display: flex;
            align-items: center;
            gap: 13px;
            text-align: left;
            cursor: pointer;
            transition:
                background 0.15s ease,
                transform 0.15s ease;
        }


        .location-suggestion:last-child {
            border-bottom: none;
        }


        .location-suggestion:hover {
            background: #f8fafc;
        }


        .location-suggestion:active {
            transform: scale(0.995);
        }


        .suggestion-icon {
            width: 42px;
            height: 42px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #eff6ff;
            border-radius: 12px;
            flex-shrink: 0;
            font-size: 19px;
        }


        .suggestion-content {
            min-width: 0;
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }


        .suggestion-content strong {
            color: #111827;
            font-size: 14px;
            font-weight: 700;
        }


        .suggestion-content small {
            color: #6b7280;
            font-size: 12px;
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }


        .suggestion-type {
            color: #2563eb;
            font-size: 11px;
            font-weight: 600;
        }


        .suggestion-arrow {
            color: #9ca3af;
            font-size: 18px;
            flex-shrink: 0;
        }


        .location-loading,
        .location-empty,
        .location-error {
            padding: 20px;
            text-align: center;
            font-size: 14px;
        }


        .location-loading {
            color: #6b7280;
        }


        .location-empty {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            color: #6b7280;
        }


        .location-empty strong {
            color: #111827;
        }


        .location-empty-icon {
            font-size: 24px;
            margin-bottom: 3px;
        }


        .location-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            color: #b91c1c;
            background: #fef2f2;
        }


        .location-error-icon {
            font-size: 24px;
        }


        .current-location-button {
            width: 100%;
            max-width: 760px;
            margin: 10px auto 0;
            border: 1px solid #dbeafe;
            background: #eff6ff;
            color: #1d4ed8;
            padding: 12px 16px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition:
                background 0.15s ease,
                transform 0.15s ease;
        }


        .current-location-button:hover {
            background: #dbeafe;
            transform: translateY(-1px);
        }


        .current-location-button:active {
            transform: translateY(0);
        }


        .current-location-button:disabled {
            opacity: 0.65;
            cursor: wait;
            transform: none;
        }


        .location-spinner {
            width: 15px;
            height: 15px;
            border: 2px solid rgba(37,99,235,0.25);
            border-top-color: #2563eb;
            border-radius: 50%;
            display: inline-block;
            animation:
                locoraSpin 0.7s linear infinite;
        }


        @keyframes locoraSpin {

            to {
                transform: rotate(360deg);
            }

        }


        @media (max-width: 700px) {

            .location-suggestions {
                max-width: 100%;
            }


            .current-location-button {
                max-width: 100%;
            }


            .location-suggestion {
                padding: 13px;
            }

        }

    `;


    document.head.appendChild(
        style
    );
}


/* =========================================================
   SUPPORT GLOBAL BUTTONS
========================================================= */

window.searchLocora =
    searchLocora;


window.useCurrentLocation =
    useCurrentLocation;


window.goToExplore =
    goToExplore;


window.selectLocation =
    selectLocation;


/* =========================================================
   EXPOSE SAVED LOCATION
========================================================= */

window.getLocoraLocation =
    loadSavedLocation;
```
