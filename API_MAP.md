# API_MAP.md — PitWall
## Mappa completa dei datapoint disponibili da Ergast e OpenF1

> Questo documento risponde alla domanda: "Cosa possiamo sapere?" — non cosa usiamo già,
> ma tutto quello che le API ci mettono a disposizione.
> Campi verificati su dati reali — session_key 11249 (Suzuka 2026 Qualifying) e Ergast /2026/3/
> Ogni datapoint è annotato con: già usato ✅ / non usato ma utile 💡 / non rilevante per PitWall ⬜

---

## OPENF1 — `https://api.openf1.org/v1/`

### Struttura generale
OpenF1 fornisce dati live e storici dal 2023. Tutti gli endpoint supportano filtri via query string. I dati live si aggiornano in tempo reale. La maggior parte degli endpoint richiede `session_key`. Ogni endpoint restituisce un array JSON. `meeting_key` e `session_key` sono sempre presenti in ogni record.

---

### 1. Sessions — `GET /sessions`
✅ **Già usato** — trova sessioni per circuito/anno

**Campi verificati:**
```json
{
  "session_key": 11249,
  "meeting_key": 1281,
  "session_name": "Qualifying",
  "session_type": "Qualifying",
  "date_start": "2026-03-28T06:00:00+00:00",
  "date_end": "2026-03-28T07:00:00+00:00",
  "year": 2026,
  "circuit_key": 39,
  "circuit_short_name": "Suzuka",
  "country_name": "Japan",
  "country_code": "JPN",
  "location": "Suzuka",
  "gmt_offset": "09:00:00"
}
```
💡 **Non usato**: `meeting_key` per raggruppare sessioni dello stesso weekend; `gmt_offset` per orari locali

---

### 2. Meetings — `GET /meetings`
💡 Info sui weekend completi

**Campi attesi:**
```json
{
  "meeting_key": 1281,
  "meeting_name": "Japanese Grand Prix",
  "meeting_official_name": "Formula One Aramco Japanese Grand Prix 2026",
  "date_start": "2026-03-27",
  "year": 2026,
  "circuit_short_name": "Suzuka",
  "country_name": "Japan",
  "country_code": "JPN",
  "location": "Suzuka"
}
```
💡 `meeting_official_name` — nome ufficiale con sponsor

---

### 3. Drivers — `GET /drivers?session_key={key}`
✅ **Già usato** — piloti in sessione

**Campi verificati (da Suzuka 2026 Qualifying):**
```json
{
  "meeting_key": 1281,
  "session_key": 11249,
  "driver_number": 1,
  "broadcast_name": "L NORRIS",
  "full_name": "Lando NORRIS",
  "name_acronym": "NOR",
  "first_name": "Lando",
  "last_name": "Norris",
  "team_name": "McLaren",
  "team_colour": "F47600",
  "headshot_url": "https://media.formula1.com/...",
  "country_code": null
}
```
⚠️ `country_code` spesso null — non affidabile

💡 **Non usato**:
- `headshot_url` — URL foto ufficiale pilota (CDN Formula1) — **usabile in H2H, expand quali, prediction**
- `broadcast_name` — nome in formato TV (es. "L NORRIS")

---

### 4. Laps — `GET /laps?session_key={key}`
✅ **Già usato** — giri di una sessione

**Campi verificati (da Suzuka 2026 Qualifying):**
```json
{
  "meeting_key": 1281,
  "session_key": 11249,
  "driver_number": 30,
  "lap_number": 1,
  "date_start": null,
  "lap_duration": 102.953,
  "is_pit_out_lap": true,
  "duration_sector_1": 33.257,
  "duration_sector_2": 40.697,
  "duration_sector_3": 21.143,
  "i1_speed": 275,
  "i2_speed": 259,
  "st_speed": 258,
  "segments_sector_1": [2064, 2049, 2049, 2049, 2049, 2049, 2049, 2049, 2064],
  "segments_sector_2": [2049, 2049, 2049, 2049, 2049, 2049, 2049, 2049, 2049, 2049, 2049],
  "segments_sector_3": [0, 0, 0, 0, 0, 0]
}
```

