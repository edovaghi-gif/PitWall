# Other Screens

## Design System

Dark mode all screens.

| Token | Value |
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

## Head to Head (H2H)

**ABSOLUTE RULE: never rewrite tug-of-war logic. Cosmetic fixes only.**
If fix touches % / proportion calc logic, stop and ask.

- Tug-of-war bars: net gap, no overlap
- Driver picker: FlatList, 20 drivers dynamic from Ergast
- Modal: bottom-sheet
- Driver headshots: `/sessions?year=2026&session_type=Race` → `/drivers?session_key={key}`, matched by `name_acronym`. 80×80px circle. Fallback: colored number.
- Non-JSON guard all OpenF1 fetches (text() + startsWith check)

### Tab CIRCUITO
- 3 tab: CARRIERA / STAGIONI / CIRCUITO
- Default circuit = next GP from Ergast 2026 calendar
- Tug-of-war metrics: races, wins, podiums, poles, fastest laps, DNF, avg pos. gain
- Standalone: best result, avg pos. (all tug-of-war first, standalone last)
- Data from Ergast `/drivers/{driverId}/circuits/{circuitId}/results.json` (paginated)
- circuitId 2026: `madring`=Madrid, `vegas`=Las Vegas, `red_bull_ring`=Austria, `villeneuve`=Canada

## Prediction

### Data source
OpenF1 only. Never Ergast for post-race scoring.

### Endpoints
- Podio: `/position?session_key={key}`
- Race control: `/race_control?session_key={key}`
- DNF: `/laps?session_key={key}&lap_number={totalLaps}` — absent = retired

### Scoring
| Event | Points |
|---|---|
| Exact podium (order 1-2-3) | +50pt |
| Exact position | +20pt |
| Driver in podium, wrong pos | +7pt |
| SC correct | ×1.1 |
| Red Flag correct | ×1.15 |
| DNF range correct | ×1.1 |
| SC wrong | −5pt |
| Red Flag wrong | −8pt |
| DNF range wrong | −5pt |

Target: ~100–110 pts.

### Implementation
- `checkRaceResults()` → sets `raceResultsAvailable = true` if 3+ drivers
- `calculateScore()` → upsert by `round + season` in `pitwall_scores`
- `fetchSessionKey()` → dynamic session_key via circuitMap
- Lock: blocked after quali start — orange banner
- Persistence: `AsyncStorage` key `pitwall_scores`

### Flow (3 steps)
1. Podio (P1/P2/P3) — "LA MIA STAGIONE" banner if history exists
2. Advanced params (SC count, Red Flag, DNF range)
3. Recap + submit

## Circuito Screen (circuito.tsx)

- 25 circuits (24 real + Madrid placeholder with `points: []`)
- `CIRCUIT_INFO_MAP`: circuit key → `require()` JSON
- `CIRCUIT_COUNTRY`: circuit key → country (for AI prompt)
- `CANCELLED_CIRCUITS = new Set(['bahrain', 'jeddah'])` → gray "ANNULLATA" badge
- Madrid guard: `points.length === 0` → placeholder text

### Header
- Row 1: `ROUND X · CITTÀ` (small, #999999)
- Row 2: circuit name fontSize 22, fontWeight 900
- Row 3: km · giri (#999999)

### Stats
- Lap record card: time #E10600 fontSize 32, `driver · year`
- 2×2 grid: GIRI, DISTANZA, CURVE (`circuitInfo.turns`), G-MAX (`Math.max(corners[].g)`)
- Profilo Tecnico: Velocità media, Carico aero, Trazione, Usura gomme
  - Block indicators: 4 rectangles, fill count = rating level

### AI Anecdotes
- `fetchAnecdotes()`: Claude Haiku via `https://a.anthropic.com/v1/messages`
- Cache: `AsyncStorage anecdotes_{circuitKey}`
- Called on mount + `onMomentumScrollEnd`

### fetch-lap-records.js
- Filter `secs < 60` (exclude short variants)
- Manual fixes: Bahrain=De La Rosa 1:31.447 2005, Catalunya=Piastri 1:16.330 2025, Silverstone=Verstappen 1:27.097 2020

## Home pre-weekend (home.tsx)

- Countdown: fontSize 52 fontWeight 300
- Ultima gara: headshot 32×32 + team bar 2×20px, pill LEADER/gap
- Classifica piloti: headshot 28×28, name `#CCC` fontSize 15, points `#FFF` fontSize 13
- Classifica costruttori: team logo 32×20, no headshot
- `fetchHomeHeadshots()`: `/sessions?year=2026&session_type=Race` → last key → `/drivers`

### Team Logos
All 11 in `assets/images/` (NOT in teams/ subfolder):
`mercedes.png`, `mclaren.png`, `ferrari.png`, `redbull.png`, `astonmartin.png`, `alpine.png`, `haas.png`, `audi.png`, `cadillac.png`, `racingbull.png`, `williams.png`

`TEAM_LOGOS` keys: `'Mercedes'`, `'McLaren'`, `'Ferrari'`, `'Red Bull'`, `'Aston Martin'`, `'Alpine F1 Team'`, `'Haas F1 Team'`, `'Audi'`, `'Cadillac'`, `'Racing Bulls'`, `'Williams'`

## Onboarding
- File: `app/onboarding.tsx`
- 5 slides horizontal ScrollView, paging. Logo fixed top, paddingTop 220.
- AsyncStorage key: `"onboarding_complete"` — if present, skip
- DEV test: temporarily add `await AsyncStorage.removeItem('onboarding_complete')` in `app/index.tsx`

## Roadmap

### Next features
- Events feed (race_control already fetched)
- S1/S2/S3 in expand (from /laps)
- Radio toggle (/team_radio recording_url)
- Undercut/overcut simulator
- Post-race telemetry (/car_data + /location)
- GPS live on circuit map

### Dropped (no public data)
- Pit window, tyre health

### Remaining redesign
- Live Race, Circuito, H2H, Prediction
