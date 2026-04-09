const fs = require('fs');
const path = require('path');
const https = require('https');

const DRIVER_CODES = {
  1: "VER", 4: "NOR", 5: "BOR", 7: "DOO", 10: "GAS", 11: "PER",
  12: "ANT", 14: "ALO", 16: "LEC", 18: "STR", 20: "MAG", 22: "TSU",
  23: "ALB", 24: "ZHO", 27: "HUL", 30: "LAW", 31: "OCO", 43: "COL",
  44: "HAM", 55: "SAI", 63: "RUS", 77: "BOT", 81: "PIA", 87: "BEA",
};

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

function formatLapTime(seconds) {
  if (!seconds) return null;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(3).padStart(6, '0');
  return `${mins}:${secs}`;
}

async function main() {
  const sessions = JSON.parse(fs.readFileSync(path.join(__dirname, 'quali-2025-sessions.json'), 'utf8'));
  const results = {};

  for (const [circuit, session] of Object.entries(sessions)) {
    if (!session) {
      console.log(`${circuit.padEnd(20)} → nessuna sessione, skip`);
      continue;
    }

    const { session_key } = session;
    console.log(`${circuit.padEnd(20)} → session_key ${session_key} — fetching laps...`);

    try {
      const laps = await fetchJSON(
        `https://api.openf1.org/v1/laps?session_key=${session_key}&is_pit_out_lap=false`
      );

      if (!Array.isArray(laps) || laps.length === 0) {
        console.log(`  nessun lap trovato`);
        results[circuit] = {};
        await delay(1000);
        continue;
      }

      const bestPerDriver = {};
      for (const lap of laps) {
        const num = lap.driver_number;
        const dur = lap.lap_duration;
        if (!num || !dur) continue;
        if (!bestPerDriver[num] || dur < bestPerDriver[num]) {
          bestPerDriver[num] = dur;
        }
      }

      const circuitResult = {};
      for (const [num, dur] of Object.entries(bestPerDriver)) {
        const code = DRIVER_CODES[parseInt(num)] ?? `#${num}`;
        circuitResult[code] = {
          bestLap: formatLapTime(dur),
          lapDuration: Math.round(dur * 1000) / 1000,
        };
      }

      // Sort by lapDuration
      const sorted = Object.fromEntries(
        Object.entries(circuitResult).sort((a, b) => a[1].lapDuration - b[1].lapDuration)
      );

      results[circuit] = sorted;

      const fastest = Object.entries(sorted)[0];
      console.log(`  ${Object.keys(sorted).length} piloti — fastest: ${fastest[0]} ${fastest[1].bestLap}`);
    } catch (err) {
      console.log(`  errore: ${err.message}`);
      results[circuit] = {};
    }

    await delay(1000);
  }

  const outputPath = path.join(__dirname, '..', 'assets', 'quali-pb-2025.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nSalvato in: ${outputPath}`);
}

main();
