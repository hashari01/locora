const API_URL = "https://locora-api.onrender.com";

/* =========================================================
   LOCORA LOCATION SYSTEM
========================================================= */

let selectedLocation = null;
let searchTimer = null;


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
        return;
    }

    createLocationUI();

    input.addEventListener("input", handleLocationTyping);

    input.addEventListener("focus", () => {

        if (input.value.trim().length >= 2) {
            searchLocations(input.value.trim());
        }

    });

    input.addEventListener("keydown", event => {

        if (event.key === "Escape") {
            hideSuggestions();
        }

        if (event.key === "Enter") {

            event.preventDefault();

            const firstSuggestion =
                document.querySelector(
                    ".location-suggestion"
                );

            if (firstSuggestion) {
                firstSuggestion.click();
            }

        }

    });

});


/* =========================================================
   CREATE LOCATION UI
========================================================= */

function createLocationUI() {

    const input = getSearchInput();

    if (!input) {
        return;
    }

    const searchBox =
        input.closest(".search-box");

    if (!searchBox) {
        return;
    }


    /*
     * Create suggestions container
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

        searchBox.parentElement.insertBefore(
            suggestions,
            searchBox.nextSibling
        );
    }


    /*
     * Create current location button
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

        suggestions.parentElement.insertBefore(
            currentLocationButton,
            suggestions.nextSibling
        );
    }


    addLocationStyles();
}


/* =========================================================
   LOCATION TYPING
========================================================= */

function handleLocationTyping(event) {

    const value =
        event.target.value.trim();


    /*
     * Clear previously selected location
     * if user changes the search.
     */

    if (
        selectedLocation &&
        value !== selectedLocation.searchValue
    ) {

        selectedLocation = null;

        localStorage.removeItem(
            "locoraSelectedLocation"
        );
    }


    clearTimeout(searchTimer);


    if (value.length < 2) {

        hideSuggestions();

        return;
    }


    searchTimer =
        setTimeout(() => {

            searchLocations(value);

        }, 350);
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


    suggestions.innerHTML = `
        <div class="location-loading">
            🔎 Searching locations...
        </div>
    `;

    suggestions.classList.add(
        "visible"
    );


    try {

        const response =
            await fetch(
                `${API_URL}/search?q=${encodeURIComponent(query)}`
            );


        if (!response.ok) {

            throw new Error(
                `Location search failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        if (
            !data.success ||
            !Array.isArray(data.results)
        ) {

            throw new Error(
                "Invalid location response."
            );
        }


        const results =
            data.results;


        if (results.length === 0) {

            suggestions.innerHTML = `
                <div class="location-empty">
                    No locations found.
                </div>
            `;

            return;
        }


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


        suggestions
            .querySelectorAll(
                ".location-suggestion"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const index =
                            Number(
                                button.dataset.index
                            );

                        selectLocation(
                            results[index],
                            query
                        );

                    }
                );

            });


    } catch (error) {

        console.error(
            "Location search error:",
            error
        );


        suggestions.innerHTML = `
            <div class="location-error">
                Unable to search locations right now.
            </div>
        `;
    }
}


/* =========================================================
   CREATE SUGGESTION
========================================================= */

function createSuggestion(
    location,
    index
) {

    const name =
        location.name ||
        "Unknown location";


    const displayName =
        location.displayName ||
        name;


    const type =
        location.type ||
        "location";


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

            </span>

        </button>
    `;
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
            "Invalid coordinates:",
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
            originalSearch
    };


    /*
     * Save location.
     */

    localStorage.setItem(
        "locoraSelectedLocation",
        JSON.stringify(
            selectedLocation
        )
    );


    /*
     * Put selected location
     * into search bar.
     */

    const input =
        getSearchInput();

    if (input) {

        input.value =
            selectedLocation.name;
    }


    /*
     * Hide suggestions.
     */

    hideSuggestions();


    /*
     * Update status.
     */

    const status =
        getStatus();

    if (status) {

        status.innerHTML = `
            📍 Selected:
            <strong>
                ${escapeHtml(
                    selectedLocation.displayName
                )}
            </strong>
        `;
    }


    /*
     * Update button.
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
     * Update location result
     * if your existing HTML has it.
     */

    const locationResult =
        document.getElementById(
            "locationResult"
        );

    if (locationResult) {

        locationResult.innerHTML = `

            <strong>
                📍 ${escapeHtml(
                    selectedLocation.displayName
                )}
            </strong>

            <small>
                ${latitude.toFixed(5)}
                ,
                ${longitude.toFixed(5)}
            </small>

        `;

        locationResult.classList.add(
            "visible"
        );
    }
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


    if (button) {

        button.disabled = true;

        button.innerHTML =
            "📍 Finding your location...";
    }


    if (status) {

        status.textContent =
            "Allow location access to find where you are.";
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
                "Geolocation error:",
                error
            );


            if (status) {

                if (
                    error.code ===
                    error.PERMISSION_DENIED
                ) {

                    status.textContent =
                        "Location permission was denied. Please allow location access in your browser.";

                } else {

                    status.textContent =
                        "Unable to find your current location. Please try again.";

                }
            }


            if (button) {

                button.disabled = false;

                button.innerHTML =
                    "📍 Use my current location";
            }
        },


        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
        }

    );
}


/* =========================================================
   REVERSE GEOCODE CURRENT LOCATION
========================================================= */

