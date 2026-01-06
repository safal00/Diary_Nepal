// ------------------ Google Sheet Info ------------------
const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI";
const SHEET_NAME = "offices";

// ------------------ DOM Elements ------------------
const provinceFilter = document.getElementById("provinceFilter");
const districtFilter = document.getElementById("districtFilter");
const localFilter = document.getElementById("localFilter");
const nameFilter = document.getElementById("globalSearch");
const searchBtn = document.getElementById("searchBtn");
const resultsTableBody = document.getElementById("results");

let allRows = [];

// ------------------ Fetch Google Sheet ------------------
const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`;

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

    initFilters();
    applyFilters();
  })
  .catch(err => console.error("❌ Error fetching sheet:", err));

// ------------------ Initialize Filters ------------------
function initFilters() {
  populateSelect(provinceFilter, getUnique("Province"));

  provinceFilter.onchange = () => {
    populateSelect(districtFilter, getUnique("District", "Province", provinceFilter.value));
    localFilter.innerHTML = `<option value="">All Local Levels</option>`;
    applyFilters();
  };

  districtFilter.onchange = () => {
    populateSelect(
      localFilter,
      getUnique(
        "Local Level",
        ["Province", "District"],
        [provinceFilter.value, districtFilter.value]
      )
    );
    applyFilters();
  };

  localFilter.onchange = applyFilters;
  searchBtn.onclick = applyFilters;
  nameFilter.oninput = applyFilters;
}

// ------------------ Populate Select ------------------
function populateSelect(select, values) {
  select.innerHTML = `<option value="">All</option>`;
  values.forEach(v => select.innerHTML += `<option value="${v}">${v}</option>`);
}

// ------------------ Get Unique Values ------------------
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

// ------------------ Apply Filters ------------------
function applyFilters() {
  let data = allRows;

  if (provinceFilter.value) data = data.filter(r => r["Province"] === provinceFilter.value);
  if (districtFilter.value) data = data.filter(r => r["District"] === districtFilter.value);
  if (localFilter.value) data = data.filter(r => r["Local Level"] === localFilter.value);

  if (nameFilter.value) {
    const q = nameFilter.value.toLowerCase();
    data = data.filter(r =>
      r["Office Name"].toLowerCase().includes(q)
    );
  }

  renderResults(data);
}

// ------------------ Render Results ------------------
function renderResults(data) {
  resultsTableBody.innerHTML = "";

  if (!data.length) {
    resultsTableBody.innerHTML = `<tr><td colspan="4">No results found.</td></tr>`;
    return;
  }

  data.forEach(r => {
    const row = document.createElement("tr");

    // Office Name
    row.innerHTML += `<td>${r["Office Name"] || "-"}</td>`;

    // Email (clickable)
    row.innerHTML += `<td>${
      r["Email"] ? `<a href="mailto:${r["Email"]}">${r["Email"]}</a>` : "-"
    }</td>`;

    // Website (clickable)
    if (r["Website"]) {
      const raw = r["Website"].trim();
      const url = raw.startsWith("http") ? raw : `https://${raw}`;
      row.innerHTML += `<td><a href="${url}" target="_blank">${raw}</a></td>`;
    } else {
      row.innerHTML += `<td>-</td>`;
    }

    // Phone (click-to-call)
    const phone = r["Phone"] ? r["Phone"].replace(/\s+/g, "") : "";
    row.innerHTML += `<td>${
      phone ? `<a href="tel:${phone}">${r["Phone"]}</a>` : "-"
    }</td>`;

    resultsTableBody.appendChild(row);
  });
}
