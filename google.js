// google.js

// Base URL for fetching GViz JSON
const GOOGLE_SHEET_BASE_URL = id => 
  `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:json`;

// Sheet configuration: sheet ID + tab name
const GOOGLE_SHEETS = {
  "Municipality Offices": { id: "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI", tab: "offices" },
  "Police": { id: "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI", tab: "Police" },
  "Blood Bank": { id: "1wXNfEA5Hqnw3pnMduzDZajEMXkTCBRizQLIiLSsk1yI", tab: "Blood Bank" }
};

// Example usage in page JS:
// const { id, tab } = GOOGLE_SHEETS["Police"];
// fetch(`${GOOGLE_SHEET_BASE_URL(id)}&sheet=${encodeURIComponent(tab)}`)
