const fs = require('fs');
const path = require('path');
const https = require('https');

const ERGAST = 'https://api.jolpi.ca/ergast/f1';

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

function timeToSeconds(t) {
  if (!t) return Infinity;
  const parts = t.split(':');
  if (parts.length === 2) return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
  return parseFloat(parts[0]);
}

async function fetchAllFastestLaps(circuitId) {
  let offset = 0;
  const limit = 100;
  let all = [];
  while (true) {
    const data = await fetchJSON(`${ERGAST}/circuits/${circuitId}/fastest/1/results.json?limit=${limit}&offset=${offset}`);
    const races = data.MRData.RaceTable.Races;
    all = [...all, ...races];
    const total = parseInt(data.MRData.total);
    if (all.length >= total) break;
    offset += limit;
    await delay(300);
  }
  return all;
}

async function main() {
  // Fetch 2025 schedule to get circuitIds
  const scheduleData = await fetchJSON(`${ERGAST}/2025.json?limit=30`);
  const races = scheduleData.MRData.RaceTable.Races;

  const results = {};

  for (const race of races) {
    const circuitId = race.Circuit.circuitId;
    const circuitName = race.Circuit.circuitName;
    const raceName = race.raceName;

    try {
      const allRaces = await fetchAllFastestLaps(circuitId);

      let best = null;
      let bestSecs = Infinity;

      for (const r of allRaces) {
        const result = r.Results?.[0];
        const lapTime = result?.FastestLap?.Time?.time;
        if (!lapTime) continue;
        const secs = timeToSeconds(lapTime);
        if (secs < bestSecs) {
          bestSecs = secs;
          best = {
            circuit: circuitName,
            driver: `${result.Driver.givenName} ${result.Driver.familyName}`,
            time: lapTime,
            year: parseInt(r.season),
          };
        }
      }

      if (best) {
        console.log(`${raceName.padEnd(35)} → ${best.driver.padEnd(22)} ${best.time}  (${best.year})`);
        results[circuitId] = best;
      } else {
        console.log(`${raceName.padEnd(35)} → nessun dato`);
        results[circuitId] = null;
      }
    } catch (err) {
      console.log(`${raceName.padEnd(35)} → errore: ${err.message}`);
      results[circuitId] = null;
    }

    await delay(500);
  }

  const outputPath = path.join(__dirname, 'lap-records.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nSalvato in: ${outputPath}`);
}

main();
