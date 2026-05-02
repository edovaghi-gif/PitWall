# CODEBASE_MAP.md

Mappa tecnica precisa del codice PitWall. Generata dal codice reale — non da descrizioni generiche.

---

## 1. Costanti principali

### DEV flags — `app/(tabs)/home.tsx`
```ts
const QUALI_DEV_MODE = false         // true → usa fakeSession Suzuka Q3 (session_key 11249)
const QUALI_DEV_SESSION_KEY = 11249  // GP Giappone 2025 Qualifying
const QUALI_DEV_MAX_LAP = 999        // filtra lap_number > N (usato per troncare dati)
const FP_DEV_MODE = false            // true → usa FP_DEV_CIRCUIT e FP_DEV_YEAR
const FP_DEV_CIRCUIT = "Suzuka"      // circuit_short_name OpenF1 per dev FP
const FP_DEV_YEAR = 2026
```
**⚠️ Verificare entrambi = false prima di ogni build/release.**

### circuitMap — duplicato in `home.tsx` (fetchFpData) e `getCurrentSessionInfo`, e in `prediction.tsx` (fetchSessionKey)
```ts
// Ergast raceName → OpenF1 circuit_short_name
{
  "Miami Grand Prix":          "Miami",
  "Japanese Grand Prix":       "Suzuka",
  "Bahrain Grand Prix":        "Bahrain",    // ⚠ NON corrisponde a OpenF1 "Sakhir"
  "Saudi Arabian Grand Prix":  "Jeddah",
  "Australian Grand Prix":     "Melbourne",
  "Chinese Grand Prix":        "Shanghai",
  "Spanish Grand Prix":        "Barcelona",  // ⚠ OpenF1 usa "Catalunya"
  "Monaco Grand Prix":         "Monaco",     // ⚠ OpenF1 usa "Monte Carlo"
  "Canadian Grand Prix":       "Montreal",
  "Austrian Grand Prix":       "Spielberg",
  "British Grand Prix":        "Silverstone",
  "Hungarian Grand Prix":      "Budapest",   // ⚠ OpenF1 usa "Hungaroring"
  "Belgian Grand Prix":        "Spa",        // ⚠ OpenF1 usa "Spa-Francorchamps"
  "Dutch Grand Prix":          "Zandvoort",
  "Italian Grand Prix":        "Monza",
  "Azerbaijan Grand Prix":     "Baku",
  "Singapore Grand Prix":      "Singapore",
  "United States Grand Prix":  "Austin",
  "Mexico City Grand Prix":    "Mexico City",
  "São Paulo Grand Prix":      "Interlagos",
  "Las Vegas Grand Prix":      "Las Vegas",
  "Qatar Grand Prix":          "Lusail",
  "Abu Dhabi Grand Prix":      "Abu Dhabi",  // ⚠ OpenF1 usa "Yas Marina Circuit"
}
```
**Nota:** questo circuitMap usa nomi OpenF1 approssimati per le sessioni FP/Quali. Per le qualifiche 2025 i nomi esatti OpenF1 sono in `scripts/quali-2025-sessions.json`.

