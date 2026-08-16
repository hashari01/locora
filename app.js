/* =========================================================
   LOCORA — FRONTEND ENGINE
   ========================================================= */

const places = [

  {
    id: 1,
    name: "The Garage Food Hall",
    category: "Restaurants",
    rating: 4.8,
    reviews: 2300,
    distance: 0.8,
    price: 2,
    open: true,
    trending: true,
    image: "image-one",
    icon: "🍔",
    description: "A lively local food hall with multiple restaurants, drinks and plenty of atmosphere."
  },

  {
    id: 2,
    name: "Provider Coffee",
    category: "Coffee",
    rating: 4.7,
    reviews: 1200,
    distance: 1.1,
    price: 2,
    open: true,
    trending: true,
    image: "image-two",
    icon: "☕",
    description: "A modern neighborhood coffee shop serving specialty coffee and fresh pastries."
  },

  {
    id: 3,
    name: "Newfields",
    category: "Things to Do",
    rating: 4.9,
    reviews: 3100,
    distance: 3.2,
    price: 3,
    open: true,
    trending: true,
    image: "image-three",
    icon: "🎨",
    description: "Explore art, gardens and cultural experiences in one of Indianapolis' most popular destinations."
  },

  {
    id: 4,
    name: "Bottleworks District",
    category: "Shopping",
    rating: 4.7,
    reviews: 1900,
    distance: 1.6,
    price: 2,
    open: true,
    trending: false,
    image: "image-four",
    icon: "🛍️",
    description: "A modern district filled with restaurants, shopping, entertainment and events."
  },

  {
    id: 5,
    name: "The Jazz Kitchen",
    category: "Restaurants",
    rating: 4.6,
    reviews: 1400,
    distance: 2.4,
    price: 3,
    open: false,
    trending: false,
    image: "image-five",
    icon: "🎷",
    description: "Live music, dinner and an intimate atmosphere for a memorable night out."
  },

  {
    id: 6,
    name: "Monon Trail",
    category: "Things to Do",
    rating: 4.8,
    reviews: 2700,
    distance: 2.9,
    price: 1,
    open: true,
    trending: true,
    image: "image-six",
    icon: "🚲",
    description: "A popular local trail for walking, running, cycling and enjoying the outdoors."
  },

  {
    id: 7,
    name: "Anytime Fitness",
    category: "Fitness",
    rating: 4.5,
    reviews: 800,
    distance: 1.9,
    price: 2,
    open: true,
    trending: false,
    image: "image-three",
    icon: "🏋️",
    description: "A convenient neighborhood gym with equipment and flexible hours."
  },

  {
    id: 8,
    name: "Bottleworks Hotel",
    category: "Hotels",
    rating: 4.7,
    reviews: 980,
    distance: 1.7,
    price: 4,
    open: true,
    trending: false,
    image: "image-four",
    icon: "🏨",
    description: "A stylish stay located in the heart of the Bottleworks district."
  }

];


/* =========================================================
   STATE
   ========================================================= */

let currentPlaces = [...places];
let savedPlaces = JSON.parse(localStorage.getItem("locoraSaved")) || [];
let currentCategory = "All";
let currentFilter = "all";


/* =========================================================
   INITIALIZE
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  renderTrending();
  renderResults();
  renderSaved();

  const savedTheme = localStorage.getItem("locoraTheme");

  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    document.getElementById("themeBtn").textContent = "☀";
  }

  document
    .getElementById("themeBtn")
    .addEventListener("click", toggleTheme);

  document
    .getElementById("searchInput")
    .addEventListener("keydown", event => {
      if (event.key === "Enter") {
        performSearch();
      }
    });

});


/* =========================================================
   RENDER TRENDING
   ========================================================= */

function renderTrending() {

  const grid = document.getElementById("trendingGrid");

  const trending = places.filter(place => place.trending);

  grid.innerHTML = trending
    .map(place => createPlaceCard(place))
    .join("");

}


/* =========================================================
   RENDER RESULTS
   ========================================================= */

function renderResults(data = currentPlaces) {

  const grid = document.getElementById("resultsGrid");

  if (!data.length) {

    grid.innerHTML = `
      <div style="
        grid-column:1/-1;
        padding:60px 20px;
        text-align:center;
        color:var(--muted);
      ">
        <div style="font-size:40px;">🔎</div>
        <h3 style="color:var(--text);margin-top:10px;">
          Nothing found
        </h3>
        <p style="margin-top:5px;">
          Try another search or category.
        </p>
      </div>
    `;

    return;
  }

  grid.innerHTML = data
    .map(place => createPlaceCard(place))
    .join("");

}


/* =========================================================
   PLACE CARD
   ========================================================= */

