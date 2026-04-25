# PitWall Design System
Source: `app/(tabs)/home.tsx` — Live Race screen only.

---

## COLOR PALETTE

### Base
| Token | Hex | Usage |
|---|---|---|
| Background | `#000000` | Screen background |
| Surface | `#0D0D0D` | Toggle container bg |
| Surface2 | `#0F0F0F` | Expand panel bg |
| Surface3 | `#1E1E1E` | Bottom sheet card bg |
| Border | `#1A1A1A` | Row dividers, panel top borders |
| BorderDeep | `#0A0A0A` | Events list divider |

### Text
| Hex | Role |
|---|---|
| `#FFFFFF` | Primary text |
| `#999999` | Secondary text (position numbers, age) |
| `#555555` | Muted (DNF, inactive tabs, stops) |
| `#444444` | Inactive toggle label, section label |
| `#888` | Lap header numbers |
| `#666` | AVG label overlay |
| `#333` | Empty lap time, inactive toggle border |
| `#2A2A2A` | Placeholder/disabled |

### Accent
| Hex | Role |
|---|---|
| `#E10600` | Accent — leader pill, active tab underline, alert, soft tyre |
| `#F39C12` | Warning — SC/VSC, medium tyre, SC lap cell, yellow flag bg |
| `#27AE60` | Success — improving trend, within-avg lap, intermediate tyre |
| `#9B59B6` | Purple — best lap overall |
| `#E8A000` | Above-avg lap cell, wet weather indicator |
| `#00C850` | Toggle LED active (INT/GAP, GRAF/LAP) |
| `#3498DB` | Wet tyre |
| `#4FC3F7` | Rainfall active status |

### Banner backgrounds
| Hex | Role |
|---|---|
| `#1A0000` | Red flag banner bg |
| `#1A1500` | SC/VSC banner bg |
| `#F39C12` | Yellow flag banner bg (full fill) |

### Team colors
| Team | Hex |
|---|---|
| Ferrari | `#E8002D` |
| Red Bull | `#3671C6` |
| McLaren | `#FF8000` |
| Mercedes | `#27F4D2` |
| Williams | `#00A3E0` |
| Alpine | `#FF87BC` |
| Aston Martin | `#229971` |
| Haas | `#B6BABD` |
| Racing Bulls | `#6692FF` |
| Sauber/Audi | `#52E252` |

### Tyre compounds
| Compound | Label | bg | text |
|---|---|---|---|
| Soft | S | `#E10600` | `#FFFFFF` |
| Medium | M | `#F39C12` | `#000000` |
| Hard | H | `#FFFFFF` | `#000000` |
| Intermediate | I | `#27AE60` | `#FFFFFF` |
| Wet | W | `#3498DB` | `#FFFFFF` |
| Unknown | ? | `#2A2A2A` | `#555555` |

### Lap cell colors (PACE)
| State | Border/bg | Text |
|---|---|---|
| Best overall | `#9B59B6` | `#9B59B6` |
| Fast (≤ avg) | `#27AE60` | `#27AE60` |
| Slow (> avg) | `#E8A000` | `#E8A000` |
| SC lap | `#F39C12` solid fill | `#000000` |
| PIT / OUT | `#FFFFFF` solid fill | `#E10600` |
| No data | `#2A2A2A` | — |
| Empty slot | `#0A0A0A` | — |

---

## TYPOGRAPHY

Fonts: `JetBrainsMono_700Bold` (MONO), `JetBrainsMono_400Regular` (MONO_REG).

