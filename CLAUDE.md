# CLAUDE.md

Guide Claude Code repo.

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

No tests.

---

## Architecture

PitWall: F1 iOS app. Expo/React Native, expo-router file-routing. New Arch + React Compiler ON.

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

`@/*` → repo root (tsconfig.json).

---

## External APIs

- **Ergast** via `https://api.jolpi.ca/ergast/f1/` — results, standings, drivers, schedule
- **OpenF1** via `https://api.openf1.org/v1/` — circuit GPS, live telemetry, post-race scoring

Prefer dynamic fetch. Never hardcode via API.

---

## App Assets
- Logo: `assets/images/PitWall Logo.png` — transparent PNG, all screens (`height: 32, width: 160, resizeMode: 'contain'`)
- Foto muretto: `assets/images/PitWall Photo.png` — onboarding background (opacity 0.25)
- All screens: `SafeAreaView` — navbar `paddingTop: 8`, NOT `paddingTop: 52`

---

## Circuit Assets

- `assets/circuits/` — 25 JSON (24 calendar + madrid.json con points:[])
- `assets/circuit-info/{key}.json` — circuit metadata, DNA, lap records
  - Fields: `name`, `corners[]`, `turns` (int), `trazione` (string), `dna{}`, `lapRecord{}`, `qualiRecord{}`
  - `lapRecord`: `{ time, driver, year }` — from `fetch-lap-records.js`
  - `turns`: official corner count, added manually to all 24 JSON
  - Manual fix: edit `scripts/lap-records.json`, rerun script then node -e "..." apply loop
- `assets/quali-pb-2025.json` — 2025 quali PBs per circuit/driver
  - Structure: `{ "Suzuka": { "VER": { "bestLap": "1:26.983", "lapDuration": 86.983 }, ... }, ... }`
  - Circuit key = `circuit_short_name` OpenF1 (e.g. "Suzuka", "Monte Carlo", "Yas Marina Circuit")
  - Rerun `fetch-pb-2025.js` after each GP
  - Baku + Yas Marina: no lap data in OpenF1 (archive gaps)
- Circuit struct: `name`, `session_key`, `viewBox ("0 0 300 300")`, `points: [{x,y,z}]`
- `pointIndex` 0-99 proportional on track
- Y axis corrected (inverted vs raw GPS)
- Rerun `generate-circuit.js` after coord transform logic changes
- Colored sectors: never remove during cosmetic fixes

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

### Known session keys — Giappone 2026 (circuit_short_name "Suzuka")
- Practice 1: 11246
- Practice 2: 11247
- Practice 3: 11248
- Qualifying: 11249 (single session 60min, Q1/Q2/Q3 not split)
- Race: 11253 (53 laps)

### OpenF1 — key findings
- Sessions fetch: use `session_type=Race` (NOT `session_name=Race`) — confirmed working
- Quali = single session (no Q1/Q2/Q3 split) — one session_key
- `date_start` populated on normal laps, null on out-laps
- Laps: `segments_sector_1/2/3` = mini-sector color arrays, pre-calc by OpenF1:
  - 2048 = grey (no time), 2049 = yellow, 2051 = green, 2064 = purple
- `is_pit_out_lap: true` = pit exit
- Q1/Q2/Q3 from `/race_control` field `qualifying_phase` (1/2/3)
- `SESSION STARTED`/`SESSION FINISHED` in race_control → exact timestamps per Q phase
- OpenF1 rate-limited — sequential fetch (not `Promise.all`) for multiple sessions
- `/intervals` not available for quali, only race
- `/session_status` useless
- `/intervals` `interval` field for lapped drivers = string `"LAP"` (not a number) — no numeric gap to car ahead
- `/intervals` `gap_to_leader` for lapped = string `"+1 LAP"` / `"+2 LAPS"` — use for detection and display
- SC: `race_control` `category === "SafetyCar"` + message contains `"DEPLOYED"` but NOT `"VIRTUAL"`
- VSC: `category === "SafetyCar"` + message contains `"VIRTUAL SAFETY CAR DEPLOYED"` or `"VSC DEPLOYED"`
- Yellow flag: `race_control` `flag === "YELLOW"` + `sector` field (int, may be null = track-wide)

---

## Design System

Dark mode all screens.

| Token | Valore |
|---|---|
| Background | `#000000` |
| Surface | `#0D0D0D` |
| Surface2 | `#1E1E1E` |
| Border | `#0A0A0A` (0.5px) |
| Accent | `#E10600` |
| Success | `#00C850` |
| TextPrimary | `#FFFFFF` |
| TextSecondary | `#999999` |
| TextMuted | `#555555` |

