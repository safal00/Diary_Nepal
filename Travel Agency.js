// ------------------ Google Sheet info ------------------
const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI"; // replace with your Sheet ID
const SHEET_GID = "1564520405"; // replace with Travel Agency tab GID

// ------------------ DOM Elements ------------------
const nameFilter = document.getElementById("globalSearch");
const searchBtn = document.getElementById("searchBtn");
const resultsTableBody = document.querySelector("#results tbody");

let allRows = [];

// ------------------ Column Order ------------------
const HEADERS = ["Travel Agency Name", "Location", "Email", "Website", "Phone"];

console.log("✈️ Travel Agency Directory loaded");

// ------------------ Fetch Google Sheet ------------------
const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;

fetch(url)
  .then(res => res.text())
  .then(text => {
    const json = JSON.parse(text.substring(47).slice(0, -2));

    // ------------------ Skip the first row (header row) ------------------
    allRows = json.table.rows.slice(1).map(r => ({
      "Travel Agency Name": r.c[0]?.v ?? "",
      "Location": r.c[1]?.v ?? "",
      "Email": r.c[2]?.v ?? "",
      "Website": r.c[3]?.v ?? "",
      "Phone": r.c[4]?.v ?? ""
    }))
    .map(row => {
      Object.keys(row).forEach(k => row[k] = row[k].toString().trim());
      return row;
    })
    .filter(r => r["Travel Agency Name"] || r["Phone"]);

    console.log(`✅ Loaded ${allRows.length} travel agencies`);
    applyFilters();
  })
  .catch(err => console.error("❌ Error loading travel agency sheet:", err));

// ------------------ Apply Search ------------------
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

      // 📞 Phone
      if (field === "Phone" && value && value !== "-") {
        const clean = value.replace(/[^0-9+]/g, "");
        td.innerHTML = `📞 <a href="tel:${clean}">${value}</a>`;
      }

      // ✉️ Email
      else if (field === "Email" && value && value !== "-") {
        td.innerHTML = `✉️ <a href="mailto:${value}">${value}</a>`;
      }

      // 🌐 Website
      else if (field === "Website" && value && value !== "-") {
        const link = value.startsWith("http") ? value : `https://${value}`;
        td.innerHTML = `🌐 <a href="${link}" target="_blank" rel="noopener">Website</a>`;
      }

      else {
        td.textContent = value || "—";
      }

      tr.appendChild(td);
    });

    resultsTableBody.appendChild(tr);
  });
}

// Optional: trigger search on button click or input
searchBtn.onclick = applyFilters;
nameFilter.oninput = applyFilters;
