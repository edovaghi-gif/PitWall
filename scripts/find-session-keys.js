const https = require('https');

const CIRCUIT = process.argv[2] || 'Miami';
const YEAR = process.argv[3] || new Date().getFullYear();

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

async function findSessions() {
  const url = `https://api.openf1.org/v1/sessions?year=${YEAR}&circuit_short_name=${encodeURIComponent(CIRCUIT)}`;
  console.log(`Fetching: ${url}\n`);

  const sessions = await fetchJSON(url);

  if (!Array.isArray(sessions) || sessions.length === 0) {
    console.log('No sessions found yet. Try closer to the race weekend.');
    return;
  }

  console.log(`Found ${sessions.length} sessions for ${CIRCUIT} ${YEAR}:\n`);
  sessions.forEach(s => {
    console.log(`  ${s.session_name.padEnd(15)} session_key: ${s.session_key}  start: ${s.date_start}`);
  });
}

findSessions().catch(console.error);