- Tab bar: Ionicons (`home`, `map`, `bar-chart`, `trophy`) — active `#E10600`, inactive `#555555`
- Accent `#E10600` only primary interactive + active states
- Border always 0.5px
- Pill LEADER: bg `rgba(0,200,80,0.15)`, text `#00C850`
- Pill gap: bg `#161616`, text `#555555`
- Styles: React Native `StyleSheet` scoped per component
- `SafeAreaView` for content padding

---

## Head to Head (H2H)

**ABSOLUTE RULE: never rewrite tug-of-war logic. Cosmetic fixes only.**
If fix touches % / proportion calc logic, stop and ask.

- Tug-of-war bars: net gap, no overlap
- Driver picker: FlatList, 20 drivers dynamic from Ergast
- Modal: bottom-sheet
- Driver numbers: dynamic from Ergast
- Driver headshots: OpenF1 `/sessions?year=2026&session_type=Race` → `/drivers?session_key={key}`, matched by `name_acronym`. 80×80px circle above name. Fallback: colored number. Non-JSON guard all OpenF1 fetches (text() + startsWith check).

### Tab CIRCUITO
- 3 tab: CARRIERA / STAGIONI / CIRCUITO
- Default circuit = next GP from Ergast 2026 calendar
- Selector 24 circuits, name format `"Paese — Circuito"` (e.g. "Giappone — Suzuka Circuit")
- Tug-of-war metrics: races, wins, podiums, poles, fastest laps, DNF, avg pos. gain
- Standalone: best result, avg pos.
- Order: all tug-of-war bars first, standalone last
- Data from Ergast `/drivers/{driverId}/circuits/{circuitId}/results.json` (paginated)
- circuitId 2026 confirmed: `madring`=Madrid, `vegas`=Las Vegas, `red_bull_ring`=Austria, `villeneuve`=Canada

---

## Scoring Prediction

### Fonte dati
OpenF1 only. Never use Ergast for post-race scoring.

### Endpoint OpenF1
- Podio reale: `/position?session_key={key}`
- Race control: `/race_control?session_key={key}`
- DNF: `/laps?session_key={key}&lap_number={totalLaps}` — absent drivers = retired

### Detection eventi
- Safety Car: `category === "SafetyCar"` + `message` contains `"DEPLOYED"`
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

Target good session: ~100–110 pts.

### Implementazione post-gara
- `checkRaceResults()` — fetches `/position?session_key={key}`, sets `raceResultsAvailable = true` if 3+ drivers returned
- `calculateScore()` — score from saved prediction vs OpenF1 real data (`/position`, `/race_control`, `/laps`)
  - Saves to `pitwall_scores`: `myPodiumNames`, `savedSafetyCar`, `savedRedFlag`, `savedDnfRange`
  - Upsert by `round + season` — overwrite if exists, insert if not
- `fetchSessionKey()` — dynamic session_key from OpenF1 via circuitMap
- Modal "SCOPRI IL RISULTATO" — visible if `raceResultsAvailable === true`, shows score breakdown