**Segmenti sector (mini-settori):**
- `2048` = grigio (nessun dato)
- `2049` = giallo (non migliorato)
- `2051` = verde (personal best)
- `2064` = viola (best assoluto sessione)
- `0` = nessun dato (out-lap o dato mancante)

✅ Già usati: `lap_duration`, `is_pit_out_lap`, `date_start`, `duration_sector_*`, `segments_sector_*`
💡 **Non usato**:
- `st_speed` — velocità punta sul rettilineo principale (km/h) — **il dato più iconico, mostrabile nell'expand pilota**
- `i1_speed`, `i2_speed` — velocità ai due speed trap intermedi (km/h)

---

### 5. Race Control — `GET /race_control?session_key={key}`
✅ **Già usato** — eventi race control

**Campi verificati (da Suzuka 2026 Qualifying):**
```json
{
  "meeting_key": 1281,
  "session_key": 11249,
  "date": "2026-03-28T05:49:45+00:00",
  "driver_number": null,
  "lap_number": null,
  "category": "Other",
  "flag": null,
  "scope": null,
  "sector": null,
  "qualifying_phase": null,
  "message": "RISK OF RAIN FOR F1 QUALIFYING IS 0%"
}
```

**Valori `category`:** "Flag", "SafetyCar", "Drs", "Other", "RedFlag"
**Valori `flag`:** "GREEN", "YELLOW", "RED", "CHEQUERED", "BLUE", "BLACK AND WHITE", "CLEAR", null
**Valori `scope`:** "Track", "Sector", "Driver", null
**Valori `qualifying_phase`:** 1 (Q1), 2 (Q2), 3 (Q3), null

✅ Già usati: `message` (SESSION STARTED/FINISHED), `qualifying_phase`, `category`
💡 **Non usato**:
- `flag` + `sector` — bandiera per settore specifico
- `lap_number` — giro in cui è avvenuto l'evento in gara
- `driver_number` — evento riguarda pilota specifico (penalità, incidente)

---

### 6. Weather — `GET /weather?session_key={key}`
💡 **Non usato** — meteo aggiornato ogni ~1 minuto

**Campi verificati (da Suzuka 2026 Qualifying):**
```json
{
  "date": "2026-03-28T05:48:59.111000+00:00",
  "session_key": 11249,
  "meeting_key": 1281,
  "air_temperature": 16.7,
  "track_temperature": 32.4,
  "humidity": 57.2,
  "pressure": 1008.8,
  "wind_speed": 2.9,
  "wind_direction": 126,
  "rainfall": 0
}
```
⚠️ `rainfall` è integer 0/1, non boolean

💡 Campi utili:
- `rainfall` — pioggia in corso — **rilevante per strategia gomme e avvisi**
- `track_temperature` — temperatura pista — **mostrabile nell'header live**
- `air_temperature` — temperatura aria
- `wind_speed` / `wind_direction` — vento

---

### 7. Stints — `GET /stints?session_key={key}`
💡 **Non usato** — stint gomme

**Campi verificati (da Suzuka 2026 Qualifying):**
```json
{
  "meeting_key": 1281,
  "session_key": 11249,
  "driver_number": 55,
  "stint_number": 1,
  "lap_start": 1,
  "lap_end": 3,
  "compound": "SOFT",
  "tyre_age_at_start": 0
}
```

**Valori `compound`:** "SOFT", "MEDIUM", "HARD", "INTERMEDIATE", "WET"

💡 Utile per Live Race:
- `compound` — tipo gomma attuale per ogni pilota
- `tyre_age_at_start` — età gomme a inizio stint
- `stint_number` — numero sosta = `stint_number - 1`

---

### 8. Intervals — `GET /intervals?session_key={key}`
⚠️ **Solo gara** — non disponibile per qualifiche (confermato: "No results found" su Qualifying)

