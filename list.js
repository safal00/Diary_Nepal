const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI";

const SHEETS = {
  "Police": "Police",
  "Blood Bank": "Blood Bank",
  "Municipality": "Officials"
};

const params = new URLSearchParams(window.location.search);
const type = params.get("type");
const searchQuery = params.get("search");

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const provinceFilter = document.getElementById("provinceFilter");
const districtFilter = document.getElementById("districtFilter");
const localFilter = document.getElementById("localFilter");
const resultsTableBody = document.querySelector("#results tbody");
const nameFilter = document.getElementById("globalSearch");

let allRows = [];

/* ---------- Page Title ---------- */
if (type) {
  pageTitle.innerText = `${type} Directory`;
  pageSubtitle.innerText = "Browse by location";
} else if (searchQuery) {
  pageTitle.innerText = "Search Results";
  pageSubtitle.innerText = `"${searchQuery}"`;
} else {
  pageTitle.innerText = "Directory";
  pageSubtitle.innerText = "";
}

/* ---------- Load Sheet ---------- */
if (type && SHEETS[type]) {
  loadSheet(SHEETS[type]);
} else if (searchQuery) {
  pageSubtitle.innerText = `Search results for "${searchQuery}"`;
}

function loadSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

  fetch(url)
    .then(res => res.text())
    .then(text => {
      const json = JSON.parse(text.substring(47).slice(0, -2));
      allRows = json.table.rows.map(r => ({
        province: r.c[0]?.v || "",
        district: r.c[1]?.v || "",
        local: r.c[2]?.v || "",
        officeType: r.c[3]?.v || r.c[4]?.v || "",
        name: r.c[4]?.v || r.c[5]?.v || "",
        phone: r.c[5]?.v || r.c[6]?.v || "",
        website: r.c[6]?.v || r.c[7]?.v || "",
        lat: r.c[7]?.v || "",
        lng: r.c[8]?.v || ""
      }));

      initFilters();
      applyFilters();
    });
}

/* ---------- Filters ---------- */
function initFilters() {
  populateSelect(provinceFilter, getUnique("province"));

  provinceFilter.onchange = () => {
    populateSelect(districtFilter, getUnique("district", "province", provinceFilter.value));
    localFilter.innerHTML = `<option value="">All Local Levels</option>`;
    applyFilters();
  };

  districtFilter.onchange = () => {
    populateSelect(localFilter, getUnique("local", ["province","district"], [provinceFilter.value,districtFilter.value]));
    applyFilters();
  };

  localFilter.onchange = applyFilters;
  nameFilter.oninput = applyFilters;
}

function populateSelect(select, values) {
  select.innerHTML = `<option value="">All</option>`;
  values.forEach(v => select.innerHTML += `<option value="${v}">${v}</option>`);
}

function getUnique(field, filterField, filterValue) {
  return [...new Set(
    allRows
      .filter(r => {
        if (!filterField) return true;
        if (Array.isArray(filterField)) {
          return filterField.every((f,i) => r[f] === filterValue[i]);
        }
        return r[filterField] === filterValue;
      })
      .map(r => r[field])
      .filter(Boolean)
  )].sort();
}

/* ---------- Apply Filters ---------- */
function applyFilters() {
  let data = allRows;

  if (provinceFilter.value) data = data.filter(r => r.province === provinceFilter.value);
  if (districtFilter.value) data = data.filter(r => r.district === districtFilter.value);
  if (localFilter.value) data = data.filter(r => r.local === localFilter.value);
  if (nameFilter.value) data = data.filter(r => r.name.toLowerCase().includes(nameFilter.value.toLowerCase()));
  if (searchQuery) data = data.filter(r => Object.values(r).join(" ").toLowerCase().includes(searchQuery.toLowerCase()));

  renderResults(data);
}

/* ---------- Render Table ---------- */
function renderResults(data) {
  resultsTableBody.innerHTML = "";

  if (!data.length) {
    resultsTableBody.innerHTML = `<tr><td colspan="5">No results found.</td></tr>`;
    return;
  }

  data.forEach(r => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = r.name || r.officeType || "-";
    row.appendChild(nameCell);

    const typeCell = document.createElement("td");
    typeCell.textContent = r.officeType || "-";
    row.appendChild(typeCell);

    const phoneCell = document.createElement("td");
    phoneCell.textContent = r.phone || "-";
    row.appendChild(phoneCell);

    const websiteCell = document.createElement("td");
    if (r.website) {
      const a = document.createElement("a");
      a.href = r.website.startsWith("http") ? r.website : "#";
      a.target = "_blank";
      a.textContent = r.website;
      websiteCell.appendChild(a);
    } else {
      websiteCell.textContent = "-";
    }
    row.appendChild(websiteCell);

    const locationCell = document.createElement("td");
    locationCell.textContent = `${r.local}, ${r.district}, ${r.province}`;
    row.appendChild(locationCell);

    resultsTableBody.appendChild(row);
  });
}
