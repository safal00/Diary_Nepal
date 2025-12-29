const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI";
const OFFICES_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Offices`;
const OFFICIALS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Official`;

const params = new URLSearchParams(window.location.search);
const province = params.get("p")?.trim().toLowerCase();
const district = params.get("d")?.trim().toLowerCase();
const local = params.get("l")?.trim().toLowerCase();

console.log("URL Params:", { province, district, local });

document.getElementById("title").innerText = `${local || "All"}, ${district || "All"}, ${province || "All"}`;

let officeData = [];
let officialData = [];
let map, markers = [];

// Initialize map
function initMap() {
  map = L.map('map').setView([26.5, 87.5], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

// Parse Google Sheets JSON
function parseSheetJSON(sheetText) {
  const json = JSON.parse(sheetText.substring(47).slice(0, -2));
  const cols = json.table.cols.map(c => c.label);
  const rows = json.table.rows.map(r => {
    const obj = {};
    cols.forEach((col, i) => {
      obj[col] = r.c[i]?.v || "";
    });
    return obj;
  });
  return rows;
}

// Display offices
function displayOffices(data) {
  const div = document.getElementById("offices");
  div.innerHTML = "";
  if (!data.length) div.innerHTML = "<p>No offices found.</p>";
  data.forEach(o => {
    div.innerHTML += `<div class="contact">
      <strong>${o.officeType}</strong><br>
      ${o.officeName ? "Name: " + o.officeName + "<br>" : ""}
      ${o.phone ? "Phone: " + o.phone + "<br>" : ""}
      ${o.email ? "Email: " + o.email + "<br>" : ""}
      ${o.address ? "Address: " + o.address : ""}
    </div>`;
  });
}

// Display officials
function displayOfficials(data) {
  const div = document.getElementById("officials");
  div.innerHTML = "";
  if (!data.length) div.innerHTML = "<p>No officials found.</p>";
  data.forEach(o => {
    div.innerHTML += `<div class="contact">
      <strong>${o.officeName}</strong><br>
      ${o.name ? "Name: " + o.name + "<br>" : ""}
      ${o.designation ? "Designation: " + o.designation + "<br>" : ""}
      ${o.phone ? "Phone: " + o.phone + "<br>" : ""}
      ${o.email ? "Email: " + o.email + "<br>" : ""}
    </div>`;
  });
}

// Add markers
function addMarkers(offices, officials) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  offices.forEach(o => {
    if (o.lat && o.lng) {
      const marker = L.marker([o.lat, o.lng])
        .bindPopup(`<strong>${o.officeName || o.officeType}</strong><br>${o.address || ""}`);
      marker.addTo(map);
      markers.push(marker);
    }
  });

  const blueIcon = L.icon({
    iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  officials.forEach(o => {
    if (o.lat && o.lng) {
      const marker = L.marker([o.lat, o.lng], {icon: blueIcon})
        .bindPopup(`<strong>${o.name}</strong><br>${o.designation || ""}<br>${o.officeName}`);
      marker.addTo(map);
      markers.push(marker);
    }
  });

  if (markers.length) {
    const group = L.featureGroup(markers);
    map.fitBounds(group.getBounds().pad(0.2));
  }
}

// Generate office type filters
function generateOfficeTypeFilters() {
  const allTypes = [...new Set(officeData.map(o => o.officeType).filter(Boolean))];
  const container = document.getElementById("officeTypeFilters");
  container.innerHTML = "<strong>Filter by Office Type:</strong><br>";
  allTypes.forEach(type => {
    const id = `type-${type.replace(/\s+/g, "")}`;
    container.innerHTML += `<label>
      <input type="checkbox" value="${type}" id="${id}" checked> ${type}
    </label><br>`;
  });
}

// Apply filters & search
function applyFilters() {
  const searchQuery = document.getElementById("searchBox").value.trim();
  const selectedTypes = Array.from(document.querySelectorAll("#officeTypeFilters input:checked")).map(cb => cb.value);

  let filteredOffices = officeData.filter(o => selectedTypes.includes(o.officeType));
  let filteredOfficials = officialData; // can also match officeType if needed

  if (searchQuery) {
    const fuse = new Fuse([...filteredOffices, ...filteredOfficials], {
      keys: ['officeType','officeName','name','designation','phone','email'],
      threshold: 0.3
    });
    const results = fuse.search(searchQuery).map(r => r.item);
    filteredOffices = results.filter(r => r.type === 'office');
    filteredOfficials = results.filter(r => r.type === 'official');
  }

  displayOffices(filteredOffices);
  displayOfficials(filteredOfficials);
  addMarkers(filteredOffices, filteredOfficials);
}

// Fetch offices and officials
initMap();

fetch(OFFICES_URL)
  .then(res => res.text())
  .then(sheetText => {
    officeData = parseSheetJSON(sheetText).filter(r =>
      (!province || (r.Province || "").trim().toLowerCase() === province) &&
      (!district || (r.District || "").trim().toLowerCase() === district) &&
      (!local || (r["Local Level"] || "").trim().toLowerCase() === local)
    ).map(r => ({
      officeType: r["Office Type"],
      officeName: r["Office Name"],
      phone: r.Phone,
      email: r.Email,
      address: r.Address,
      lat: r.Lat || null,
      lng: r.Lng || null,
      type: 'office'
    }));
    displayOffices(officeData);
    generateOfficeTypeFilters();
  })
  .then(() => fetch(OFFICIALS_URL))
  .then(res => res.text())
  .then(sheetText => {
    officialData = parseSheetJSON(sheetText).filter(r =>
      (!province || (r.Province || "").trim().toLowerCase() === province) &&
      (!district || (r.District || "").trim().toLowerCase() === district) &&
      (!local || (r["Local Level"] || "").trim().toLowerCase() === local)
    ).map(r => ({
      officeName: r["Office Name"],
      name: r.Name,
      designation: r.Designation,
      phone: r.Phone,
      email: r.Email,
      lat: r.Lat || null,
      lng: r.Lng || null,
      type: 'official'
    }));
    displayOfficials(officialData);

    addMarkers(officeData, officialData);

    document.getElementById("searchBox").addEventListener("input", applyFilters);
    document.getElementById("officeTypeFilters").addEventListener("change", applyFilters);
  });
