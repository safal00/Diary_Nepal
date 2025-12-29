const params = new URLSearchParams(window.location.search);
const province = params.get("p")?.trim();
const district = params.get("d")?.trim();
const local = params.get("l")?.trim();

document.getElementById("title").innerText = `${local}, ${district}, ${province}`;

// Google Sheet IDs
const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI";
const OFFICES_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Offices`;
const OFFICIALS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Officials`;

let officeData = [];
let officialData = [];
let map, markers = [];

// Initialize Leaflet map
function initMap() {
  map = L.map('map').setView([26.5, 87.5], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
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

// Add markers to map
function addMarkers(offices, officials) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  // Office markers (default)
  offices.forEach(o => {
    if (o.lat && o.lng) {
      const marker = L.marker([o.lat, o.lng])
        .bindPopup(`<strong>${o.officeName || o.officeType}</strong><br>${o.address || ""}`);
      marker.addTo(map);
      markers.push(marker);
    }
  });

  // Officials markers (blue)
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

// Parse Google Sheets JSON safely
function parseSheetJSON(sheetText) {
  const json = JSON.parse(sheetText.substring(47).slice(0, -2));
  return json.table.rows.map(r => {
    const c = r.c;
    return {
      Province: c[0]?.v || "",
      District: c[1]?.v || "",
      LocalLevel: c[2]?.v || "",
      OfficeType: c[4]?.v || "",
      OfficeName: c[5]?.v || c[3]?.v || "",
      Name: c[4]?.v || "",
      Designation: c[5]?.v || "",
      Phone: c[6]?.v || "",
      Email: c[7]?.v || "",
      Address: c[8]?.v || "",
      Lat: c[9]?.v || null,
      Lng: c[10]?.v || null
    };
  });
}

// Fetch Offices
fetch(OFFICES_URL)
  .then(res => res.text())
  .then(text => {
    officeData = parseSheetJSON(text).filter(r =>
      r.Province.trim() === province &&
      r.District.trim() === district &&
      r.LocalLevel.trim() === local
    ).map(r => ({
      officeType: r.OfficeType,
      officeName: r.OfficeName,
      phone: r.Phone,
      email: r.Email,
      address: r.Address,
      lat: r.Lat,
      lng: r.Lng,
      type: 'office'
    }));

    displayOffices(officeData);
    initMap();
  });

// Fetch Officials
fetch(OFFICIALS_URL)
  .then(res => res.text())
  .then(text => {
    officialData = parseSheetJSON(text).filter(r =>
      r.Province.trim() === province &&
      r.District.trim() === district &&
      r.LocalLevel.trim() === local
    ).map(r => ({
      officeName: r.OfficeName,
      name: r.Name,
      designation: r.Designation,
      phone: r.Phone,
      email: r.Email,
      lat: r.Lat,
      lng: r.Lng,
      type: 'official'
    }));

    console.log("Officials loaded:", officialData);

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
