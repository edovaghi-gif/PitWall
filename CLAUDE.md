# CLAUDE.md

PitWall: F1 iOS app. Expo/React Native, expo-router, New Arch + React Compiler ON. No tests.

## MODULAR DOCS
- Live Race fetch/classifica/expand/SC: see CLAUDE_RACE.md
- PACE tab (GRAF/LAP/trend/callout/scroll): see CLAUDE_PACE.md
- STINTS tab (expand/stats/fonts): see CLAUDE_STINTS.md
- Qualifying live: see CLAUDE_QUALIFYING.md
- Design system, H2H, Prediction, Circuito, Onboarding: see CLAUDE_OTHER.md

---

## Commands

```bash
npx expo start --ios    # Start on iOS simulator (Xcode iPhone 17 Pro iOS 26.4)
npx expo start          # Start dev server
expo lint               # Lint con ESLint
node scripts/generate-circuit.js  # Rigenera i JSON circuiti da OpenF1
node scripts/find-session-keys.js Miami 2026  # Trova session_key per qualsiasi GP
node scripts/capture-quali.js <session_key>   # Cattura snapshot qualifiche ogni 30s
node scripts/capture-race.js <session_key>    # Cattura snapshot gara ogni 30s
node scripts/capture-fp.js <session_key>    # Cattura snapshot FP ogni 30s
node scripts/fetch-all-quali-2025.js          # Aggiorna scripts/quali-2025-sessions.json
node scripts/fetch-lap-records.js             # Aggiorna scripts/lap-records.json
node scripts/fetch-quali-records.js           # Aggiorna scripts/quali-records.json
node scripts/fetch-pb-2025.js                 # Aggiorna assets/quali-pb-2025.json
```

---

## Stack / Routing

```
app/index.tsx             → redirect to /(tabs)/home
app/_layout.tsx           → root Stack (headerShown: false all screens)
app/(tabs)/_layout.tsx    → bottom tab bar, 4 tabs, Ionicons, active #E10600 inactive #555555
app/(tabs)/home.tsx       → countdown, results, standings, live race/quali
app/(tabs)/circuito.tsx   → GPS SVG maps, sectors, swipe 24 circuits
app/(tabs)/headtohead.tsx → career comparison, tug-of-war bars
app/(tabs)/prediction.tsx → 3-step prediction, scoring, AsyncStorage
app/season-results.tsx    → season history
app/onboarding.tsx        → 5-slide onboarding, first launch only
```

`@/*` → repo root (tsconfig.json)

---

## External APIs
- **Ergast** `https://api.jolpi.ca/ergast/f1/` — results, standings, schedule
- **OpenF1** `https://api.openf1.org/v1/` — telemetry, live data, scoring

Dynamic fetch only. No hardcode via API.

---

## DEV mode flags — CHECK BEFORE EVERY BUILD
- `RACE_DEV_MODE = false` / `RACE_DEV_SESSION_KEY = 11253`
- `QUALI_DEV_MODE = false` / `QUALI_DEV_SESSION_KEY = 11249`
- `FP_DEV_MODE = false`
- `FP_LIVE_DEV_MODE = false` / `FP_LIVE_DEV_SESSION_KEY = 11248`

---

## Known session keys — Giappone 2026 (circuit_short_name "Suzuka")
- Practice 1: 11246 · Practice 2: 11247 · Practice 3: 11248
- Qualifying: 11249 (single 60min session)
- Race: 11253 (53 laps)

---

## OpenF1 key findings
- Use `session_type=Race` (NOT `session_name=Race`)
- Rate-limited — sequential fetch, 500ms delay, never `Promise.all`
- `/laps` max ~1108 entries (no pagination)
- PIT/OUT from `/stints` (`lap_start-1`=pit, `lap_start`=out) — NOT from `lap_duration`
- Stint dedup: per `(driver_number, stint_number)`, keep min `lap_start`
- `gap_to_leader` lapped = string `"+1 LAP"` / `"+2 LAPS"`
- `interval` lapped = string `"LAP"` (not numeric)
- `raceControlRef.current` must populate in `fetchRaceData` (not only `fetchRaceControl`)
- Baku + Yas Marina: no lap data in OpenF1 (archive gaps)
- Laps segments: 0=no data, 2048=yellow, 2049=green, 2051=purple, 2064=pitlane (grey)
- ALB Giappone: 5 real pits (Williams test) — correct data

---

## Driver number mapping 2025
| # | Code | | # | Code | | # | Code |
|---|---|---|---|---|---|---|---|
| 1 | VER | | 4 | NOR | | 5 | BOR |
| 7 | DOO | | 10 | GAS | | 11 | PER |
| 12 | ANT | | 14 | ALO | | 16 | LEC |
| 18 | STR | | 20 | MAG | | 22 | TSU |
| 23 | ALB | | 27 | HUL | | 30 | LAW |
| 31 | OCO | | 43 | COL | | 44 | HAM |
| 55 | SAI | | 63 | RUS | | 81 | PIA |
| 87 | BEA | | | | | | |

---

## Assets
- Logo: `assets/images/PitWall Logo.png` — `height: 32, width: 160, resizeMode: 'contain'`
- All screens: `SafeAreaView` — navbar `paddingTop: 8`, NOT `paddingTop: 52`
- Circuits: `assets/circuits/` (25 JSON), `assets/circuit-info/{key}.json`
- `assets/quali-pb-2025.json` — structure: `{ "Suzuka": { "VER": { bestLap, lapDuration } } }`
- Circuit key = `circuit_short_name` from OpenF1

---

## General rules
- NO headers — `headerShown: false` in `app/_layout.tsx`
- NO hardcoded driver data — always from Ergast API
- Surgical changes only. Ask before big refactor.
- Code blocks: only code, no trailing inline comments

---

## GitHub Raw URLs

```
https://raw.githubusercontent.com/edovaghi-gif/PitWall/main/app/(tabs)/home.tsx
https://raw.githubusercontent.com/edovaghi-gif/PitWall/main/app/(tabs)/prediction.tsx
https://raw.githubusercontent.com/edovaghi-gif/PitWall/main/app/(tabs)/headtohead.tsx
https://raw.githubusercontent.com/edovaghi-gif/PitWall/main/app/(tabs)/circuito.tsx
https://raw.githubusercontent.com/edovaghi-gif/PitWall/main/app/_layout.tsx
```