### Scale
| Usage | fontFamily | fontSize | fontWeight | Notes |
|---|---|---|---|---|
| Race lap counter | MONO | 16 | 800 | letterSpacing 1 |
| Gap value in expand | MONO | 16 | 700 | |
| Arrow indicator | MONO | 16 | — | letterSpacing 3 |
| Driver acronym | MONO | 13 | 700 | |
| Weather temp | MONO | 13 | — | |
| Bottom sheet title | MONO | 13 | — | letterSpacing 2 |
| Stints header | MONO | 13 | 700 | letterSpacing 2 |
| Driver behind name | MONO | 11 | 700 | |
| Weather status | MONO | 11 | 700 | |
| Tab label | MONO | 11 | 700 | letterSpacing 1.5 |
| Events message | MONO_REG | 11 | — | lineHeight 15 |
| Events time | MONO_REG | 11 | — | tabular-nums |
| Interval / gap | MONO | 12 | 700 | tabular-nums |
| Position | MONO | 12 | — | |
| Lap time | MONO | 11 | 500 | tabular-nums |
| Tyre label (S/M/H) | MONO | 10 | 800 | |
| Tyre age | MONO | 10 | — | |
| Stint tyre label | MONO | 10 | 700 | |
| Stint detail title | MONO | 10 | — | |
| Stint avg value | MONO | 10 | — | |
| Stint vs race | MONO | 10 | — | |
| Stops count | MONO_REG | 10 | — | |
| Catch estimate | MONO | 9 | — | color `#27AE60` |
| Lap cell (pace) | MONO | 9 | 700 | |
| Event type badge | default | 9 | 700 | |
| PIT badge | default | 9 | 800 | |
| Banner subtext | MONO | 9 | — | letterSpacing 1.5, opacity 0.7 |
| Bottom sheet header | MONO | 9 | — | letterSpacing 2, color `#555555` |
| Trend tooltip title | MONO | 8 | 700 | |
| Trend tooltip delta | MONO | 8 | — | |
| Lap header (pace) | MONO | 8 | — | |
| Scale ticks | MONO_REG | 8 | — | color `#444444` |
| Column headers | MONO | 8 | — | |
| Expand section label | MONO | 7 | — | letterSpacing 2, color `#444444` |
| Stint stop label | MONO_REG | 8 | — | color `#555555` |
| Stint avg label | MONO | 7 | — | color `#555555` |
| Stint deg label | MONO | 7 | — | color `#555555` |
| Toggle options | MONO | 7 | — | |
| SC/VSC pace label | default | 6 | 700 | color `#F39C12`, lineHeight 8 |
| Lap number (bars) | default | 6 | — | color `#444444` |

---

## SPACING

### Padding
| Value | Context |
|---|---|
| `paddingTop: 52` | Main container (safe area) |
| `paddingHorizontal: 24` | Bottom sheet content |
| `paddingHorizontal: 16` | Section content margins, expand panels |
| `paddingHorizontal: 12` | Driver rows, banners |
| `paddingHorizontal: 10` | Toggle container |
| `paddingHorizontal: 8` | Tooltip |
| `paddingHorizontal: 6` | Pill/badge |
| `paddingHorizontal: 5` | Event badge |
| `paddingVertical: 12` | Expand panel, section vertical |
| `paddingVertical: 10` | Tab toggle, stints expand |
| `paddingVertical: 8` | Tooltip |
| `paddingVertical: 7` | Driver row |
| `paddingVertical: 6` | Events row, banner |
| `paddingVertical: 5` | Toggle content |
| `paddingVertical: 4` | Toggle button, header row |
| `paddingVertical: 2` | PIT badge |
| `paddingVertical: 1` | Event badge compact |
| `paddingBottom: 40` | Bottom sheet safe inset |
| `paddingBottom: 20` | ScrollView bottom |

### Margin
| Value | Context |
|---|---|
| `marginHorizontal: 12` | Banners (RF/SC/VSC) |
| `marginHorizontal: 16` | Yellow flag banner |
| `marginVertical: 4` | Banner vertical spacing |
| `marginRight: 6` | Cell gap in pace, left column in stints |
| `marginRight: 1` | Pace cell gap (GRAF) |
| `marginLeft: 12` | Team bar after position |
| `marginLeft: 8` | Tyre badge |
| `marginLeft: 4` | Tyre age, stops, headshot |
| `marginBottom: 8` | Section separator |
| `marginBottom: 6` | Stint row |
| `marginBottom: 4` | Label before value |
| `marginBottom: 2` | Text pair |
| `marginTop: 4` | Trend/SC text in expand |
| `marginTop: 2` | Catch estimate |

### Gap (flex)
| Value | Context |
|---|---|
| `gap: 16` | Stint detail columns |
| `gap: 10` | Toggle options (INT/GAP, GRAF/LAP) |
| `gap: 8` | Banner content |
| `gap: 2` | Sector color squares |

---

## BORDER RADIUS
| Value | Context |
|---|---|
| 16 | Driver headshot circle |
| 10 | Pace trend highlight box |
| 6 | Toggle button, yellow banner, pace cell |
| 4 | Tyre badge, PIT badge, banner border, tooltip |
| 3 | Event badge, pulse dot, toggle circle |
| 2 | Sector color squares |
| 1 | Team color bar |

---

## BORDER STYLES
| Width | Color | Context |
|---|---|---|
| 2 | `#E10600` / `transparent` | Active tab underline |
| 1 | `#E10600` | Red flag banner |
| 1 | `#F39C12` | SC/VSC banner |
| 1 | cell bg color | Lap cell outline (non-SC) |
| 0.75 | trend color | Trend highlight overlay |
| 0.5 | `#1A1A1A` | Row dividers, expand panel top |
| 0.5 | `#2A2A2A` | Header divider below classifica |
| 0.5 | `#0A0A0A` | Events list divider |
| 0.5 | accentColor | Trend tooltip border |
| 0.5 | `#00C850` / `#333` | Toggle LED circle |
| 0 | — | SC lap cell (solid fill, no border) |

