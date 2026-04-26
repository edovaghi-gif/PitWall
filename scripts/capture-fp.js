const fs = require('fs');
const path = require('path');
const https = require('https');

const SESSION_KEY = process.argv[2];
if (!SESSION_KEY) {
  console.error('Usage: node scripts/capture-fp.js <session_key>');
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, '..', 'captured-data', `fp_${SESSION_KEY}`);
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

let snapshotIndex = 0;
let driversCache = null;

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

async function captureSnapshot() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Capturing snapshot #${snapshotIndex}...`);

  try {
    const [laps, stints, raceControl, weather] = await Promise.all([
      fetchJSON(`https://api.openf1.org/v1/laps?session_key=${SESSION_KEY}`),
      fetchJSON(`https://api.openf1.org/v1/stints?session_key=${SESSION_KEY}`),
      fetchJSON(`https://api.openf1.org/v1/race_control?session_key=${SESSION_KEY}`),
      fetchJSON(`https://api.openf1.org/v1/weather?session_key=${SESSION_KEY}`),
    ]);

    if (!driversCache) {
      driversCache = await fetchJSON(`https://api.openf1.org/v1/drivers?session_key=${SESSION_KEY}`);
      console.log(`  Fetched drivers: ${driversCache.length}`);
    }

    const snapshot = {
      timestamp,
      snapshot_index: snapshotIndex,
      session_key: parseInt(SESSION_KEY),
      laps,
      stints,
      race_control: raceControl,
      weather,
      drivers: driversCache,
    };

    const filename = path.join(OUTPUT_DIR, `snapshot_${String(snapshotIndex).padStart(4, '0')}.json`);
    fs.writeFileSync(filename, JSON.stringify(snapshot, null, 2));
    console.log(`  Saved: ${filename} (laps: ${laps.length}, stints: ${stints.length}, rc: ${raceControl.length})`);
    snapshotIndex++;
  } catch (err) {
    console.error(`  Error: ${err.message}`);
  }
}

console.log(`Starting FP capture for session_key ${SESSION_KEY}`);
console.log(`Saving to: ${OUTPUT_DIR}`);
console.log('Press Ctrl+C to stop.\n');

captureSnapshot();
const interval = setInterval(captureSnapshot, 30000);

process.on('SIGINT', () => {
  clearInterval(interval);
  console.log(`\nCapture stopped. ${snapshotIndex} snapshots saved to ${OUTPUT_DIR}`);
  process.exit(0);
});
