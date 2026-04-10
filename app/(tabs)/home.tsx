import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const logo = require('../../assets/images/PitWall Logo.png');
const qualiPb2025 = require('../../assets/quali-pb-2025.json');

const CIRCUIT_INFO_MAP: Record<string, any> = {
  "Sakhir": require('../../assets/circuit-info/bahrain.json'),
  "Jeddah": require('../../assets/circuit-info/jeddah.json'),
  "Melbourne": require('../../assets/circuit-info/melbourne.json'),
  "Suzuka": require('../../assets/circuit-info/suzuka.json'),
  "Shanghai": require('../../assets/circuit-info/shanghai.json'),
  "Miami": require('../../assets/circuit-info/miami.json'),
  "Imola": require('../../assets/circuit-info/imola.json'),
  "Monte Carlo": require('../../assets/circuit-info/monaco.json'),
  "Catalunya": require('../../assets/circuit-info/barcelona.json'),
  "Montreal": require('../../assets/circuit-info/montreal.json'),
  "Spielberg": require('../../assets/circuit-info/spielberg.json'),
  "Silverstone": require('../../assets/circuit-info/silverstone.json'),
  "Hungaroring": require('../../assets/circuit-info/budapest.json'),
  "Spa-Francorchamps": require('../../assets/circuit-info/spa.json'),
  "Zandvoort": require('../../assets/circuit-info/zandvoort.json'),
  "Monza": require('../../assets/circuit-info/monza.json'),
  "Baku": require('../../assets/circuit-info/baku.json'),
  "Singapore": require('../../assets/circuit-info/singapore.json'),
  "Austin": require('../../assets/circuit-info/austin.json'),
  "Mexico City": require('../../assets/circuit-info/mexico.json'),
  "Interlagos": require('../../assets/circuit-info/saopaulo.json'),
  "Las Vegas": require('../../assets/circuit-info/lasvegas.json'),
  "Lusail": require('../../assets/circuit-info/lusail.json'),
  "Yas Marina Circuit": require('../../assets/circuit-info/abudhabi.json'),
};

function timeToSecs(t: string): number {
  const parts = t.split(':');
  return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
}

function formatDelta(delta: number): { text: string; color: string } {
  const sign = delta < 0 ? '-' : '+';
  return {
    text: `${sign}${Math.abs(delta).toFixed(3)}s`,
    color: delta < 0 ? "#27AE60" : "#FFFFFF",
  };
}