---

## COMPONENT PATTERNS

### Tab toggle (CLASSIFICA / PACE / STINTS)
- Container: `flexDirection: row`, `borderBottomWidth: 0.5`, `borderBottomColor: #1A1A1A`
- Button: `flex: 1`, `paddingVertical: 10`, `alignItems: center`, `borderBottomWidth: 2`, `borderBottomColor: active ? #E10600 : transparent`
- Label: MONO, 11, 700, letterSpacing 1.5, color: `#FFFFFF` (active) / `#444` (inactive)

### LED toggle (INT/GAP, GRAF/LAP)
- Container: `flexDirection: row`, `alignItems: center`, `gap: 10`, `backgroundColor: #0D0D0D`, `borderRadius: 6`, `paddingHorizontal: 10`, `paddingVertical: 4`
- Dot: `width: 5`, `height: 5`, `borderRadius: 3`, `borderWidth: 0.5`
  - Active: `backgroundColor: #00C850`, `borderColor: #00C850`
  - Inactive: `backgroundColor: #1A1A1A`, `borderColor: #333`
- Label: MONO, 7, color: `#FFFFFF` (active) / `#444` (inactive)

### Driver row (classifica)
- `flexDirection: row`, `alignItems: center`, `paddingHorizontal: 12`, `paddingVertical: 7`, `borderBottomWidth: 0.5`, `borderBottomColor: #1A1A1A`
- Position: width 18, MONO, 12, color `#999999`
- Team bar: width 2, height 20, borderRadius 1, marginRight 6, marginLeft 12
- Headshot: 32×32, borderRadius 16, marginHorizontal 4, bg `#2A2A2A`
- Acronym: MONO, 13, 700, width 32
- Interval/gap: MONO, 12, 700, width 72, tabular-nums
- Tyre badge: 20×20, borderRadius 4, marginLeft 8
- Tyre age: MONO, 10, width 20, marginLeft 4
- Stops: MONO_REG, 10, width 16, marginLeft 4

### Expand panel (classifica / PACE / STINTS)
- `backgroundColor: #0F0F0F`, `paddingHorizontal: 16`, `paddingVertical: 12`, `borderTopWidth: 0.5`, `borderTopColor: #1A1A1A`
- `MotiView from={{ opacity: 0, translateY: -6 }} animate={{ opacity: 1, translateY: 0 }} exit={{ opacity: 0, translateY: -6 }} transition={{ type: 'timing', duration: 180 }}`
- Section label: MONO, 7, color `#444444`, letterSpacing 2, marginBottom 4
- Large value (gap): MONO, 16, 700
- Trend text: MONO, 8, color from trend
- Arrow: MONO, 16, letterSpacing 3, overflow hidden

### Banners
**Red Flag:** bg `#1A0000`, border 1 `#E10600`, mx 12, my 4, br 4, px 12, py 6
- Pulse dot: 6×6, bg `#E10600`, borderRadius 3, opacity animated
- Text: MONO, 12, 700, color `#E10600`, letterSpacing 2
- Subtext: MONO, 9, color `#E10600`, opacity 0.7, letterSpacing 1.5

**SC/VSC:** bg `#1A1500`, border 1 `#F39C12` — same layout as RF, colors `#F39C12`

**Yellow flag:** bg `#F39C12`, mx 16, mb 8, br 6, py 4, px 12
- Text: default, 11, 700, color `#000000`, letterSpacing 0.5

**All banners:** `MotiView from={{ opacity: 0, translateY: -8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 250 }}`

### Events list row
- `flexDirection: row`, `alignItems: flex-start`, `paddingHorizontal: 12`, `paddingVertical: 6`, `borderBottomWidth: 0.5`, `borderBottomColor: #0A0A0A`
- Latest event opacity 1, older 0.5
- Type badge: br 3, px 5, py 1, minWidth 32; INV/FLAG/PEN = bg `#F39C12` text `#000`; others = bg `#1A1A1A` text `#555`
- Message: MONO_REG, 11, flex 1, lineHeight 15

### Pace tab (GRAF mode)
- Collapsed row: height 36, centerY 17
- Expanded row: height 120, centerY 60
- `MotiView animate={{ height: paceRowH }} transition={{ type: 'timing', duration: 200 }}`
- Bar: width 14, borderRadius 6, marginRight 1
- SC/VSC box: 12×14, orange border `#F39C12`

