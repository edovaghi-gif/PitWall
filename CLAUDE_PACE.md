# PACE Tab (home.tsx)

## Toggle GRAF/LAP
- Two-option LED toggle (like INT/GAP in Classifica)
- Left: "GRAF" (`showLapTimes === false`), Right: "LAP" (`showLapTimes === true`)
- Active LED: `#00C850`, inactive: `#1A1A1A`. Both use green when active.

## Scroll architecture
- Single shared horizontal ScrollView for all rows — eliminates flickering
- LAP mode: sticky header (separate ScrollView, `scrollEnabled: false`) synced via `onScroll` → `paceHeaderScrollRef.current?.scrollTo`
- GRAF mode: header inside same ScrollView as bars
- Refs: `paceScrollRef` (content), `paceHeaderScrollRef` (LAP header only)
- No per-row ScrollViews, no scroll sync refs

## LAP mode — cell styling
- `height: 20`, `borderRadius: 6`, `marginRight: 6`, font `JetBrainsMono_700Bold` fontSize 9
- SC lap: `backgroundColor: '#F39C12'`, `borderWidth: 0`, `color: '#000000'`
- Slow (> driver avg): border-only `#E8A000`, text `#E8A000`, bg `#000000`
- Fast (≤ driver avg): border-only `#27AE60`, text `#27AE60`, bg `#000000`
- Best overall: border-only `#9B59B6`, text `#9B59B6`, bg `#000000`
- PIT/OUT: `backgroundColor: '#FFFFFF'`, text `#E10600`
- `slotW = cellWidth + 6` (includes marginRight)
- Driver acronym: `JetBrainsMono_700Bold`, fontSize 13, `#FFFFFF`

## Trend detection — strict monotonic
- `cleanLaps` filter: `l.lap > 1 && !l.isPit && !l.isOut && !isScLapFn && !isVscLapFn && time !== null && time > 60 && time < 200`
- Direction from first two laps: `t1 < t0` = improving, `t1 > t0` = worsening, equal = skip
- Extend while strictly monotonic (equal or reversal breaks)
- Min sequence: 3 laps. Min total delta: `0.1 * (seqLen - 1)`s
- Confirmed trend: advance `i = end + 2` (1-lap cooldown)
- No trend: advance `i = end`
- Tag: `${direction}-${seqCounter}` — prevents adjacent same-direction merge

## Trend overlay — LAP mode
- Tappable `TouchableOpacity`, `zIndex: 2`
- `left: seq.startIdx * slotW - 4`, `width: seq.length * slotW + 2`
- `height: 30`, `top: 3`, `borderRadius: 10`, `borderWidth: 0.75`
- Colors: improving `#27AE60` / worsening `#E10600`, bg rgba 0.18
- Tap: toggle `selectedTrend: { driverNumber, seqIdx } | null`
- Driver row `zIndex`: first driver = 20, others = 1 (so first-driver tooltip overlaps next row)

## Trend tooltip — LAP mode
- Inline absolute View inside driver row `TouchableOpacity`
- `tooltipTop`: first driver = 36 (below), all others = -38 (above)
- `tooltipLeft = Math.max(0, Math.min(seq.startIdx * slotW, allLapNumbers.length * slotW - 148))`
- `zIndex: 50`, `backgroundColor: '#1A1A1A'`, `minWidth: 140`
- Content: label (↓ IMPROVING / ↑ WORSENING · N GIRI), total delta, per-lap delta
- Dismiss: outer `TouchableOpacity` `onPress={() => setSelectedTrend(null)}`

## Trend overlay — GRAF mode (unchanged)
- `height: 22`, `top: 7`, `borderRadius: 11`, `borderWidth: 1`
- `left: seq.startIdx * slotW + 1`, `width: seq.length * slotW - 4`
- `slotW = slotWidth` (20)

## GRAF mode — collapsed rows
- Height: 36px, candlestick bars centered at `centerY = 17`
- `delta = clamp(lap.time - driverAvg, -2.0, 2.0)`
- `halfHeight = clamp(|delta| * 4, 1, 8)`
- `delta >= 0` (slow): bar above center. `delta < 0` (fast): bar below center.
- SC/VSC: label box `'SC'`/`'VS'`, orange border `#F39C12`, 12×14px

## GRAF mode — expanded rows
- Height: 120px, `centerY = 60`, `halfHeight = clamp(|delta| * 22, 2, 44)`
- Average line: `top: 59`, full width, `#333333`
- AVG label: absolute overlay on outer `<View position:'relative'>`, `left: 54`, `bottom: avgOverlayBottom`, `zIndex: 10`, `pointerEvents: 'none'`
- `avgOverlayBottom = (rowData.length - 1 - expandedRowIdx) * 36 + 6`
- SC/VSC in expanded: label box + lap number at `top: 4`
- Lap number above each bar: fontSize 6, `#444444`

## Callout (GRAF expanded)
- Tap bar → `selectedPaceBar: { driverNumber, lapNum } | null`
- Absolute overlay at MotiView level (after allLapNumbers.map)
- `leftPos = lapIdx * (slotWidth + 2) - 4`, clamped: `Math.max(2, Math.min(leftPos, maxLeft))`
- `topPos`: `clampedDelta > 0 ? 72 : 4`
- Shows lap time + real delta (unclamped) vs avg, or special label for PIT/OUT/SC
- `maxLeft = allLapNumbers.length * (slotWidth + 2) - 80`

## Driver averages filter
`l.lap > 1 && !l.isPit && !l.isOut && !isScLapFn(l.lap) && !isVscLapFn(l.lap) && l.time !== null && l.time > 60 && l.time < 200`

## SC/VSC window computation
- Built from `raceControlRef.current` — same logic in PACE and STINTS
- `raceControlRef.current` populated by `fetchRaceData` (not only `fetchRaceControl`)
