# Live Race (home.tsx)

## DEV mode
- `RACE_DEV_MODE = false` — **check before every build/release**
- `RACE_DEV_SESSION_KEY = 11253` (Suzuka 2026 Race)

## Fetch architecture
- `fetchRaceData()`: poll 15s — parallel via `safeFetch`: `/position`, `/intervals`, `/race_control`, `/drivers` (cache-empty only)
- `fetchRaceStints()`: poll 30s — `/stints`
- `fetchRaceWeather()`: poll 120s — `/weather`
- `fetchPaceData(sessionKey)`: called on mount if `paceData` empty — ensures STINTS expand stats available without visiting PACE tab
- `safeFetch(url)`: returns null on non-JSON/rate-limit/error. Retry once 1500ms.
- On mount: one-shot `/laps?lap_number={totalLaps}` → populate `dnfRef`

## DNF detection
- `dnfRef`: Set<number> from last-lap driver_numbers
- `isDnf = dnfRef.size > 0 && !dnfRef.has(num) && !isLapped`
- Lapped (`isLapped = true`) NOT DNF — detected from `gap_to_leader` STRING ("+1 LAP", "+2 LAPS")
- OpenF1 `interval` field for lapped = string "LAP"
- DNF shown at bottom, interval = "DNF" color #555555

## Classifica live
- `/position` (last pos) + `/intervals` (gap to car ahead + leader)
- Sort: classified by pos → lapped (by lap count) → DNF last
- Tyre compound/age from `/stints` (`raceStintsRef`)
- Tyre age estimate: `tyre_age_at_start + (totalLaps - lap_start)`
- Header cols: INTERVAL | CPD | AGE | PIT

## Gap toggle
- `showGapToLeader: boolean` — toggle via header tap
- INTERVAL: `driver.interval` (gap to car ahead)
- GAP: `driver.gapToLeaderStr`
- Lapped: show `gapToLeaderStr` in BOTH modes, color #555555
- P1: "LEADER" red. DNF: "DNF" gray.

## SC / VSC / Flag detection
- Iterates `rcData` chronologically
- SC: `category === "SafetyCar"` + `"DEPLOYED"` not `"VIRTUAL"` → scActive=true, vscActive=false
- VSC: `"VIRTUAL SAFETY CAR DEPLOYED"` or `"VSC DEPLOYED"` → vscActive=true, scActive=false
- Both clear on `"WITHDRAWN"` or `"ENDING"`
- RF: `category === "RedFlag"` → rfActive=true, clears on `"RESTARTED"`/`"RESUMED"`
- Yellow: `flag === "YELLOW"` + `sector` → `raceYellowSectors`. `-1` sentinel = track-wide.
- State: `raceSafetyCarActive`, `raceVscActive`, `raceRedFlagActive`, `raceYellowSectors`

## Banner priority
RF (red) → SC (orange) → VSC (orange dashed) → Yellow (paddingVertical 4)
Yellow label: `"⚠️ GIALLA S1 · S3"` or `"⚠️ BANDIERA GIALLA"` if no sector.

## Expand inline (race)
- Tap row → expand panel (toggle, one at a time). State: `expandedRaceDriver: number | null`
- Shows DIETRO only: acronym, gap, trend text, animated arrow, catch estimate
- DNF: no expand
- `gapHistoryRef`: rolling 5-sample gap_to_leader per driver (paused during SC/VSC)
- `getTrend()`: SC/VSC guard → "🚗 SC/VSC in pista". Thresholds: closing `delta < -0.1`, stable `|delta| <= 0.1`, pulling away `delta > 0.1`

## Arrow animations
- `arrowAnimsRef`: Animated.Value map per driver
- Closing (green #27AE60): translateX -range→0 loop. Slow `"> > >"` 1200ms, medium `">> >>"` 800ms, fast `">>>>>>>"` 400ms. Ranges: 8/14/20.
- Stable/SC (orange #F39C12): `"● ● ●"` opacity pulse 0.3↔1.0, 900ms per half.
- Pulling away (red #E10600): translateX 0→-range. Same tiers.
- Intensity: slow 0.1–0.3s/lap, medium 0.3–0.6, fast >0.6
- `getCatchEstimate`: `Math.ceil(gap / closingRate)`, shown as `"~N giri"` if ≤30
- Overflow hidden (width 60) clips arrows.

## Driver headshots
- 32×32px circle between team color bar and acronym
- From `/drivers?session_key={key}`, stored in `raceDriversCacheRef`

## Meteo
- `raceWeather.track_temperature` + `raceWeather.rainfall` in header
- `raceTotalLaps` from `TOTAL_LAPS[circuit_short_name]`
- Tap meteo → bottom-sheet modal: track/air temp, humidity, rainfall, rain risk, wind
- `extractRainRisk(rcData)`: scans race_control for "RISK OF RAIN XX%"
- Present in race + qualifying
