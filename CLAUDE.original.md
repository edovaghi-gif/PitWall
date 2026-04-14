# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Commands

```bash
npx expo start --ios    # Start on iOS simulator (Xcode iPhone 17 Pro iOS 26.4)
npx expo start          # Start dev server
expo lint               # Lint con ESLint
node scripts/generate-circuit.js  # Rigenera i JSON circuiti da OpenF1
node scripts/find-session-keys.js Miami 2026  # Trova session_key per qualsiasi GP
node scripts/capture-quali.js <session_key>   # Cattura snapshot qualifiche ogni 30s
node scripts/capture-race.js <session_key>    # Cattura snapshot gara ogni 30s
node scripts/fetch-all-quali-2025.js          # Aggiorna scripts/quali-2025-sessions.json
node scripts/fetch-lap-records.js             # Aggiorna scripts/lap-records.json
node scripts/fetch-quali-records.js           # Aggiorna scripts/quali-records.json
node scripts/fetch-pb-2025.js                 # Aggiorna assets/quali-pb-2025.json
```

No test suite is currently set up.

---

## Architecture

PitWall è un'app F1 per iOS in Expo/React Native con expo-router (file-based routing).
New Architecture e React Compiler abilitati.

### Routing

```
app/index.tsx             → redirect a /(tabs)/home
app/_layout.tsx           → root Stack navigator (headerShown: false su tutte le schermate)
app/(tabs)/_layout.tsx    → bottom tab bar, 4 tab, Ionicons, active #E10600 inactive #555555
app/(tabs)/home.tsx       → countdown GP, ultimi risultati, standings, stat del giorno, live banner
app/(tabs)/circuito.tsx   → mappe GPS SVG, settori colorati, swipe tra 24 circuiti
app/(tabs)/headtohead.tsx → confronto carriera piloti, barre tug-of-war
app/(tabs)/prediction.tsx → pronostico 3-step, scoring con bonus/malus, AsyncStorage
app/season-results.tsx    → storico stagione, lista GP con punteggi e breakdown espandibile
app/onboarding.tsx        → 5 slide onboarding con animazione, mostrato solo al primo avvio
```

### Path Alias

`@/*` → root del repo (configurato in tsconfig.json).

---

## External APIs

- **Ergast** via `https://api.jolpi.ca/ergast/f1/` — risultati, standings, piloti, schedule
- **OpenF1** via `https://api.openf1.org/v1/` — GPS circuiti, live telemetria, scoring post-gara

Preferire sempre fetch dinamici alle API. Mai hardcodare dati disponibili via API.

---

## App Assets
- Logo: `assets/images/PitWall Logo.png` — PNG trasparente, usato in tutte le schermate (`height: 32, width: 160, resizeMode: 'contain'`)
- Foto muretto: `assets/images/PitWall Photo.png` — sfondo onboarding (opacity 0.25)
- Tutte le schermate usano `SafeAreaView` — navbar `paddingTop: 8`, NON usare `paddingTop: 52`

---

## Circuit Assets

- `assets/circuits/` — 24 JSON pre-generati (calendario 2024)
- `assets/circuit-info/{key}.json` — metadati curve, DNA circuito, record storici
  - Campi: `name`, `corners[]`, `dna{}`, `lapRecord{}`, `qualiRecord{}`
  - `lapRecord` e `qualiRecord`: `{ time, driver, team, year }` — generati da `fetch-lap-records.js` / `fetch-quali-records.js`
  - Per correzioni manuali: editare direttamente `scripts/lap-records.json` o `scripts/quali-records.json`, poi rieseguire lo script corrispondente
- `assets/quali-pb-2025.json` — personal best qualifiche 2025 per circuito e pilota
  - Struttura: `{ "Suzuka": { "VER": { "bestLap": "1:26.983", "lapDuration": 86.983 }, ... }, ... }`
  - Chiave circuito = `circuit_short_name` OpenF1 (es. "Suzuka", "Monte Carlo", "Yas Marina Circuit")
  - Rieseguire `fetch-pb-2025.js` dopo ogni GP per aggiornare
  - Baku e Yas Marina Circuit: nessun dato lap disponibile in OpenF1 (gap nei loro archivi)