export default function HomeScreen() {
  const [lastRace, setLastRace] = useState<any>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [statOfDay, setStatOfDay] = useState<string>("");
  const [nextRace, setNextRace] = useState<any>(null);
  const [constructorStandings, setConstructorStandings] = useState<any[]>([]);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [qualifyingDrivers, setQualifyingDrivers] = useState<any[]>([]);
  const [qualiPhase, setQualiPhase] = useState<"Q1" | "Q2" | "Q3" | null>(null);
  const [nextSessionCountdown, setNextSessionCountdown] = useState<string | null>(null);
  const QUALI_DEV_MODE = false;
  const [activeQualiPhase, setActiveQualiPhase] = useState<string | null>(QUALI_DEV_MODE ? "Q3" : null);
  const QUALI_DEV_SESSION_KEY = 11249;
  const QUALI_DEV_MAX_LAP = 999;
  const FP_DEV_MODE = false;
  const FP_DEV_CIRCUIT = "Suzuka";
  const FP_DEV_YEAR = 2026;

  const [fpSessions, setFpSessions] = useState<{key: number, name: string, finished: boolean}[]>([]);
  const [fpResults, setFpResults] = useState<Record<number, any[]>>({});
  const [showFpModal, setShowFpModal] = useState(false);
  const [activeFpTab, setActiveFpTab] = useState<number>(0);

  const [qualiCountdown, setQualiCountdown] = useState<string | null>(null);
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
  const [flashingDrivers, setFlashingDrivers] = useState<Set<number>>(new Set());
  const driverLapRef = useRef<Record<number, number>>({});
  const flashTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const raceControlRef = useRef<any[]>([]);
  const devQualiPhase = useRef<string | null>(QUALI_DEV_MODE ? "Q3" : null);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!nextRace) return;
    const raceDate = new Date(`${nextRace.date}T${nextRace.time || "14:00:00"}`);
    const timer = setInterval(() => {
      const now = new Date();
      const diff = raceDate.getTime() - now.getTime();
      if (diff <= 0) { clearInterval(timer); return; }
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [nextRace]);

  async function fetchData() {
    try {
      const [raceRes, standingsRes, scheduleRes, constructorsRes] = await Promise.all([
        fetch("https://api.jolpi.ca/ergast/f1/current/last/results.json"),
        fetch("https://api.jolpi.ca/ergast/f1/current/driverStandings.json"),
        fetch("https://api.jolpi.ca/ergast/f1/current.json"),
        fetch("https://api.jolpi.ca/ergast/f1/current/constructorStandings.json"),
      ]);
      const raceData = await raceRes.json();
      const standingsData = await standingsRes.json();
      const scheduleData = await scheduleRes.json();
      const constructorsData = await constructorsRes.json();

      const lastRaceData = raceData.MRData.RaceTable.Races[0];
      setLastRace(lastRaceData);
      setStandings(standingsData.MRData.StandingsTable.StandingsLists[0].DriverStandings.slice(0, 5));
      setConstructorStandings(constructorsData.MRData.StandingsTable.StandingsLists[0].ConstructorStandings.slice(0, 5));

      const allRaces = scheduleData.MRData.RaceTable.Races;
      const now = new Date();
      const upcoming = allRaces.find((r: any) => new Date(r.date) > now);
      setNextRace(upcoming);

      if (upcoming) {
        await fetchStatOfDay(upcoming.Circuit.circuitId, upcoming.raceName);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStatOfDay(circuitId: string, raceName: string) {
    try {
      const res = await fetch(`https://api.jolpi.ca/ergast/f1/circuits/${circuitId}/results/1.json?limit=100`);
      const data = await res.json();
      const races = data.MRData.RaceTable.Races;
      if (!races || races.length === 0) return;

      const winners: Record<string, number> = {};
      races.forEach((r: any) => {
        const driver = r.Results[0]?.Driver?.familyName;
        if (driver) winners[driver] = (winners[driver] || 0) + 1;
      });

      const topWinner = Object.entries(winners).sort((a, b) => b[1] - a[1])[0];
      const totalRaces = races.length;
      const lastWinner = races[races.length - 1]?.Results[0]?.Driver?.familyName;
      const lastYear = races[races.length - 1]?.season;

      setStatOfDay(
        `${topWinner[0]} è il pilota più vincente nella storia di questa gara con ${topWinner[1]} vittorie su ${totalRaces} edizioni. L'ultima volta ha vinto ${lastWinner} (${lastYear}).`
      );
    } catch (e) {
      console.error(e);
    }
  }

  const fetchFpData = async () => {
    if (!nextRace) return;
    const circuitMap: Record<string, string> = {
      "Miami Grand Prix": "Miami",
      "Japanese Grand Prix": "Suzuka",
      "Bahrain Grand Prix": "Bahrain",
      "Saudi Arabian Grand Prix": "Jeddah",
      "Australian Grand Prix": "Melbourne",
      "Chinese Grand Prix": "Shanghai",
      "Spanish Grand Prix": "Barcelona",
      "Monaco Grand Prix": "Monaco",
      "Canadian Grand Prix": "Montreal",
      "Austrian Grand Prix": "Spielberg",
      "British Grand Prix": "Silverstone",
      "Hungarian Grand Prix": "Budapest",
      "Belgian Grand Prix": "Spa",
      "Dutch Grand Prix": "Zandvoort",
      "Italian Grand Prix": "Monza",
      "Azerbaijan Grand Prix": "Baku",
      "Singapore Grand Prix": "Singapore",
      "United States Grand Prix": "Austin",
      "Mexico City Grand Prix": "Mexico City",
      "São Paulo Grand Prix": "Interlagos",
      "Las Vegas Grand Prix": "Las Vegas",
      "Qatar Grand Prix": "Lusail",
      "Abu Dhabi Grand Prix": "Abu Dhabi",
    };
    const circuitShortName = FP_DEV_MODE ? FP_DEV_CIRCUIT : circuitMap[nextRace.raceName];
    const year = FP_DEV_MODE ? FP_DEV_YEAR : new Date(nextRace.date).getFullYear();
    if (!circuitShortName) return;

    const sessionsRes = await fetch(`https://api.openf1.org/v1/sessions?year=${year}&circuit_short_name=${encodeURIComponent(circuitShortName)}`);
    const sessionsData = await sessionsRes.json();
    if (!Array.isArray(sessionsData)) return;
    const fpSessionList = sessionsData
      .filter((s: any) => s.session_name?.startsWith('Practice'))
      .sort((a: any, b: any) => new Date(a.date_start).getTime() - new Date(b.date_start).getTime())
      .map((s: any) => ({ key: s.session_key, name: s.session_name, finished: false }));

    if (fpSessionList.length === 0) return;

    const results: Record<number, any[]> = {};
    const updatedSessions = [];
    for (const session of fpSessionList) {
      const rcRes = await fetch(`https://api.openf1.org/v1/race_control?session_key=${session.key}`);
      const rcData = await rcRes.json();
      const finished = Array.isArray(rcData) && rcData.some((e: any) => e.message === 'SESSION FINISHED');

      if (finished) {
        const [lapsRes, driversRes] = await Promise.all([
          fetch(`https://api.openf1.org/v1/laps?session_key=${session.key}`),
          fetch(`https://api.openf1.org/v1/drivers?session_key=${session.key}`)
        ]);
        const lapsData = await lapsRes.json();
        const driversData = await driversRes.json();

        if (!Array.isArray(driversData) || driversData.length === 0) {
          updatedSessions.push({ ...session, finished });
          continue;
        }

        if (Array.isArray(lapsData) && Array.isArray(driversData)) {
          const driverInfo: Record<number, any> = {};
          for (const d of driversData) {
            driverInfo[d.driver_number] = d;
          }

          const bestLaps: Record<number, number> = {};
          for (const lap of lapsData) {
            if (lap.is_pit_out_lap || !lap.lap_duration) continue;
            if (!bestLaps[lap.driver_number] || lap.lap_duration < bestLaps[lap.driver_number]) {
              bestLaps[lap.driver_number] = lap.lap_duration;
            }
          }

          const sorted = Object.entries(bestLaps)
            .map(([driverNum, time]) => ({
              driver_number: parseInt(driverNum),
              best_lap: time,
              info: driverInfo[parseInt(driverNum)] || {}
            }))
            .sort((a, b) => a.best_lap - b.best_lap);

          results[session.key] = sorted;
        }
      }
      updatedSessions.push({ ...session, finished });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setFpSessions(updatedSessions);
    setFpResults(results);
  };

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  function getSectorColor(segments: number[] | null): string {
    if (!segments || segments.length === 0) return "#2A2A2A";
    if (segments.includes(2064)) return "#9B59B6";
    if (segments.includes(2051)) return "#27AE60";
    if (segments.includes(2049)) return "#F39C12";
    return "#2A2A2A";
  }

  const formatLapTime = (seconds: number | null): string => {
    if (!seconds) return "--:--.---";
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(3).padStart(6, "0");
    return `${mins}:${secs}`;
  };

  async function getCurrentSessionInfo(raceName: string, year: number) {
    const circuitMap: Record<string, string> = {
      "Miami Grand Prix": "Miami",
      "Japanese Grand Prix": "Suzuka",
      "Bahrain Grand Prix": "Bahrain",
      "Saudi Arabian Grand Prix": "Jeddah",
      "Australian Grand Prix": "Melbourne",
      "Chinese Grand Prix": "Shanghai",
      "Spanish Grand Prix": "Barcelona",
      "Monaco Grand Prix": "Monaco",
      "Canadian Grand Prix": "Montreal",
      "Austrian Grand Prix": "Spielberg",
      "British Grand Prix": "Silverstone",
      "Hungarian Grand Prix": "Budapest",
      "Belgian Grand Prix": "Spa",
      "Dutch Grand Prix": "Zandvoort",
      "Italian Grand Prix": "Monza",
      "Azerbaijan Grand Prix": "Baku",
      "Singapore Grand Prix": "Singapore",
      "United States Grand Prix": "Austin",
      "Mexico City Grand Prix": "Mexico City",
      "São Paulo Grand Prix": "Interlagos",
      "Las Vegas Grand Prix": "Las Vegas",
      "Qatar Grand Prix": "Lusail",
      "Abu Dhabi Grand Prix": "Abu Dhabi",
    };
    const circuitShortName = circuitMap[raceName];
    if (!circuitShortName) return null;
    const res = await fetch(`https://api.openf1.org/v1/sessions?year=${year}&circuit_short_name=${encodeURIComponent(circuitShortName)}`);
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    return data;
  }

  async function checkActiveSession() {
    if (QUALI_DEV_MODE) {
      const fakeSession = {
        session_key: QUALI_DEV_SESSION_KEY,
        session_name: "Qualifying",
        circuit_short_name: "Suzuka",
        date_start: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        date_end: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
      setActiveSession(fakeSession);
      setQualiPhase("Q3");
      return;
    }
    if (!nextRace) return;
    const year = new Date(nextRace.date).getFullYear();
    const sessions = await getCurrentSessionInfo(nextRace.raceName, year);
    if (!sessions) return;
    const now = new Date();
    const active = sessions.find((s: any) => {
      const start = new Date(s.date_start);
      const end = new Date(s.date_end);
      return now >= start && now <= end;
    });
    if (active && (active.session_name === "Qualifying" || active.session_name === "Sprint Qualifying")) {
      setActiveSession(active);
    } else {
      const nextQual = sessions.find((s: any) => {
        const start = new Date(s.date_start);
        const diff = start.getTime() - now.getTime();
        return (s.session_name === "Qualifying" || s.session_name === "Sprint Qualifying") && diff > 0 && diff <= 60 * 60 * 1000;
      });
      if (nextQual) {
        const mins = Math.floor((new Date(nextQual.date_start).getTime() - now.getTime()) / 60000);
        setNextSessionCountdown(`Qualifiche tra ${mins}m`);
      } else {
        setActiveSession(null);
        setNextSessionCountdown(null);
      }
    }
  }

  async function fetchRaceControl(sessionKey: number) {
    const res = await fetch(`https://api.openf1.org/v1/race_control?session_key=${sessionKey}`);
    const data = await res.json();
    if (!Array.isArray(data)) return;
    raceControlRef.current = data;

    const startedPhases = data
      .filter((e: any) => e.qualifying_phase != null && e.message?.includes("SESSION STARTED"))
      .map((e: any) => Number(e.qualifying_phase));
    const finishedPhases = data
      .filter((e: any) => e.qualifying_phase != null && e.message?.includes("SESSION FINISHED"))
      .map((e: any) => Number(e.qualifying_phase));

    let currentPhaseNum: number | null = null;
    for (const phase of [...startedPhases].reverse()) {
      if (!finishedPhases.includes(phase)) {
        currentPhaseNum = phase;
        break;
      }
    }

    setQualiPhase(currentPhaseNum ? (`Q${currentPhaseNum}` as "Q1" | "Q2" | "Q3") : null);

    if (!currentPhaseNum) {
      const allPhases = [1, 2, 3];
      const nextPhase = allPhases.find(p => !startedPhases.includes(p));
      setQualiCountdown(nextPhase ? `Q${nextPhase} in arrivo` : null);
    } else {
      setQualiCountdown(null);
    }
  }

  async function fetchQualifyingData() {
    if (!activeSession) return;
    const sessionKey = activeSession.session_key;

    const driversRes = await fetch(`https://api.openf1.org/v1/drivers?session_key=${sessionKey}`);
    const driversData = await driversRes.json();
    if (!Array.isArray(driversData)) return;
    const lapsRes = await fetch(`https://api.openf1.org/v1/laps?session_key=${sessionKey}`);
    const lapsData = await lapsRes.json();
    if (!Array.isArray(lapsData)) return;

    const effectivePhase = devQualiPhase.current ?? qualiPhase;
    setActiveQualiPhase(effectivePhase);

    // Helper: get start/end timestamps for a given phase number from raceControlRef
    function getPhaseWindow(phaseNum: number): { start: Date | null; end: Date | null } {
      const rcData = raceControlRef.current;
      const startEvent = rcData.find((e: any) => Number(e.qualifying_phase) === phaseNum && e.message?.includes("SESSION STARTED"));
      const endEvent = rcData.find((e: any) => Number(e.qualifying_phase) === phaseNum && e.message?.includes("SESSION FINISHED"));
      return {
        start: startEvent?.date ? new Date(startEvent.date) : null,
        end: endEvent?.date ? new Date(endEvent.date) : null,
      };
    }

    // Helper: best lap for a driver in a specific phase.
    // requireWindow=true: returns null if no phase window available (safe fallback for past phases).
    // requireWindow=false: includes all laps if no window (current phase behaviour when rc not loaded yet).
    function getBestLapInPhase(driverNumber: number, phaseNum: number, requireWindow: boolean): any | null {
      const { start, end } = getPhaseWindow(phaseNum);
      if (requireWindow && !start) return null;
      let best: any = null;
      for (const lap of lapsData) {
        if (lap.driver_number !== driverNumber) continue;
        if (lap.is_pit_out_lap) continue;
        if (!lap.lap_duration) continue;
        if (QUALI_DEV_MODE && lap.lap_number > QUALI_DEV_MAX_LAP) continue;
        if (start && lap.date_start) {
          const lapDate = new Date(lap.date_start);
          if (lapDate < start) continue;
          if (end && lapDate > end) continue;
        }
        if (!best || lap.lap_duration < best.lap_duration) best = lap;
      }
      return best;
    }

    // Determine current phase number from raceControlRef
    let currentPhaseNum: number | null = null;
    {
      const rcData = raceControlRef.current;
      const startedPhases = rcData
        .filter((e: any) => e.qualifying_phase != null && e.message?.includes("SESSION STARTED"))
        .map((e: any) => Number(e.qualifying_phase));
      const finishedPhases = rcData
        .filter((e: any) => e.qualifying_phase != null && e.message?.includes("SESSION FINISHED"))
        .map((e: any) => Number(e.qualifying_phase));
      if (QUALI_DEV_MODE) {
        const devPhaseNum = effectivePhase === "Q3" ? 3 : effectivePhase === "Q2" ? 2 : 1;
        currentPhaseNum = startedPhases.includes(devPhaseNum) ? devPhaseNum : null;
      } else {
        for (const phase of [...startedPhases].reverse()) {
          if (!finishedPhases.includes(phase)) { currentPhaseNum = phase; break; }
        }
      }
    }

    const driverMap: Record<number, any> = {};
    for (const driver of driversData) {
      driverMap[driver.driver_number] = {
        driver_number: driver.driver_number,
        full_name: driver.full_name,
        name_acronym: driver.name_acronym,
        team_colour: driver.team_colour,
        best_lap_duration: null,
        lap_phase: null as number | null,
        sector1: null,
        sector2: null,
        sector3: null,
        sector1_color: "#2A2A2A",
        sector2_color: "#2A2A2A",
        sector3_color: "#2A2A2A",
      };
    }

    // Best lap per driver: current phase first, then fall back to previous phases for eliminated drivers
    const bestLaps: Record<number, any> = {};
    for (const d of Object.values(driverMap) as any[]) {
      const num = d.driver_number;
      let best: any = null;
      let bestPhase: number | null = null;
      if (currentPhaseNum !== null) {
        best = getBestLapInPhase(num, currentPhaseNum, false);
        if (best) {
          bestPhase = currentPhaseNum;
        } else {
          for (let p = currentPhaseNum - 1; p >= 1 && !best; p--) {
            best = getBestLapInPhase(num, p, true);
            if (best) bestPhase = p;
          }
        }
      }
      if (best) {
        bestLaps[num] = best;
        d.best_lap_duration = best.lap_duration;
        d.lap_phase = bestPhase;
      }
    }

    // Assign sector colors from segment arrays + flash detection
    const newFlashing = new Set(flashingDrivers);
    for (const d of Object.values(driverMap) as any[]) {
      const bestLap = bestLaps[d.driver_number];
      if (!bestLap) continue;

      const prevLapNum = driverLapRef.current[d.driver_number];
      const lapChanged = prevLapNum !== undefined && bestLap.lap_number !== prevLapNum;
      driverLapRef.current[d.driver_number] = bestLap.lap_number;

      d.sector1 = bestLap.duration_sector_1 ?? null;
      d.sector2 = bestLap.duration_sector_2 ?? null;
      d.sector3 = bestLap.duration_sector_3 ?? null;
      d.sector1_color = getSectorColor(bestLap.segments_sector_1 ?? null);
      d.sector2_color = getSectorColor(bestLap.segments_sector_2 ?? null);
      d.sector3_color = getSectorColor(bestLap.segments_sector_3 ?? null);

      if (lapChanged && d.best_lap_duration !== null) {
        newFlashing.add(d.driver_number);
        if (flashTimers.current[d.driver_number]) clearTimeout(flashTimers.current[d.driver_number]);
        flashTimers.current[d.driver_number] = setTimeout(() => {
          setFlashingDrivers(prev => { const next = new Set(prev); next.delete(d.driver_number); return next; });
        }, 2500);
      }
    }
    setFlashingDrivers(newFlashing);

    const sorted = Object.values(driverMap).sort((a: any, b: any) => {
      if (!a.best_lap_duration && !b.best_lap_duration) return 0;
      if (!a.best_lap_duration) return 1;
      if (!b.best_lap_duration) return -1;
      // Drivers from a higher phase always rank above drivers from a lower phase
      if ((b.lap_phase ?? 0) !== (a.lap_phase ?? 0)) return (b.lap_phase ?? 0) - (a.lap_phase ?? 0);
      return a.best_lap_duration - b.best_lap_duration;
    });

    setQualifyingDrivers(sorted);
  }

  useEffect(() => {
    if (!nextRace) return;
    fetchFpData();
    checkActiveSession();
    const interval = setInterval(checkActiveSession, 60000);
    return () => clearInterval(interval);
  }, [nextRace]);

  useEffect(() => {
    if (!activeSession) return;
    if (activeSession.session_name !== "Qualifying" && activeSession.session_name !== "Sprint Qualifying") return;
    const sessionKey = activeSession.session_key;
    fetchRaceControl(sessionKey);
    fetchQualifyingData();
    const rcInterval = setInterval(() => fetchRaceControl(sessionKey), 30000);
    const dataInterval = setInterval(fetchQualifyingData, 10000);
    return () => { clearInterval(rcInterval); clearInterval(dataInterval); };
  }, [activeSession]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E10600" />
      </View>
    );
  }

  const isQualifying = activeSession &&
    (activeSession.session_name === "Qualifying" || activeSession.session_name === "Sprint Qualifying");

  if (isQualifying) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", paddingTop: 52 }}>
        <View style={styles.navbar}>
          <Image source={logo} style={{ height: 32, width: 160, resizeMode: 'contain' }} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12 }}>
          <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#E10600", marginRight: 8, opacity: pulseAnim }} />
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 1 }}>
            {activeQualiPhase ? `${activeQualiPhase} IN CORSO` : "QUALIFICHE IN CORSO"}
          </Text>
        </View>
        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 12, gap: 8 }}>
          {["Q1", "Q2", "Q3"].map(q => (
            <View key={q} style={{
              paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6,
              backgroundColor: activeQualiPhase === q ? "#E10600" : "#1E1E1E",
            }}>
              <Text style={{ color: activeQualiPhase === q ? "#FFFFFF" : "#555555", fontSize: 12, fontWeight: "700" }}>{q}</Text>
            </View>
          ))}
        </View>
        <ScrollView>
          {(() => {
            const leaderTime = qualifyingDrivers[0]?.best_lap_duration;
            const circuitShortName = activeSession?.circuit_short_name ?? "";
            const circuitInfo = CIRCUIT_INFO_MAP[circuitShortName] ?? null;
            const lapRecord = circuitInfo?.lapRecord ?? null;
            const pbData: Record<string, any> = (qualiPb2025 as any)[circuitShortName] ?? {};
            return qualifyingDrivers.map((driver, index) => {
              const isEliminated =
                (activeQualiPhase === "Q1" && index >= 16) ||
                (activeQualiPhase === "Q2" && index >= 10) ||
                (activeQualiPhase === "Q3" && index >= 10);
              const teamColor = isEliminated ? "#444444" : (`#${driver.team_colour}` || "#FFFFFF");
              const gap = driver.best_lap_duration && leaderTime
                ? driver.best_lap_duration - leaderTime
                : null;
              const gapStr = gap !== null
                ? (index === 0 ? "LEADER" : `+${gap.toFixed(3)}`)
                : "--";
              const acronym = driver.name_acronym;
              const isExpanded = expandedDriver === acronym;

              const qualiRecord = circuitInfo?.qualiRecord ?? null;
              const vsRecord = (() => {
                if (!driver.best_lap_duration || !qualiRecord?.time) return null;
                return formatDelta(driver.best_lap_duration - timeToSecs(qualiRecord.time));
              })();

              const vsPb = (() => {
                if (!driver.best_lap_duration) return null;
                const pb = pbData[acronym];
                if (!pb?.lapDuration) return null;
                return formatDelta(driver.best_lap_duration - pb.lapDuration);
              })();

              return (
                <View key={driver.driver_number}>
                  <TouchableOpacity
                    onPress={() => setExpandedDriver(isExpanded ? null : acronym)}
                    style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: isExpanded ? 0 : 0.5, borderBottomColor: "#1A1A1A" }}
                  >
                    <Text style={{ color: isEliminated ? "#555555" : "#999999", fontSize: 11, width: 16 }}>{index + 1}</Text>
                    <View style={{ width: 2, height: 16, backgroundColor: teamColor, borderRadius: 2, marginRight: 6 }} />
                    <Text style={{ color: isEliminated ? "#555555" : "#FFFFFF", fontSize: 12, fontWeight: "600", width: 30 }}>{acronym}</Text>
                    <View style={{ flexDirection: "row", gap: 2, marginHorizontal: 6 }}>
                      <View style={{ width: 62, height: 20, borderRadius: 3, backgroundColor: isEliminated ? "#1A1A1A" : (driver.sector1 !== null ? driver.sector1_color : "#2A2A2A"), justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: isEliminated ? "#555555" : "#000000", fontSize: 10, fontWeight: "700" }}>{driver.sector1 ? driver.sector1.toFixed(3) : ""}</Text>
                      </View>
                      <View style={{ width: 62, height: 20, borderRadius: 3, backgroundColor: isEliminated ? "#1A1A1A" : (driver.sector2 !== null ? driver.sector2_color : "#2A2A2A"), justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: isEliminated ? "#555555" : "#000000", fontSize: 10, fontWeight: "700" }}>{driver.sector2 ? driver.sector2.toFixed(3) : ""}</Text>
                      </View>
                      <View style={{ width: 62, height: 20, borderRadius: 3, backgroundColor: isEliminated ? "#1A1A1A" : (driver.sector3 !== null ? driver.sector3_color : "#2A2A2A"), justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: isEliminated ? "#555555" : "#000000", fontSize: 10, fontWeight: "700" }}>{driver.sector3 ? driver.sector3.toFixed(3) : ""}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 6 }}>
                      <Text style={{ color: isEliminated ? "#555555" : "#FFFFFF", fontSize: 13, fontWeight: "700", fontVariant: ["tabular-nums"], minWidth: 72 }}>
                        {formatLapTime(driver.best_lap_duration)}
                      </Text>
                      <Text style={{ color: isEliminated ? "#444444" : "#999999", fontSize: 10, fontVariant: ["tabular-nums"], marginLeft: 6, minWidth: 44 }}>
                        {index === 0 ? "LEADER" : gapStr}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={{ flexDirection: "row", backgroundColor: "#1E1E1E", borderTopWidth: 0.5, borderTopColor: "#2A2A2A", borderBottomWidth: 0.5, borderBottomColor: "#1A1A1A" }}>
                      <View style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 6 }}>
                        <Text style={{ color: "#999999", fontSize: 10, textTransform: "uppercase", marginBottom: 2 }}>VS Quali Record</Text>
                        <Text style={{ color: vsRecord?.color ?? "#FFFFFF", fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                          {vsRecord ? vsRecord.text : "N/D"}
                        </Text>
                      </View>
                      <View style={{ width: 0.5, backgroundColor: "#2A2A2A" }} />
                      <View style={{ flex: 1, paddingHorizontal: 8, paddingVertical: 6 }}>
                        <Text style={{ color: "#999999", fontSize: 10, textTransform: "uppercase", marginBottom: 2 }}>VS PB 2025</Text>
                        <Text style={{ color: vsPb?.color ?? "#FFFFFF", fontSize: 14, fontWeight: "700", fontVariant: ["tabular-nums"] }}>
                          {vsPb ? vsPb.text : "N/D"}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              );
            });
          })()}
        </ScrollView>
      </View>
    );
  }

  return (
    <>
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.navbar}>
        <Image source={logo} style={{ height: 32, width: 160, resizeMode: 'contain' }} />
      </View>

      {nextRace && (
        <View style={styles.countdownCard}>
          <Text style={styles.countdownLabel}>{nextRace.raceName}</Text>
          <Text style={styles.countdownCircuit}>{nextRace.Circuit.circuitName}</Text>
          <View style={styles.countdownRow}>
            <View style={styles.countdownUnit}>
              <Text style={styles.countdownNum}>{String(countdown.days).padStart(2, "0")}</Text>
              <Text style={styles.countdownUnitLabel}>GIORNI</Text>
            </View>
            <Text style={styles.countdownSep}>:</Text>
            <View style={styles.countdownUnit}>
              <Text style={styles.countdownNum}>{String(countdown.hours).padStart(2, "0")}</Text>
              <Text style={styles.countdownUnitLabel}>ORE</Text>
            </View>
            <Text style={styles.countdownSep}>:</Text>
            <View style={styles.countdownUnit}>
              <Text style={styles.countdownNum}>{String(countdown.minutes).padStart(2, "0")}</Text>
              <Text style={styles.countdownUnitLabel}>MIN</Text>
            </View>
            <Text style={styles.countdownSep}>:</Text>
            <View style={styles.countdownUnit}>
              <Text style={styles.countdownNum}>{String(countdown.seconds).padStart(2, "0")}</Text>
              <Text style={styles.countdownUnitLabel}>SEC</Text>
            </View>
          </View>
        </View>
      )}

      {(() => {
        const anyFpFinished = fpSessions.some(s => s.finished);
        const lastFinishedFp = [...fpSessions].reverse().find(s => s.finished);
        return anyFpFinished ? (
          <TouchableOpacity
            onPress={() => setShowFpModal(true)}
            style={{ backgroundColor: "#141414", borderRadius: 12, padding: 16, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderLeftWidth: 3, borderLeftColor: "#E10600" }}
          >
            <View>
              <Text style={{ color: "#999999", fontSize: 10, fontWeight: "600", letterSpacing: 1.5, marginBottom: 4 }}>PROVE LIBERE</Text>
              <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>Prove Libere</Text>
              <Text style={{ color: "#999999", fontSize: 12, marginTop: 2 }}>{lastFinishedFp?.name} terminata</Text>
            </View>
            <View style={{ backgroundColor: "#E10600", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 }}>
              <Text style={{ color: "#FFFFFF", fontSize: 9, fontWeight: "700", letterSpacing: 1 }}>RISULTATI</Text>
            </View>
          </TouchableOpacity>
        ) : null;
      })()}

      {statOfDay ? (
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>
            Stat del weekend{nextRace ? ` · ${nextRace.raceName}` : ""}
          </Text>
          <Text style={styles.statText}>{statOfDay}</Text>
        </View>
      ) : null}

      {lastRace && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Ultima gara</Text>
          <Text style={styles.cardTitle}>{lastRace.raceName}</Text>
          {lastRace.Results.slice(0, 3).map((r: any, i: number) => (
            <View key={i} style={styles.podiumRow}>
              <Text style={styles.podiumPos}>{i + 1}°</Text>
              <Text style={styles.podiumDriver}>{r.Driver.familyName}</Text>
              <Text style={styles.podiumTeam}>{r.Constructor.name}</Text>
              <Text style={styles.podiumTime}>{i === 0 ? "–" : r.Time?.time ?? r.status}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Classifica piloti</Text>
        {standings.map((s: any, i: number) => (
          <View key={i} style={styles.standingRow}>
            <Text style={styles.standingPos}>{s.position}</Text>
            <Text style={styles.standingDriver}>{s.Driver.familyName}</Text>
            <Text style={styles.standingPts}>{s.points} pt</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Classifica costruttori</Text>
        {constructorStandings.map((s: any, i: number) => (
          <View key={i} style={styles.standingRow}>
            <Text style={styles.standingPos}>{s.position}</Text>
            <Text style={styles.standingDriver}>{s.Constructor.name}</Text>
            <Text style={styles.standingPts}>{s.points} pt</Text>
          </View>
        ))}
      </View>
    </ScrollView>
    </SafeAreaView>

    <Modal visible={showFpModal} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", paddingTop: 48 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, marginBottom: 16 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 20, fontWeight: "800" }}>PROVE LIBERE</Text>
          <TouchableOpacity onPress={() => setShowFpModal(false)}>
            <Text style={{ color: "#999999", fontSize: 16 }}>Chiudi</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 16, gap: 8 }}>
          {fpSessions.map((session, index) => (
            <TouchableOpacity
              key={session.key}
              onPress={() => setActiveFpTab(index)}
              style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6, backgroundColor: activeFpTab === index ? "#E10600" : "#1E1E1E" }}
            >
              <Text style={{ color: activeFpTab === index ? "#FFFFFF" : "#555555", fontSize: 12, fontWeight: "700" }}>
                {session.name.replace('Practice ', 'FP')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView>
          {fpSessions[activeFpTab] && fpResults[fpSessions[activeFpTab].key] ? (
            fpResults[fpSessions[activeFpTab].key].map((driver, index) => {
              const leaderTime = fpResults[fpSessions[activeFpTab].key][0].best_lap;
              const gap = index === 0 ? null : driver.best_lap - leaderTime;
              const teamColor = driver.info?.team_colour ? `#${driver.info.team_colour}` : "#FFFFFF";
              return (
                <View key={driver.driver_number} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#1A1A1A" }}>
                  <Text style={{ color: "#999999", fontSize: 12, width: 20 }}>{index + 1}</Text>
                  <View style={{ width: 3, height: 18, backgroundColor: teamColor, borderRadius: 2, marginRight: 8 }} />
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600", flex: 1 }}>{driver.info?.name_acronym || driver.driver_number}</Text>
                  <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700", fontVariant: ["tabular-nums"], marginRight: 8 }}>{formatLapTime(driver.best_lap)}</Text>
                  <Text style={{ color: "#999999", fontSize: 10, fontVariant: ["tabular-nums"], width: 44, textAlign: "right" }}>
                    {gap === null ? "LEADER" : `+${gap.toFixed(3)}`}
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={{ padding: 32, alignItems: "center" }}>
              <Text style={{ color: "#555555", fontSize: 14 }}>
                {fpSessions[activeFpTab]?.finished === false ? "Sessione non ancora disputata" : "Nessun dato disponibile"}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  content: { padding: 16, gap: 12, backgroundColor: "#0A0A0A" },
  navbar: { paddingVertical: 8, paddingTop: 8, marginBottom: 4 },

  countdownCard: {
    backgroundColor: "#141414", borderRadius: 16,
    padding: 24, alignItems: "center", gap: 4, marginBottom: 8,
  },
  countdownLabel: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  countdownCircuit: { fontSize: 13, color: "#999999", marginBottom: 16 },
  countdownRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-evenly", width: "100%", paddingHorizontal: 8, marginTop: 8 },
  countdownUnit: { alignItems: "center", flex: 1 },
  countdownNum: { fontSize: 48, fontWeight: "800", color: "#FFFFFF", letterSpacing: -1, textAlign: "center" },
  countdownUnitLabel: { fontSize: 9, fontWeight: "600", color: "#E10600", letterSpacing: 2, marginTop: 4, textAlign: "center" },
  countdownSep: { fontSize: 28, color: "#444444", marginBottom: 16 },
  card: { backgroundColor: "#141414", borderRadius: 12, padding: 14, gap: 8, marginBottom: 8 },
  cardLabel: { fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: "500", marginBottom: 4, color: "#FFFFFF" },
  podiumRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  podiumPos: { fontSize: 12, color: "#999", width: 20 },
  podiumDriver: { fontSize: 13, fontWeight: "500", flex: 1, color: "#FFFFFF" },
  podiumTeam: { fontSize: 11, color: "#999999" },
  podiumTime: { fontSize: 11, color: "#555555" },
  standingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#222222" },
  standingPos: { fontSize: 11, color: "#999", width: 16 },
  standingDriver: { fontSize: 13, fontWeight: "500", flex: 1, color: "#FFFFFF" },
  standingPts: { fontSize: 12, color: "#999999" },
  statCard: { backgroundColor: "#141414", borderLeftWidth: 2, borderLeftColor: "#E10600", paddingLeft: 12, paddingVertical: 10, gap: 6, borderRadius: 12, marginBottom: 8 },
  statLabel: { fontSize: 10, color: "#E10600", textTransform: "uppercase", letterSpacing: 0.5 },
  statText: { fontSize: 13, color: "#FFFFFF", lineHeight: 20 },
});