### Flusso prediction (3 step)
1. Podio selection (P1, P2, P3) — banner "LA MIA STAGIONE" at top if `scoreHistory.length > 0`, navigates to `/season-results`
2. Advanced params (# Safety Car, Red Flag y/n, DNF range)
3. Recap + submit

- Lock: blocked after quali start — orange banner with exact date/time
- Persistence: `AsyncStorage` key `pitwall_scores` — record array, survives app restart

---

## Live Race (home.tsx)

### DEV mode
- `RACE_DEV_MODE = false` — **check before every build/release**
- `RACE_DEV_SESSION_KEY = 11253` (Suzuka 2026 Race)

### Architettura fetch
- `fetchRaceData()`: poll every 15s — parallel fetch via `safeFetch`: `/position`, `/intervals`, `/race_control`, `/drivers` (only if cache empty)
- `fetchRaceStints()`: poll every 30s — `/stints`
- `fetchRaceWeather()`: poll every 120s — `/weather`
- `safeFetch(url)`: null (never throws) on non-JSON, rate limit, network error. Retry once 1500ms, null silently.
- On mount: one-shot fetch `/laps?lap_number={totalLaps}` → save finishers to `dnfRef`

### DNF detection
- `dnfRef`: Set<number> populated on mount from last-lap driver_numbers
- `isDnf = dnfRef.size > 0 && !dnfRef.has(num) && !isLapped`
- Lapped drivers (`isLapped = true`) NOT DNF — detected from `gap_to_leader` STRING ("+1 LAP", "+2 LAPS")
- OpenF1 `interval` field for lapped drivers = string "LAP" — no numeric gap to car ahead
- `gapToLeaderStr`: stored on driver object. Both modes show "+1 LAP"/"+2 LAPS" for lapped.
- DNF shown at bottom, interval = "DNF" color #555555

### Classifica live
- Data from `/position` (last pos per driver) + `/intervals` (gap to car ahead + gap to leader)
- Lapped: `gap_to_leader` is string "+1 LAP"/"+2 LAPS" from OpenF1 → `isLapped = true`
- Sort: classified by position → lapped (by lap count) → DNF last
- Tyre compound/age from `/stints` (`raceStintsRef`)
- Tyre age: `tyre_age_at_start + (totalLaps - lap_start)` (estimate)
- Header cols: INTERVAL | CPD | AGE | PIT

### Gap toggle
- `showGapToLeader: boolean` — toggle via header tap
- INTERVAL mode: `driver.interval` (gap to car ahead, from `intEntry.interval`)
- GAP mode: `driver.gapToLeaderStr` (formatted string, from `intEntry.gap_to_leader`)
- Lapped drivers: show `gapToLeaderStr` in BOTH modes ("+1 LAP"/"+2 LAPS"), color #555555
- P1: "LEADER" red. DNF: "DNF" gray. Classified: white.

### SC / VSC / Flag detection (fetchRaceData)
- Iterates `rcData` chronologically — state accumulates per event
- SC: `category === "SafetyCar"` + message contains `"DEPLOYED"` but NOT `"VIRTUAL"` → `scActive = true`, `vscActive = false`
- VSC: `category === "SafetyCar"` + message contains `"VIRTUAL SAFETY CAR DEPLOYED"` or `"VSC DEPLOYED"` → `vscActive = true`, `scActive = false`
- Both clear on `"WITHDRAWN"` or `"ENDING"`
- RF: `category === "RedFlag"` → `rfActive = true`, clears on `"RESTARTED"`/`"RESUMED"`
- Yellow: `flag === "YELLOW"` + `sector` field → `raceYellowSectors` (number[], sector numbers). `-1` sentinel = yellow with no sector info. Clears per-sector on GREEN/CLEAR/CHEQUERED; clears all if no sector specified.
- State: `raceSafetyCarActive`, `raceVscActive`, `raceRedFlagActive`, `raceYellowSectors`

### Banner priority (top to bottom)
RF (red) → SC (orange) → VSC (orange dashed border) → Yellow (thinner paddingVertical 4)
Yellow label: `"⚠️ GIALLA S1 · S3"` or `"⚠️ BANDIERA GIALLA"` if no sector info.

### Expand inline pilota (race)
- Tap driver row → expand panel below (toggle, one at a time)
- State: `expandedRaceDriver: number | null` (driver_number)
- Shows DIETRO only (DAVANTI removed): driver acronym, gap, trend text, animated arrow, catch estimate
- DNF drivers: no expand panel
- `gapHistoryRef`: rolling 5-sample gap_to_leader history per driver (paused during SC/VSC)
- `getTrend()`: text/color. SC/VSC guard: "🚗 SC/VSC in pista" if either active.
- Thresholds: closing `delta < -0.1`, stable `|delta| <= 0.1`, pulling away `delta > 0.1`

### Arrow animations (expand panel)
- `arrowAnimsRef`: Animated.Value map per driver (not single set)
- `getArrowConfig(driverBehindNum)`: returns `{type, tier, text, color}` from gapHistoryRef
- Closing (green #27AE60): translateX -range→0 loop. Slow `"> > >"` 1200ms, medium `">> >>"` 800ms, fast `">>>>>>>"` 400ms. Ranges: slow=8, medium=14, fast=20.
- Stable/SC (orange #F39C12): `"● ● ●"` opacity pulse 0.3↔1.0, 900ms per half.
- Pulling away (red #E10600): translateX 0→-range loop. Same tiers/durations.
- Thresholds: closing `delta < -0.1`, stable `|delta| <= 0.1`, pulling away `delta > 0.1`
- Intensity: slow 0.1–0.3s/lap, medium 0.3–0.6, fast >0.6
- `getCatchEstimate(attackerNum, currentGap)`: `Math.ceil(gap / closingRate)`, null if not closing or SC/VSC active. Shown as `"~N giri"` if ≤30.
- Overflow hidden (width 60) clips sliding arrows.

### Driver headshots (race + quali rows)
- 32×32px circle between team color bar and driver acronym
- From OpenF1 `/drivers?session_key={key}`, stored in `raceDriversCacheRef`
- `safeFetch` guards all OpenF1 calls

### Meteo
- `raceWeather.track_temperature` + `raceWeather.rainfall` in header
- `raceTotalLaps` from `TOTAL_LAPS[circuit_short_name]`

### Modal CONDIZIONI PISTA
- Tap meteo area in header → bottom-sheet modal
- Shows: track + air temp, humidity, rainfall, rain risk (regex from race_control messages), wind (speed + degrees + cardinal)
- `extractRainRisk(rcData)`: scans race_control for "RISK OF RAIN XX%" → state `raceRainRisk`
- Present in race + qualifying
- `fetchRaceWeather()` also called in qualifying useEffect (120s interval)

---

## Live Qualifying (home.tsx)

### DEV mode
- `QUALI_DEV_MODE = false` — **check before every build/release**
- `QUALI_DEV_SESSION_KEY = 11249` (Suzuka 2025 Qualifying)
- In DEV mode, `fakeSession` includes `circuit_short_name: "Suzuka"` for circuit mapping
- `FP_DEV_MODE = false` — check before every build/release

### Filtro lap per fase Q
- `phaseStart`/`phaseEnd` always from `raceControlRef` (even in DEV mode)
- In DEV mode, `phaseNum` forced from simulated phase (e.g. "Q3" → 3) if present in SESSION STARTED events
- `getBestLapInPhase(driverNumber, phaseNum, requireWindow)`:
  - `requireWindow=false` for current phase (fallback to all laps if rc not loaded)
  - `requireWindow=true` for previous phases (null if window unavailable)

### Piloti eliminati
- Best lap frozen from last Q phase participated (Q3 → Q2 → Q1)
- `lap_phase: number | null` in driverMap — tracks phase of shown best lap
- Sort: first by `lap_phase` desc (Q3 > Q2 > Q1), then by `best_lap_duration`
- Gap always relative to current phase leader (not `bubbleTime`)

### Expand inline pilota (quali)
- Tap driver row → expand panel below (toggle, one driver at a time)
- State: `expandedDriver: string | null` (driver acronym)
- **VS QUALI RECORD**: delta vs `qualiRecord.time` from circuit-info of current circuit
- **VS PB 2025**: delta vs `quali-pb-2025.json[circuitShortName][acronym].lapDuration`
- Green `#27AE60` if delta negative (beats record), white otherwise, "N/D" if no data
- `CIRCUIT_INFO_MAP` in home.tsx: maps `circuit_short_name` → `require()` circuit-info JSON
- `qualiPb2025`: imported as static JSON from `assets/quali-pb-2025.json`

---

## Circuito Screen (circuito.tsx)

- 25 circuits (24 real + Madrid placeholder)
- `CIRCUIT_INFO_MAP`: maps circuit key → `require()` circuit-info JSON (same pattern as home.tsx)
- `CIRCUIT_COUNTRY`: maps circuit key → country (for AI prompt)

### Header restyling
- Row 1: `ROUND X · CITTÀ` (small, #999999)
- Row 2: circuit name fontSize 22, fontWeight 900
- Row 3: km · giri (#999999)

### Lap record card
- `circuitInfo?.lapRecord` → card with time #E10600 fontSize 32, subtitle `driver · year`
- Shown after sector legend, before map

### Stats grid 2×2
- GIRI, DISTANZA (from `meta.sub` split '·'), CURVE (from `circuitInfo.turns`), G-MAX (Math.max on `corners[].g`)
- Shown after map/dots, before corner detail/DNA

### Profilo Tecnico
- Replaces Sector Complexity. Shown if `circuitInfo?.corners?.length > 0` (hidden for Madrid)
- 4 rows: Velocità media, Carico aerodinamico, Trazione, Usura gomme
- Velocità media: `(distanza_km / lapRecord_secs) * 3600`. Labels: ≥240=Altissima, ≥220=Alta, ≥200=Media, else=Bassa
- Carico aerodinamico: avg G from `corners[].g`. Labels: ≥4.5=Altissimo, ≥3.8=Alto, ≥3.0=Medio, else=Basso
- Trazione: from `circuitInfo.trazione` field (hardcoded in JSON). `getTractionRating(trazione)` → label+color
- Usura gomme: from `meta.dna.usura`
- Removed from DNA card, only in Profilo Tecnico
- Block indicators: `getBlocks(rating, color)` — 4 rectangular blocks, filled count: Altissima/Molto Alta=4, Alta=3, Media=2, Bassa=1
- Field `trazione` added to all 25 circuit-info JSONs

### AI Anecdotes
- `fetchAnecdotes(circuitKey, circuitName, lapRecord, country)`: calls Claude Haiku via `https://a.anthropic.com/v1/messages`
- Cache AsyncStorage key `anecdotes_{circuitKey}` — load cache if present, else fetch
- Silent fallback on error → `setAnecdotes([])`
- Called on mount (circuit 0) and in `onMomentumScrollEnd` (reset + fetch new circuit)
- Shown after DNA card

### Madrid placeholder
- `assets/circuits/madrid.json`: `points: []`
- Guard in pager: if `points.length === 0` → placeholder View with text "Tracciato non disponibile\nPrima edizione 2026"

### fetch-lap-records.js
- Filter `secs < 60` added to exclude outer/short circuit variants
- Manual fixes in `scripts/lap-records.json`: Bahrain=De La Rosa 1:31.447 2005, catalunya=Piastri 1:16.330 2025, Silverstone=Verstappen 1:27.097 2020

### Calendar integration
- `fetchCalendar()` fetches Ergast `/2026.json` → `raceCalendar` state (Record<ergastId, {round, date}>)
- Header shows `R{n}` badge (red) + formatted date per circuit
- `CANCELLED_CIRCUITS = new Set(['bahrain', 'jeddah'])` → gray "ANNULLATA" badge, dimmed name
- CIRCUITS array ordered by 2026 calendar
- `CIRCUIT_TO_ERGAST_ID` maps circuit key → Ergast circuitId

---

## Home pre-weekend (home.tsx)

- Background `#000000`, separatori `0.5px #0A0A0A`
- Countdown: no card bg, fontSize 52 fontWeight 300, sep `#1A1A1A`
- Stat del weekend: no bg, solo left border `#E10600`
- Ultima gara: no card bg, headshot 32×32 + barra team 2×20px, pill LEADER/gap
- Classifica piloti: headshot 28×28, nome `#CCC` fontSize 15, punti `#FFF` fontSize 13 + "pt" `#444`
- Classifica costruttori: no headshot, no dot, solo pos/nome/punti
- `fetchHomeHeadshots()`: fetch `/sessions?year=2026&session_type=Race` → last session_key → `/drivers` → map acronym→headshot_url

---

## Prossimi passi

- Team logos in assets/images/teams/ — da implementare in costruttori e H2H
- Redesign: Live Race, Circuito, H2H, Prediction
- Statistiche circuito aggiuntive: DRS zones, record costruttori, anno prima gara

---

## Regole generali

- NO headers — `headerShown: false` in `app/_layout.tsx`
- NO hardcoded driver data — always from Ergast API
- Surgical changes only
- Ask before extensive refactor
- Code blocks: only code, no trailing inline comments
- Test onboarding: temporarily add `await AsyncStorage.removeItem('onboarding_complete')` in `app/index.tsx`, remove after

---

## Onboarding
- File: app/onboarding.tsx
- 5 slides horizontal ScrollView, paging
- PitWall logo fixed at top (no scroll), paddingTop 220
- AsyncStorage key: "onboarding_complete" — if present, skip
- `app/index.tsx` checks key, redirects to `/onboarding` or `/(tabs)/home`
- DEV: test → temporarily add `await AsyncStorage.removeItem('onboarding_complete')` in index.tsx, remove after

---

## GitHub Raw URLs

```
https://raw.githubusercontent.com/edovaghi-gif/PitWall/main/app/(tabs)/home.tsx
https://raw.githubusercontent.com/edovaghi-gif/PitWall/main/app/(tabs)/prediction.tsx
https://raw.githubusercontent.com/edovaghi-gif/PitWall/main/app/(tabs)/headtohead.tsx
https://raw.githubusercontent.com/edovaghi-gif/PitWall/main/app/(tabs)/circuito.tsx
https://raw.githubusercontent.com/edovaghi-gif/PitWall/main/app/_layout.tsx
```