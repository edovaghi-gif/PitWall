# Live Qualifying (home.tsx)

## DEV mode
- `QUALI_DEV_MODE = false` — **check before every build/release**
- `QUALI_DEV_SESSION_KEY = 11249` (Suzuka 2025 Qualifying)
- DEV: `fakeSession` includes `circuit_short_name: "Suzuka"`
- `FP_DEV_MODE = false` — check before every build/release

## Lap filter per Q phase
- `phaseStart`/`phaseEnd` always from `raceControlRef` (even in DEV mode)
- DEV: `phaseNum` forced from simulated phase if present in SESSION STARTED events
- `getBestLapInPhase(driverNumber, phaseNum, requireWindow)`:
  - `requireWindow=false` for current phase (fallback to all laps if rc not loaded)
  - `requireWindow=true` for previous phases (null if window unavailable)

## Eliminated drivers
- Best lap frozen from last Q phase participated (Q3 → Q2 → Q1)
- `lap_phase: number | null` in driverMap — tracks phase of shown best lap
- Sort: `lap_phase` desc first, then `best_lap_duration`
- Gap always relative to current phase leader

## Expand inline (quali)
- Tap row → expand panel. State: `expandedDriver: string | null` (acronym)
- **VS QUALI RECORD**: delta vs `qualiRecord.time` from circuit-info JSON
- **VS PB 2025**: delta vs `quali-pb-2025.json[circuitShortName][acronym].lapDuration`
- Green `#27AE60` if delta negative, white otherwise, "N/D" if no data
- `CIRCUIT_INFO_MAP`: `circuit_short_name` → `require()` circuit-info JSON
- `qualiPb2025`: static import from `assets/quali-pb-2025.json`

## OpenF1 quali notes
- Quali = single session (no Q1/Q2/Q3 split) — one session_key
- Q1/Q2/Q3 from `/race_control` field `qualifying_phase` (1/2/3)
- `SESSION STARTED`/`SESSION FINISHED` → exact timestamps per phase
- `/intervals` not available for quali

## Expand panel pilota (quali)
- Compound: da `qualiStintsRef` (fetch `/stints` one-shot, ref: `qualiStintsRef`)
  - `driverStints.filter(s => s.driver_number === driver.driver_number).sort desc stint_number[0]?.compound`
  - Dot colorato: SOFT=#E10600, MEDIUM=#F5D400, HARD=#FFFFFF, INTERMEDIATE=#27AE60, WET=#1E90FF
- `getLastTwoLaps(driverNumber, lapPhase, laps, getPhaseWindowFn, bestLapDuration)`:
  - current = lap con `Math.abs(lap_duration - bestLapDuration) < 0.001`
  - prev = più recente timed lap con `lap_number < current.lap_number`
  - `isTimedLap`: tutti e 3 i settori con almeno un segmento ≠ 2048
  - Phase window: `expandPhase = isHistoricalView ? selectedPhaseNum : driver.lap_phase`
  - Call site: `driver.display_lap_duration ?? driver.best_lap_duration` come 5° arg
- Tabella: header S1/S2/S3/TOT, riga PREC (box colorati), riga Δ (delta bianco)
- VS QUALI RECORD e VS PB 2025: invariati, sotto divider