function createPlaceCard(place) {

  const saved = savedPlaces.includes(place.id);

  const price = "$".repeat(place.price);

  return `

    <article
      class="place-card"
      onclick="openPlace(${place.id})"
    >

      <div class="place-image ${place.image}">

        ${
          place.trending
            ? `<span class="trending-badge">🔥 Trending</span>`
            : ""
        }

        <button
          class="save-btn ${saved ? "saved" : ""}"
          onclick="event.stopPropagation(); toggleSave(${place.id})"
          aria-label="Save ${place.name}"
        >
          ${saved ? "♥" : "♡"}
        </button>

        <div class="place-photo-text">
          ${place.icon}
        </div>

      </div>

      <div class="place-body">

        <div class="place-top">

          <div>
            <div class="place-title">
              ${place.name}
            </div>

            <div class="place-category">
              ${place.category}
            </div>
          </div>

          <div class="place-rating">
            ⭐ ${place.rating}
          </div>

        </div>

        <div class="place-meta">

          <span class="meta">
            📍 ${place.distance} mi
          </span>

          <span class="meta">
            ${price}
          </span>

          <span class="meta ${place.open ? "open" : ""}">
            ${place.open ? "● Open now" : "Closed"}
          </span>

        </div>

        <p class="place-description">
          ${place.description}
        </p>

      </div>

    </article>

  `;
}


/* =========================================================
   SEARCH
   ========================================================= */

function performSearch() {

  const input = document
    .getElementById("searchInput")
    .value
    .trim()
    .toLowerCase();

  if (!input) {

    currentPlaces = [...places];

    document.getElementById("resultsTitle").textContent =
      "Places around you";

    document.getElementById("resultsSubtitle").textContent =
      "Popular places worth checking out.";

    renderResults();

    scrollToResults();

    return;
  }

  const results = places.filter(place => {

    const text = `
      ${place.name}
      ${place.category}
      ${place.description}
    `.toLowerCase();

    return text.includes(input);

  });

  currentPlaces = results;

  document.getElementById("resultsTitle").textContent =
    `Results for "${input}"`;

  document.getElementById("resultsSubtitle").textContent =
    `${results.length} discovery${results.length === 1 ? "" : "ies"} found nearby.`;

  renderResults(results);

  scrollToResults();

}


/* =========================================================
   QUICK SEARCH
   ========================================================= */

function quickSearch(category) {

  document.getElementById("searchInput").value = category;

  filterCategory(category);

}


/* =========================================================
   CATEGORY FILTER
   ========================================================= */

function filterCategory(category, button = null) {

  currentCategory = category;

  document
    .querySelectorAll(".category-card")
    .forEach(card => card.classList.remove("active"));

  if (button) {
    button.classList.add("active");
  }

  if (category === "All") {

    currentPlaces = [...places];

  } else {

    currentPlaces = places.filter(place =>
      place.category === category
    );

  }

  document.getElementById("resultsTitle").textContent =
    category === "All"
      ? "Places around you"
      : category;

  document.getElementById("resultsSubtitle").textContent =
    `${currentPlaces.length} place${currentPlaces.length === 1 ? "" : "s"} to explore.`;

  renderResults(currentPlaces);

  scrollToResults();

}


/* =========================================================
   FILTERS
   ========================================================= */

function toggleFilterMenu() {

  document
    .getElementById("filterMenu")
    .classList.toggle("show");

}


function applyQuickFilter(type) {

  currentFilter = type;

  let results = [...currentPlaces];

  if (type === "open") {

    results = results.filter(place => place.open);

  }

  if (type === "cheap") {

    results = results.filter(place => place.price <= 2);

  }

  if (type === "top") {

    results = results.filter(place => place.rating >= 4.5);

  }

  renderResults(results);

  showToast("Filter applied");

}


/* =========================================================
   SORT
   ========================================================= */

function sortResults() {

  const value =
    document.getElementById("sortSelect").value;

  let sorted = [...currentPlaces];

  if (value === "rating") {

    sorted.sort((a, b) =>
      b.rating - a.rating
    );

  }

  if (value === "distance") {

    sorted.sort((a, b) =>
      a.distance - b.distance
    );

  }

  if (value === "price-low") {

    sorted.sort((a, b) =>
      a.price - b.price
    );

  }

  renderResults(sorted);

}


/* =========================================================
   SAVE SYSTEM
   ========================================================= */

function toggleSave(id) {

  if (savedPlaces.includes(id)) {

    savedPlaces =
      savedPlaces.filter(placeId => placeId !== id);

    showToast("Removed from saved");

  } else {

    savedPlaces.push(id);

    showToast("Saved to your Locora ❤️");

  }

  localStorage.setItem(
    "locoraSaved",
    JSON.stringify(savedPlaces)
  );

  renderTrending();
  renderResults(currentPlaces);
  renderSaved();

}