- Struttura circuits: `name`, `session_key`, `viewBox ("0 0 300 300")`, `points: [{x,y,z}]`
- `pointIndex` 0-99 mappati proporzionalmente sul tracciato
- Y axis corretto (invertito rispetto al raw GPS)
- Rieseguire `generate-circuit.js` dopo qualsiasi modifica alla logica di trasformazione coordinate
- I settori colorati non devono essere rimossi durante fix cosmetici

### Driver number mapping 2025 (per fetch-pb-2025.js)
| # | Codice | Pilota |
|---|---|---|
| 1 | VER | Verstappen | 4 | NOR | Norris | 5 | BOR | Bortoleto |
| 7 | DOO | Doohan | 10 | GAS | Gasly | 11 | PER | Pérez |
| 12 | ANT | Antonelli | 14 | ALO | Alonso | 16 | LEC | Leclerc |
| 18 | STR | Stroll | 20 | MAG | Magnussen | 22 | TSU | Tsunoda |
| 23 | ALB | Albon | 27 | HUL | Hülkenberg | 30 | LAW | Lawson |
| 31 | OCO | Ocon | 43 | COL | Colapinto | 44 | HAM | Hamilton |
| 55 | SAI | Sainz | 63 | RUS | Russell | 81 | PIA | Piastri | 87 | BEA | Bearman |
### Session key noti — Giappone 2026 (circuit_short_name "Suzuka")
- Practice 1: 11246
- Practice 2: 11247
- Practice 3: 11248
- Qualifying: 11249 (sessione unica 60min, Q1/Q2/Q3 non separati)
- Race: 11253 (53 giri)

### OpenF1 — scoperte importanti
- La qualifica è una sessione unica (non separata per Q1/Q2/Q3) — un solo session_key
- I lap hanno date_start popolato sui giri normali, null sugli out-lap (non su tutti i lap come erroneamente notato in precedenza)
- I lap hanno segments_sector_1/2/3: array con colori mini-settore già calcolati da OpenF1:
  - 2048 = grigio (nessun tempo), 2049 = giallo, 2051 = verde, 2064 = viola
- is_pit_out_lap: true segnala l'uscita dai box
- Q1/Q2/Q3 si determina da /race_control con campo qualifying_phase (1/2/3)
- SESSION STARTED e SESSION FINISHED in race_control danno i timestamp esatti di ogni fase Q
- OpenF1 ha rate limiting — usare fetch sequenziali (non Promise.all) per sessioni multiple
- /intervals non disponibile per qualifiche, solo per gara
- /session_status non restituisce dati utili

---

## Design System

Dark mode applicata a tutte le schermate. Non usare colori chiari.

| Token | Valore |
|---|---|
| Background | `#0A0A0A` |
| Surface | `#141414` |
| Surface2 | `#1E1E1E` |
| Border | `#2A2A2A` (0.5px) |
| Accent | `#E10600` |
| TextPrimary | `#FFFFFF` |
| TextSecondary | `#999999` |
| TextMuted | `#555555` |

- Tab bar: Ionicons (`home`, `map`, `bar-chart`, `trophy`) — active `#E10600`, inactive `#555555`
- Accent `#E10600` solo per elementi interattivi primari e stati attivi
- Border sempre 0.5px
- Stili con React Native `StyleSheet` scoped per componente
- Usare `SafeAreaView` per il padding dei contenuti

---

## Head to Head (H2H)

**REGOLA ASSOLUTA: non riscrivere mai la logica tug-of-war. Solo fix cosmetici.**
Se un fix richiede di toccare la logica di calcolo percentuali/proporzioni, fermarsi e chiedere.

- Barre tug-of-war: gap netto, nessun overlap
- Picker piloti: FlatList con tutti i 20 piloti dinamici da Ergast
- Modal: bottom-sheet
- Numeri pilota: dinamici da Ergast

---

## Scoring Prediction

### Fonte dati
Solo OpenF1. Mai usare Ergast per il calcolo scoring post-gara.

