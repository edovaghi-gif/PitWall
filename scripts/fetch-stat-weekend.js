const fs = require('fs');
const path = require('path');

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('Missing GEMINI_API_KEY');
    process.exit(1);
  }

  // 1. Next race
  console.log('Fetching next race...');
  const nextRes = await fetch('https://api.jolpi.ca/ergast/f1/current/next.json');
  const nextData = await nextRes.json();
  const race = nextData.MRData.RaceTable.Races[0];
  if (!race) { console.error('No next race found'); process.exit(1); }
  const { raceName, round, date } = race;
  const circuitId = race.Circuit.circuitId;
  const circuitName = race.Circuit.circuitName;
  console.log(`Next race: ${raceName} (${circuitId}), round ${round}, ${date}`);

  // 2. Historical winners for this circuit
  console.log(`Fetching historical winners for ${circuitId}...`);
  const winnersRes = await fetch(`https://api.jolpi.ca/ergast/f1/circuits/${circuitId}/results/1.json?limit=100`);
  const winnersData = await winnersRes.json();
  const allRaces = winnersData.MRData.RaceTable.Races;
  const total = allRaces.length;
  const winCounts = {};
  let lastYear = null;
  for (const r of allRaces) {
    const driver = r.Results[0].Driver.familyName;
    winCounts[driver] = (winCounts[driver] ?? 0) + 1;
    const y = parseInt(r.season);
    if (lastYear === null || y > lastYear) lastYear = y;
  }
  const topWinner = Object.entries(winCounts).sort((a, b) => b[1] - a[1])[0];
  const topWinnerName = topWinner ? topWinner[0] : 'N/A';
  const topWinnerCount = topWinner ? topWinner[1] : 0;
  console.log(`Top winner: ${topWinnerName} (${topWinnerCount}/${total}), last edition: ${lastYear}`);

  // 3. Last race winner
  console.log('Fetching last race winner...');
  const lastRes = await fetch('https://api.jolpi.ca/ergast/f1/current/last/results.json');
  const lastData = await lastRes.json();
  const lastRaces = lastData.MRData.RaceTable.Races;
  let lastWinner = 'N/A';
  let lastWinnerTeam = '';
  if (lastRaces.length > 0) {
    const w = lastRaces[0].Results[0];
    lastWinner = `${w.Driver.givenName} ${w.Driver.familyName}`;
    lastWinnerTeam = w.Constructor.name;
  }
  console.log(`Last winner: ${lastWinner} (${lastWinnerTeam})`);

  // 4. Generate stat with Gemini Flash
  console.log('Calling Gemini Flash...');
  const geminiRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Sei un esperto di Formula 1. Genera una statistica interessante e coinvolgente in italiano (max 3 frasi) per il prossimo GP: ${raceName} sul circuito ${circuitName}. Dati disponibili: pilota più vincente = ${topWinnerName} con ${topWinnerCount} vittorie su ${total} edizioni, ultima vittoria di ${lastWinner} (${lastYear ?? 'N/A'}). Rendi il testo dinamico, non iniziare sempre con il nome del pilota, usa costruzioni narrative variegate.`
          }]
        }]
      })
    }
  );
  const geminiData = await geminiRes.json();
  if (!geminiRes.ok) throw new Error(JSON.stringify(geminiData));
  const stat = geminiData.candidates[0].content.parts[0].text.trim();
  console.log(`Stat: ${stat.slice(0, 100)}...`);

  // 5. Save to assets/stat-weekend.json
  const output = {
    raceName,
    circuitId,
    generatedAt: new Date().toISOString(),
    stat,
  };
  const outPath = path.join(__dirname, '..', 'assets', 'stat-weekend.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Saved to ${outPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
