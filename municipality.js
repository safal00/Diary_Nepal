const params = new URLSearchParams(window.location.search);
const province = params.get("p");
const district = params.get("d");
const local = params.get("l");

document.getElementById("title").innerText = `${local}, ${district}, ${province}`;

const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI";
const OFFICES_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=offices`;
const OFFICIALS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=officials`;

let officeData = [];
let map, markers = [];

function initMap() {
  map = L.map('map').setView([26.5, 87.5], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

// Load offices
fetch(OFFICES_URL)
  .then(res => res.text())
  .then(text => {
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows.filter(r =>
      r.c[0]?.v === province &&
      r.c[1]?.v === district &&
      r.c[2]?.v === local
    );

    officeData = rows.map(r => ({
      officeType: r.c[4]?.v || "",
      officeName: r.c[5]?.v || "",
      phone: r.c[6]?.v || "",
      email: r.c[7]?.v || "",
      address: r.c[8]?.v || "",
      lat: r.c[9]?.v || null,
      lng: r.c[10]?.v || null
    }));

    displayOffices(officeData);
    initMap();
    addMarkers(officeData);
    initSearch();
  });

// Load officials
fetch(OFFICIALS_URL)
  .then(res => res.text())
  .then(text => {
    const json = JSON.parse(text.substring(47).slice(0, -2));
    const rows = json.table.rows.filter(r =>
      r.c[0]?.v === province &&
      r.c[1]?.v === district &&
      r.c[2]?.v === local
    );

    const officialsDiv = document.getElementById("officials");
    if (rows.length === 0) officialsDiv.innerHTML = "<p>No officials found.</p>";

    rows.forEach(r => {
      officialsDiv.innerHTML += `<div class="contact">
        <strong>${r.c[4]?.v || "Official"}</strong><br>
        ${r.c[5]?.v ? "Name: " + r.c[5].v + "<br>" : ""}
        ${r.c[6]?.v ? "Designation: " + r.c[6].v + "<br>" : ""}
        ${r.c[7]?.v ? "Phone: " + r.c[7].v + "<br>" : ""}
        ${r.c[8]?.v ? "Email: " + r.c[8].v : ""}
      </div>`;
    });
  });

// Display offices
function displayOffices(data) {
  const officesDiv = document.getElementById("offices");
  officesDiv.innerHTML = "";
  if (data.length === 0) officesDiv.innerHTML = "<p>No offices found.</p>";

  data.forEach(o => {
    officesDiv.innerHTML += `<div class="contact">
      <strong>${o.officeType}</strong><br>
      ${o.officeName ? "Name: " + o.officeName + "<br>" : ""}
      ${o.phone ? "Phone: " + o.phone + "<br>" : ""}
      ${o.email ? "Email: " + o.email + "<br>" : ""}
      ${o.address ? "Address: " + o.address : ""}
    </div>`;
  });
}

// Add markers
function addMarkers(data) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  data.forEach(o => {
    if (o.lat && o.lng) {
      const marker = L.marker([o.lat, o.lng])
        .bindPopup(`<strong>${o.officeName || o.officeType}</strong><br>${o.address || ""}`);
      marker.addTo(map);
      markers.push(marker);
    }
  });

  if (markers.length > 0) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.2));
  }
}

// Fuse.js search
function initSearch() {
  const fuse = new Fuse(officeData, {
    keys: ['officeType', 'officeName', 'address', 'phone'],
    threshold: 0.3
  });

  document.getElementById("searchBox").addEventListener("input", e => {
    const query = e.target.value.trim();
    if (!query) {
      displayOffices(officeData);
      addMarkers(officeData);
    } else {
      const results = fuse.search(query).map(r => r.item);
      displayOffices(results);
      addMarkers(results);
    }
  });
}
