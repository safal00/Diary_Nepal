// nav.js
const NAV_TABS = [
  { name: "Home", href: "index.html" },
  { name: "Municipality Offices", href: "municipality_offices.html" },
  { name: "Police", href: "police.html" },
  { name: "Blood Bank", href: "bloodbank.html" }
];

function renderNavTabs(containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  NAV_TABS.forEach(tab => {
    const btn = document.createElement("button");
    btn.textContent = tab.name;
    btn.onclick = () => window.location.href = tab.href;
    container.appendChild(btn);
  });
}