**Campi attesi (solo sessioni Race):**
```json
{
  "date": "...",
  "session_key": 11253,
  "driver_number": 1,
  "interval": 1.234,
  "gap_to_leader": 5.678
}
```
💡 `gap_to_leader` — distacco dal leader in tempo reale
💡 `interval` — distacco dal pilota davanti ("LAP" se doppiato)

---

### 9. Car Data — `GET /car_data?session_key={key}&driver_number={n}`
💡 **Non usato** — telemetria completa ~3.7Hz
⚠️ `driver_number` obbligatorio — senza di esso: "too much data" error

**Campi verificati:**
```json
{
  "date": "2026-03-28T03:36:54.871000+00:00",
  "session_key": 11249,
  "meeting_key": 1281,
  "driver_number": 1,
  "speed": 0,
  "throttle": 0,
  "brake": 0,
  "drs": null,
  "n_gear": 0,
  "rpm": 0
}
```
⚠️ `drs` può essere `null`
**Valori `drs` quando non null:** 0=chiuso, 8=aperto, 10=abilitato, 12=abilitato+aperto

Dataset pesante — usare solo per giri singoli specifici, non per intera sessione

---

### 10. Location (GPS) — `GET /location?session_key={key}&driver_number={n}`
⚠️ `driver_number` obbligatorio
✅ Già usato negli script di generazione tracciati SVG

**Campi verificati:**
```json
{
  "date": "2026-03-28T03:36:54.806000+00:00",
  "session_key": 11249,
  "meeting_key": 1281,
  "driver_number": 1,
  "x": 3410,
  "y": -2872,
  "z": 830
}
```
💡 Usabile per posizione live piloti sulla mappa durante gara/qualifiche

---

### 11. Team Radio — `GET /team_radio?session_key={key}`
💡 **Non usato** — messaggi radio team
⚠️ Non garantito per tutte le sessioni (Suzuka 2026 Qualifying: nessun dato)

**Campi attesi quando disponibile:**
```json
{
  "date": "...",
  "session_key": ...,
  "meeting_key": ...,
  "driver_number": 1,
  "recording_url": "https://livetiming.formula1.com/static/.../audio.mp3"
}
```
💡 `recording_url` — URL MP3 diretto — **feature iconica se disponibile**

---

### 12. Position — `GET /position?session_key={key}`
✅ **Già usato** (scoring post-gara)

**Campi attesi:**
```json
{
  "date": "...",
  "session_key": ...,
  "driver_number": 1,
  "position": 1
}
```
Per posizione finale: prendere l'ultimo record per ogni `driver_number`.

---

---

## ERGAST — `https://api.jolpi.ca/ergast/f1/`

### Struttura generale
Dati F1 dal 1950 ad oggi. Struttura: `MRData > [Table] > [Array]`. Paginazione con `?limit=N&offset=N`. Stagione corrente: `/current/`, storiche: `/{year}/`, round specifico: `/{year}/{round}/`. Aggiornato dopo ogni evento — non live.

---

### 1. Calendario — `GET /current.json` o `/{year}.json`
✅ **Già usato**

**Campi verificati:**
```json
{
  "season": "2026",
  "round": "3",
  "raceName": "Japanese Grand Prix",
  "date": "2026-03-29",
  "time": "05:00:00Z",
  "Circuit": {
    "circuitId": "suzuka",
    "circuitName": "Suzuka Circuit",
    "Location": { "lat": "34.8431", "long": "136.541", "locality": "Suzuka", "country": "Japan" }
  },
  "FirstPractice": { "date": "2026-03-27", "time": "03:30:00Z" },
  "SecondPractice": { "date": "2026-03-27", "time": "07:00:00Z" },
  "ThirdPractice": { "date": "2026-03-28", "time": "03:30:00Z" },
  "Qualifying": { "date": "2026-03-28", "time": "07:00:00Z" }
}
```
💡 **Non usato**: date/orari esatti di FP1/FP2/FP3/Qualifying per countdown sessioni specifiche

