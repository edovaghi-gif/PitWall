# STINTS Tab (home.tsx)

## Font / style
- Driver acronym: `MONO`, fontSize 13, fontWeight '700', `#FFFFFF`
- N-STOP label: `MONO_REG`, fontSize 8, `#555555`
- Compound letter (M/H/S/I/W): `MONO`, fontSize 10, fontWeight '700'
- Tyre age `↺N`: `MONO_REG`, fontSize 7
- Header scale labels: `MONO_REG`, fontSize 8, `#444444`
- NOW line lap label `L{raceLap}`: `MONO`, fontSize 8

## Stint dedup
- Pass 1: unique by `lap_start` (sorted ascending)
- Pass 2: merge consecutive same-compound stints within 2 laps

## Expand on tap
- State: `expandedStintDriver: number | null`
- `TouchableOpacity` wraps each driver row — `Haptics.impactAsync(Light)` on tap
- Expand panel: `backgroundColor: '#0F0F0F'`, `borderTopWidth: 0.5`, `borderTopColor: '#1A1A1A'`

## Expand panel — per stint stats
For each stint:
- **MEDIA STINT**: avg lap time of valid stint laps
- **VS MEDIA GARA**: stint avg − race avg (red if positive, green if negative)
- **DEGRADO**: second-half avg − first-half avg (orange if positive, green if negative)
- SC count: laps in stint that are SC/VSC

### Valid stint laps filter
```
l.lap >= stint.lap_start &&
l.lap <= lapEnd &&
l.lap !== stint.lap_start &&          // exclude out-lap
(last stint || l.lap !== lapEnd) &&   // exclude pit-lap (not last stint)
!isScOrVscLap(l.lap) &&
l.time !== null && l.time > 60 && l.time < 200
```

## SC/VSC + driverAverages in STINTS
- Recomputed locally in stints section (not shared from PACE IIFE)
- `isScOrVscLap`: merges SC+VSC windows into single array (both excluded together)
- `stintDriverAvg`: same filter as global driverAverages

## paceData preload
- `fetchPaceData(sessionKey)` called on race mount if `Object.keys(paceData).length === 0`
- Ensures STINTS expand stats populated even if user never visits PACE tab
