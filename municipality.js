const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI";
const OFFICES_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Offices`;
const OFFICIALS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=Official`;

const params = new URLSearchParams(window.location.search);
const province = params.get("p")?.trim().toLowerCase();
const district = params.get("d")?.trim().toLowerCase();
const local = params.get("l")?.trim().toLowerCase();

document.getElementById("title").innerText = `${local || "All"}, ${district || "All"}, ${province || "All"}`;

let officeData = [];
let officialData = [];
let map, markers = [];

/* ---------- Initialize Map ---------- */
function initMap() {
  map = L.map('map').setView([26.5, 87.5], 8);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

/* ---------- Parse Sheet JSON ---------- */
function parseSheetJSON(sheetText) {
  const json = JSON.parse(sheetText.substring(47).slice(0, -2));
  const cols = json.table.cols.map(c => c.label);
  return json.table.rows.map(r => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = r.c[i]?.v || ""; });
    return obj;
  });
}

/* ---------- Display Offices in Table ---------- */
function displayOffices(data) {
  const tbody = document.querySelector("#officesTable tbody");
  tbody.innerHTML = "";
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5">No offices found.</td></tr>`;
    return;
  }
  data.forEach(o => {
    tbody.innerHTML += `
      <tr>
        <td>${o.officeType}</td>
        <td>${o.officeName}</td>
        <td>${o.phone || "-"}</td>
        <td>${o.email || "-"}</td>
        <td>${o.address || "-"}</td>
      </tr>
    `;
  });
}

/* ---------- Display Officials in Table ---------- */
function displayOfficials(data) {
  const tbody = document.querySelector("#officialsTable tbody");
  tbody.innerHTML = "";
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="5">No officials found.</td></tr>`;
    return;
  }
  data.forEach(o => {
    tbody.innerHTML += `
      <tr>
        <td>${o.officeName || "-"}</td>
        <td>${o.name || "-"}</td>
        <td>${o.designation || "-"}</td>
        <td>${o.phone || "-"}</td>
        <td>${o.email || "-"}</td>
      </tr>
    `;
  });
}

/* ---------- Add Markers ---------- */
function addMarkers(offices, officials) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];

  const colorMap = { "Municipality Office": "red", "Police": "blue", "Health Post": "green" };

  offices.forEach(o => {
    if (o.lat && o.lng) {
      const icon = L.icon({
        iconUrl: `https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-${colorMap[o.officeType] || 'orange'}.png`,
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      const marker = L.marker([o.lat, o.lng], { icon })
        .bindPopup(`<strong>${o.officeName || o.officeType}</strong><br>${o.address || ""}`);
      marker.addTo(map);
      markers.push(marker);
    }
  });

  officials.forEach(o => {
    if (o.lat && o.lng) {
      const marker = L.marker([o.lat, o.lng], { icon: L.icon({
        iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      })})
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

/* ---------- Generate Office Type Filters ---------- */
function generateOfficeTypeFilters() {
  const types = [...new Set(officeData.map(o => o.officeType).filter(Boolean))];
  const container = document.getElementById("officeTypeFilters");
  container.innerHTML = "<strong>Filter by Type:</strong><br>";
  types.forEach(t => {
    const id = `type-${t.replace(/\s+/g, "")}`;
    container.innerHTML += `<label><input type="checkbox" value="${t}" id="${id}" checked> ${t}</label><br>`;
  });
}

/* ---------- Apply Filters & Search ---------- */
function applyFilters() {
  const searchQuery = document.getElementById("searchBox").value.trim().toLowerCase();
  const selectedTypes = Array.from(document.querySelectorAll("#officeTypeFilters input:checked")).map(cb => cb.value);

  let filteredOffices = officeData.filter(o => selectedTypes.includes(o.officeType));
  let filteredOfficials = officialData;

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

/* ---------- Fetch Data ---------- */
initMap();

fetch(OFFICES_URL)
  .then(res => res.text())
  .then(sheetText => {
    officeData = parseSheetJSON(sheetText)
      .filter(r =>
        (!province || (r.Province || "").trim().toLowerCase() === province) &&
        (!district || (r.District || "").trim().toLowerCase() === district) &&
        (!local || (r["Local Level"] || "").trim().toLowerCase() === local)
      )
      .map(r => ({
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
    officialData = parseSheetJSON(sheetText)
      .filter(r =>
        (!province || (r.Province || "").trim().toLowerCase() === province) &&
        (!district || (r.District || "").trim().toLowerCase() === district) &&
        (!local || (r["Local Level"] || "").trim().toLowerCase() === local)
      )
      .map(r => ({
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