function renderSaved() {

  const container =
    document.getElementById("savedContent");

  if (!savedPlaces.length) {

    container.className = "saved-empty";

    container.innerHTML = `
      <div>♡</div>
      <h3>Nothing saved yet</h3>
      <p>
        Tap the heart on a place you love and it'll appear here.
      </p>
    `;

    return;
  }

  const saved = places.filter(place =>
    savedPlaces.includes(place.id)
  );

  container.className = "place-grid";

  container.innerHTML =
    saved.map(place =>
      createPlaceCard(place)
    ).join("");

}


/* =========================================================
   PLACE MODAL
   ========================================================= */

function openPlace(id) {

  const place =
    places.find(item => item.id === id);

  if (!place) return;

  document.getElementById("modalTitle").textContent =
    place.name;

  document.getElementById("modalRating").textContent =
    `⭐ ${place.rating} · ${place.reviews.toLocaleString()} reviews`;

  document.getElementById("modalCategory").textContent =
    `${place.icon} ${place.category}`;

  document.getElementById("modalDescription").textContent =
    place.description;

  document.getElementById("modalImage").className =
    `modal-image ${place.image}`;

  document.getElementById("modalInfo").innerHTML = `

    <span>📍 ${place.distance} miles away</span>

    <span>${"$".repeat(place.price)}</span>

    <span>
      ${place.open ? "🟢 Open now" : "🔴 Closed"}
    </span>

  `;

  document.getElementById("modalSave").onclick =
    () => toggleSave(place.id);

  document.getElementById("modalDirections").onclick =
    () => openDirections(place);

  document
    .getElementById("placeModal")
    .classList.add("show");

}


function closePlaceModal() {

  document
    .getElementById("placeModal")
    .classList.remove("show");

}


function closeModal(event) {

  if (event.target.id === "placeModal") {
    closePlaceModal();
  }

}


/* =========================================================
   DIRECTIONS
   ========================================================= */

function openDirections(place) {

  const query =
    encodeURIComponent(
      `${place.name}, Indianapolis, IN`
    );

  window.open(
    `https://www.google.com/maps/search/?api=1&query=${query}`,
    "_blank"
  );

}


/* =========================================================
   LOCATION
   ========================================================= */

function getLocation() {

  if (!navigator.geolocation) {

    showToast("Location isn't supported on this device.");

    return;
  }

  showToast("Finding your location…");

  navigator.geolocation.getCurrentPosition(

    position => {

      const lat =
        position.coords.latitude;

      const lng =
        position.coords.longitude;

      document.getElementById("locationText").textContent =
        "Near you";

      showToast(
        `Location found 📍 ${lat.toFixed(2)}, ${lng.toFixed(2)}`
      );

      /*
        IMPORTANT:

        This frontend is ready for a real location API.

        Later you can send:
        lat
        lng

        to your backend/API and return real nearby businesses.
      */

    },

    () => {

      showToast(
        "Couldn't access your location. Check browser permissions."
      );

    },

    {
      enableHighAccuracy: true,
      timeout: 10000
    }

  );

}


/* =========================================================
   THEME
   ========================================================= */

function toggleTheme() {

  document.body.classList.toggle("dark");

  const dark =
    document.body.classList.contains("dark");

  localStorage.setItem(
    "locoraTheme",
    dark ? "dark" : "light"
  );

  document.getElementById("themeBtn").textContent =
    dark ? "☀" : "☾";

}


/* =========================================================
   MOBILE MENU
   ========================================================= */

function toggleMenu() {

  document
    .getElementById("mobileMenu")
    .classList.toggle("open");

}


function closeMenu() {

  document
    .getElementById("mobileMenu")
    .classList.remove("open");

}


/* =========================================================
   SCROLLING
   ========================================================= */

function scrollToDiscover() {

  document
    .getElementById("discover")
    .scrollIntoView({
      behavior: "smooth"
    });

}


function scrollToResults() {

  setTimeout(() => {

    document
      .getElementById("results")
      .scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

  }, 100);

}


function goHome() {

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* =========================================================
   ALL CATEGORIES
   ========================================================= */

function showAllCategories() {

  document
    .getElementById("explore")
    .scrollIntoView({
      behavior: "smooth"
    });

}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimer;

function showToast(message) {

  const toast =
    document.getElementById("toast");

  toast.textContent = message;

  toast.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer =
    setTimeout(() => {

      toast.classList.remove("show");

    }, 2600);

}
