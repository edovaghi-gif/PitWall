const fs = require("fs");

const CIRCUITS = [
    { name: "bahrain", sessionName: "Sakhir" },
    { name: "jeddah", sessionName: "Jeddah" },
    { name: "melbourne", sessionName: "Melbourne" },
    { name: "suzuka", sessionName: "Suzuka" },
    { name: "shanghai", sessionName: "Shanghai" },
    { name: "miami", sessionName: "Miami" },
    { name: "imola", sessionName: "Imola" },
    { name: "monaco", sessionName: "Monte Carlo" },
    { name: "montreal", sessionName: "Montreal" },
    { name: "barcelona", sessionName: "Catalunya" },
    { name: "spielberg", sessionName: "Spielberg" },
    { name: "silverstone", sessionName: "Silverstone" },
    { name: "budapest", sessionName: "Hungaroring" },
    { name: "spa", sessionName: "Spa-Francorchamps" },
    { name: "zandvoort", sessionName: "Zandvoort" },
    { name: "monza", sessionName: "Monza" },
    { name: "baku", sessionName: "Baku" },
    { name: "singapore", sessionName: "Singapore" },
    { name: "austin", sessionName: "Austin" },
    { name: "mexico", sessionName: "Mexico City" },
    { name: "saopaulo", sessionName: "Interlagos" },
    { name: "lasvegas", sessionName: "Las Vegas" },
    { name: "lusail", sessionName: "Lusail" },
    { name: "abudhabi", sessionName: "Yas Marina Circuit" },
  ];

async function getSessions(year) {
  const res = await fetch(`https://api.openf1.org/v1/sessions?year=${year}&session_name=Race`);
  return res.json();
}

async function getLaps(sessionKey, driverNumber = 1) {
    const res = await fetch(`https://api.openf1.org/v1/laps?session_key=${sessionKey}&driver_number=${driverNumber}`);
    const laps = await res.json();
    if (!Array.isArray(laps)) { console.log(`  API error:`, laps); return []; }
    return laps.filter(l => l.lap_duration && l.lap_duration > 60 && l.lap_duration < 300);
  }

async function getGPS(sessionKey, driverNumber, dateStart, duration) {
  const start = new Date(dateStart);
  const end = new Date(start.getTime() + duration * 1000);
  const url = `https://api.openf1.org/v1/location?session_key=${sessionKey}&driver_number=${driverNumber}&date>${start.toISOString()}&date<${end.toISOString()}`;
  const res = await fetch(url);
  return res.json();
}

function normalize(points) {
  const xs = points.map(p => p.x);
  const ys = points.map(p => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = 280 / Math.max(maxX - minX, maxY - minY);
  const offsetX = (300 - (maxX - minX) * scale) / 2;
  const offsetY = (300 - (maxY - minY) * scale) / 2;
  const normalizedPoints = points.map(p => ({
    x: Math.round((p.x - minX) * scale + offsetX),
    y: Math.round((maxY - p.y) * scale + offsetY),
    z: p.z,
  }));
  return { points: normalizedPoints, transform: { minX, maxY, scale, offsetX, offsetY } };
}

function downsample(points, every = 4) {
  return points.filter((_, i) => i % every === 0);
}

async function generateCircuit(circuitName, sessionKey, circuitShortName) {
  console.log(`\nGenerating ${circuitName}...`);

  const laps = await getLaps(sessionKey);
  if (!laps.length) { console.log(`  No laps found`); return; }

  const lap = laps[2] || laps[0];
  console.log(`  Using lap ${lap.lap_number}, duration ${lap.lap_duration}s`);

  const raw = await getGPS(sessionKey, 1, lap.date_start, lap.lap_duration);
  console.log(`  Got ${raw.length} GPS points`);

  if (!raw.length) { console.log(`  No GPS data`); return; }

  const { points: normalizedPoints, transform } = normalize(raw);
  const sampled = downsample(normalizedPoints, 4);

  const output = {
    name: circuitShortName,
    session_key: sessionKey,
    points: sampled,
    viewBox: "0 0 300 300",
    transform,
  };

  fs.mkdirSync("assets/circuits", { recursive: true });
  fs.writeFileSync(`assets/circuits/${circuitName}.json`, JSON.stringify(output, null, 2));
  console.log(`  Saved ${sampled.length} points to assets/circuits/${circuitName}.json`);
}

async function main() {
  const filter = process.argv[2];
  const sessions = await getSessions(2024);
  console.log(`Found ${sessions.length} race sessions in 2024`);

  for (const circuit of CIRCUITS) {
    if (filter && circuit.name !== filter) continue;
    if (!filter && fs.existsSync(`assets/circuits/${circuit.name}.json`)) {
      console.log(`\nSkipping ${circuit.name} (already exists)`);
      continue;
    }
    const session = sessions.find(s =>
      s.circuit_short_name.toLowerCase().includes(circuit.sessionName.toLowerCase()) ||
      circuit.sessionName.toLowerCase().includes(s.circuit_short_name.toLowerCase())
    );

    if (!session) {
      console.log(`\nNo session found for ${circuit.name}`);
      continue;
    }

    console.log(`Found session for ${circuit.name}: key=${session.session_key}`);
    await generateCircuit(circuit.name, session.session_key, session.circuit_short_name);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log("\nDone!");
}

main();