### Endpoint OpenF1
- Podio reale: `/position?session_key={key}`
- Race control: `/race_control?session_key={key}`
- DNF: `/laps?session_key={key}&lap_number={totalLaps}` — piloti assenti = ritirati

### Detection eventi
- Safety Car: `category === "SafetyCar"` + `message` contiene `"DEPLOYED"`
- Red Flag: `category === "RedFlag"`

### Calcolo punti
| Evento | Punti |
|---|---|
| Podio esatto (ordine 1-2-3 corretto) | +50pt |
| Posizione esatta (pilota giusto, posto giusto) | +20pt |
| Pilota nel podio ma posizione sbagliata | +7pt |
| Safety Car corretta | ×1.1 |
| Red Flag corretta | ×1.15 |
| Range DNF corretto | ×1.1 |
| Safety Car sbagliata | −5pt |
| Red Flag sbagliata | −8pt |
| Range DNF sbagliato | −5pt |

Target sessione buona: ~100–110 punti totali.

### Implementazione post-gara
- `checkRaceResults()` — fetcha `/position?session_key={key}` da OpenF1, se ritorna array con 3+ piloti imposta `raceResultsAvailable = true`
- `calculateScore()` — calcola il punteggio confrontando il pronostico salvato con i dati reali OpenF1 (/position, /race_control, /laps)
  - Salva in `pitwall_scores`: `myPodiumNames` (nomi piloti), `savedSafetyCar`, `savedRedFlag`, `savedDnfRange`
  - Upsert per `round + season` — sovrascrive se esiste, aggiunge se non esiste
- `fetchSessionKey()` — recupera il session_key dinamicamente da OpenF1 tramite circuitMap
- Modal "SCOPRI IL RISULTATO" — visibile solo se raceResultsAvailable === true, mostra breakdown punti e punteggio finale

### Flusso prediction (3 step)
1. Selezione podio (P1, P2, P3) — banner "LA MIA STAGIONE" in cima se `scoreHistory.length > 0`, naviga a `/season-results`
2. Parametri avanzati (n° Safety Car, Red Flag sì/no, range DNF)
3. Recap + submit

- Lock: bloccato dopo inizio qualifiche — banner arancione con data/ora esatta
- Persistenza: `AsyncStorage` key `pitwall_scores` — array di record, sopravvive al riavvio app

---

## Live Race (home.tsx)

### DEV mode
- `RACE_DEV_MODE = false` — **verificare prima di ogni build/release**
- `RACE_DEV_SESSION_KEY = 11253` (Suzuka 2026 Race)

### Architettura fetch
- `fetchRaceData()`: polling ogni 15s — fetch parallele con `safeFetch` (retry 1x dopo 1000ms): `/position`, `/intervals`, `/race_control`, `/drivers` (solo se cache vuota)
- `fetchRaceStints()`: polling ogni 30s — `/stints`
- `fetchRaceWeather()`: polling ogni 120s — `/weather`
- `safeFetch(url)`: helper interno, retry una volta dopo 1000ms in caso di errore
- Al mount: fetch one-shot `/laps?lap_number={totalLaps}` → salva finisher in `dnfRef`

### DNF detection
- `dnfRef`: Set<number> popolato al mount con driver_number dell'ultimo giro
- `isDnf = dnfRef.size > 0 && !dnfRef.has(num) && intervalStr !== "LAP"`
- Piloti doppiati (intervalStr = "LAP") NON sono DNF — mostrano gap normalmente
- DNF mostrati in fondo, interval = "DNF" colore #555555

### Classifica live
- Dati da `/position` (ultima pos per driver) + `/intervals` (gap al leader)
- Gap > 120s → "LAP" (doppiato)
- Compound/età gomme da `/stints` (raceStintsRef)
- Età gomma: `tyre_age_at_start + (totalLaps - lap_start)` come stima
- Header colonne: INTERVAL | CPD | AGE | PIT

### Battle Insight
- Coppia con gap < 2.0s più piccolo tra driver consecutivi in classifica
- `previousIntervalsRef`: salva gap numerico (relativo tra i due driver) ad ogni polling
- `trend = previousGap - currentGap` → positivo = si avvicinano, negativo = si allontanano
- Mostrato sotto la riga del driver davanti