---

### 2. Risultati gara — `GET /current/last/results.json`
✅ **Già usato**

**Campi verificati (da Suzuka 2026):**
```json
{
  "number": "12",
  "position": "1",
  "positionText": "1",
  "points": "25",
  "grid": "1",
  "laps": "53",
  "status": "Finished",
  "Driver": {
    "driverId": "antonelli",
    "permanentNumber": "12",
    "code": "ANT",
    "givenName": "Andrea Kimi",
    "familyName": "Antonelli",
    "dateOfBirth": "2006-08-25",
    "nationality": "Italian"
  },
  "Constructor": { "constructorId": "mercedes", "name": "Mercedes", "nationality": "German" },
  "Time": { "millis": "5283403", "time": "1:28:03.403" },
  "FastestLap": {
    "rank": "1",
    "lap": "49",
    "Time": { "time": "1:32.432" },
    "AverageSpeed": { "units": "kph", "speed": "226.933" }
  }
}
```
✅ Già usato: `position`, `Driver.*`, `Constructor.*`, `Time.time`, `status`
💡 **Non usato**:
- `grid` — posizione di partenza (confronto griglia vs arrivo)
- `status` — causa ritiro: "Engine", "Collision", "Accident", "Finished", "+1 Lap", ecc.
- `FastestLap.Time.time` — giro veloce in gara
- `FastestLap.AverageSpeed.speed` — velocità media giro veloce
- `FastestLap.lap` — a che giro è stato fatto
- `Driver.dateOfBirth`, `Driver.nationality` — per H2H anagrafiche

---

### 3. Qualifiche — `GET /current/last/qualifying.json` o `/{year}/{round}/qualifying.json`
💡 **Non usato** — risultati qualifiche ufficiali post-sessione

**Campi verificati (da Suzuka 2026):**
```json
{
  "number": "12",
  "position": "1",
  "Driver": { "driverId": "antonelli", "code": "ANT", "givenName": "Andrea Kimi", "familyName": "Antonelli" },
  "Constructor": { "constructorId": "mercedes", "name": "Mercedes" },
  "Q1": "1:30.035",
  "Q2": "1:29.048",
  "Q3": "1:28.778"
}
```
⚠️ Piloti eliminati in Q1 hanno solo `Q1`; eliminati in Q2 hanno `Q1` e `Q2`; top 10 hanno tutti e tre

💡 **Molto utile**: mostrare tempi Q1/Q2/Q3 ufficiali post-sessione per tutti i piloti

---

### 4. Classifiche — `GET /current/driverStandings.json` e `/constructorStandings.json`
✅ **Già usati**

💡 **Non usato**: `wins` — numero vittorie per pilota in classifica

---

### 5. Storico qualifiche circuito — `GET /circuits/{circuitId}/qualifying.json`
✅ **Già usato** (via script) → `qualiRecord`

---

### 6. Storico giri veloci — `GET /circuits/{circuitId}/fastest/1/results.json`
✅ **Già usato** (via script) → `lapRecord`

---

### 7. Vincitori circuito — `GET /circuits/{circuitId}/results/1.json`
✅ **Già usato** → stat del giorno

---

### 8. Carriera pilota — `GET /drivers/{driverId}/results.json`
✅ **Già usato** (H2H)

---

### 9. Storico qualifiche pilota — `GET /drivers/{driverId}/qualifying.json`
💡 **Non usato** — storico qualifiche per ogni stagione: utile per H2H

---

### 10. Classifiche finali stagionali pilota — `GET /drivers/{driverId}/driverStandings.json`
💡 **Non usato** — posizione finale classifica per ogni stagione: utile per H2H evoluzione stagioni

---

### 11. Pit stop — `GET /{year}/{round}/pitstops.json`
💡 **Non usato** — soste ai box

**Campi attesi:**
```json
{
  "driverId": "antonelli",
  "lap": "20",
  "stop": "1",
  "time": "14:32:15",
  "duration": "2.345"
}
```

