// ------------------ Google Sheet info ------------------
const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI"; // replace with your Sheet ID
const SHEET_GID = "248934655"; // replace with Airlines tab GID

// ------------------ DOM Elements ------------------
const provinceFilter = document.getElementById("provinceFilter");
const cityFilter = document.getElementById("cityFilter");
const nameFilter = document.getElementById("globalSearch");
const searchBtn = document.getElementById("searchBtn");
const resultsTableBody = document.querySelector("#results tbody");

let allRows = [];

// ------------------ Column Order ------------------
const HEADERS = ["Province", "City/Airport", "Airline", "Email / Website", "Phone"];

console.log("✈️ Airlines Directory loaded");

// ------------------ Fetch Google Sheet ------------------
const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;

fetch(url)
  .then(res => res.text())
  .then(text => {
    const json = JSON.parse(text.substring(47).slice(0, -2));

    // ------------------ Skip header row ------------------
    allRows = json.table.rows.slice(1).map(r => ({
      "Province": r.c[0]?.v ?? "",
      "City/Airport": r.c[1]?.v ?? "",
      "Airline": r.c[2]?.v ?? "",
      "Email / Website": r.c[3]?.v ?? "",
      "Phone": r.c[4]?.v ?? ""
    }))
    .map(row => {
      Object.keys(row).forEach(k => row[k] = row[k].toString().trim());
      return row;
    })
    .filter(r => r["Province"] || r["City/Airport"] || r["Airline"]);

    console.log(`✅ Loaded ${allRows.length} airlines`);
    initFilters();
    applyFilters();
  })
  .catch(err => console.error("❌ Error loading airlines sheet:", err));

// ------------------ Initialize Filters ------------------
function initFilters() {
  populateSelect(provinceFilter, getUnique("Province"));

  provinceFilter.onchange = () => {
    populateSelect(
      cityFilter,
      getUnique("City/Airport", "Province", provinceFilter.value)
    );
    applyFilters();
  };

  cityFilter.onchange = applyFilters;
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
        return r[filterField] === filterValue;
      })
      .map(r => r[field])
      .filter(v => v && v !== "-")
  )].sort();
}

// ------------------ Apply Filters ------------------
function applyFilters() {
  let data = allRows;

  if (provinceFilter.value)
    data = data.filter(r => r["Province"] === provinceFilter.value);

  if (cityFilter.value)
    data = data.filter(r => r["City/Airport"] === cityFilter.value);

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
      if (field === "Phone" && value && value !== "-") {
        const clean = value.replace(/[^0-9+]/g, "");
        td.innerHTML = `📞 <a href="tel:${clean}">${value}</a>`;
      }

      // ✉️ Email / Website
      else if (field === "Email / Website" && value && value !== "-") {
        if (value.includes("@")) {
          td.innerHTML = `✉️ <a href="mailto:${value}">${value}</a>`;
        } else {
          const link = value.startsWith("http") ? value : `https://${value}`;
          td.innerHTML = `🌐 <a href="${link}" target="_blank" rel="noopener">Website</a>`;
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
