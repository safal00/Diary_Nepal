const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI";

const SHEETS = {
  "Police": "Police",
  "Blood Bank": "Blood Bank",
  "Office": "Officials"
};

const params = new URLSearchParams(window.location.search);
const type = params.get("type");
const searchQuery = params.get("search");

const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

const provinceFilter = document.getElementById("provinceFilter");
const districtFilter = document.getElementById("districtFilter");
const localFilter = document.getElementById("localFilter");
const resultsDiv = document.getElementById("results");

let allRows = [];

/* ---------- Page Title ---------- */
if (type) {
  pageTitle.innerText = `${type} Directory`;
  pageSubtitle.innerText = "Browse by location";
} else {
  pageTitle.innerText = "Search Results";
  pageSubtitle.innerText = `"${searchQuery}"`;
}

/* ---------- Load Sheet ---------- */
if (type && SHEETS[type]) {
  loadSheet(SHEETS[type]);
} else {
  pageSubtitle.innerText = "Invalid category";
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
        officeType: r.c[3]?.v || "",
        name: r.c[4]?.v || "",
        phone: r.c[5]?.v || "",
        website: r.c[6]?.v || "",
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
    populateSelect(
      localFilter,
      getUnique(
        "local",
        ["province", "district"],
        [provinceFilter.value, districtFilter.value]
      )
    );
    applyFilters();
  };

  localFilter.onchange = applyFilters;
}

function populateSelect(select, values) {
  select.innerHTML = `<option value="">All</option>`;
  values.forEach(v => {
    select.innerHTML += `<option value="${v}">${v}</option>`;
  });
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

/* ---------- Render ---------- */
function applyFilters() {
  let data = allRows;

  if (provinceFilter.value)
    data = data.filter(r => r.province === provinceFilter.value);

  if (districtFilter.value)
    data = data.filter(r => r.district === districtFilter.value);

  if (localFilter.value)
    data = data.filter(r => r.local === localFilter.value);

  if (searchQuery)
    data = data.filter(r =>
      Object.values(r).join(" ").toLowerCase().includes(searchQuery.toLowerCase())
    );

  renderResults(data);
}

function renderResults(data) {
  resultsDiv.innerHTML = "";

  if (!data.length) {
    resultsDiv.innerHTML = "<p>No results found.</p>";
    return;
  }

  data.forEach(r => {
    resultsDiv.innerHTML += `
      <div class="contact office">
        <h3>${r.name}</h3>
        <p><strong>Type:</strong> ${r.officeType}</p>
        <p><strong>Phone:</strong> ${r.phone}</p>
        ${r.website ? `<p><a href="${r.website}" target="_blank">Website</a></p>` : ""}
        <p>${r.local}, ${r.district}, ${r.province}</p>
      </div>
    `;
  });
}