### CIRCUIT_INFO_MAP — `home.tsx` (file-level, fuori dal componente)
```ts
// OpenF1 circuit_short_name → require() del JSON circuit-info
{
  "Sakhir":            require('../../assets/circuit-info/bahrain.json'),
  "Jeddah":            require('../../assets/circuit-info/jeddah.json'),
  "Melbourne":         require('../../assets/circuit-info/melbourne.json'),
  "Suzuka":            require('../../assets/circuit-info/suzuka.json'),
  "Shanghai":          require('../../assets/circuit-info/shanghai.json'),
  "Miami":             require('../../assets/circuit-info/miami.json'),
  "Imola":             require('../../assets/circuit-info/imola.json'),
  "Monte Carlo":       require('../../assets/circuit-info/monaco.json'),
  "Catalunya":         require('../../assets/circuit-info/barcelona.json'),
  "Montreal":          require('../../assets/circuit-info/montreal.json'),
  "Spielberg":         require('../../assets/circuit-info/spielberg.json'),
  "Silverstone":       require('../../assets/circuit-info/silverstone.json'),
  "Hungaroring":       require('../../assets/circuit-info/budapest.json'),
  "Spa-Francorchamps": require('../../assets/circuit-info/spa.json'),
  "Zandvoort":         require('../../assets/circuit-info/zandvoort.json'),
  "Monza":             require('../../assets/circuit-info/monza.json'),
  "Baku":              require('../../assets/circuit-info/baku.json'),
  "Singapore":         require('../../assets/circuit-info/singapore.json'),
  "Austin":            require('../../assets/circuit-info/austin.json'),
  "Mexico City":       require('../../assets/circuit-info/mexico.json'),
  "Interlagos":        require('../../assets/circuit-info/saopaulo.json'),
  "Las Vegas":         require('../../assets/circuit-info/lasvegas.json'),
  "Lusail":            require('../../assets/circuit-info/lusail.json'),
  "Yas Marina Circuit":require('../../assets/circuit-info/abudhabi.json'),
}
```
Usato in DEV e produzione per leggere `lapRecord` e `qualiRecord`. La chiave è `activeSession.circuit_short_name` (campo reale dell'oggetto sessione OpenF1).

### TEAM_COLORS — `prediction.tsx` e `headtohead.tsx`
```ts
{
  ferrari: "#E8002D", red_bull: "#3671C6", mclaren: "#FF8000",
  mercedes: "#27F4D2", williams: "#00A3E0", alpine: "#FF87BC",
  aston_martin: "#229971", haas: "#B6BABD", rb: "#6692FF", sauber: "#52E252",
}
// Chiave = constructorId Ergast (lowercase, underscore)
```

### DRIVER_CODES — `scripts/fetch-pb-2025.js`
```js
{
  1:"VER", 4:"NOR", 5:"BOR", 7:"DOO", 10:"GAS", 11:"PER",
  12:"ANT", 14:"ALO", 16:"LEC", 18:"STR", 20:"MAG", 22:"TSU",
  23:"ALB", 27:"HUL", 30:"LAW", 31:"OCO", 43:"COL", 44:"HAM",
  55:"SAI", 63:"RUS", 77:"BOT", 81:"PIA", 87:"BEA",
}
// Numeri permanenti 2025. LAW=30 (era 40 nel 2024), ANT=12 (non 38)
```

---

## 2. Stato React principale — `home.tsx`

### useState
```ts
lastRace: any                   // ultimo GP da Ergast /current/last/results
standings: any[]                // top 5 piloti da Ergast
constructorStandings: any[]     // top 5 costruttori da Ergast
nextRace: any                   // prossimo GP da Ergast /current.json
statOfDay: string               // stringa generata da fetchStatOfDay()
countdown: {days,hours,minutes,seconds}  // conto alla rovescia verso nextRace.date
loading: boolean                // true durante fetchData() iniziale

activeSession: any | null       // oggetto sessione OpenF1 attiva (ha .session_key, .session_name, .circuit_short_name)
qualifyingDrivers: any[]        // array piloti ordinati per best_lap_duration (vedi struttura sotto)
qualiPhase: "Q1"|"Q2"|"Q3"|null // fase corrente da fetchRaceControl()
activeQualiPhase: string|null   // fase da mostrare in UI (set in fetchQualifyingData)
nextSessionCountdown: string|null  // es. "Qualifiche tra 45m"
qualiCountdown: string|null     // es. "Q2 in arrivo"
expandedDriver: string|null     // acronimo pilota con expand panel aperto

fpSessions: {key:number, name:string, finished:boolean}[]
fpResults: Record<number, any[]>  // session_key → array piloti con best_lap
showFpModal: boolean
activeFpTab: number             // indice in fpSessions

flashingDrivers: Set<number>    // driver_number dei piloti con nuovo best lap (flash 2.5s)
```

### useRef
```ts
raceControlRef: any[]           // cache race_control OpenF1 — aggiornato ogni 30s
driverLapRef: Record<number,number>  // driver_number → ultimo lap_number visto (per flash detection)
flashTimers: Record<number,ReturnType<typeof setTimeout>>  // timeout per rimuovere flash
devQualiPhase: string|null      // "Q3" in DEV mode, null in produzione
pulseAnim: Animated.Value       // animazione pulsante punto rosso live (1→0.3→1, 800ms loop)
```

### Struttura oggetto in `qualifyingDrivers[]`
```ts
{
  driver_number: number,
  full_name: string,
  name_acronym: string,       // es. "VER", "LEC"
  team_colour: string,        // hex senza # (es. "E10600") — da OpenF1
  best_lap_duration: number|null,  // secondi con decimali (es. 86.983)
  lap_phase: number|null,     // 1=Q1, 2=Q2, 3=Q3 — fase del best lap mostrato
  sector1: number|null,       // duration_sector_1 in secondi
  sector2: number|null,
  sector3: number|null,
  sector1_color: string,      // "#9B59B6"|"#27AE60"|"#F39C12"|"#2A2A2A"
  sector2_color: string,
  sector3_color: string,
}
```

---

## 3. Funzioni chiave

### `fetchData()` — `home.tsx`
- Fetcha in parallelo: ultimo GP, driver standings, schedule corrente, constructor standings
- Setta: `lastRace`, `standings`, `constructorStandings`, `nextRace`
- Chiama `fetchStatOfDay(circuitId, raceName)` per il prossimo GP
- Setta `loading = false` nel finally

### `getCurrentSessionInfo(raceName, year)` — `home.tsx`
- Parametri: raceName (Ergast, es. "Japanese Grand Prix"), year (number)
- Traduce raceName → circuit_short_name via circuitMap interno
- Fetcha `https://api.openf1.org/v1/sessions?year={year}&circuit_short_name={name}`
- Restituisce: `any[]` (array sessioni OpenF1) o `null`

### `checkActiveSession()` — `home.tsx`
- In DEV mode: setta `fakeSession` con circuit_short_name "Suzuka" e chiama `setActiveSession`
- In produzione: chiama `getCurrentSessionInfo()`, trova sessione attiva (now tra date_start e date_end)
- Se sessione attiva è Qualifying/Sprint Qualifying → `setActiveSession(active)`
- Se prossima qualifica entro 1h → `setNextSessionCountdown("Qualifiche tra Xm")`

### `fetchRaceControl(sessionKey)` — `home.tsx`
- Fetcha `https://api.openf1.org/v1/race_control?session_key={key}`
- Aggiorna `raceControlRef.current` con tutti gli eventi
- Determina fase corrente: cerca ultimi eventi "SESSION STARTED" non seguiti da "SESSION FINISHED"
- Setta `qualiPhase` ("Q1"|"Q2"|"Q3"|null) e `qualiCountdown`
- Chiamata ogni 30s tramite interval

### `fetchQualifyingData()` — `home.tsx`
- Fetcha drivers e laps per `activeSession.session_key`
- `getPhaseWindow(phaseNum)`: legge `raceControlRef` per ottenere Date start/end di una fase
- `getBestLapInPhase(driverNum, phaseNum, requireWindow)`: filtra laps per finestra temporale, restituisce il giro più veloce
- Per ogni pilota: prova fase corrente → fallback Q2 → fallback Q1 (per eliminati)
- Salva `lap_phase` nel driverMap
- Sort: per `lap_phase` desc, poi per `best_lap_duration` asc
- Setta `qualifyingDrivers`
- Chiamata ogni 10s tramite interval

### `fetchFpData()` — `home.tsx`
- Traduce `nextRace.raceName` → circuit_short_name (o usa FP_DEV_CIRCUIT in dev)
- Fetcha tutte le sessioni OpenF1 per anno+circuito, filtra quelle Practice
- Per ogni sessione: verifica se terminata via race_control ("SESSION FINISHED")
- Se terminata: fetcha laps e drivers, calcola best lap per pilota
- Fetch sequenziali con delay 1s tra sessioni (evita rate limiting)
- Setta `fpSessions` e `fpResults`

### `fetchSessionKey(raceName, year)` — `prediction.tsx`
- Parametri: raceName Ergast, year number
- Traduce raceName → circuit_short_name via circuitMap interno
- Fetcha `https://api.openf1.org/v1/sessions?year={year}&circuit_short_name={name}&session_name=Race`
- Restituisce: `number` (session_key) o `null`

### `checkRaceResults()` — `prediction.tsx`
- Chiama `fetchSessionKey()` per il prossimo GP
- Fetcha `https://api.openf1.org/v1/position?session_key={key}`
- Se almeno 3 piloti distinti nelle prime 3 posizioni → `setRaceResultsAvailable(true)`
- Chiamata in useEffect quando nextRace cambia

### `calculateScore()` — `prediction.tsx`
- Fetcha position, race_control, laps per il sessionKey della gara
- Calcola podio reale, safety car, red flag, DNF
- Punteggio base: +50 podio esatto, +20 posizione esatta, +7 pilota nel podio
- Moltiplicatori: ×1.1 SC corretta, ×1.15 RF corretta, ×1.1 DNF corretto
- Penalità: -5 SC sbagliata, -8 RF sbagliata, -5 DNF sbagliato
- Setta `scoreBreakdown` e apre modal scoring

---

## 4. Struttura JSON — esempi reali

### `assets/circuit-info/suzuka.json`
```json
{
  "name": "Suzuka International Racing Course",
  "corners": [
    {
      "id": 1,
      "name": "S Curves",
      "sector": 1,
      "desc": "La sequenza più iconica della F1: cambi di direzione ad altissima velocità.",
      "speed": "255 km/h",
      "g": "4.8G",
      "pointIndex": 8
    }
  ],
  "dna": {
    "tipo": "Permanente",
    "usuraGomme": "Alta",
    "importanzaQualifica": "Alta",
    "safetyCar": "3 su ultimi 10 GP",
    "sorpassi": "Rari"
  },
  "lapRecord": {
    "time": "1:30.965",
    "driver": "Andrea Kimi Antonelli",
    "team": "Mercedes",
    "year": 2025
  },
  "qualiRecord": {
    "time": "1:26.983",
    "driver": "Max Verstappen",
    "team": "Red Bull",
    "year": 2025
  }
}
```

### `assets/circuits/suzuka.json`
```json
{
  "name": "Suzuka",
  "session_key": 9496,
  "viewBox": "0 0 300 300",
  "points": [
    { "x": 231, "y": 133, "z": 735 },
    { "x": 237, "y": 140, "z": 718 }
  ]
}
```
- `points`: 500–2000 punti GPS trasformati (coordinate normalizzate 0-300, Y invertito)
- `session_key`: qualifica 2024 usata per generare il tracciato GPS

### `assets/quali-pb-2025.json`
```json
{
  "Suzuka": {
    "VER": { "bestLap": "1:26.983", "lapDuration": 86.983 },
    "NOR": { "bestLap": "1:26.995", "lapDuration": 86.995 },
    "PIA": { "bestLap": "1:27.027", "lapDuration": 87.027 }
  },
  "Baku": {},
  "Yas Marina Circuit": {}
}
```
- Chiave circuito = `circuit_short_name` OpenF1 esatto
- Chiave pilota = `name_acronym` OpenF1 (es. "ANT", non "KAN")
- Baku e Yas Marina Circuit: oggetti vuoti (nessun dato lap in OpenF1 per quelle sessioni)
- `lapDuration`: secondi con 3 decimali (usato per calcolo delta numerico)

---

## 5. Endpoint API usati

### Ergast (`https://api.jolpi.ca/ergast/f1`)
```
GET /current/last/results.json                       → ultimo GP completato
GET /current/driverStandings.json                    → classifica piloti corrente
GET /current/constructorStandings.json               → classifica costruttori corrente
GET /current.json?limit=30                           → calendario stagione corrente
GET /current/driverStandings.json                    → piloti per prediction/H2H
GET /circuits/{circuitId}/results/1.json?limit=100   → vincitori storici per stat del giorno
GET /circuits/{circuitId}/qualifying.json?limit=100&offset=N  → record qualifica storico
GET /circuits/{circuitId}/fastest/1/results.json?limit=100&offset=N  → record gara storico
GET /drivers/{driverId}/results.json?limit=100&offset=N  → risultati carriera pilota (H2H)
GET /2025.json?limit=30                              → calendario 2025 (per fetch-lap-records.js)
```

### OpenF1 (`https://api.openf1.org/v1`)
```
GET /sessions?year={Y}&circuit_short_name={name}                    → tutte le sessioni per circuito+anno
GET /sessions?year={Y}&circuit_short_name={name}&session_type=Qualifying  → solo qualifiche
GET /sessions?year={Y}&circuit_short_name={name}&session_name=Race  → solo gara
GET /drivers?session_key={key}                                      → piloti in sessione
GET /laps?session_key={key}                                         → tutti i giri
GET /laps?session_key={key}&is_pit_out_lap=false                    → giri escludendo out-lap
GET /laps?session_key={key}&lap_number={N}                          → giri specifici (per DNF detection)
GET /race_control?session_key={key}                                 → eventi gara/qualifiche
GET /position?session_key={key}                                     → posizioni gara
```

---

## 6. Componenti UI — vista qualifying live

### Schermata qualifying (`isQualifying === true`)
Sostituisce tutta la home quando `activeSession.session_name === "Qualifying"`.
Layout: `View > navbar > fase-badges > ScrollView(righe-pilota)`

### Header fase
```
● [pulse] Q3 IN CORSO         ← punto rosso animato + testo fase
[Q1] [Q2] [Q3]               ← badge fase: attivo #E10600, inattivo #1E1E1E
```

### Riga pilota (per ogni `driver` in `qualifyingDrivers`)
```
pos  ▌  ACR  [S1][S2][S3]  M:SS.mmm  +X.XXX
```
- `pos`: index+1, colore #555555 se eliminato, #999999 se attivo
- `▌`: barra colorata team (2px), grigio #444444 se eliminato
- `ACR`: name_acronym, bianco se attivo, grigio #555555 se eliminato
- `[S1][S2][S3]`: box 62×20px, colori settore se attivo, #1A1A1A se eliminato
  - Colori settore: viola #9B59B6 (2051), verde #27AE60 (2049), giallo #F39C12 (2048), grigio #2A2A2A (2064=pitlane, 0=no data)
  - Testo settore: nero #000000 su sfondo colorato, grigio #555555 se eliminato
- Tempo: `formatLapTime(best_lap_duration)` → "M:SS.mmm", --:--.--- se null
- Gap: sempre relativo a `leaderTime` (qualifyingDrivers[0].best_lap_duration)
  - index===0: "LEADER"
  - altrimenti: "+X.XXX" o "--" se null

### Condizione eliminato
```ts
const isEliminated =
  (activeQualiPhase === "Q1" && index >= 16) ||
  (activeQualiPhase === "Q2" && index >= 10) ||
  (activeQualiPhase === "Q3" && index >= 10);
```
I piloti eliminati mostrano il best lap freezato della loro ultima fase Q (`lap_phase`).
Sort: `lap_phase` desc → tempo asc (Q3 drivers sempre sopra Q2, Q2 sopra Q1).

### Expand panel (tap su riga → toggle)
```
┌─────────────────┬─────────────────┐
│ VS QUALI RECORD │   VS PB 2025    │
│   +0.342s       │   -0.012s       │  ← verde se negativo
└─────────────────┴─────────────────┘
```
- Background: `#1E1E1E`
- Label: #999999, fontSize 10, uppercase
- Delta: #FFFFFF o #27AE60 (se record battuto), fontSize 14, fontWeight 700
- "N/D" se dati non disponibili (es. Baku per PB 2025)
- Stato: `expandedDriver: string|null` — un solo pilota aperto alla volta
- VS QUALI RECORD: `driver.best_lap_duration - timeToSecs(qualiRecord.time)`
  - `qualiRecord` da `CIRCUIT_INFO_MAP[circuit_short_name].qualiRecord`
- VS PB 2025: `driver.best_lap_duration - qualiPb2025[circuit_short_name][acronym].lapDuration`
  - `qualiPb2025` importato come JSON statico da `assets/quali-pb-2025.json`
