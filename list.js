const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI";

const SHEETS = {
  "Police": "Police",
  "Blood Bank": "Blood Bank",
  "Municipality Offices": "admin_mapping"
};

const params = new URLSearchParams(window.location.search);
const type = params.get("type");
const searchQuery = params.get("search");

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const provinceFilter = document.getElementById("provinceFilter");
const districtFilter = document.getElementById("districtFilter");
const localFilter = document.getElementById("localFilter");
const nameFilter = document.getElementById("globalSearch");
const resultsTableBody = document.querySelector("#results tbody");

let allRows = [];

/* ---------- Page Title ---------- */
if (type) {
  pageTitle.innerText = `${type} Directory`;
  pageSubtitle.innerText = "Browse by location";
} else if (searchQuery) {
  pageTitle.innerText = "Search Results";
  pageSubtitle.innerText = `Search results for "${searchQuery}"`;
} else {
  pageTitle.innerText = "Directory";
  pageSubtitle.innerText = "Invalid category";
}

/* ---------- Load Sheet ---------- */
if (type && SHEETS[type]) {
  loadSheet(SHEETS[type]);
}

/* ---------- Load Google Sheet ---------- */
function loadSheet(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;

  fetch(url)
    .then(res => res.text())
    .then(text => {
      const json = JSON.parse(text.substring(47).slice(0, -2));
      const headers = json.table.cols.map(c => c.label);
      allRows = json.table.rows.map(r => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = r.c[i]?.v || "");
        return obj;
      });

      initFilters(headers);
      applyFilters();
    });
}

/* ---------- Filters ---------- */
function initFilters(headers) {
  populateSelect(provinceFilter, getUnique("Province"));
  provinceFilter.onchange = () => {
    populateSelect(districtFilter, getUnique("District", "Province", provinceFilter.value));
    localFilter.innerHTML = `<option value="">All Local Levels</option>`;
    applyFilters();
  };
  districtFilter.onchange = () => {
    populateSelect(localFilter, getUnique("Local Level", ["Province", "District"], [provinceFilter.value, districtFilter.value]));
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
          return filterField.every((f, i) => r[f] === filterValue[i]);
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

  if (provinceFilter.value) data = data.filter(r => r.Province === provinceFilter.value);
  if (districtFilter.value) data = data.filter(r => r.District === districtFilter.value);
  if (localFilter.value) data = data.filter(r => r["Local Level"] === localFilter.value);

  if (nameFilter.value) {
    const q = nameFilter.value.toLowerCase();
    data = data.filter(r =>
      Object.values(r).join(" ").toLowerCase().includes(q)
    );
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    data = data.filter(r => Object.values(r).join(" ").toLowerCase().includes(q));
  }

  renderResults(data);
}

/* ---------- Render Results ---------- */
function renderResults(data) {
  resultsTableBody.innerHTML = "";

  if (!data.length) {
    resultsTableBody.innerHTML = `<tr><td colspan="5">No results found.</td></tr>`;
    return;
  }

  data.forEach(r => {
    const row = document.createElement("tr");

    const nameCell = document.createElement("td");
    nameCell.textContent = r["Local Level"] || r["Office Name"] || "-";
    row.appendChild(nameCell);

    const typeCell = document.createElement("td");
    typeCell.textContent = r["Local Type"] || r["Office Type"] || "-";
    row.appendChild(typeCell);

    const phoneCell = document.createElement("td");
    phoneCell.textContent = r["Phone"] || "-";
    row.appendChild(phoneCell);

    const websiteCell = document.createElement("td");
    if (r["Email"] || r["Website"]) {
      const a = document.createElement("a");
      a.href = r["Website"]?.startsWith("http") ? r["Website"] : "#";
      a.target = "_blank";
      a.textContent = r["Email"] || r["Website"];
      websiteCell.appendChild(a);
    } else {
      websiteCell.textContent = "-";
    }
    row.appendChild(websiteCell);

    const locationCell = document.createElement("td");
    locationCell.textContent = `${r["Local Level"] || ""}, ${r.District || ""}, ${r.Province || ""}`;
    row.appendChild(locationCell);

    resultsTableBody.appendChild(row);
  });
}