async function reverseGeocode(
    latitude,
    longitude
) {

    const status =
        getStatus();

    const button =
        document.getElementById(
            "currentLocationButton"
        );


    try {

        /*
         * Use Nominatim directly for reverse
         * geocoding.
         */

        const url =
            "https://nominatim.openstreetmap.org/reverse?" +
            new URLSearchParams({

                lat:
                    latitude,

                lon:
                    longitude,

                format:
                    "json",

                addressdetails:
                    "1"

            });


        const response =
            await fetch(
                url,
                {
                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `Reverse geocoding failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        const displayName =
            data.display_name ||
            "Current location";


        const name =
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


        localStorage.setItem(
            "locoraSelectedLocation",
            JSON.stringify(
                selectedLocation
            )
        );


        const input =
            getSearchInput();

        if (input) {

            input.value =
                name;
        }


        hideSuggestions();


        if (status) {

            status.innerHTML = `
                📍 Using your current location:
                <strong>
                    ${escapeHtml(
                        displayName
                    )}
                </strong>
            `;
        }


        const locationResult =
            document.getElementById(
                "locationResult"
            );


        if (locationResult) {

            locationResult.innerHTML = `

                <strong>
                    📍 ${escapeHtml(
                        displayName
                    )}
                </strong>

                <small>
                    ${latitude.toFixed(5)}
                    ,
                    ${longitude.toFixed(5)}
                </small>

            `;

            locationResult.classList.add(
                "visible"
            );
        }


        /*
         * Automatically go to Explore
         * after current location is found.
         */

        setTimeout(() => {

            goToExplore();

        }, 500);


    } catch (error) {

        console.error(
            "Reverse geocoding error:",
            error
        );


        if (status) {

            status.textContent =
                "We found your coordinates, but couldn't identify the location name.";
        }


        /*
         * Even if reverse geocoding fails,
         * keep the coordinates.
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


        localStorage.setItem(
            "locoraSelectedLocation",
            JSON.stringify(
                selectedLocation
            )
        );


        setTimeout(() => {

            goToExplore();

        }, 500);


    } finally {

        if (button) {

            button.disabled = false;

            button.innerHTML =
                "📍 Use my current location";
        }
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
     * If a location is already selected,
     * go directly to Explore.
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
     * Search locations and show
     * suggestions.
     */

    searchLocations(value);
}


/* =========================================================
   GO TO EXPLORE
========================================================= */

function goToExplore() {

    const saved =
        localStorage.getItem(
            "locoraSelectedLocation"
        );


    if (!saved) {

        const status =
            getStatus();

        if (status) {

            status.textContent =
                "Please select a location first.";
        }

        return;
    }


    /*
     * Send user to explore page.
     */

    window.location.href =
        "explore.html";
}


/* =========================================================
   LOAD SAVED LOCATION
========================================================= */

function loadSavedLocation() {

    const saved =
        localStorage.getItem(
            "locoraSelectedLocation"
        );


    if (!saved) {
        return null;
    }


    try {

        const location =
            JSON.parse(saved);


        if (
            !Number.isFinite(
                Number(location.latitude)
            ) ||
            !Number.isFinite(
                Number(location.longitude)
            )
        ) {

            return null;
        }


        return location;

    } catch {

        return null;
    }
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
            event.target !== input
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
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            overflow: hidden;
            display: none;
            box-shadow:
                0 12px 35px rgba(0,0,0,0.08);
            position: relative;
            z-index: 50;
        }


        .location-suggestions.visible {
            display: block;
        }


        .location-suggestion {
            width: 100%;
            border: none;
            border-bottom: 1px solid #f0f1f3;
            background: white;
            padding: 14px 16px;
            display: flex;
            align-items: center;
            gap: 13px;
            text-align: left;
            cursor: pointer;
            transition: background 0.15s;
        }


        .location-suggestion:last-child {
            border-bottom: none;
        }


        .location-suggestion:hover {
            background: #f8fafc;
        }


        .suggestion-icon {
            width: 38px;
            height: 38px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #eff6ff;
            border-radius: 10px;
            flex-shrink: 0;
            font-size: 18px;
        }


        .suggestion-content {
            min-width: 0;
            display: flex;
            flex-direction: column;
            gap: 3px;
        }


        .suggestion-content strong {
            color: #111827;
            font-size: 14px;
        }


        .suggestion-content small {
            color: #6b7280;
            font-size: 12px;
            line-height: 1.4;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }


        .location-loading,
        .location-empty,
        .location-error {
            padding: 18px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }


        .location-error {
            color: #b91c1c;
            background: #fef2f2;
        }


        .current-location-button {
            display: block;
            margin: 12px auto 0;
            border: 1px solid #dbeafe;
            background: #eff6ff;
            color: #1d4ed8;
            padding: 11px 16px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            transition:
                background 0.15s,
                transform 0.15s;
        }


        .current-location-button:hover {
            background: #dbeafe;
            transform: translateY(-1px);
        }


        .current-location-button:disabled {
            opacity: 0.65;
            cursor: wait;
            transform: none;
        }


        @media (max-width: 700px) {

            .location-suggestions {
                width: calc(100% - 0px);
            }

            .current-location-button {
                width: 100%;
            }

        }

    `;


    document.head.appendChild(
        style
    );
}


/* =========================================================
   SUPPORT OLD BUTTON / NAVIGATION
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
