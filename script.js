const SHEET_ID = "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI";
const ADMIN_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=admin_mapping`;

const provinceSelect = document.getElementById("province");
const districtSelect = document.getElementById("district");
const localSelect = document.getElementById("local");

let adminRows = [];

fetch(ADMIN_URL)
  .then(res => res.text())
  .then(text => {
    const json = JSON.parse(text.substring(47).slice(0, -2));
    adminRows = json.table.rows.map(r => ({
      province: r.c[0]?.v || "",
      district: r.c[1]?.v || "",
      local: r.c[2]?.v || "",
      type: r.c[3]?.v || "",
      ward: r.c[4]?.v || ""
    }));
    loadProvinces();
  });

function loadProvinces() {
  const provinces = [...new Set(adminRows.map(r => r.province))].sort();
  provinceSelect.innerHTML = `<option value="">Select Province</option>`;
  provinces.forEach(p => provinceSelect.innerHTML += `<option value="${p}">${p}</option>`);
}

provinceSelect.onchange = () => {
  const districts = [...new Set(
    adminRows.filter(r => r.province === provinceSelect.value).map(r => r.district)
  )].sort();
  districtSelect.innerHTML = `<option value="">Select District</option>`;
  localSelect.innerHTML = `<option value="">Select Local Level</option>`;
  districts.forEach(d => districtSelect.innerHTML += `<option value="${d}">${d}</option>`);
};

districtSelect.onchange = () => {
  const locals = [...new Set(
    adminRows.filter(r => r.province === provinceSelect.value && r.district === districtSelect.value).map(r => r.local)
  )].sort();
  localSelect.innerHTML = `<option value="">Select Local Level</option>`;
  locals.forEach(l => localSelect.innerHTML += `<option value="${l}">${l}</option>`);
};

function goToLocal() {
  if (!provinceSelect.value || !districtSelect.value || !localSelect.value) {
    alert("Please select Province, District, and Local Level");
    return;
  }
  window.location.href = `municipality.html?p=${encodeURIComponent(provinceSelect.value)}&d=${encodeURIComponent(districtSelect.value)}&l=${encodeURIComponent(localSelect.value)}`;
}