---

### 12. Piloti stagione — `GET /current/drivers.json`
💡 **Non usato** — lista completa piloti con anagrafiche

---

---

## RIEPILOGO DATAPOINT NON USATI PIÙ INTERESSANTI

| Datapoint | Fonte | Endpoint | Utilizzo potenziale | Priorità |
|---|---|---|---|---|
| `headshot_url` | OpenF1 | `/drivers` | Foto pilota in H2H, expand quali, prediction | 🔴 Alta |
| `st_speed` | OpenF1 | `/laps` | Velocità punta rettilineo nell'expand pilota | 🔴 Alta |
| `stints.compound` + `tyre_age_at_start` | OpenF1 | `/stints` | Gomma attuale e soste in Live Race | 🔴 Alta |
| `intervals.gap_to_leader` | OpenF1 | `/intervals` | Distacchi live in gara (solo Race) | 🔴 Alta |
| `weather.rainfall` + `track_temperature` | OpenF1 | `/weather` | Meteo live durante sessione | 🟡 Media |
| `race_control.flag` + `sector` | OpenF1 | `/race_control` | Bandiere live per settore | 🟡 Media |
| `results.status` | Ergast | `/results` | Causa ritiro per ogni pilota | 🟡 Media |
| `results.FastestLap` | Ergast | `/results` | Giro veloce gara con tempo e velocità | 🟡 Media |
| `qualifying.Q1/Q2/Q3` | Ergast | `/qualifying` | Tempi ufficiali post-qualifica | 🟡 Media |
| `calendar.Qualifying.time` | Ergast | `/current.json` | Countdown preciso a ogni sessione | 🟡 Media |
| `results.grid` | Ergast | `/results` | Confronto griglia partenza vs arrivo | 🟢 Bassa |
| `team_radio.recording_url` | OpenF1 | `/team_radio` | Audio messaggi radio (non sempre disponibile) | 🟢 Bassa |
| `pitstops.duration/lap` | Ergast | `/pitstops` | Statistiche pit stop storici | 🟢 Bassa |
| `i1_speed` / `i2_speed` | OpenF1 | `/laps` | Speed trap intermedi | 🟢 Bassa |
| `car_data.throttle/brake/drs` | OpenF1 | `/car_data` | Telemetria per lap singoli specifici | 🟢 Bassa |

---

## NOTE IMPORTANTI

### Limiti OpenF1
- Dati disponibili dal 2023 in poi
- Rate limiting: usare delay 500-1000ms tra fetch multiple sequenziali
- `/car_data` e `/location` richiedono `driver_number` obbligatorio
- `/intervals` solo gara — non disponibile per qualifiche (confermato)
- `/team_radio` non garantito per tutte le sessioni
- Alcune sessioni hanno dati incompleti (Baku e Yas Marina 2025 per `/laps`)
- `country_code` in `/drivers` spesso null
- `rainfall` in `/weather` è integer 0/1, non boolean
- `drs` in `/car_data` può essere null

### Limiti Ergast
- Aggiornato dopo ogni evento — non live
- Paginazione necessaria (default limit=30)
- `jolpi.ca` mirror non ufficiale ma più veloce di ergast.com
- Per `/circuits/{id}/qualifying.json`: total = risultati individuali (piloti × gare), non numero gare
- Piloti eliminati in Q1 hanno solo campo `Q1`, eliminati in Q2 hanno `Q1` e `Q2`

### Sincronizzazione tra le due API
- Ergast: `raceName` + `circuitId` (es. "suzuka")
- OpenF1: `circuit_short_name` + `session_key`
- Il `circuitMap` in home.tsx fa da ponte — attenzione ai nomi divergenti:
  - Monaco → "Monte Carlo", Barcelona → "Catalunya", Budapest → "Hungaroring"
  - Spa → "Spa-Francorchamps", Abu Dhabi → "Yas Marina Circuit"
- Per dati live: OpenF1. Per statistiche storiche: Ergast.