### Meteo
- `raceWeather.track_temperature` + `raceWeather.rainfall` nell'header
- `raceTotalLaps` da `TOTAL_LAPS[circuit_short_name]`

---

## Live Qualifying (home.tsx)

### DEV mode
- `QUALI_DEV_MODE = false` — **verificare prima di ogni build/release**
- `QUALI_DEV_SESSION_KEY = 11249` (Suzuka 2025 Qualifying)
- In DEV mode, `fakeSession` include `circuit_short_name: "Suzuka"` per il mapping circuito
- `FP_DEV_MODE = false` — verificare prima di ogni build/release

### Filtro lap per fase Q
- `phaseStart`/`phaseEnd` sempre calcolati da `raceControlRef` (anche in DEV mode)
- In DEV mode, `phaseNum` viene forzato dalla fase simulata (es. "Q3" → 3) se presente negli eventi SESSION STARTED
- `getBestLapInPhase(driverNumber, phaseNum, requireWindow)`:
  - `requireWindow=false` per la fase corrente (fallback a tutti i lap se rc non caricato)
  - `requireWindow=true` per fasi precedenti (null se window non disponibile)

### Piloti eliminati
- Best lap freezato dell'ultima fase Q in cui hanno partecipato (Q3 → Q2 → Q1)
- Campo `lap_phase: number | null` nel driverMap — traccia la fase del best lap mostrato
- Sort: prima per `lap_phase` decrescente (Q3 > Q2 > Q1), poi per `best_lap_duration`
- Gap sempre relativo al leader della fase corrente (non più `bubbleTime`)

### Expand inline pilota
- Tap su riga pilota → pannello espanso sotto (toggle, un solo pilota alla volta)
- Stato: `expandedDriver: string | null` (acronimo pilota)
- **VS QUALI RECORD**: delta vs `qualiRecord.time` dal circuit-info del circuito corrente
- **VS PB 2025**: delta vs `quali-pb-2025.json[circuitShortName][acronym].lapDuration`
- Verde `#27AE60` se delta negativo (batte il record), bianco altrimenti, "N/D" se dati assenti
- `CIRCUIT_INFO_MAP` in home.tsx: mappa `circuit_short_name` → `require()` del JSON circuit-info
- `qualiPb2025`: importato come JSON statico da `assets/quali-pb-2025.json`

---

## Regole generali

- NON aggiungere header — `headerShown: false` in `app/_layout.tsx`
- NON hardcodare dati piloti — sempre da Ergast API
- Modifiche chirurgiche: cambia solo il necessario per il task
- Chiedere conferma prima di refactoring estesi
- I code block devono contenere solo codice, senza commenti inline finali
- Per testare onboarding: aggiungere temporaneamente `await AsyncStorage.removeItem('onboarding_complete')` in `app/index.tsx`, rimuovere dopo il test

---

## Onboarding
- File: app/onboarding.tsx
- 5 slide in ScrollView orizzontale con paging
- Logo PitWall fisso in alto (non scorre), paddingTop 220
- AsyncStorage key: "onboarding_complete" — se presente salta l'onboarding
- app/index.tsx controlla la key e fa redirect a /onboarding o /(tabs)/home
- DEV: per testare l'onboarding, aggiungere temporaneamente await AsyncStorage.removeItem('onboarding_complete') in index.tsx, rimuoverlo dopo il test

---

## GitHub Raw URLs

```
https://raw.githubusercontent.com/edovaghi-gif/PitWall/main/app/(tabs)/home.tsx
https://raw.githubusercontent.com/edovaghi-gif/PitWall/main/app/(tabs)/prediction.tsx
https://raw.githubusercontent.com/edovaghi-gif/PitWall/main/app/(tabs)/headtohead.tsx
https://raw.githubusercontent.com/edovaghi-gif/PitWall/main/app/(tabs)/circuito.tsx
https://raw.githubusercontent.com/edovaghi-gif/PitWall/main/app/_layout.tsx
```
