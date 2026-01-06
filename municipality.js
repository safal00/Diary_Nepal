// ------------------ Google Sheet Info ------------------
const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI";
const SHEET_NAME = "offices"; // tab name

// ------------------ DOM Elements ------------------
const searchInput = document.getElementById("globalSearch");
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

    renderResults(allRows);
  })
  .catch(err => console.error("❌ Error fetching Google Sheet:", err));

// ------------------ Search ------------------
searchBtn.onclick = applySearch;
searchInput.oninput = applySearch;

function applySearch() {
  const q = searchInput.value.toLowerCase();

  const filtered = allRows.filter(r =>
    Object.values(r).join(" ").toLowerCase().includes(q)
  );

  renderResults(filtered);
}

// ------------------ Render Table ------------------
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
      r["Email"]
        ? `<a href="mailto:${r["Email"]}">${r["Email"]}</a>`
        : "-"
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
    if (r["Phone"]) {
      const tel = r["Phone"].replace(/[^0-9+]/g, "");
      row.innerHTML += `<td><a href="tel:${tel}">${r["Phone"]}</a></td>`;
    } else {
      row.innerHTML += `<td>-</td>`;
    }

    resultsTableBody.appendChild(row);
  });
}
