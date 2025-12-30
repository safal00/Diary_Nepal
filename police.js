// ------------------ Google Sheet info ------------------
const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI"; 
const SHEET_GID = "1971990937"; // Police tab GID

// ------------------ DOM Elements ------------------
const provinceFilter = document.getElementById("provinceFilter");
const districtFilter = document.getElementById("districtFilter");
const localFilter = document.getElementById("localFilter");
const nameFilter = document.getElementById("globalSearch");
const searchBtn = document.getElementById("searchBtn");
const resultsTableBody = document.querySelector("#results tbody");

let allRows = [];

console.log("📌 Police Directory Script Started");

// ------------------ Fetch Google Sheet ------------------
const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;
console.log("Fetching Google Sheet from:", url);

fetch(url)
  .then(res => {
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return res.text();
  })
  .then(text => {
    try {
      const json = JSON.parse(text.substring(47).slice(0, -2));
      const headers = json.table.cols.map(c => c.label);
      console.log("Sheet headers:", headers);

      allRows = json.table.rows.map(r => {
        const obj = {};
        headers.forEach((h, i) => obj[h] = r.c[i]?.v || "");
        return obj;
      });

      console.log(`✅ Loaded ${allRows.length} rows from Google Sheet`);
      initFilters();
      applyFilters();
    } catch (err) {
      console.error("❌ Error parsing Google Sheet JSON:", err);
    }
  })
  .catch(err => console.error("❌ Error fetching Google Sheet:", err));

// ------------------ Initialize Filters ------------------
function initFilters() {
  console.log("Initializing filters...");
  populateSelect(provinceFilter, getUnique("Province"));
  provinceFilter.onchange = () => {
    console.log("Province changed:", provinceFilter.value);
    populateSelect(districtFilter, getUnique("District", "Province", provinceFilter.value));
    localFilter.innerHTML = `<option value="">All Local Levels</option>`;
    applyFilters();
  };
  districtFilter.onchange = () => {
    console.log("District changed:", districtFilter.value);
    populateSelect(localFilter, getUnique("Local Level", ["Province", "District"], [provinceFilter.value, districtFilter.value]));
    applyFilters();
  };
  localFilter.onchange = () => {
    console.log("Local Level changed:", localFilter.value);
    applyFilters();
  };
  searchBtn.onclick = () => {
    console.log("Search button clicked:", nameFilter.value);
    applyFilters();
  };
}

// ------------------ Populate Dropdown ------------------
function populateSelect(select, values) {
  select.innerHTML = `<option value="">All</option>`;
  values.forEach(v => select.innerHTML += `<option value="${v}">${v}</option>`);
  console.log(`Populated select with ${values.length} options`);
}

// ------------------ Get Unique Values ------------------
function getUnique(field, filterField, filterValue) {
  const uniqueValues = [...new Set(
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

  console.log(`Unique values for ${field}:`, uniqueValues);
  return uniqueValues;
}

// ------------------ Apply Filters & Search ------------------
function applyFilters() {
  console.log("Applying filters...");
  let data = allRows;

  if (provinceFilter.value) data = data.filter(r => r["Province"] === provinceFilter.value);
  if (districtFilter.value) data = data.filter(r => r["District"] === districtFilter.value);
  if (localFilter.value) data = data.filter(r => r["Local Level"] === localFilter.value);

  if (nameFilter.value) {
    const q = nameFilter.value.toLowerCase();
    data = data.filter(r => Object.values(r).join(" ").toLowerCase().includes(q));
  }

  console.log(`Filtered rows: ${data.length}`);
  renderResults(data);
}

// ------------------ Render Table ------------------
function renderResults(data) {
  resultsTableBody.innerHTML = "";

  if (!data.length) {
    resultsTableBody.innerHTML = `<tr><td colspan="8">No results found.</td></tr>`;
    console.warn("No matching results found.");
    return;
  }

  data.forEach((r, index) => {
    const row = document.createElement("tr");

    ["Province","District","Local Level","Office Type","Office Name","Phone"].forEach(field => {
      const cell = document.createElement("td");
      cell.textContent = r[field] || "-";
      if(field === "Phone") cell.style.minWidth = "120px";
      row.appendChild(cell);
    });

    // Email
    const emailCell = document.createElement("td");
    if (r["Email"]) {
      const a = document.createElement("a");
      a.href = `mailto:${r["Email"]}`;
      a.textContent = r["Email"];
      emailCell.appendChild(a);
    } else emailCell.textContent = "-";
    row.appendChild(emailCell);

    // Website
    const websiteCell = document.createElement("td");
    if (r["Website"]) {
      const a = document.createElement("a");
      a.href = r["Website"];
      a.textContent = r["Website"];
      a.target = "_blank";
      websiteCell.appendChild(a);
    } else websiteCell.textContent = "-";
    row.appendChild(websiteCell);

    resultsTableBody.appendChild(row);
    console.log(`Rendered row ${index+1}:`, r);
  });
}
