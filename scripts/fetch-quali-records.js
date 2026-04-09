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

function bestQualiTime(result) {
  return result.Q3 || result.Q2 || result.Q1 || null;
}

async function fetchAllQualiRaces(circuitId) {
  let offset = 0;
  const limit = 100;
  let allRaces = [];
  while (true) {
    const data = await fetchJSON(`${ERGAST}/circuits/${circuitId}/qualifying.json?limit=${limit}&offset=${offset}`);
    const races = data.MRData.RaceTable.Races;
    allRaces = [...allRaces, ...races];
    const total = parseInt(data.MRData.total);
    if (offset + limit >= total) break;
    offset += limit;
    await delay(500);
  }
  return allRaces;
}

async function main() {
  const scheduleData = await fetchJSON(`${ERGAST}/2025.json?limit=30`);
  const races = scheduleData.MRData.RaceTable.Races;

  const results = {};

  for (const race of races) {
    const circuitId = race.Circuit.circuitId;
    const circuitName = race.Circuit.circuitName;
    const raceName = race.raceName;

    try {
      const allRaces = await fetchAllQualiRaces(circuitId);

      let best = null;
      let bestSecs = Infinity;

      for (const r of allRaces) {
        const pole = r.QualifyingResults?.find(res => res.position === '1');
        if (!pole) continue;
        const t = bestQualiTime(pole);
        const secs = timeToSeconds(t);
        if (secs < bestSecs) {
          bestSecs = secs;
          best = {
            circuit: circuitName,
            driver: `${pole.Driver.givenName} ${pole.Driver.familyName}`,
            team: pole.Constructor.name,
            time: t,
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

  const outputPath = path.join(__dirname, 'quali-records.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`\nSalvato in: ${outputPath}`);
}

main();
