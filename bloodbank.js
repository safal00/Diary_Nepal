// ------------------ Google Sheet info ------------------
const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI";
const SHEET_GID = "926713625"; // Blood Bank tab GID

// ------------------ DOM Elements ------------------
const provinceFilter = document.getElementById("provinceFilter");
const districtFilter = document.getElementById("districtFilter");
const localFilter = document.getElementById("localFilter");
const nameFilter = document.getElementById("globalSearch");
const searchBtn = document.getElementById("searchBtn");
const resultsTableBody = document.querySelector("#results tbody");

let allRows = [];

// ------------------ Manual Headers (MATCH SHEET ORDER) ------------------
const HEADERS = [
  "Province",
  "District",
  "Local Level",
  "Office Name",
  "Phone"
];

console.log("📌 Blood Bank Directory Script Started");

// ------------------ Fetch Google Sheet ------------------
const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;
console.log("Fetching:", url);

fetch(url)
  .then(res => res.text())
  .then(text => {
    const json = JSON.parse(text.substring(47).slice(0, -2));

    allRows = json.table.rows
      .map(r => {
        const obj = {};
        HEADERS.forEach((h, i) => {
          obj[h] = r.c[i]?.v?.toString().trim() || "";
        });
        return obj;
      })
      .filter(r => r["Province"]); // remove empty rows

    console.log(`✅ Loaded ${allRows.length} blood banks`);
    initFilters();
    applyFilters();
  })
  .catch(err => console.error("❌ Sheet error:", err));

// ------------------ Initialize Filters ------------------
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

// ------------------ Populate Dropdown ------------------
function populateSelect(select, values) {
  select.innerHTML = `<option value="">All</option>`;
  values.forEach(v => {
    select.innerHTML += `<option value="${v}">${v}</option>`;
  });
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
      const value = r[field] || "";

      // 📞 Phone → clickable call link
      if (field === "Phone" && value) {
        td.innerHTML = `<a href="tel:${value}" title="Call">📞 ${value}</a>`;
      }

      // 🌐 Detect website inside Office Name (if any)
      else if (field === "Office Name" && value) {
        const urlMatch = value.match(/(https?:\/\/[^\s]+)/i);
        if (urlMatch) {
          td.innerHTML = `
            ${value.replace(urlMatch[0], "").trim()}
            <br>
            <a href="${urlMatch[0]}" target="_blank">🌐 Website</a>
          `;
        } else {
          td.textContent = value;
        }
      }

      else {
        td.textContent = value || "—";
      }

      tr.appendChild(td);
    });

    resultsTableBody.appendChild(tr);
  });
}
