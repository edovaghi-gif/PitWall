const fs = require('fs');
const path = require('path');
const https = require('https');

const CIRCUITS = [
  "Sakhir", "Jeddah", "Melbourne", "Suzuka", "Shanghai",
  "Miami", "Imola", "Monte Carlo", "Catalunya", "Montreal",
  "Spielberg", "Silverstone", "Hungaroring", "Spa-Francorchamps", "Zandvoort",
  "Monza", "Baku", "Singapore", "Austin", "Mexico City",
  "Interlagos", "Las Vegas", "Lusail", "Yas Marina Circuit"
];

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const results = {};

  for (const circuit of CIRCUITS) {
    const url = `https://api.openf1.org/v1/sessions?year=2025&circuit_short_name=${encodeURIComponent(circuit)}&session_type=Qualifying`;
    try {
      const data = await fetchJSON(url);
      if (Array.isArray(data) && data.length > 0) {
        const s = data[0];
        console.log(`${circuit.padEnd(15)} → session_key: ${s.session_key}  date_start: ${s.date_start}`);
        results[circuit] = { session_key: s.session_key, date_start: s.date_start };
      } else {
        console.log(`${circuit.padEnd(15)} → nessuna sessione trovata`);
        results[circuit] = null;
      }
    } catch (err) {
      console.log(`${circuit.padEnd(15)} → errore: ${err.message}`);
      results[circuit] = null;
    }
    await delay(500);
  }

  const outputPath = path.join(__dirname, 'quali-2025-sessions.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nSalvato in: ${outputPath}`);
}

main();
