// ------------------ Google Sheet info ------------------
const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI"; // replace with your Sheet ID
const SHEET_GID = "1726201180"; // replace with Airlines tab GID

// ------------------ DOM Elements ------------------
const nameFilter = document.getElementById("globalSearch");
const searchBtn = document.getElementById("searchBtn");
const resultsTableBody = document.querySelector("#results tbody");

let allRows = [];

// ------------------ Column Order ------------------
const HEADERS = [
  "SN",
  "Name",
  "Branch",
  "Contact Person",
  "Contact Number",
  "Code",
  "Status",
  "TMS Link",
  "Phone"
];

console.log("📈 Broker Office Directory loaded");

// ------------------ Fetch Google Sheet ------------------
const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;

fetch(url)
  .then(res => res.text())
  .then(text => {
    const json = JSON.parse(text.substring(47).slice(0, -2));

    // Skip first row (header)
    allRows = json.table.rows.slice(1).map(r => ({
      "SN": r.c[0]?.v ?? "",
      "Name": r.c[1]?.v ?? "",
      "Branch": r.c[2]?.v ?? "",
      "Contact Person": r.c[3]?.v ?? "",
      "Contact Number": r.c[4]?.v ?? "",
      "Code": r.c[5]?.v ?? "",
      "Status": r.c[6]?.v ?? "",
      "TMS Link": r.c[7]?.v ?? "",
      "Phone": r.c[8]?.v ?? ""
    }))
    .map(row => {
      Object.keys(row).forEach(k => row[k] = row[k].toString().trim());
      return row;
    })
    .filter(r => r["Name"] || r["Branch"] || r["Contact Number"]);

    console.log(`✅ Loaded ${allRows.length} broker offices`);
    applyFilters();
  })
  .catch(err => console.error("❌ Error loading broker sheet:", err));

// ------------------ Apply Filters ------------------
function applyFilters() {
  let data = allRows;

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

      // 📞 Phone / Contact Number
      if ((field === "Phone" || field === "Contact Number") && value && value !== "-") {
        const clean = value.replace(/[^0-9+]/g, "");
        td.innerHTML = `📞 <a href="tel:${clean}">${value}</a>`;
      }

      // 🌐 TMS Link
      else if (field === "TMS Link" && value && value !== "-") {
        const link = value.startsWith("http") ? value : `https://${value}`;
        td.innerHTML = `🌐 <a href="${link}" target="_blank" rel="noopener">TMS</a>`;
      }

      // Text
      else {
        td.textContent = value || "—";
      }

      tr.appendChild(td);
    });

    resultsTableBody.appendChild(tr);
  });
}

// ------------------ Search Event ------------------
searchBtn.onclick = applyFilters;
nameFilter.oninput = applyFilters;