### Pace tab (LAP mode)
- Cell: height 20, borderRadius 6, marginRight 6, MONO, 9, 700
- slotW = cellWidth + 6
- SC cell: bg `#F39C12`, text `#000000`, borderWidth 0
- Non-SC: borderWidth 1, borderColor = text color, bg `#000000`
- PIT/OUT: bg `#FFFFFF`, text `#E10600`, full label

### Trend overlay
- LAP mode: height 30, top 3, borderRadius 10, borderWidth 0.75
  - `left: seq.startIdx * slotW - 4`, `width: seq.length * slotW + 2`
- GRAF mode: height 22, top 7, borderRadius 11, borderWidth 1
  - `left: seq.startIdx * slotW + 1`, `width: seq.length * slotW - 4`
- Improving: borderColor `#27AE60`, bg `rgba(39,174,96,0.18)`
- Worsening: borderColor `#E10600`, bg `rgba(225,6,0,0.18)`

### Trend tooltip
- bg `#1A1A1A`, br 4, px 8, py 5, borderWidth 0.5, borderColor accentColor, minWidth 140
- Title: MONO, 8, 700, color accentColor
- Delta: MONO, 8, color `#FFFFFF`, marginTop 2
- First driver row: zIndex 20, tooltip at top 36 (below). All others: zIndex 1, tooltip at top −38 (above).

### Stints tab
- Timeline bar: height 24, borderRadius 3, bg `#0A0A0A`, overflow hidden
- Stint block: height 24, bg = tyre.bg, marginRight 1
- Tyre label: MONO, 10, 700
- Tyre age: MONO_REG, 7, opacity 0.6, lineHeight 8
- NOW line: width 1.5, bg `#E10600`, position absolute, zIndex 10

### Bottom sheet (weather modal)
- bg `#141414`, handle `#2A2A2A`
- Content: padding 24 (sides), 40 (bottom)
- Card: bg `#1E1E1E`, br 4, padding 14, marginBottom 16
- Section title: MONO, 13, letterSpacing 2, marginBottom 20
- Section header: MONO, 9, color `#555555`, letterSpacing 2, marginBottom 8

---

## SYMBOLS & LABELS
| Symbol | Meaning |
|---|---|
| `▲` | SC/VSC suspended trend |
| `↓` | Improving trend |
| `↑` | Worsening trend |
| `↺` | Tyre age prefix (e.g. ↺5) |
| `→` | Stable gap arrow |
| `> > >` / `>> >>` / `>>>>>>>` | Closing gap (slow/medium/fast) |
| `● ● ●` | Stable / SC gap |
| `~N giri` | Catch estimate |
| `+N LAP` / `+N LAPS` | Lapped driver gap |
| `DNF` | Retired (color `#555555`) |
| `LEADER` | P1 pill |

---

## ANIMATIONS

### Pulse (banners, dots)
- `Animated.loop(Animated.sequence([timing(0.3, 800ms), timing(1.0, 800ms)]))`
- Range: 1 → 0.3 → 1, total 1600ms

### Arrow — stable
- Opacity pulse: 0.3 → 1.0 → 0.3, 900ms each, total 1800ms

### Arrow — closing/pulling away
- translateX loop: from -range → 0 (closing) or 0 → -range (pulling away)
- Tiers: slow (1200ms, ±8px) / medium (800ms, ±14px) / fast (400ms, ±20px)
- Thresholds: slow 0.1–0.3 s/lap, medium 0.3–0.6, fast >0.6

### Expand panel
- `MotiView from={{ opacity: 0, translateY: -6 }} animate={{ opacity: 1, translateY: 0 }} exit={{ opacity: 0, translateY: -6 }} transition={{ type: 'timing', duration: 180 }}`

### Banner entrance
- `MotiView from={{ opacity: 0, translateY: -8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 250 }}`

### PACE row expand
- `MotiView animate={{ height: paceRowH }} transition={{ type: 'timing', duration: 200 }}`
- 36px (collapsed) ↔ 120px (expanded)

---

## MISC RULES
- `fontVariant: ['tabular-nums']` on all numeric time/gap displays
- Active touch: `activeOpacity: 0.8` on tappable overlays
- Overflow hidden (`overflow: 'hidden'`) on arrow animation container
- First driver row in PACE LAP mode: `zIndex: 20, elevation: 20` for tooltip layering
- `SafeAreaView` on all screens, `paddingTop: 8` on navbar (NOT 52)
- Interval color: DNF/lapped = `#555555`, P1 = `#E10600`, classified = `#FFFFFF`
