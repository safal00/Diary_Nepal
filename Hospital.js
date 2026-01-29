// ------------------ Google Sheet info ------------------
const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI"; 
const SHEET_GID = "378293569"; // Hospital/Clinic tab GID

// ------------------ DOM Elements ------------------
const provinceFilter = document.getElementById("provinceFilter");
const districtFilter = document.getElementById("districtFilter");
const localFilter = document.getElementById("localFilter");
const nameFilter = document.getElementById("globalSearch");
const searchBtn = document.getElementById("searchBtn");
const resultsTableBody = document.querySelector("#results tbody");

let allRows = [];

// ------------------ Column Order (LOCKED) ------------------
const HEADERS = [
  "Province",
  "District",
  "Local Level",
  "Hospital/Clinic Name",
  "Email",
  "Website",
  "Phone number"
];

console.log("🏥 Hospital Directory loaded");

// ------------------ Fetch Google Sheet ------------------
const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;

fetch(url)
  .then(res => res.text())
  .then(text => {
    const json = JSON.parse(text.substring(47).slice(0, -2));

    allRows = json.table.rows.map(r => ({
      "Province": r.c[0]?.v?.toString().trim() || "",
      "District": r.c[1]?.v?.toString().trim() || "",
      "Local Level": r.c[2]?.v?.toString().trim() || "",
      "Hospital/Clinic Name": r.c[3]?.v?.toString().trim() || "",
      "Email": r.c[4]?.v?.toString().trim() || "",
      "Website": r.c[5]?.v?.toString().trim() || "",
      "Phone number": r.c[6]?.v?.toString().trim() || ""
    }));

    console.log(`✅ Loaded ${allRows.length} hospitals / clinics`);
    initFilters();
    applyFilters();
  })
  .catch(err => console.error("❌ Error loading hospital sheet:", err));

// ------------------ Filters ------------------
function initFilters() {
  populateSelect(provinceFilter, getUnique("Province"));

  provinceFilter.onchange = () => {
    populateSelect(
      districtFilter,
      getUnique("District", "Province", provinceFilter.value)
    );
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

// ------------------ Helpers ------------------
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

// ------------------ Apply Filters ------------------
function applyFilters() {
  let data = allRows;

  if (provinceFilter.value)
    data = data.filter(r => r["Province"] === provinceFilter.value);

  if (districtFilter.value)
    data = data.filter(r => r["District"] === districtFilter.value);

  if (localFilter.value)
    data = data.filter(r => r["Local Level"] === localFilter.value);

  if (nameFilter.value) {
    const q = nameFilter.value.toLowerCase();
    data = data.filter(r =>
      Object.values(r).join(" ").toLowerCase().includes(q)
    );
  }

  renderResults(data);
}

// ------------------ Render Table ------------------
function renderResults(data) {
  resultsTableBody.innerHTML = "";

  if (!data.length) {
    resultsTableBody.innerHTML =
      `<tr><td colspan="${HEADERS.length}">No results found.</td></tr>`;
    return;
  }

  data.forEach(r => {
    const tr = document.createElement("tr");

    HEADERS.forEach(field => {
      const td = document.createElement("td");
      const value = r[field];

      // 📞 Phone
      if (field === "Phone number" && value) {
        td.innerHTML = `<a href="tel:${value}">📞 ${value}</a>`;
      }

      // ✉️ Email
      else if (field === "Email" && value) {
        td.innerHTML = `<a href="mailto:${value}">✉️ ${value}</a>`;
      }

      // 🌐 Website
      else if (field === "Website" && value) {
        const url = value.startsWith("http") ? value : `https://${value}`;
        td.innerHTML = `<a href="${url}" target="_blank">🌐 Website</a>`;
      }

      // Text
      else {
        td.textContent = value;
      }

      tr.appendChild(td);
    });

    resultsTableBody.appendChild(tr);
  });
}
