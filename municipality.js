// ------------------ Google Sheet Info ------------------
const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI";
const SHEET_GID = "1826911797";

const searchInput = document.getElementById("globalSearch");
const searchBtn = document.getElementById("searchBtn");
const resultsTableBody = document.getElementById("results");

// ------------------ Hardcoded headers ------------------
const HEADERS = ["Province","District","Office Name","Email","Website","Phone"];

let allRows = [];

const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&gid=${SHEET_GID}`;

fetch(url)
  .then(res => res.text())
  .then(text => {
    const json = JSON.parse(text.substring(47).slice(0, -2));

    // Map rows using forced headers
    allRows = json.table.rows.map(r => {
      const obj = {};
      HEADERS.forEach((h, i) => obj[h] = r.c[i]?.v || "");
      return obj;
    });

    renderResults(allRows);
  })
  .catch(err => console.error("❌ Error fetching Google Sheet:", err));

// ------------------ Search functionality ------------------
searchBtn.onclick = applySearch;
searchInput.oninput = applySearch;

function applySearch() {
  const q = searchInput.value.toLowerCase();

  const filtered = allRows.filter(r =>
    Object.values(r).join(" ").toLowerCase().includes(q)
  );

  renderResults(filtered);
}

// ------------------ Render table ------------------
function renderResults(data) {
  resultsTableBody.innerHTML = "";

  if (!data.length) {
    resultsTableBody.innerHTML = `<tr><td colspan="${HEADERS.length}">No results found.</td></tr>`;
    return;
  }

  data.forEach(r => {
    const row = document.createElement("tr");

    HEADERS.forEach(field => {
      if (field === "Email") {
        row.innerHTML += `<td>${
          r[field] ? `<a href="mailto:${r[field]}">${r[field]}</a>` : "-"
        }</td>`;
      } else if (field === "Website") {
        row.innerHTML += `<td>${
          r[field] ? `<a href="${r[field].startsWith('http') ? r[field] : 'https://' + r[field]}" target="_blank">${r[field]}</a>` : "-"
        }</td>`;
      } else if (field === "Phone") {
        const tel = r[field] ? r[field].replace(/[^0-9+]/g, "") : "";
        row.innerHTML += `<td>${
          tel ? `<a href="tel:${tel}">${r[field]}</a>` : "-"
        }</td>`;
      } else {
        row.innerHTML += `<td>${r[field] || "-"}</td>`;
      }
    });

    resultsTableBody.appendChild(row);
  });
}
