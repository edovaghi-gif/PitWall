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

const TOTAL_LAPS: Record<string, number> = {
  "Suzuka": 53, "Miami": 57, "Sakhir": 57, "Jeddah": 50, "Melbourne": 58,
  "Shanghai": 56, "Monte Carlo": 78, "Catalunya": 66, "Montreal": 70,
  "Spielberg": 71, "Silverstone": 52, "Hungaroring": 70, "Spa-Francorchamps": 44,
  "Zandvoort": 72, "Monza": 53, "Baku": 51, "Singapore": 62, "Austin": 56,
  "Mexico City": 71, "Interlagos": 71, "Las Vegas": 50, "Lusail": 57,
  "Yas Marina Circuit": 58,
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
  const RACE_DEV_MODE = true;
  const RACE_DEV_SESSION_KEY = 11253;

  const [fpSessions, setFpSessions] = useState<{key: number, name: string, finished: boolean}[]>([]);
  const [fpResults, setFpResults] = useState<Record<number, any[]>>({});
  const [showFpModal, setShowFpModal] = useState(false);
  const [activeFpTab, setActiveFpTab] = useState<number>(0);

  const [qualiCountdown, setQualiCountdown] = useState<string | null>(null);
  const [expandedDriver, setExpandedDriver] = useState<string | null>(null);
  const [selectedQPhase, setSelectedQPhase] = useState<"Q1" | "Q2" | "Q3" | null>(null);
  const [flashingDrivers, setFlashingDrivers] = useState<Set<number>>(new Set());
  const driverLapRef = useRef<Record<number, number>>({});
  const flashTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  const raceControlRef = useRef<any[]>([]);
  const lapsRef = useRef<any[]>([]);
  const devQualiPhase = useRef<string | null>(QUALI_DEV_MODE ? "Q3" : null);

  const [raceDrivers, setRaceDrivers] = useState<any[]>([]);
  const [raceLap, setRaceLap] = useState<number | null>(null);
  const [raceTotalLaps, setRaceTotalLaps] = useState<number | null>(null);
  const [raceWeather, setRaceWeather] = useState<any | null>(null);
  const [raceSafetyCarActive, setRaceSafetyCarActive] = useState(false);
  const [raceVscActive, setRaceVscActive] = useState(false);
  const [raceRedFlagActive, setRaceRedFlagActive] = useState(false);
  const [raceYellowSectors, setRaceYellowSectors] = useState<number[]>([]);
  const [raceBattle, setRaceBattle] = useState<any | null>(null);
  const [raceRainRisk, setRaceRainRisk] = useState<string | null>(null);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  const previousIntervalsRef = useRef<Record<number, number>>({});
  const raceStintsRef = useRef<any[]>([]);
  const raceDriversCacheRef = useRef<any[]>([]);
  const dnfRef = useRef<Set<number>>(new Set());
  const [expandedRaceDriver, setExpandedRaceDriver] = useState<number | null>(null);
  const [showGapToLeader, setShowGapToLeader] = useState(false);
  const gapHistoryRef = useRef<Record<number, Array<{gap: number, stint: number, timestamp: number}>>>({});
  const arrowTranslateRef = useRef(new Animated.Value(0));
  const arrowOpacityRef = useRef(new Animated.Value(1));
  const arrowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

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

  useEffect(() => {
    arrowLoopRef.current?.stop();
    arrowTranslateRef.current.setValue(0);
    arrowOpacityRef.current.setValue(1);
    if (expandedRaceDriver === null) return;
    const driverIdx = raceDrivers.findIndex((d: any) => d.driver_number === expandedRaceDriver);
    if (driverIdx < 0 || driverIdx >= raceDrivers.length - 1) return;
    const behind = raceDrivers[driverIdx + 1];
    if (!behind || behind.isDnf) return;
    const config = getArrowConfig(behind.driver_number);
    if (!config) return;
    let loop: Animated.CompositeAnimation;
    if (config.type === 'stable' || config.type === 'sc') {
      arrowOpacityRef.current.setValue(0.3);
      loop = Animated.loop(Animated.sequence([
        Animated.timing(arrowOpacityRef.current, { toValue: 1.0, duration: 900, useNativeDriver: true }),
        Animated.timing(arrowOpacityRef.current, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ]));
    } else {
      const durations: Record<string, number> = { slow: 1200, medium: 800, fast: 400 };
      const ranges: Record<string, number> = { slow: 8, medium: 14, fast: 20 };
      const dur = durations[config.tier];
      const range = ranges[config.tier];
      const fromX = config.type === 'closing' ? -range : 0;
      const toX = config.type === 'closing' ? 0 : -range;
      arrowTranslateRef.current.setValue(fromX);
      loop = Animated.loop(Animated.sequence([
        Animated.timing(arrowTranslateRef.current, { toValue: toX, duration: dur, useNativeDriver: true }),
        Animated.timing(arrowTranslateRef.current, { toValue: fromX, duration: 0, useNativeDriver: true }),
      ]));
    }
    arrowLoopRef.current = loop;
    loop.start();
    return () => { loop.stop(); };
  }, [expandedRaceDriver, raceDrivers, raceSafetyCarActive, raceVscActive]);

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

  function getPhaseWindow(phaseNum: number): { start: Date | null; end: Date | null } {
    const rcData = raceControlRef.current;
    const startEvent = rcData.find((e: any) => Number(e.qualifying_phase) === phaseNum && e.message?.includes("SESSION STARTED"));
    const endEvent = rcData.find((e: any) => Number(e.qualifying_phase) === phaseNum && e.message?.includes("SESSION FINISHED"));
    return {
      start: startEvent?.date ? new Date(startEvent.date) : null,
      end: endEvent?.date ? new Date(endEvent.date) : null,
    };
  }

  function getBestLapInPhase(driverNumber: number, phaseNum: number, requireWindow: boolean): any | null {
    const { start, end } = getPhaseWindow(phaseNum);
    if (requireWindow && !start) return null;
    let best: any = null;
    for (const lap of lapsRef.current) {
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

  async function safeFetch(url: string): Promise<any | null> {
    const attempt = async () => {
      const res = await fetch(url);
      const text = await res.text();
      if (!text.startsWith('[') && !text.startsWith('{')) return null;
      const data = JSON.parse(text);
      if (data?.error === "Too Many Requests") return null;
      return data;
    };
    try {
      const result = await attempt();
      if (result !== null) return result;
      await new Promise(r => setTimeout(r, 1500));
      return await attempt();
    } catch {
      return null;
    }
  }

  async function fetchRaceStints() {
    if (!activeSession) return;
    const sessionKey = activeSession.session_key;
    try {
      const data = await safeFetch(`https://api.openf1.org/v1/stints?session_key=${sessionKey}`);
      if (!Array.isArray(data)) return;
      raceStintsRef.current = data;
    } catch {}
  }

  async function fetchRaceWeather() {
    if (!activeSession) return;
    const sessionKey = activeSession.session_key;
    try {
      const data = await safeFetch(`https://api.openf1.org/v1/weather?session_key=${sessionKey}`);
      console.log('Weather result:', JSON.stringify(data).slice(0, 200));
      if (!Array.isArray(data) || data.length === 0) return;
      console.log('Setting weather:', JSON.stringify(data[data.length - 1]));
      setRaceWeather(data[data.length - 1]);
    } catch {}
  }

  function getTrend(attackerNum: number | null): { text: string; color: string } | null {
    if (raceSafetyCarActive || raceVscActive) return { text: "🚗 SC/VSC in pista", color: "#F39C12" };
    if (attackerNum === null) return null;
    const history = gapHistoryRef.current[attackerNum] ?? [];
    const valid: Array<{gap: number, stint: number}> = [];
    for (let i = 0; i < history.length; i++) {
      if (i > 0 && history[i].stint !== history[i - 1].stint) { valid.length = 0; continue; }
      valid.push(history[i]);
    }
    if (valid.length < 2) return null;
    const current = valid[valid.length - 1].gap;
    const avgPrev = valid.slice(0, valid.length - 1).reduce((s, e) => s + e.gap, 0) / (valid.length - 1);
    const delta = current - avgPrev;
    if (Math.abs(delta) <= 0.1) return { text: "→ stabile", color: "#999999" };
    if (delta < 0) return { text: "↓ si avvicina", color: "#27AE60" };
    return { text: "↑ si allontana", color: "#999999" };
  }

  function getCatchEstimate(attackerNum: number | null, currentGap: number | null): number | null {
    if (attackerNum === null || currentGap === null || currentGap <= 0) return null;
    if (raceSafetyCarActive || raceVscActive) return null;
    const history = gapHistoryRef.current[attackerNum] ?? [];
    const valid: Array<{ gap: number; stint: number }> = [];
    for (let i = 0; i < history.length; i++) {
      if (i > 0 && history[i].stint !== history[i - 1].stint) { valid.length = 0; continue; }
      valid.push(history[i]);
    }
    if (valid.length < 2) return null;
    const current = valid[valid.length - 1].gap;
    const avgPrev = valid.slice(0, valid.length - 1).reduce((s, e) => s + e.gap, 0) / (valid.length - 1);
    const delta = current - avgPrev;
    if (delta >= -0.1) return null;
    const closingRate = Math.abs(delta);
    return Math.ceil(currentGap / closingRate);
  }

  function extractRainRisk(rcData: any[]): string | null {
    for (let i = rcData.length - 1; i >= 0; i--) {
      const msg = rcData[i]?.message ?? "";
      const match = msg.match(/RISK OF RAIN[^0-9]*(\d+)%/i);
      if (match) return `${match[1]}%`;
    }
    return null;
  }

  function getWindDirection(degrees: number): string {
    const dirs = ["N", "NE", "E", "SE", "S", "SO", "O", "NO"];
    return dirs[Math.round(degrees / 45) % 8];
  }

  function WeatherRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
      <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 }}>
        <Text style={{ color: "#999999", fontSize: 13 }}>{label}</Text>
        <Text style={{ color: highlight ? "#F39C12" : "#FFFFFF", fontSize: 13, fontWeight: "600" }}>{value}</Text>
      </View>
    );
  }

  type ArrowTier = 'slow' | 'medium' | 'fast';
  type ArrowType = 'closing' | 'stable' | 'away' | 'sc';
  type ArrowConfig = { type: ArrowType; tier: ArrowTier; text: string; color: string };

  function getArrowConfig(driverBehindNum: number | null): ArrowConfig | null {
    if (driverBehindNum === null) return null;
    if (raceSafetyCarActive || raceVscActive) return { type: 'sc', tier: 'slow', text: '● ● ●', color: '#F39C12' };
    const history = gapHistoryRef.current[driverBehindNum] ?? [];
    const valid: Array<{gap: number, stint: number}> = [];
    for (let i = 0; i < history.length; i++) {
      if (i > 0 && history[i].stint !== history[i - 1].stint) { valid.length = 0; continue; }
      valid.push(history[i]);
    }
    if (valid.length < 2) return null;
    const current = valid[valid.length - 1].gap;
    const avgPrev = valid.slice(0, valid.length - 1).reduce((s, e) => s + e.gap, 0) / (valid.length - 1);
    const delta = current - avgPrev;
    const absDelta = Math.abs(delta);
    if (delta < -0.1) {
      const tier: ArrowTier = absDelta >= 0.6 ? 'fast' : absDelta >= 0.3 ? 'medium' : 'slow';
      const texts: Record<ArrowTier, string> = { slow: '> > >', medium: '>> >>', fast: '>>>>>>>' };
      return { type: 'closing', tier, text: texts[tier], color: '#27AE60' };
    } else if (absDelta <= 0.1) {
      return { type: 'stable', tier: 'slow', text: '● ● ●', color: '#F39C12' };
    } else {
      const tier: ArrowTier = absDelta >= 0.6 ? 'fast' : absDelta >= 0.3 ? 'medium' : 'slow';
      const texts: Record<ArrowTier, string> = { slow: '< < <', medium: '<< <<', fast: '<<<<<<<' };
      return { type: 'away', tier, text: texts[tier], color: '#E10600' };
    }
  }

  async function fetchRaceData() {
    if (!activeSession) return;
    const sessionKey = activeSession.session_key;
    const totalLaps = TOTAL_LAPS[activeSession.circuit_short_name] ?? 50;
    let positionData: any[], intervalsData: any[], rcData: any[];
    try {
      const fetchPromises: Promise<any>[] = [
        safeFetch(`https://api.openf1.org/v1/position?session_key=${sessionKey}`),
        safeFetch(`https://api.openf1.org/v1/intervals?session_key=${sessionKey}`),
        safeFetch(`https://api.openf1.org/v1/race_control?session_key=${sessionKey}`),
      ];
      if (raceDriversCacheRef.current.length === 0) {
        fetchPromises.push(safeFetch(`https://api.openf1.org/v1/drivers?session_key=${sessionKey}`));
      }
      const results = await Promise.all(fetchPromises);
      [positionData, intervalsData, rcData] = results;
      const driversData = results[3];
      if (Array.isArray(driversData) && driversData.length > 0) {
        console.log('Driver headshot_url:', driversData[0]?.headshot_url);
        raceDriversCacheRef.current = driversData;
      }
    } catch { return; }
    const drivers = raceDriversCacheRef.current;

    if (!Array.isArray(positionData) || !Array.isArray(intervalsData) || !Array.isArray(rcData)) return;
    console.log('ALO interval raw:', intervalsData.filter((i: any) => i.driver_number === 14).slice(-1)[0])
    console.log('BOT interval raw:', intervalsData.filter((i: any) => i.driver_number === 77).slice(-1)[0])
    console.log('ALB interval raw:', intervalsData.filter((i: any) => i.driver_number === 23).slice(-1)[0])

    // raceLap: max lap_number from positionData, fallback totalLaps
    let maxLapFound: number | null = null;
    for (const entry of positionData) {
      if (entry.lap_number != null && entry.lap_number > (maxLapFound ?? 0)) {
        maxLapFound = entry.lap_number;
      }
    }
    setRaceLap(maxLapFound ?? totalLaps);

    // Latest position per driver
    const latestPosition: Record<number, number> = {};
    for (const entry of positionData) {
      latestPosition[entry.driver_number] = entry.position;
    }

    // Latest interval per driver
    const latestInterval: Record<number, any> = {};
    for (const entry of intervalsData) {
      latestInterval[entry.driver_number] = entry;
    }

    // DNF detection from race_control
    const dnfDrivers = new Set<number>();
    for (const e of rcData) {
      if (e.driver_number != null && (
        e.message?.includes("RETIRED") ||
        e.message?.includes("OUT") ||
        (e.category === "Other" && e.flag === "BLACK AND WHITE")
      )) {
        dnfDrivers.add(e.driver_number);
      }
    }

    // SC / VSC / RF / Yellow detection — iterate in chronological order
    const sortedRc = [...rcData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let scActive = false;
    let vscActive = false;
    let rfActive = false;
    const yellowSectors: Record<number, string> = {};
    for (const e of sortedRc) {
      if (e.category === "SafetyCar") {
        const msg = e.message ?? "";
        if (msg.includes("VIRTUAL SAFETY CAR DEPLOYED") || msg.includes("VSC DEPLOYED")) {
          vscActive = true;
          scActive = false;
        } else if (msg.includes("DEPLOYED")) {
          scActive = true;
          vscActive = false;
        }
        if (msg.includes("WITHDRAWN") || msg.includes("ENDING")) {
          scActive = false;
          vscActive = false;
        }
      }
      if (e.category === "RedFlag") {
        rfActive = true;
        if ((e.message ?? "").includes("RESTARTED") || (e.message ?? "").includes("RESUMED")) rfActive = false;
      }
      if (e.flag === "YELLOW") {
        const sector = e.sector ?? 0;
        yellowSectors[sector] = "YELLOW";
      }
      if (e.flag === "GREEN" || e.flag === "CLEAR" || e.flag === "CHEQUERED") {
        const sector = e.sector ?? 0;
        if (yellowSectors[sector] !== undefined) delete yellowSectors[sector];
        if (e.sector == null) {
          Object.keys(yellowSectors).forEach(k => delete yellowSectors[Number(k)]);
        }
      }
    }
    setRaceSafetyCarActive(scActive);
    setRaceVscActive(vscActive);
    setRaceRedFlagActive(rfActive);
    const activeSectors = Object.keys(yellowSectors).map(Number).filter(s => s > 0).sort((a, b) => a - b);
    const hasGenericYellow = yellowSectors[0] !== undefined;
    setRaceYellowSectors(hasGenericYellow && activeSectors.length === 0 ? [-1] : activeSectors);

    // Build driver list
    const driverMap: Record<number, any> = {};
    for (const d of drivers) {
      driverMap[d.driver_number] = d;
    }

    const stints = raceStintsRef.current;
    const latestStint: Record<number, any> = {};
    for (const s of stints) {
      if (!latestStint[s.driver_number] || s.lap_end > latestStint[s.driver_number].lap_end) {
        latestStint[s.driver_number] = s;
      }
    }

    const positionDrivers = new Set(Object.keys(latestPosition).map(Number));
    const allDriverNumbers = new Set<number>([
      ...positionDrivers,
      ...drivers.map((d: any) => d.driver_number),
    ]);
    const driverNumbers = Array.from(allDriverNumbers);
    const built: any[] = [];
    for (const num of driverNumbers) {
      const info = driverMap[num] ?? {};
      const pos = latestPosition[num];
      const intEntry = latestInterval[num];
      const stint = latestStint[num];

      let intervalStr = "LEADER";
      let gapToLeaderStr = "LEADER";
      let gapToLeader: number | null = null;
      let isLapped = false;

      if (pos !== 1 && intEntry) {
        const gap = intEntry.gap_to_leader;
        const interval = intEntry.interval;

        if (gap !== null && gap !== undefined) {
          if (typeof gap === "string") {
            gapToLeaderStr = gap;
            isLapped = true;
          } else if (typeof gap === "number" && gap > 120) {
            gapToLeaderStr = "+1 LAP";
            isLapped = true;
          } else if (typeof gap === "number") {
            gapToLeaderStr = `+${gap.toFixed(3)}s`;
            gapToLeader = gap;
          }
        }

        if (interval !== null && interval !== undefined) {
          if (typeof interval === "number") {
            intervalStr = `+${interval.toFixed(3)}s`;
          } else if (typeof interval === "string") {
            intervalStr = interval;
          }
        }
      }

      let compound: string | null = null;
      let tyreAge: number | null = null;
      let stops = 0;
      if (stint) {
        compound = stint.compound ?? null;
        stops = Math.max(0, (stint.stint_number ?? 1) - 1);
        if (stint.tyre_age_at_start != null && stint.lap_start != null) {
          tyreAge = stint.tyre_age_at_start + (totalLaps - stint.lap_start);
        }
      }

      built.push({
        driver_number: num,
        name_acronym: info.name_acronym ?? String(num),
        team_colour: info.team_colour ? `#${info.team_colour}` : "#FFFFFF",
        headshot_url: info.headshot_url ?? null,
        position: pos,
        interval: intervalStr,
        gapToLeaderStr,
        gap_to_leader: gapToLeader,
        compound,
        tyre_age: tyreAge,
        stops,
        isLapped,
        isDnf: dnfRef.current.size > 0 && !dnfRef.current.has(num) && !isLapped,
      });
    }

    built.sort((a, b) => {
      const aDnf = a.isDnf ? 1 : 0;
      const bDnf = b.isDnf ? 1 : 0;
      if (aDnf !== bDnf) return aDnf - bDnf;
      const aLapped = a.isLapped ? 1 : 0;
      const bLapped = b.isLapped ? 1 : 0;
      if (aLapped !== bLapped) return aLapped - bLapped;
      return (a.position ?? 999) - (b.position ?? 999);
    });
    setRaceDrivers(built);

    // Gap history for expand inline
    if (!raceSafetyCarActive && !raceVscActive) {
      for (const d of built) {
        if (d.gap_to_leader === null) continue;
        const stintEntry = latestStint[d.driver_number];
        const stintNum = stintEntry?.stint_number ?? 0;
        const history = gapHistoryRef.current[d.driver_number] ?? [];
        history.push({ gap: d.gap_to_leader, stint: stintNum, timestamp: Date.now() });
        if (history.length > 5) history.shift();
        gapHistoryRef.current[d.driver_number] = history;
      }
    }

    // Battle Insight
    const newPrev: Record<number, number> = { ...previousIntervalsRef.current };
    let bestBattle: any = null;
    let bestGap = Infinity;
    for (let i = 0; i < built.length - 1; i++) {
      const d1 = built[i];
      const d2 = built[i + 1];
      if (d2.gap_to_leader === null || d1.gap_to_leader === null) continue;
      const gap = d2.gap_to_leader - d1.gap_to_leader;
      if (gap < 2.0 && gap < bestGap) {
        bestGap = gap;
        const prevGap = previousIntervalsRef.current[d2.driver_number];
        const trend = prevGap !== undefined ? prevGap - gap : null;
        bestBattle = { driver1: d1, driver2: d2, gap, trend };
      }
      newPrev[d2.driver_number] = gap;
    }
    previousIntervalsRef.current = newPrev;
    setRaceBattle(bestBattle);
    setRaceRainRisk(extractRainRisk(rcData));
  }

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
    if (RACE_DEV_MODE) {
      const fakeSession = {
        session_key: RACE_DEV_SESSION_KEY,
        session_name: "Race",
        circuit_short_name: "Suzuka",
        date_start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        date_end: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
      };
      setActiveSession(fakeSession);
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
    } else if (active && active.session_name === "Race") {
      setActiveSession(active);
      return;
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
    setRaceRainRisk(extractRainRisk(data));
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
    lapsRef.current = lapsData;

    const effectivePhase = devQualiPhase.current ?? qualiPhase;
    setActiveQualiPhase(effectivePhase);

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
        headshot_url: driver.headshot_url ?? null,
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
    fetchRaceWeather();
    const rcInterval = setInterval(() => fetchRaceControl(sessionKey), 30000);
    const dataInterval = setInterval(fetchQualifyingData, 10000);
    const weatherInterval = setInterval(fetchRaceWeather, 120000);
    return () => { clearInterval(rcInterval); clearInterval(dataInterval); clearInterval(weatherInterval); };
  }, [activeSession]);

  useEffect(() => {
    if (!activeSession || activeSession.session_name !== "Race") return;
    const sessionKey = activeSession.session_key;
    const totalLaps = TOTAL_LAPS[activeSession.circuit_short_name] ?? 50;
    setRaceTotalLaps(TOTAL_LAPS[activeSession.circuit_short_name] ?? null);
    dnfRef.current = new Set();
    (async () => {
      try {
        const res = await fetch(`https://api.openf1.org/v1/laps?session_key=${sessionKey}&lap_number=${totalLaps}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          dnfRef.current = new Set(data.map((l: any) => l.driver_number));
          console.log('dnfRef finishers:', [...dnfRef.current]);
        } else {
          console.log('dnfRef: no last-lap data returned, size=0');
        }
      } catch {}
    })();
    fetchRaceData();
    fetchRaceStints();
    fetchRaceWeather();
    const dataInterval = setInterval(fetchRaceData, 15000);
    const stintsInterval = setInterval(fetchRaceStints, 30000);
    const weatherInterval = setInterval(fetchRaceWeather, 120000);
    return () => {
      clearInterval(dataInterval);
      clearInterval(stintsInterval);
      clearInterval(weatherInterval);
    };
  }, [activeSession]);

  useEffect(() => {
    setSelectedQPhase(activeQualiPhase as "Q1" | "Q2" | "Q3" | null);
  }, [activeQualiPhase]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#E10600" />
      </View>
    );
  }

  const isRace = activeSession?.session_name === "Race";
  const isQualifying = activeSession &&
    (activeSession.session_name === "Qualifying" || activeSession.session_name === "Sprint Qualifying");

  function getTyreInfo(compound: string | null): { label: string; bg: string; textColor: string } {
    switch (compound) {
      case "SOFT": return { label: "S", bg: "#E10600", textColor: "#FFFFFF" };
      case "MEDIUM": return { label: "M", bg: "#F39C12", textColor: "#000000" };
      case "HARD": return { label: "H", bg: "#FFFFFF", textColor: "#000000" };
      case "INTERMEDIATE": return { label: "I", bg: "#27AE60", textColor: "#FFFFFF" };
      case "WET": return { label: "W", bg: "#3498DB", textColor: "#FFFFFF" };
      default: return { label: "?", bg: "#2A2A2A", textColor: "#555555" };
    }
  }

  if (isRace) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", paddingTop: 52 }}>
        <View style={styles.navbar}>
          <Image source={logo} style={{ height: 32, width: 160, resizeMode: 'contain' }} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#E10600", marginRight: 8, opacity: pulseAnim }} />
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 1 }}>
              GIRO {raceLap ?? "—"}/{raceTotalLaps ?? "—"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowWeatherModal(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: "#999999", fontSize: 13, fontWeight: "600" }}>
              {raceWeather?.track_temperature ?? "—"}°C {raceWeather?.rainfall ? "🌧" : "☀️"} ›
            </Text>
          </TouchableOpacity>
        </View>
        {raceRedFlagActive && (
          <View style={{ backgroundColor: "#E10600", marginHorizontal: 16, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 8 }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13, textAlign: "center" }}>🚩 RED FLAG</Text>
          </View>
        )}
        {raceSafetyCarActive && (
          <View style={{ backgroundColor: "#F39C12", marginHorizontal: 16, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12, marginBottom: 8 }}>
            <Text style={{ color: "#FFFFFF", fontWeight: "800", fontSize: 13, textAlign: "center" }}>🚗 SAFETY CAR IN PISTA</Text>
          </View>
        )}
        {raceVscActive && (
          <View style={{ backgroundColor: "#F39C12", marginHorizontal: 16, marginBottom: 8, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#D4890A", borderStyle: "dashed" }}>
            <Text style={{ color: "#000000", fontWeight: "800", fontSize: 12, letterSpacing: 1 }}>🚗 VIRTUAL SAFETY CAR</Text>
          </View>
        )}
        {raceYellowSectors.length > 0 && (() => {
          const yellowLabel = raceYellowSectors[0] === -1
            ? "⚠️ BANDIERA GIALLA"
            : `⚠️ GIALLA ${raceYellowSectors.join(' · ')}`;
          return (
            <View style={{ backgroundColor: "#F39C12", marginHorizontal: 16, marginBottom: 8, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 12, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "#000000", fontWeight: "700", fontSize: 11, letterSpacing: 0.5 }}>{yellowLabel}</Text>
            </View>
          );
        })()}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#2A2A2A" }}>
          <Text style={{ color: "#555555", fontSize: 10, width: 22 }}> </Text>
          <View style={{ width: 12, marginRight: 10 }} />
          <Text style={{ color: "#555555", fontSize: 10, flex: 1 }}> </Text>
          <TouchableOpacity onPress={() => setShowGapToLeader(v => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: showGapToLeader ? "#E10600" : "#555555", fontSize: 10, fontStyle: "italic", marginRight: 12 }}>
              {showGapToLeader ? "GAP" : "INTERVAL"}
            </Text>
          </TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text style={{ color: "#555555", fontSize: 9, width: 20, textAlign: "center" }}>CPD</Text>
            <Text style={{ color: "#555555", fontSize: 9, width: 20, textAlign: "center" }}>AGE</Text>
            <Text style={{ color: "#555555", fontSize: 9, width: 20, textAlign: "center" }}>PIT</Text>
          </View>
        </View>
        <ScrollView>
          {raceDrivers.length === 0 ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <ActivityIndicator size="small" color="#E10600" />
            </View>
          ) : (
            raceDrivers.map((driver, index) => {
              const teamColor = driver.team_colour ?? "#FFFFFF";
              const tyre = getTyreInfo(driver.compound);
              const isExpanded = expandedRaceDriver === driver.driver_number;
              const driverAhead = index > 0 ? raceDrivers[index - 1] : null;
              const driverBehind = index < raceDrivers.length - 1 ? raceDrivers[index + 1] : null;
              const trendAhead = getTrend(driver.driver_number);
              const trendBehind = getTrend(driverBehind?.driver_number ?? null);
              const arrowConfig = isExpanded && driverBehind && !driverBehind.isDnf
                ? getArrowConfig(driverBehind.driver_number)
                : null;
              const catchEst = isExpanded && driverBehind && !driverBehind.isDnf
                ? getCatchEstimate(driverBehind.driver_number, driverBehind.gap_to_leader !== null ? driverBehind.gap_to_leader - (driver.gap_to_leader ?? 0) : null)
                : null;
              const intervalDisplay = (() => {
                if (driver.isDnf) return "DNF";
                if (driver.isLapped) return driver.gapToLeaderStr;
                if (driver.position === 1) return "LEADER";
                return showGapToLeader ? driver.gapToLeaderStr : driver.interval;
              })();
              const intervalColor = driver.isDnf ? "#555555" : driver.isLapped ? "#555555" : driver.position === 1 ? "#E10600" : "#FFFFFF";
              return (
                <View key={driver.driver_number}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setExpandedRaceDriver(isExpanded ? null : driver.driver_number)}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#1A1A1A" }}>
                      <Text style={{ color: "#999999", fontSize: 13, width: 22 }}>{driver.position}</Text>
                      <View style={{ width: 2, height: 40, backgroundColor: teamColor, borderRadius: 1, marginRight: 10 }} />
                      {driver.headshot_url ? (
                        <Image source={{ uri: driver.headshot_url }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: "#2A2A2A" }} resizeMode="cover" />
                      ) : (
                        <View style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: "#2A2A2A" }} />
                      )}
                      <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "700", flex: 1 }}>{driver.name_acronym}</Text>
                      <Text style={{ fontSize: 13, fontWeight: "700", fontVariant: ["tabular-nums"], marginRight: 12, color: intervalColor }}>
                        {intervalDisplay}
                      </Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <View style={{ backgroundColor: tyre.bg, borderRadius: 4, width: 20, height: 20, alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ color: tyre.textColor, fontSize: 11, fontWeight: "800" }}>{tyre.label}</Text>
                        </View>
                        {driver.tyre_age !== null && (
                          <Text style={{ color: "#999999", fontSize: 11 }}>{driver.tyre_age}</Text>
                        )}
                        <Text style={{ color: "#555555", fontSize: 11 }}>{driver.stops > 0 ? `${driver.stops}S` : ""}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                  {isExpanded && !driver.isDnf && (
                    <View style={{ backgroundColor: "#1A1A1A", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#2A2A2A" }}>
                      <Text style={{ color: "#999999", fontSize: 10, textTransform: "uppercase", marginBottom: 4 }}>DIETRO</Text>
                      {!driverBehind || driverBehind.isDnf ? (
                        <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>—</Text>
                      ) : (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <View>
                            <Text style={{ color: "#555555", fontSize: 10, marginBottom: 2 }}>{driverBehind.name_acronym}</Text>
                            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700" }}>{driverBehind.interval}</Text>
                            {raceSafetyCarActive || raceVscActive ? (
                              <Text style={{ color: "#F39C12", fontSize: 11, marginTop: 2 }}>🚗 SC/VSC — trend sospeso</Text>
                            ) : trendBehind ? (
                              <Text style={{ color: trendBehind.color, fontSize: 11, marginTop: 2 }}>{trendBehind.text}</Text>
                            ) : null}
                          </View>
                          {arrowConfig ? (
                            <View style={{ alignItems: "flex-end" }}>
                              <View style={{ overflow: "hidden", width: 60, alignItems: "flex-end" }}>
                                {(arrowConfig.type === 'stable' || arrowConfig.type === 'sc') ? (
                                  <Animated.Text style={{ color: arrowConfig.color, fontSize: 14, letterSpacing: 2, opacity: arrowOpacityRef.current }}>
                                    {arrowConfig.text}
                                  </Animated.Text>
                                ) : (
                                  <Animated.View style={{ transform: [{ translateX: arrowTranslateRef.current }] }}>
                                    <Text style={{ color: arrowConfig.color, fontSize: 14, letterSpacing: 2 }}>{arrowConfig.text}</Text>
                                  </Animated.View>
                                )}
                              </View>
                              {arrowConfig.type === 'closing' && catchEst !== null && catchEst <= 30 && (
                                <Text style={{ fontSize: 11, fontWeight: "600", color: "#27AE60", marginTop: 2 }}>~{catchEst} giri</Text>
                              )}
                            </View>
                          ) : null}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
        <Modal transparent animationType="slide" visible={showWeatherModal} onRequestClose={() => setShowWeatherModal(false)}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowWeatherModal(false)} />
          <View style={{ backgroundColor: "#141414", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <View style={{ width: 40, height: 4, backgroundColor: "#2A2A2A", borderRadius: 2, alignSelf: "center", marginBottom: 20 }} />
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 1, marginBottom: 20 }}>CONDIZIONI PISTA</Text>
            {!raceWeather ? (
              <Text style={{ color: "#999999", fontSize: 13, textAlign: "center", paddingVertical: 24 }}>Dati meteo non disponibili</Text>
            ) : (
              <>
                <Text style={{ color: "#999999", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 8 }}>🌡 TEMPERATURA</Text>
                <View style={{ backgroundColor: "#1E1E1E", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <WeatherRow label="Asfalto" value={`${raceWeather.track_temperature ?? "—"}°C`} />
                  <WeatherRow label="Aria" value={`${raceWeather.air_temperature ?? "—"}°C`} />
                </View>
                <Text style={{ color: "#999999", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 8 }}>💧 UMIDITÀ & PIOGGIA</Text>
                <View style={{ backgroundColor: "#1E1E1E", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <WeatherRow label="Umidità" value={`${raceWeather.humidity ?? "—"}%`} />
                  <WeatherRow label="Pioggia in corso" value={raceWeather.rainfall ? "Sì 🌧" : "No ☀️"} />
                  {raceRainRisk !== null && <WeatherRow label="Rischio pioggia" value={raceRainRisk} highlight={parseInt(raceRainRisk) > 30} />}
                </View>
                <Text style={{ color: "#999999", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 8 }}>💨 VENTO</Text>
                <View style={{ backgroundColor: "#1E1E1E", borderRadius: 10, padding: 14 }}>
                  <WeatherRow label="Velocità" value={`${raceWeather.wind_speed ?? "—"} m/s`} />
                  <WeatherRow label="Direzione" value={raceWeather.wind_direction != null ? `${raceWeather.wind_direction}° (${getWindDirection(raceWeather.wind_direction)})` : "—"} />
                </View>
              </>
            )}
          </View>
        </Modal>
      </View>
    );
  }

  if (isQualifying) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", paddingTop: 52 }}>
        <View style={styles.navbar}>
          <Image source={logo} style={{ height: 32, width: 160, resizeMode: 'contain' }} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#E10600", marginRight: 8, opacity: pulseAnim }} />
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 1 }}>
              {activeQualiPhase ? `${activeQualiPhase} IN CORSO` : "QUALIFICHE IN CORSO"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowWeatherModal(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: "#999999", fontSize: 13, fontWeight: "600" }}>
              {raceWeather?.track_temperature ?? "—"}°C {raceWeather?.rainfall ? "🌧" : "☀️"} ›
            </Text>
          </TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 12, gap: 8 }}>
          {["Q1", "Q2", "Q3"].map(q => {
            const isLive = activeQualiPhase === q;
            const isSelected = selectedQPhase === q && !isLive;
            return (
              <TouchableOpacity
                key={q}
                onPress={() => setSelectedQPhase(q as "Q1" | "Q2" | "Q3")}
                style={{
                  paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6,
                  backgroundColor: isLive ? "#E10600" : isSelected ? "#2A2A2A" : "#1E1E1E",
                  borderWidth: isSelected ? 1 : 0,
                  borderColor: "#FFFFFF",
                }}
              >
                <Text style={{ color: isLive || isSelected ? "#FFFFFF" : "#555555", fontSize: 12, fontWeight: "700" }}>{q}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <ScrollView>
          {(() => {
            const circuitShortName = activeSession?.circuit_short_name ?? "";
            const circuitInfo = CIRCUIT_INFO_MAP[circuitShortName] ?? null;
            const pbData: Record<string, any> = (qualiPb2025 as any)[circuitShortName] ?? {};

            const isHistoricalView = selectedQPhase !== null && selectedQPhase !== activeQualiPhase;
            const selectedPhaseNum = selectedQPhase === "Q1" ? 1 : selectedQPhase === "Q2" ? 2 : 3;

            let displayedDrivers: any[];
            if (isHistoricalView) {
              displayedDrivers = qualifyingDrivers.map((d: any) => {
                const participatedInPhase = (d.lap_phase ?? 0) >= selectedPhaseNum;
                const phaseLap = participatedInPhase ? getBestLapInPhase(d.driver_number, selectedPhaseNum, true) : null;
                return {
                  ...d,
                  display_lap_duration: participatedInPhase ? (phaseLap?.lap_duration ?? null) : d.best_lap_duration,
                  participated_in_phase: participatedInPhase,
                };
              }).sort((a: any, b: any) => {
                if (a.participated_in_phase && !b.participated_in_phase) return -1;
                if (!a.participated_in_phase && b.participated_in_phase) return 1;
                if (!a.display_lap_duration && !b.display_lap_duration) return 0;
                if (!a.display_lap_duration) return 1;
                if (!b.display_lap_duration) return -1;
                return a.display_lap_duration - b.display_lap_duration;
              });
            } else {
              displayedDrivers = qualifyingDrivers.map((d: any) => ({
                ...d,
                display_lap_duration: d.best_lap_duration,
                participated_in_phase: true,
              }));
            }

            const leaderTime = displayedDrivers[0]?.display_lap_duration;

            return displayedDrivers.map((driver, index) => {
              const isEliminated = isHistoricalView
                ? !driver.participated_in_phase
                : (activeQualiPhase === "Q1" && index >= 16) ||
                  (activeQualiPhase === "Q2" && index >= 10) ||
                  (activeQualiPhase === "Q3" && index >= 10);
              const teamColor = isEliminated ? "#444444" : (`#${driver.team_colour}` || "#FFFFFF");
              const gap = driver.display_lap_duration && leaderTime
                ? driver.display_lap_duration - leaderTime
                : null;
              const gapStr = gap !== null
                ? (index === 0 ? "LEADER" : `+${gap.toFixed(3)}`)
                : "--";
              const acronym = driver.name_acronym;
              const isExpanded = expandedDriver === acronym;

              const qualiRecord = circuitInfo?.qualiRecord ?? null;
              const vsRecord = (() => {
                if (!driver.display_lap_duration || !qualiRecord?.time) return null;
                return formatDelta(driver.display_lap_duration - timeToSecs(qualiRecord.time));
              })();

              const vsPb = (() => {
                if (!driver.display_lap_duration) return null;
                const pb = pbData[acronym];
                if (!pb?.lapDuration) return null;
                return formatDelta(driver.display_lap_duration - pb.lapDuration);
              })();

              return (
                <View key={driver.driver_number}>
                  <TouchableOpacity
                    onPress={() => setExpandedDriver(isExpanded ? null : acronym)}
                    style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: isExpanded ? 0 : 0.5, borderBottomColor: "#1A1A1A" }}
                  >
                    <Text style={{ color: isEliminated ? "#555555" : "#999999", fontSize: 11, width: 16 }}>{index + 1}</Text>
                    <View style={{ width: 2, height: 16, backgroundColor: teamColor, borderRadius: 2, marginRight: 6 }} />
                    {driver.headshot_url ? (
                      <Image source={{ uri: driver.headshot_url }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 6, backgroundColor: "#2A2A2A" }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 32, height: 32, borderRadius: 16, marginRight: 6, backgroundColor: "#2A2A2A" }} />
                    )}
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
                        {formatLapTime(driver.display_lap_duration)}
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
        <Modal transparent animationType="slide" visible={showWeatherModal} onRequestClose={() => setShowWeatherModal(false)}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowWeatherModal(false)} />
          <View style={{ backgroundColor: "#141414", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <View style={{ width: 40, height: 4, backgroundColor: "#2A2A2A", borderRadius: 2, alignSelf: "center", marginBottom: 20 }} />
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 1, marginBottom: 20 }}>CONDIZIONI PISTA</Text>
            {!raceWeather ? (
              <Text style={{ color: "#999999", fontSize: 13, textAlign: "center", paddingVertical: 24 }}>Dati meteo non disponibili</Text>
            ) : (
              <>
                <Text style={{ color: "#999999", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 8 }}>🌡 TEMPERATURA</Text>
                <View style={{ backgroundColor: "#1E1E1E", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <WeatherRow label="Asfalto" value={`${raceWeather.track_temperature ?? "—"}°C`} />
                  <WeatherRow label="Aria" value={`${raceWeather.air_temperature ?? "—"}°C`} />
                </View>
                <Text style={{ color: "#999999", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 8 }}>💧 UMIDITÀ & PIOGGIA</Text>
                <View style={{ backgroundColor: "#1E1E1E", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <WeatherRow label="Umidità" value={`${raceWeather.humidity ?? "—"}%`} />
                  <WeatherRow label="Pioggia in corso" value={raceWeather.rainfall ? "Sì 🌧" : "No ☀️"} />
                  {raceRainRisk !== null && <WeatherRow label="Rischio pioggia" value={raceRainRisk} highlight={parseInt(raceRainRisk) > 30} />}
                </View>
                <Text style={{ color: "#999999", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 8 }}>💨 VENTO</Text>
                <View style={{ backgroundColor: "#1E1E1E", borderRadius: 10, padding: 14 }}>
                  <WeatherRow label="Velocità" value={`${raceWeather.wind_speed ?? "—"} m/s`} />
                  <WeatherRow label="Direzione" value={raceWeather.wind_direction != null ? `${raceWeather.wind_direction}° (${getWindDirection(raceWeather.wind_direction)})` : "—"} />
                </View>
              </>
            )}
          </View>
        </Modal>
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