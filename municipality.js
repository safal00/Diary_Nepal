const params = new URLSearchParams(window.location.search);
const province = params.get("p")?.trim().toLowerCase();
const district = params.get("d")?.trim().toLowerCase();
const local = params.get("l")?.trim().toLowerCase();

console.log("URL Params:", { province, district, local });

document.getElementById("title").innerText = `${local}, ${district}, ${province}`;

const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI";
const OFFICES_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Offices`;
const OFFICIALS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Officials`;

let officeData = [];
let officialData = [];
let map, markers = [];

// Initialize map
function initMap() {
  console.log("Initializing map...");
  map = L.map('map').setView([26.5, 87.5], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

// Display offices
function displayOffices(data) {
  console.log("Displaying offices:", data);
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
  console.log("Displaying officials:", data);
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
  console.log("Adding markers for offices:", offices);
  console.log("Adding markers for officials:", officials);

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

// Parse Google Sheets JSON using headers
function parseSheetJSONByHeader(sheetText) {
  const json = JSON.parse(sheetText.substring(47).slice(0, -2));
  const rows = json.table.rows;
  const cols = json.table.cols.map(c => c.label);

  const parsed = rows.map(r => {
    const rowObj = {};
    cols.forEach((col, i) => {
      rowObj[col] = r.c[i]?.v || "";
    });
    return rowObj;
  });

  console.log("Parsed sheet rows:", parsed);
  return parsed;
}

// Fetch Offices
fetch(OFFICES_URL)
  .then(res => res.text())
  .then(sheetText => {
    const allRows = parseSheetJSONByHeader(sheetText);
    officeData = allRows.filter(r =>
      (r.Province || "").trim().toLowerCase() === province &&
      (r.District || "").trim().toLowerCase() === district &&
      (r["Local Level"] || "").trim().toLowerCase() === local
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

    console.log("Filtered offices:", officeData);
    displayOffices(officeData);
    initMap();
  });

// Fetch Officials
fetch(OFFICIALS_URL)
  .then(res => res.text())
  .then(sheetText => {
    const allRows = parseSheetJSONByHeader(sheetText);
    console.log("All official rows:", allRows);

    officialData = allRows.filter(r =>
      (r.Province || "").trim().toLowerCase() === province &&
      (r.District || "").trim().toLowerCase() === district &&
      (r["Local Level"] || "").trim().toLowerCase() === local
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

    console.log("Filtered officials:", officialData);

    displayOfficials(officialData);
    addMarkers(officeData, officialData);
    initSearch();
  });

// Fuse.js search
function initSearch() {
  const allData = [
    ...officeData.map(o => ({ ...o, type: 'office' })),
    ...officialData.map(o => ({
      officeName: o.officeName,
      officeType: "",
      name: o.name,
      designation: o.designation,
      phone: o.phone,
      email: o.email,
      type: 'official'
    }))
  ];

  const fuse = new Fuse(allData, {
    keys: ['officeType','officeName','name','designation','phone','email'],
    threshold: 0.3
  });

  document.getElementById("searchBox").addEventListener("input", e => {
    const query = e.target.value.trim();
    const results = query ? fuse.search(query).map(r => r.item) : allData;

    const officeResults = results.filter(r => r.type === 'office');
    const officialResults = results.filter(r => r.type === 'official');

    displayOffices(officeResults);
    displayOfficials(officialResults);
    addMarkers(officeResults, officialResults);
  });
}
