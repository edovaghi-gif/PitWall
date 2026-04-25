import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassView } from 'expo-glass-effect';
import * as Haptics from 'expo-haptics';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { MotiView } from 'moti';

const logo = require('../../assets/images/PitWall Logo.png');
const qualiPb2025 = require('../../assets/quali-pb-2025.json');

const TEAM_LOGOS: Record<string, any> = {
  'Mercedes': require('../../assets/images/mercedes.png'),
  'McLaren': require('../../assets/images/mclaren.png'),
  'Ferrari': require('../../assets/images/ferrari.png'),
  'Red Bull': require('../../assets/images/redbull.png'),
  'Aston Martin': require('../../assets/images/astonmartin.png'),
  'Alpine F1 Team': require('../../assets/images/alpine.png'),
  'Haas F1 Team': require('../../assets/images/haas.png'),
  'Audi': require('../../assets/images/audi.png'),
  'Cadillac': require('../../assets/images/cadillac.png'),
  'Racing Bulls': require('../../assets/images/racingbull.png'),
  'Williams': require('../../assets/images/williams.png'),
};

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

const HOME_TEAM_COLORS: Record<string, string> = {
  ferrari: "#E8002D", red_bull: "#3671C6", mclaren: "#FF8000",
  mercedes: "#27F4D2", williams: "#00A3E0", alpine: "#FF87BC",
  aston_martin: "#229971", haas: "#B6BABD", rb: "#6692FF", sauber: "#52E252",
};

const TOTAL_LAPS: Record<string, number> = {
  "Suzuka": 53, "Miami": 57, "Sakhir": 57, "Jeddah": 50, "Melbourne": 58,
  "Shanghai": 56, "Monte Carlo": 78, "Catalunya": 66, "Montreal": 70,
  "Spielberg": 71, "Silverstone": 52, "Hungaroring": 70, "Spa-Francorchamps": 44,
  "Zandvoort": 72, "Monza": 53, "Baku": 51, "Singapore": 62, "Austin": 56,
  "Mexico City": 71, "Interlagos": 71, "Las Vegas": 50, "Lusail": 57,
  "Yas Marina Circuit": 58,
};

function getLastTwoLaps(
  driverNumber: number,
  lapPhase: number | null,
  laps: any[],
  getPhaseWindowFn: (phase: number) => { start: Date | null; end: Date | null },
  bestLapDuration: number | null
): { current: any | null; prev: any | null } {
  if (lapPhase === null || bestLapDuration === null) return { current: null, prev: null };
  const window = getPhaseWindowFn(lapPhase);
  const driverLaps = laps.filter((l: any) => {
    if (l.driver_number !== driverNumber) return false;
    if (window.start && l.date_start && new Date(l.date_start) < window.start) return false;
    if (window.end && l.date_start && new Date(l.date_start) > window.end) return false;
    return true;
  });
  const current = driverLaps.find(
    (l: any) => l.lap_duration != null && Math.abs(l.lap_duration - bestLapDuration) < 0.001
  ) ?? null;
  if (!current) return { current: null, prev: null };
  const isTimedLap = (l: any): boolean => {
    const s1: number[] = l.segments_sector_1 ?? [];
    const s2: number[] = l.segments_sector_2 ?? [];
    const s3: number[] = l.segments_sector_3 ?? [];
    return s1.some(v => v !== 2048) && s2.some(v => v !== 2048) && s3.some(v => v !== 2048);
  };
  const prev = driverLaps
    .filter((l: any) =>
      l.lap_number < current.lap_number &&
      !l.is_pit_out_lap &&
      l.lap_duration != null &&
      l.duration_sector_1 != null &&
      isTimedLap(l)
    )
    .sort((a: any, b: any) => b.lap_number - a.lap_number)[0] ?? null;
  return { current, prev };
}

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

function getPaceColor(lap: { time: number | null; isPit: boolean; isOut: boolean; isSafetyCarLap: boolean }, driverNumber: number, overallBestLap: number | null, driverAverages: Record<number, number>): { bg: string; isSpecial: boolean; label?: string; isSc?: boolean } {
  if (lap.isPit) return { bg: '#FFFFFF', isSpecial: true, label: 'PIT', isSc: lap.isSafetyCarLap };
  if (lap.isOut) return { bg: '#FFFFFF', isSpecial: true, label: 'OUT', isSc: lap.isSafetyCarLap };
  if (!lap.time) return { bg: '#2A2A2A', isSpecial: false };
  if (lap.isSafetyCarLap) return { bg: '#0A0A0A', isSpecial: false, isSc: true };
  if (overallBestLap !== null && Math.abs(lap.time - overallBestLap) < 0.001) return { bg: '#9B59B6', isSpecial: false };
  const avg = driverAverages[driverNumber];
  if (avg !== undefined && lap.time <= avg) return { bg: '#27AE60', isSpecial: false };
  return { bg: '#E8A000', isSpecial: false };
}

function getRaceSectorColor(value: number | null, sector: 1|2|3, allLaps: Record<number, any>, completedAt: number | null): string {
  if (value === null) return '#2A2A2A';
  if (completedAt !== null && Date.now() - completedAt > 8000) return '#2A2A2A';

  const allValues = Object.values(allLaps)
    .map((l: any) => sector === 1 ? l.s1 : sector === 2 ? l.s2 : l.s3)
    .filter((v): v is number => typeof v === 'number' && v > 0);

  if (allValues.length === 0) return '#999999';

  const best = Math.min(...allValues);

  if (value <= best + 0.05) return '#9B59B6';
  if (value <= best * 1.015) return '#27AE60';
  return '#F39C12';
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
  const QUALI_DEV_MODE = true;
  const [activeQualiPhase, setActiveQualiPhase] = useState<string | null>(QUALI_DEV_MODE ? "Q3" : null);
  const QUALI_DEV_SESSION_KEY = 11249;
  const QUALI_DEV_MAX_LAP = 999;
  const FP_DEV_MODE = false;
  const FP_DEV_CIRCUIT = "Suzuka";
  const FP_DEV_YEAR = 2026;
  const RACE_DEV_MODE = false;
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
  const [raceEvents, setRaceEvents] = useState<Array<{time: string, type: string, message: string}>>([]);
  const [eventsExpanded, setEventsExpanded] = useState(false);
  const [raceLiveTab, setRaceLiveTab] = useState<'classifica' | 'pace' | 'stints'>('classifica');
  const MONO = 'JetBrainsMono_700Bold';
  const MONO_REG = 'JetBrainsMono_400Regular';
  const [paceData, setPaceData] = useState<Record<number, Array<{lap: number, time: number | null, isPit: boolean, isOut: boolean, isSafetyCarLap: boolean}>>>({});
  const [showLapTimes, setShowLapTimes] = useState(false);
  const [stintsTimelineWidth, setStintsTimelineWidth] = useState(0);
  const paceScrollRef = useRef<ScrollView>(null);
  const paceHeaderScrollRef = useRef<ScrollView>(null);
  const weatherBottomSheetRef = useRef<BottomSheet>(null);
  const previousIntervalsRef = useRef<Record<number, number>>({});
  const raceStintsRef = useRef<any[]>([]);
  const raceDriversCacheRef = useRef<any[]>([]);
  const raceLapsRef = useRef<Record<number, { s1: number|null, s2: number|null, s3: number|null, lapTime: number|null, lapNumber: number|null }>>({});
  const raceCurrentLapRef = useRef<number>(0);
  const sectorCompleteTimeRef = useRef<Record<number, number>>({});
  const dnfRef = useRef<Set<number>>(new Set());
  const [expandedRaceDriver, setExpandedRaceDriver] = useState<number | null>(null);
  const [expandedPaceDriver, setExpandedPaceDriver] = useState<number | null>(null);
  const [selectedPaceBar, setSelectedPaceBar] = useState<{ driverNumber: number; lapNum: number } | null>(null);
  const [expandedStintDriver, setExpandedStintDriver] = useState<number | null>(null);
  const [selectedTrend, setSelectedTrend] = useState<{ driverNumber: number; seqIdx: number } | null>(null);
  const [showGapToLeader, setShowGapToLeader] = useState(false);
  const [homeHeadshots, setHomeHeadshots] = useState<Record<string, string>>({});
  const gapHistoryRef = useRef<Record<number, Array<{gap: number, stint: number, timestamp: number}>>>({});
  const arrowTranslateRef = useRef(new Animated.Value(0));
  const arrowOpacityRef = useRef(new Animated.Value(1));
  const arrowLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    fetchData();
    fetchHomeHeadshots();
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

  async function fetchPaceData(sessionKey: number): Promise<Record<number, Array<{lap: number, time: number | null, isPit: boolean, isOut: boolean, isSafetyCarLap: boolean}>>> {
    const data = await safeFetch(`https://api.openf1.org/v1/laps?session_key=${sessionKey}`);
    await new Promise(r => setTimeout(r, 500));
    const stintsData = await safeFetch(`https://api.openf1.org/v1/stints?session_key=${sessionKey}`);
    if (!Array.isArray(data)) return {};

    // Build pit/out sets from stints (authoritative)
    const pitLaps = new Set<string>();  // `${driver_number}_${lap_start - 1}`
    const outLaps = new Set<string>();  // `${driver_number}_${lap_start}`
    if (Array.isArray(stintsData)) {
      for (const stint of stintsData) {
        if (!stint.driver_number || stint.lap_start == null) continue;
        if (stint.stint_number > 1) {
          pitLaps.add(`${stint.driver_number}_${stint.lap_start - 1}`);
          outLaps.add(`${stint.driver_number}_${stint.lap_start}`);
        }
      }
    }

    const byDriver: Record<number, Array<{lap: number, time: number | null, isPit: boolean, isOut: boolean, isSafetyCarLap: boolean}>> = {};
    for (const lap of data) {
      const num = lap.driver_number;
      if (!num) continue;
      if (!byDriver[num]) byDriver[num] = [];
      const key = `${num}_${lap.lap_number}`;
      byDriver[num].push({
        lap: lap.lap_number,
        time: lap.lap_duration ?? null,
        isPit: pitLaps.has(key),
        isOut: outLaps.has(key),
        isSafetyCarLap: false,
      });
    }
    setPaceData(byDriver);
    return byDriver;
  }

  function recomputeScFlags(byDriver: Record<number, Array<{lap: number, time: number | null, isPit: boolean, isOut: boolean, isSafetyCarLap: boolean}>>) {
    const rcEvents = raceControlRef.current;
    const scWindows: Array<{startLap: number, endLap: number}> = [];
    let scStartLap: number | null = null;
    for (const e of rcEvents) {
      const msg: string = e.message ?? '';
      const lapNum: number | null = e.lap_number ?? null;
      const isSCDeployed = msg.includes('SAFETY CAR DEPLOYED') && !msg.includes('VIRTUAL');
      const isVSCDeployed = msg.includes('VIRTUAL SAFETY CAR DEPLOYED') || msg.includes('VSC DEPLOYED');
      const isSCEnd = msg.includes('SAFETY CAR IN THIS LAP');
      const isVSCEnd = msg.includes('VIRTUAL SAFETY CAR ENDING') || msg.includes('VSC ENDING');
      if ((isSCDeployed || isVSCDeployed) && lapNum !== null && scStartLap === null) scStartLap = lapNum;
      if ((isSCEnd || isVSCEnd) && lapNum !== null && scStartLap !== null) {
        scWindows.push({ startLap: scStartLap, endLap: lapNum });
        scStartLap = null;
      }
    }
    if (scStartLap !== null) scWindows.push({ startLap: scStartLap, endLap: Infinity });

    const updated: typeof byDriver = {};
    for (const [numStr, laps] of Object.entries(byDriver)) {
      updated[Number(numStr)] = laps.map(l => ({
        ...l,
        isSafetyCarLap: scWindows.some(w => l.lap >= w.startLap && l.lap <= w.endLap),
      }));
    }
    setPaceData(updated);
  }

  async function fetchHomeHeadshots() {
    try {
      const sessRes = await fetch('https://api.openf1.org/v1/sessions?year=2026&session_type=Race');
      const sessData = await sessRes.json();
      if (!Array.isArray(sessData) || sessData.length === 0) return;
      const sessionKey = sessData[sessData.length - 1].session_key;
      const drvRes = await fetch(`https://api.openf1.org/v1/drivers?session_key=${sessionKey}`);
      const drvData = await drvRes.json();
      if (!Array.isArray(drvData)) return;
      const map: Record<string, string> = {};
      for (const d of drvData) {
        if (d.name_acronym && d.headshot_url) {
          map[d.name_acronym] = d.headshot_url;
        }
      }
      setHomeHeadshots(map);
    } catch {}
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
      if (!Array.isArray(data) || data.length === 0) return;
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
        <Text style={{ color: "#999999", fontSize: 11, fontFamily: MONO_REG }}>{label}</Text>
        <Text style={{ color: highlight ? "#F39C12" : "#FFFFFF", fontSize: 12, fontFamily: MONO }}>{value}</Text>
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
      positionData = await safeFetch(`https://api.openf1.org/v1/position?session_key=${sessionKey}`);
      await new Promise(resolve => setTimeout(resolve, 400));
      intervalsData = await safeFetch(`https://api.openf1.org/v1/intervals?session_key=${sessionKey}`);
      await new Promise(resolve => setTimeout(resolve, 400));
      rcData = await safeFetch(`https://api.openf1.org/v1/race_control?session_key=${sessionKey}`);
      if (raceDriversCacheRef.current.length === 0) {
        await new Promise(resolve => setTimeout(resolve, 400));
        const driversData = await safeFetch(`https://api.openf1.org/v1/drivers?session_key=${sessionKey}`);
        if (Array.isArray(driversData) && driversData.length > 0) {
          raceDriversCacheRef.current = driversData;
        }
      }
    } catch { return; }
    const drivers = raceDriversCacheRef.current;

    if (!Array.isArray(positionData) || !Array.isArray(intervalsData) || !Array.isArray(rcData)) return;
    raceControlRef.current = rcData;

    // raceLap: max lap_number from positionData, fallback totalLaps
    let maxLapFound: number | null = null;
    for (const entry of positionData) {
      if (entry.lap_number != null && entry.lap_number > (maxLapFound ?? 0)) {
        maxLapFound = entry.lap_number;
      }
    }
    const resolvedLap = maxLapFound ?? totalLaps;
    setRaceLap(resolvedLap);
    raceCurrentLapRef.current = resolvedLap;

    const currentLap = resolvedLap;
    if (currentLap > 0) {
      await new Promise(resolve => setTimeout(resolve, 400));
      const lapsData = await safeFetch(`https://api.openf1.org/v1/laps?session_key=${sessionKey}&lap_number=${currentLap}`);
      if (Array.isArray(lapsData)) {
        for (const lap of lapsData) {
          if (!lap.driver_number) continue;
          const prev = raceLapsRef.current[lap.driver_number];
          const isNewLap = prev?.lapNumber != null && prev.lapNumber !== lap.lap_number;
          if (isNewLap) {
            delete raceLapsRef.current[lap.driver_number];
            delete sectorCompleteTimeRef.current[lap.driver_number];
          }
          const hadS3 = prev?.s3 != null;
          const nowHasS3 = lap.duration_sector_3 != null;
          if (!hadS3 && nowHasS3) {
            sectorCompleteTimeRef.current[lap.driver_number] = Date.now();
          }
          raceLapsRef.current[lap.driver_number] = {
            s1: lap.duration_sector_1 ?? null,
            s2: lap.duration_sector_2 ?? null,
            s3: lap.duration_sector_3 ?? null,
            lapTime: lap.lap_duration ?? null,
            lapNumber: lap.lap_number ?? null,
          };
        }
      }
    }

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

    const allEvents = rcData
      .filter((e: any) => e.message && e.message.length > 2)
      .reverse()
      .map((e: any) => {
        const date = new Date(e.date);
        const time = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}`;
        const category = e.category ?? '';
        let type = 'DIR';
        if (category === 'Flag') type = 'FLAG';
        else if (category === 'SafetyCar') type = 'SC';
        else if (category === 'Drs') type = 'DRS';
        else if (e.message?.includes('INVESTIGATION') || e.message?.includes('INFRINGEMENT')) type = 'INV';
        else if (e.message?.includes('PENALTY')) type = 'PEN';
        return { time, type, message: e.message };
      });
    setRaceEvents(allEvents);

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

    // Populate events feed for qualifying (same logic as race mode)
    const allEvents = data
      .filter((e: any) => e.message && e.message.trim() !== '')
      .reverse()
      .map((e: any) => {
        const category = e.category ?? '';
        let type = 'DIR';
        if (category === 'Flag') type = 'FLAG';
        else if (category === 'SafetyCar') type = 'SC';
        else if (category === 'Drs') type = 'DRS';
        else if (e.message?.includes('INVESTIGATION') || e.message?.includes('INFRINGEMENT')) type = 'INV';
        else if (e.message?.includes('PENALTY')) type = 'PEN';
        const date = new Date(e.date);
        const time = `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}:${String(date.getSeconds()).padStart(2,'0')}`;
        return { time, type, message: e.message };
      });
    setRaceEvents(allEvents);

    // Red flag detection
    const recentRed = data.slice(-10).some((e: any) => e.flag === 'RED');
    setRaceRedFlagActive(recentRed);

    // Yellow flag sectors
    const qYellowSectors: Record<number, string> = {};
    for (const e of data) {
      if (e.flag === 'YELLOW') { const s = e.sector ?? 0; qYellowSectors[s] = 'YELLOW'; }
      if ((e.flag === 'CLEAR' || e.flag === 'GREEN') && e.sector != null) delete qYellowSectors[e.sector];
    }
    const qActiveSectors = Object.keys(qYellowSectors).map(Number).filter(s => s > 0).sort((a, b) => a - b);
    const qHasGeneric = qYellowSectors[0] !== undefined;
    setRaceYellowSectors(qHasGeneric && qActiveSectors.length === 0 ? [-1] : qActiveSectors);
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
        }
      } catch {}
      fetchRaceData();
      fetchRaceStints();
      fetchRaceWeather();
      if (Object.keys(paceData).length === 0) {
        const pace = await fetchPaceData(sessionKey);
        setPaceData(pace);
      }
    })();
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

  useEffect(() => {
    if (raceLiveTab !== 'pace') return;
    const sessionKey = RACE_DEV_MODE ? RACE_DEV_SESSION_KEY : activeSession?.session_key;
    if (!sessionKey) return;
    (async () => {
      // Fetch pace data immediately — don't wait for fetchRaceData
      const byDriver = await fetchPaceData(sessionKey);
      // Then update SC flags in background using whatever raceControlRef already has
      recomputeScFlags(byDriver);
      // Then fetch race data in background to refresh raceControlRef and raceDriversCacheRef
      await fetchRaceData();
      // Recompute SC flags again now that raceControlRef is fresh
      recomputeScFlags(byDriver);
    })();
  }, [raceLiveTab]);

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
    const weatherLabel = !raceWeather ? '—' : raceWeather.rainfall ? 'WET' : 'DRY';
    const weatherColor = !raceWeather ? '#999' : raceWeather.rainfall ? '#4FC3F7' : '#E8A000';
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", paddingTop: 52 }}>
        <View style={styles.navbar}>
          <Image source={logo} style={{ height: 32, width: 160, resizeMode: 'contain' }} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#E10600", marginRight: 8, opacity: pulseAnim }} />
            <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "800", letterSpacing: 1, fontFamily: MONO }}>
              GIRO {raceLap ?? "—"}/{raceTotalLaps ?? "—"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => weatherBottomSheetRef.current?.expand()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: "#999999", fontSize: 13, fontFamily: MONO }}>{raceWeather?.track_temperature ?? "—"}°C{' '}</Text>
            <Text style={{ color: weatherColor, fontSize: 11, fontWeight: '700', fontFamily: MONO }}>{weatherLabel}</Text>
            <Text style={{ color: "#999999", fontSize: 13, fontFamily: MONO }}>{' '}›</Text>
          </TouchableOpacity>
        </View>
        {raceRedFlagActive && (
          <MotiView from={{ opacity: 0, translateY: -8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 250 }}>
            <View style={{ backgroundColor: '#1A0000', borderWidth: 1, borderColor: '#E10600', marginHorizontal: 12, marginVertical: 4, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E10600', opacity: pulseAnim }} />
                <Text style={{ color: '#E10600', fontSize: 10 }}>▲</Text>
                <Text style={{ color: '#E10600', fontSize: 12, fontWeight: '700', letterSpacing: 2, fontFamily: MONO }}>RED FLAG</Text>
              </View>
              <Text style={{ color: '#E10600', fontSize: 9, letterSpacing: 1.5, fontFamily: MONO, opacity: 0.7 }}>LAPS COUNTING</Text>
            </View>
          </MotiView>
        )}
        {(raceSafetyCarActive || raceVscActive) && (
          <MotiView from={{ opacity: 0, translateY: -8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 250 }}>
            <View style={{ backgroundColor: '#1A1500', borderWidth: 1, borderColor: '#F39C12', marginHorizontal: 12, marginVertical: 4, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#F39C12', opacity: pulseAnim }} />
                <Text style={{ color: '#F39C12', fontSize: 10 }}>▲</Text>
                <Text style={{ color: '#F39C12', fontSize: 12, fontWeight: '700', letterSpacing: 2, fontFamily: MONO }}>
                  {raceSafetyCarActive ? 'SAFETY CAR' : 'VIRTUAL SC'}
                </Text>
              </View>
              <Text style={{ color: '#F39C12', fontSize: 9, letterSpacing: 1.5, fontFamily: MONO, opacity: 0.7 }}>LAPS COUNTING</Text>
            </View>
          </MotiView>
        )}
        {raceYellowSectors.length > 0 && (() => {
          const yellowLabel = raceYellowSectors[0] === -1
            ? "⚠️ BANDIERA GIALLA"
            : `⚠️ GIALLA ${raceYellowSectors.join(' · ')}`;
          return (
            <View style={{ backgroundColor: "#F39C12", marginHorizontal: 16, marginBottom: 8, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 12, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "#000000", fontWeight: "700", fontSize: 11, letterSpacing: 0.5, fontFamily: MONO }}>{yellowLabel}</Text>
            </View>
          );
        })()}
        {raceEvents.length > 0 && (
          <View style={{ borderBottomWidth: 0.5, borderBottomColor: '#0D0D0D' }}>
            <TouchableOpacity
              onPress={() => setEventsExpanded(prev => !prev)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: eventsExpanded ? 0.5 : 0, borderBottomColor: '#0A0A0A' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  backgroundColor: raceEvents[0].type === 'INV' ? '#F39C12' : raceEvents[0].type === 'FLAG' ? '#E10600' : '#1A1A1A',
                  borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1
                }}>
                  <Text style={{ color: raceEvents[0].type === 'INV' || raceEvents[0].type === 'FLAG' ? '#000' : '#555', fontSize: 9, fontWeight: '700' }}>{raceEvents[0].type}</Text>
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: MONO_REG }} numberOfLines={1}>{raceEvents[0].message}</Text>
              </View>
              <Text style={{ color: '#444', fontSize: 11 }}>{eventsExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>

            {eventsExpanded && (
              <ScrollView style={{ height: 160 }} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
                {raceEvents.map((event, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#0A0A0A', opacity: i === 0 ? 1 : 0.5 }}>
                    <Text style={{ color: '#444', fontSize: 10, fontVariant: ['tabular-nums'], width: 56, marginRight: 6, fontFamily: MONO_REG }}>{event.time}</Text>
                    <View style={{
                      backgroundColor: event.type === 'INV' ? '#F39C12' : event.type === 'FLAG' ? '#E10600' : event.type === 'PEN' ? '#E10600' : '#1A1A1A',
                      borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1, marginRight: 8, minWidth: 32
                    }}>
                      <Text style={{ color: event.type === 'INV' || event.type === 'FLAG' || event.type === 'PEN' ? '#000' : '#555', fontSize: 9, fontWeight: '700' }}>{event.type}</Text>
                    </View>
                    <Text style={{ color: i === 0 ? '#FFFFFF' : '#666', fontSize: 11, flex: 1, lineHeight: 15, fontFamily: MONO_REG }} numberOfLines={2}>{event.message}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}
        <View style={{ flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: '#1A1A1A', marginBottom: 0 }}>
          {(['classifica', 'pace', 'stints'] as const).map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setRaceLiveTab(tab)}
              style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: raceLiveTab === tab ? '#E10600' : 'transparent' }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: raceLiveTab === tab ? '#FFFFFF' : '#444', fontFamily: MONO }}>
                {tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {raceLiveTab === 'classifica' && (
          <>
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#2A2A2A" }}>
              <View style={{ width: 18 }} />
              <View style={{ width: 10 }} />
              <View style={{ width: 32, marginHorizontal: 4 }} />
              <View style={{ width: 32 }} />
              <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowGapToLeader(v => !v); }} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: 72, gap: 10 }}>
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: !showGapToLeader ? '#00C850' : '#1A1A1A', borderWidth: 0.5, borderColor: !showGapToLeader ? '#00C850' : '#333' }} />
                  <Text style={{ color: !showGapToLeader ? '#FFFFFF' : '#444', fontSize: 7, fontFamily: MONO }}>INT</Text>
                </View>
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: showGapToLeader ? '#00C850' : '#1A1A1A', borderWidth: 0.5, borderColor: showGapToLeader ? '#00C850' : '#333' }} />
                  <Text style={{ color: showGapToLeader ? '#FFFFFF' : '#444', fontSize: 7, fontFamily: MONO }}>GAP</Text>
                </View>
              </TouchableOpacity>
              <Text numberOfLines={1} style={{ color: "#444", fontSize: 8, width: 46, textAlign: "center", marginLeft: 6, fontFamily: MONO }}>S1 S2 S3</Text>
              <Text style={{ color: "#444", fontSize: 8, width: 68, textAlign: "right", marginLeft: 4, fontFamily: MONO }}>LAP TIME</Text>
              <Text style={{ color: "#555555", fontSize: 8, width: 20, textAlign: "center", marginLeft: 8, fontFamily: MONO }}>CPD</Text>
              <Text style={{ color: "#555555", fontSize: 8, width: 20, textAlign: "center", marginLeft: 4, fontFamily: MONO }}>AGE</Text>
              <Text style={{ color: "#555555", fontSize: 8, width: 16, textAlign: "center", marginLeft: 4, fontFamily: MONO }}>PIT</Text>
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
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setExpandedRaceDriver(isExpanded ? null : driver.driver_number); }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: "#1A1A1A" }}>
                      <Text style={{ color: "#999999", fontSize: 12, width: 18, fontFamily: MONO }}>{driver.position}</Text>
                      <View style={{ width: 10, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: 2, height: 20, backgroundColor: teamColor, borderRadius: 1 }} /></View>
                      {driver.headshot_url ? (
                        <Image source={{ uri: driver.headshot_url }} style={{ width: 32, height: 32, borderRadius: 16, marginHorizontal: 4, backgroundColor: "#2A2A2A" }} resizeMode="cover" />
                      ) : (
                        <View style={{ width: 32, height: 32, borderRadius: 16, marginHorizontal: 4, backgroundColor: "#2A2A2A" }} />
                      )}
                      <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700", width: 32, fontFamily: MONO }}>{driver.name_acronym}</Text>
                      <Text style={{ fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"], width: 72, textAlign: 'left', color: intervalColor, fontFamily: MONO }}>
                        {intervalDisplay}
                      </Text>
                      {(() => {
                        const lapData = raceLapsRef.current[driver.driver_number];
                        const completedAt = sectorCompleteTimeRef.current[driver.driver_number] ?? null;
                        const s1Color = getRaceSectorColor(lapData?.s1 ?? null, 1, raceLapsRef.current, completedAt);
                        const s2Color = getRaceSectorColor(lapData?.s2 ?? null, 2, raceLapsRef.current, completedAt);
                        const s3Color = getRaceSectorColor(lapData?.s3 ?? null, 3, raceLapsRef.current, completedAt);
                        return (
                          <>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, width: 46, marginLeft: 6 }}>
                              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: s1Color }} />
                              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: s2Color }} />
                              <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: s3Color }} />
                            </View>
                            <Text style={{ color: lapData?.lapTime ? '#FFFFFF' : '#333', fontSize: 11, fontVariant: ['tabular-nums'], fontWeight: '500', width: 68, textAlign: 'right', marginLeft: 4, fontFamily: MONO }}>
                              {lapData?.lapTime ? formatLapTime(lapData.lapTime) : '—'}
                            </Text>
                            {(!lapData?.lapTime && lapData?.lapNumber === raceLap) && (
                              <View style={{ backgroundColor: '#F39C12', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginLeft: 4 }}>
                                <Text style={{ color: '#000', fontSize: 9, fontWeight: '800' }}>PIT</Text>
                              </View>
                            )}
                          </>
                        );
                      })()}
                      <View style={{ backgroundColor: tyre.bg, borderRadius: 4, width: 20, height: 20, alignItems: "center", justifyContent: "center", marginLeft: 8 }}>
                        <Text style={{ color: tyre.textColor, fontSize: 10, fontWeight: "800" }}>{tyre.label}</Text>
                      </View>
                      {driver.tyre_age !== null && (
                        <Text style={{ color: "#999999", fontSize: 10, width: 20, marginLeft: 4, textAlign: 'center', fontFamily: MONO }}>{driver.tyre_age}</Text>
                      )}
                      <Text style={{ color: "#555555", fontSize: 10, width: 16, marginLeft: 4, textAlign: 'center', fontFamily: MONO_REG }}>{driver.stops > 0 ? `${driver.stops}S` : ""}</Text>
                    </View>
                  </TouchableOpacity>
                  {isExpanded && !driver.isDnf && (
                    <MotiView from={{ opacity: 0, translateY: -6 }} animate={{ opacity: 1, translateY: 0 }} exit={{ opacity: 0, translateY: -6 }} transition={{ type: 'timing', duration: 180 }} style={{ backgroundColor: '#0F0F0F', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: '#1A1A1A' }}>
                      <Text style={{ color: '#444444', fontSize: 7, fontFamily: MONO, letterSpacing: 2, marginBottom: 4 }}>DIETRO</Text>
                      {!driverBehind || driverBehind.isDnf ? (
                        <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "700", fontFamily: MONO }}>—</Text>
                      ) : (
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                          <View>
                            <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700', fontFamily: MONO, marginBottom: 2 }}>{driverBehind.name_acronym}</Text>
                            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700', fontFamily: MONO }}>{driverBehind.interval}</Text>
                            {raceSafetyCarActive || raceVscActive ? (
                              <Text style={{ color: '#F39C12', fontSize: 8, fontFamily: MONO, letterSpacing: 1, marginTop: 4 }}>▲ SC/VSC — TREND SOSPESO</Text>
                            ) : trendBehind ? (
                              <Text style={{ color: trendBehind.color, fontSize: 8, fontFamily: MONO, marginTop: 4 }}>{trendBehind.text}</Text>
                            ) : null}
                          </View>
                          {arrowConfig ? (
                            <View style={{ alignItems: "flex-end" }}>
                              <View style={{ overflow: "hidden", flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
                                {(arrowConfig.type === 'stable' || arrowConfig.type === 'sc') ? (
                                  <Animated.Text style={{ color: arrowConfig.color, fontSize: 16, fontFamily: MONO, letterSpacing: 3, opacity: arrowOpacityRef.current }}>
                                    {arrowConfig.text}
                                  </Animated.Text>
                                ) : (
                                  <Animated.View style={{ transform: [{ translateX: arrowTranslateRef.current }] }}>
                                    <Text style={{ color: arrowConfig.color, fontSize: 16, fontFamily: MONO, letterSpacing: 3 }}>{arrowConfig.text}</Text>
                                  </Animated.View>
                                )}
                              </View>
                              {arrowConfig.type === 'closing' && catchEst !== null && catchEst <= 30 && (
                                <Text style={{ fontSize: 9, fontFamily: MONO, color: '#27AE60', marginTop: 2 }}>~{catchEst} giri</Text>
                              )}
                            </View>
                          ) : null}
                        </View>
                      )}
                    </MotiView>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
          </>
        )}

        {raceLiveTab === 'pace' && (
          <View style={{ flex: 1 }}>
<View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 12, paddingVertical: 6 }}>
              <TouchableOpacity
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowLapTimes(prev => !prev); }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#0D0D0D', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}
              >
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: !showLapTimes ? '#00C850' : '#1A1A1A', borderWidth: 0.5, borderColor: !showLapTimes ? '#00C850' : '#333' }} />
                  <Text style={{ color: !showLapTimes ? '#FFFFFF' : '#444', fontSize: 7, fontFamily: MONO }}>GRAF</Text>
                </View>
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: showLapTimes ? '#00C850' : '#1A1A1A', borderWidth: 0.5, borderColor: showLapTimes ? '#00C850' : '#333' }} />
                  <Text style={{ color: showLapTimes ? '#FFFFFF' : '#444', fontSize: 7, fontFamily: MONO }}>LAP</Text>
                </View>
              </TouchableOpacity>
            </View>
            {(() => {
              const allLapNumbers = Array.from(new Set(
                Object.values(paceData).flat().map(l => l.lap)
              )).sort((a, b) => a - b);
              const driverOrder = raceDrivers.map((d: any) => d.driver_number);
              const allCached = raceDriversCacheRef.current;
              const raceDriverMeta: Record<number, {isDnf: boolean, isLapped: boolean, position: number}> = {};
              for (const d of raceDrivers) raceDriverMeta[d.driver_number] = { isDnf: d.isDnf, isLapped: d.isLapped, position: d.position ?? 999 };
              const drivers = [
                ...driverOrder.map((num: number) => allCached.find((d: any) => d.driver_number === num)).filter(Boolean),
                ...allCached.filter((d: any) => !driverOrder.includes(d.driver_number))
              ].sort((a: any, b: any) => {
                const am = raceDriverMeta[a.driver_number] ?? { isDnf: false, isLapped: false, position: 999 };
                const bm = raceDriverMeta[b.driver_number] ?? { isDnf: false, isLapped: false, position: 999 };
                const aScore = am.isDnf ? 2 : am.isLapped ? 1 : 0;
                const bScore = bm.isDnf ? 2 : bm.isLapped ? 1 : 0;
                if (aScore !== bScore) return aScore - bScore;
                return am.position - bm.position;
              });
              const cellWidth = showLapTimes ? 42 : 14;

              const scWindowsForRender: Array<{startLap: number, endLap: number}> = [];
              let _scStart: number | null = null;
              for (const e of raceControlRef.current) {
                const msg: string = e.message ?? '';
                const lapNum: number | null = e.lap_number ?? null;
                if (lapNum === null) continue;
                const isStart = (msg.includes('SAFETY CAR DEPLOYED') && !msg.includes('VIRTUAL')) || msg.includes('VIRTUAL SAFETY CAR DEPLOYED') || msg.includes('VSC DEPLOYED');
                const isEnd = msg.includes('SAFETY CAR IN THIS LAP') || msg.includes('VIRTUAL SAFETY CAR ENDING') || msg.includes('VSC ENDING');
                if (isStart && _scStart === null) _scStart = lapNum;
                if (isEnd && _scStart !== null) { scWindowsForRender.push({ startLap: _scStart, endLap: lapNum }); _scStart = null; }
              }
              if (_scStart !== null) scWindowsForRender.push({ startLap: _scStart, endLap: 9999 });
              const isScLapFn = (lapNum: number) => scWindowsForRender.some(w => lapNum >= w.startLap && lapNum <= w.endLap);

              const vscWindowsForRender: Array<{startLap: number, endLap: number}> = [];
              let _vscStart: number | null = null;
              for (const e of raceControlRef.current) {
                const msg: string = e.message ?? '';
                const lapNum: number | null = e.lap_number ?? null;
                if (lapNum === null) continue;
                const isVscStart = msg.includes('VIRTUAL SAFETY CAR DEPLOYED') || msg.includes('VSC DEPLOYED');
                const isVscEnd = msg.includes('VIRTUAL SAFETY CAR ENDING') || msg.includes('VSC ENDING');
                if (isVscStart && _vscStart === null) _vscStart = lapNum;
                if (isVscEnd && _vscStart !== null) { vscWindowsForRender.push({ startLap: _vscStart, endLap: lapNum }); _vscStart = null; }
              }
              if (_vscStart !== null) vscWindowsForRender.push({ startLap: _vscStart, endLap: 9999 });
              const isVscLapFn = (lapNum: number) => vscWindowsForRender.some(w => lapNum >= w.startLap && lapNum <= w.endLap);
              const isPureScLapFn = (lapNum: number) => isScLapFn(lapNum) && !isVscLapFn(lapNum);

              const validTimes = Object.values(paceData).flat()
                .filter(l => !l.isPit && !l.isOut && !isScLapFn(l.lap) && l.time !== null && l.time > 60 && l.time < 200)
                .map(l => l.time as number);
              const overallBestLap = validTimes.length > 0 ? Math.min(...validTimes) : null;

              const driverAverages: Record<number, number> = {};
              for (const [numStr, laps] of Object.entries(paceData)) {
                const valid = laps.filter(l => l.lap > 1 && !l.isPit && !l.isOut && !isScLapFn(l.lap) && !isVscLapFn(l.lap) && l.time !== null && l.time > 60 && l.time < 200).map(l => l.time as number);
                if (valid.length > 0) driverAverages[Number(numStr)] = valid.reduce((a, b) => a + b, 0) / valid.length;
              }

              return showLapTimes ? (
                // LAP MODE — sticky header + vertical ScrollView for driver rows
                <TouchableOpacity activeOpacity={1} onPress={() => setSelectedTrend(null)} style={{ flex: 1 }}>
                {/* STICKY HEADER — outside vertical ScrollView */}
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ width: 52 }} />
                  <ScrollView
                    ref={paceHeaderScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    scrollEnabled={false}
                  >
                    <View style={{ flexDirection: 'row', height: 36, alignItems: 'flex-end', paddingBottom: 4 }}>
                      {allLapNumbers.map(lapNum => {
                        const isVsc = isVscLapFn(lapNum);
                        const isSc = isPureScLapFn(lapNum);
                        return (
                          <View key={lapNum} style={{ width: cellWidth + 6, alignItems: 'center' }}>
                            {isVsc ? (
                              <Text style={{ color: '#F39C12', fontSize: 6, fontWeight: '700', lineHeight: 8 }}>VSC</Text>
                            ) : isSc ? (
                              <Text style={{ color: '#F39C12', fontSize: 6, fontWeight: '700', lineHeight: 8 }}>SC</Text>
                            ) : null}
                            <Text style={{ color: '#888', fontSize: 8 }}>{lapNum}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
                {/* SCROLLABLE CONTENT — vertical ScrollView, no header inside */}
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
                  <View style={{ flexDirection: 'row' }}>
                    {/* Fixed name column */}
                    <View style={{ width: 52 }}>
                      {drivers.map(driver => {
                        const teamColor = driver.team_colour ? (driver.team_colour.startsWith('#') ? driver.team_colour : `#${driver.team_colour}`) : '#FFFFFF';
                        return (
                          <View key={driver.driver_number} style={{ height: 36, flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 2, height: 20, borderRadius: 1, backgroundColor: teamColor, marginRight: 6, marginLeft: 12 }} />
                            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', fontFamily: MONO }}>{driver.name_acronym ?? driver.acronym ?? String(driver.driver_number)}</Text>
                          </View>
                        );
                      })}
                    </View>
                    {/* Single horizontal ScrollView — all driver rows, syncs header via onScroll */}
                    <ScrollView
                      ref={paceScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      scrollEventThrottle={16}
                      onScroll={(e) => paceHeaderScrollRef.current?.scrollTo({ x: e.nativeEvent.contentOffset.x, animated: false })}
                    >
                      <View>
                        {/* Driver rows */}
                        {drivers.map((driver, rowIndex) => {
                          const laps = paceData[driver.driver_number] ?? [];
                          const lapMap: Record<number, typeof laps[0]> = {};
                          for (const l of laps) lapMap[l.lap] = l;

                          const cleanLaps = laps
                            .filter(l => l.lap > 1 && !l.isPit && !l.isOut && !isScLapFn(l.lap) && !isVscLapFn(l.lap) && l.time !== null && l.time > 60 && l.time < 200)
                            .sort((a, b) => a.lap - b.lap);
                          const trendMap = new Map<number, string>();
                          let seqCounter = 0;
                          let i = 0;
                          while (i < cleanLaps.length - 2) {
                            const t0 = cleanLaps[i].time as number;
                            const t1 = cleanLaps[i + 1].time as number;
                            let direction: 'improving' | 'worsening' | null = null;
                            if (t1 < t0) direction = 'improving';
                            else if (t1 > t0) direction = 'worsening';
                            if (!direction) { i++; continue; }
                            let end = i + 1;
                            while (end + 1 < cleanLaps.length) {
                              const prev = cleanLaps[end].time as number;
                              const next = cleanLaps[end + 1].time as number;
                              if (direction === 'improving' && next < prev) end++;
                              else if (direction === 'worsening' && next > prev) end++;
                              else break;
                            }
                            const seqLen = end - i + 1;
                            const totalDelta = Math.abs((cleanLaps[end].time as number) - (cleanLaps[i].time as number));
                            if (seqLen >= 3 && totalDelta >= 0.1 * (seqLen - 1)) {
                              seqCounter++;
                              const tag = `${direction}-${seqCounter}`;
                              for (let k = i; k <= end; k++) trendMap.set(cleanLaps[k].lap, tag);
                              i = end + 2;
                            } else { i = end; }
                          }

                          const trendSequences: Array<{ startIdx: number; length: number; trend: 'improving' | 'worsening' }> = [];
                          {
                            let seqStart = -1; let seqTag: string | null = null; let seqLen = 0;
                            for (let idx = 0; idx < allLapNumbers.length; idx++) {
                              const t = trendMap.get(allLapNumbers[idx]) ?? null;
                              if (t && t === seqTag) { seqLen++; }
                              else {
                                if (seqTag && seqLen >= 3) trendSequences.push({ startIdx: seqStart, length: seqLen, trend: seqTag.startsWith('improving') ? 'improving' : 'worsening' });
                                seqStart = idx; seqTag = t; seqLen = 1;
                              }
                            }
                            if (seqTag && seqLen >= 3) trendSequences.push({ startIdx: seqStart, length: seqLen, trend: seqTag.startsWith('improving') ? 'improving' : 'worsening' });
                          }

                          return (
                            <TouchableOpacity key={driver.driver_number} activeOpacity={1} onPress={() => setSelectedTrend(null)} style={{ flexDirection: 'row', height: 36, alignItems: 'center', position: 'relative', zIndex: rowIndex === 0 ? 20 : 1, elevation: rowIndex === 0 ? 20 : 1 }}>
                              {trendSequences.map((seq, si) => {
                                const slotW = cellWidth + 6;
                                const trendColor = seq.trend === 'improving' ? '#27AE60' : '#E10600';
                                const trendBg = seq.trend === 'improving' ? 'rgba(39,174,96,0.18)' : 'rgba(225,6,0,0.18)';
                                const lapNums = allLapNumbers.slice(seq.startIdx, seq.startIdx + seq.length);
                                const firstTime = lapMap[lapNums[0]]?.time;
                                const lastTime = lapMap[lapNums[lapNums.length - 1]]?.time;
                                return (
                                  <TouchableOpacity key={`trend-${si}`} activeOpacity={0.8}
                                    onPress={() => {
                                      const isActive = selectedTrend?.driverNumber === driver.driver_number && selectedTrend?.seqIdx === si;
                                      setSelectedTrend(isActive ? null : { driverNumber: driver.driver_number, seqIdx: si });
                                    }}
                                    style={{
                                      position: 'absolute', left: seq.startIdx * slotW - 4, width: seq.length * slotW + 2,
                                      height: 30, top: 3, borderRadius: 10, borderWidth: 0.75, borderColor: trendColor,
                                      backgroundColor: trendBg, zIndex: 2,
                                    }}
                                  />
                                );
                              })}
                              {selectedTrend?.driverNumber === driver.driver_number && (() => {
                                const si = selectedTrend?.seqIdx;
                                const seq = trendSequences[si];
                                if (!seq) return null;
                                const lapNums = allLapNumbers.slice(seq.startIdx, seq.startIdx + seq.length);
                                const firstTime = lapMap[lapNums[0]]?.time;
                                const lastTime = lapMap[lapNums[lapNums.length - 1]]?.time;
                                if (firstTime == null || lastTime == null) return null;
                                const totalDelta = lastTime - firstTime;
                                const perLap = totalDelta / (seq.length - 1);
                                const isImproving = seq.trend === 'improving';
                                const accentColor = isImproving ? '#27AE60' : '#E10600';
                                const slotW = cellWidth + 6;
                                const rawLeft = seq.startIdx * slotW;
                                const maxLeft = allLapNumbers.length * slotW - 148;
                                const tooltipLeft = Math.max(0, Math.min(rawLeft, maxLeft));
                                const driverIdx = drivers.indexOf(driver);
                                const isFirst = driverIdx === 0;
                                const tooltipTop = isFirst ? 36 : -38;
                                return (
                                  <View style={{
                                    position: 'absolute', left: tooltipLeft, top: tooltipTop,
                                    backgroundColor: '#1A1A1A', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 5,
                                    borderWidth: 0.5, borderColor: accentColor, minWidth: 140, zIndex: 50,
                                  }}>
                                    <Text style={{ color: accentColor, fontSize: 8, fontFamily: MONO, fontWeight: '700' }}>
                                      {isImproving ? '↓ IMPROVING' : '↑ WORSENING'} · {seq.length} GIRI
                                    </Text>
                                    <Text style={{ color: '#FFFFFF', fontSize: 8, fontFamily: MONO, marginTop: 2 }}>
                                      {totalDelta > 0 ? '+' : ''}{totalDelta.toFixed(3)}s · {perLap > 0 ? '+' : ''}{perLap.toFixed(3)}s/giro
                                    </Text>
                                  </View>
                                );
                              })()}
                              {allLapNumbers.map(lapNum => {
                                const lap = lapMap[lapNum];
                                if (!lap) return <View key={lapNum} style={{ width: cellWidth, height: 20, borderRadius: 6, backgroundColor: '#0A0A0A', marginRight: 6 }} />;
                                const { bg, isSpecial, label, isSc } = getPaceColor({ ...lap, isSafetyCarLap: isScLapFn(lap.lap) }, driver.driver_number, overallBestLap, driverAverages);
                                if (isSpecial && label) {
                                  return (
                                    <View key={lapNum} style={{ width: cellWidth, height: 20, borderRadius: 6, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', marginRight: 6 }}>
                                      <Text style={{ color: '#E10600', fontSize: 7, fontWeight: '700' }}>{label}</Text>
                                    </View>
                                  );
                                }
                                if (lap.time == null) return <View key={lapNum} style={{ width: cellWidth, height: 20, borderRadius: 6, backgroundColor: '#0A0A0A', marginRight: 6 }} />;
                                const cellColor = isSc ? '#F39C12' : bg;
                                return (
                                  <View key={lapNum} style={{ width: cellWidth, height: 20, borderRadius: 6, backgroundColor: isSc ? '#F39C12' : '#000000', justifyContent: 'center', alignItems: 'center', borderWidth: isSc ? 0 : 1, borderColor: isSc ? 'transparent' : cellColor, marginRight: 6 }}>
                                    <Text style={{ color: isSc ? '#000000' : cellColor, fontSize: 9, fontWeight: '700', fontFamily: MONO }}>
                                      {(() => { const t = lap.time; const m = Math.floor(t / 60); const s = (t % 60).toFixed(1).padStart(4, '0'); return `${m}:${s}`; })()}
                                    </Text>
                                  </View>
                                );
                              })}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </ScrollView>
                  </View>
                </ScrollView>
                </TouchableOpacity>
              ) : (
                // GRAF MODE — single ScrollView, header inside same scroll area as bars
                <View style={{ flex: 1 }}>
                  {(() => {
                    const rowData = drivers.map(driver => {
                      const isPaceExpanded = expandedPaceDriver === driver.driver_number;
                      const paceRowH = isPaceExpanded ? 120 : 36;
                      const laps = paceData[driver.driver_number] ?? [];
                      const lapMap: Record<number, typeof laps[0]> = {};
                      for (const l of laps) lapMap[l.lap] = l;
                      const slotWidth = 14;
                      const teamColor = driver.team_colour ? (driver.team_colour.startsWith('#') ? driver.team_colour : `#${driver.team_colour}`) : '#FFFFFF';

                      const cleanLaps = laps
                        .filter(l => l.lap > 1 && !l.isPit && !l.isOut && !isScLapFn(l.lap) && !isVscLapFn(l.lap) && l.time !== null && l.time > 60 && l.time < 200)
                        .sort((a, b) => a.lap - b.lap);
                      const trendMap = new Map<number, string>();
                      let seqCounter = 0;
                      let i = 0;
                      while (i < cleanLaps.length - 2) {
                        const t0 = cleanLaps[i].time as number;
                        const t1 = cleanLaps[i + 1].time as number;
                        let direction: 'improving' | 'worsening' | null = null;
                        if (t1 < t0) direction = 'improving';
                        else if (t1 > t0) direction = 'worsening';
                        if (!direction) { i++; continue; }
                        let end = i + 1;
                        while (end + 1 < cleanLaps.length) {
                          const prev = cleanLaps[end].time as number;
                          const next = cleanLaps[end + 1].time as number;
                          if (direction === 'improving' && next < prev) end++;
                          else if (direction === 'worsening' && next > prev) end++;
                          else break;
                        }
                        const seqLen = end - i + 1;
                        const totalDelta = Math.abs((cleanLaps[end].time as number) - (cleanLaps[i].time as number));
                        if (seqLen >= 3 && totalDelta >= 0.1 * (seqLen - 1)) {
                          seqCounter++;
                          const tag = `${direction}-${seqCounter}`;
                          for (let k = i; k <= end; k++) trendMap.set(cleanLaps[k].lap, tag);
                          i = end + 2;
                        } else { i = end; }
                      }

                      const trendSequences: Array<{ startIdx: number; length: number; trend: 'improving' | 'worsening' }> = [];
                      {
                        let seqStart = -1; let seqTag: string | null = null; let seqLen = 0;
                        for (let idx = 0; idx < allLapNumbers.length; idx++) {
                          const t = trendMap.get(allLapNumbers[idx]) ?? null;
                          if (t && t === seqTag) { seqLen++; }
                          else {
                            if (seqTag && seqLen >= 3) trendSequences.push({ startIdx: seqStart, length: seqLen, trend: seqTag.startsWith('improving') ? 'improving' : 'worsening' });
                            seqStart = idx; seqTag = t; seqLen = 1;
                          }
                        }
                        if (seqTag && seqLen >= 3) trendSequences.push({ startIdx: seqStart, length: seqLen, trend: seqTag.startsWith('improving') ? 'improving' : 'worsening' });
                      }

                      return { driver, isPaceExpanded, paceRowH, lapMap, slotWidth, teamColor, trendSequences };
                    });

                    const expandedRowIdx = rowData.findIndex(r => r.isPaceExpanded);
                    const avgOverlayBottom = expandedRowIdx >= 0
                      ? (rowData.length - 1 - expandedRowIdx) * 36 + 6
                      : -9999;

                    return (
                      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
                        <View style={{ flexDirection: 'row', position: 'relative' }}>
                          <View style={{ width: 52 }}>
                            <View style={{ height: 20 }} />
                            {rowData.map(({ driver, isPaceExpanded, paceRowH, teamColor }) => (
                              <MotiView key={driver.driver_number} animate={{ height: paceRowH }} transition={{ type: 'timing', duration: 200 }} style={{ overflow: 'hidden' }}>
                                <TouchableOpacity
                                  activeOpacity={0.7}
                                  onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setExpandedPaceDriver(prev => prev === driver.driver_number ? null : driver.driver_number);
                                    setSelectedPaceBar(null);
                                  }}
                                  style={{ height: paceRowH, flexDirection: 'row', alignItems: 'center' }}
                                >
                                  <View style={{ width: 2, height: 20, borderRadius: 1, backgroundColor: teamColor, marginRight: 6, marginLeft: 12 }} />
                                  <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', fontFamily: MONO }}>{driver.name_acronym ?? driver.acronym ?? String(driver.driver_number)}</Text>
                                </TouchableOpacity>
                              </MotiView>
                            ))}
                          </View>
                          <ScrollView
                            ref={paceScrollRef}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            scrollEventThrottle={16}
                          >
                            <View>
                              {/* Lap number header inside the single ScrollView */}
                              <View style={{ flexDirection: 'row', height: 20, alignItems: 'flex-end' }}>
                                {allLapNumbers.map(lapNum => {
                                  const isVsc = isVscLapFn(lapNum);
                                  const isSc = isPureScLapFn(lapNum);
                                  return (
                                    <View key={lapNum} style={{ width: 14, marginRight: 1, alignItems: 'center' }}>
                                      {isVsc ? (
                                        <Text style={{ color: '#F39C12', fontSize: 6, fontWeight: '700', lineHeight: 8 }}>VSC</Text>
                                      ) : isSc ? (
                                        <Text style={{ color: '#F39C12', fontSize: 6, fontWeight: '700', lineHeight: 8 }}>SC</Text>
                                      ) : null}
                                      <Text style={{ color: '#888', fontSize: 8 }}>{lapNum}</Text>
                                    </View>
                                  );
                                })}
                              </View>
                              {rowData.map(({ driver, isPaceExpanded, paceRowH, lapMap, slotWidth, trendSequences }) => (
                                <MotiView key={driver.driver_number} animate={{ height: paceRowH }} transition={{ type: 'timing', duration: 200 }} style={{ flexDirection: 'row', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
                                  {isPaceExpanded && (
                                    <View style={{ position: 'absolute', top: 59, left: 0, right: 0, height: 1.5, backgroundColor: '#333333', zIndex: 0 }} />
                                  )}
                                  {allLapNumbers.map(lapNum => {
                                    const lap = lapMap[lapNum];
                                    if (!lap) return <View key={lapNum} style={{ width: slotWidth, height: paceRowH, marginRight: isPaceExpanded ? 2 : 1 }} />;
                                    const { bg, isSpecial, label, isSc } = getPaceColor({ ...lap, isSafetyCarLap: isScLapFn(lap.lap) }, driver.driver_number, overallBestLap, driverAverages);
                                    if (isSpecial && label) {
                                      if (isPaceExpanded) {
                                        const isSelected = selectedPaceBar?.driverNumber === driver.driver_number && selectedPaceBar?.lapNum === lapNum;
                                        return (
                                          <TouchableOpacity
                                            key={lapNum}
                                            activeOpacity={1}
                                            onPress={() => setSelectedPaceBar(isSelected ? null : { driverNumber: driver.driver_number, lapNum })}
                                            style={{ width: slotWidth, height: 120, position: 'relative', marginRight: 2, justifyContent: 'center', alignItems: 'center' }}
                                          >
                                            <Text style={{ position: 'absolute', top: 4, left: 0, right: 0, textAlign: 'center', fontSize: 6, color: '#444444', fontFamily: MONO }}>{lapNum}</Text>
                                            <View style={{ width: 12, height: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                                              <Text style={{ color: '#E10600', fontSize: 7, fontWeight: '700', fontFamily: MONO }}>{label[0]}</Text>
                                            </View>
                                          </TouchableOpacity>
                                        );
                                      }
                                      return (
                                        <View key={lapNum} style={{ width: slotWidth, height: paceRowH, justifyContent: 'center', alignItems: 'center', marginRight: 1 }}>
                                          <View style={{ width: 12, height: 14, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}>
                                            <Text style={{ color: '#E10600', fontSize: 7, fontWeight: '700', fontFamily: MONO }}>{label[0]}</Text>
                                          </View>
                                        </View>
                                      );
                                    }
                                    const driverAvg = driverAverages[driver.driver_number];
                                    const barColor = isSc ? '#F39C12' : bg;
                                    if (isPaceExpanded) {
                                      const isVscLapExp = isVscLapFn(lapNum);
                                      // SC/VSC label box in expanded row
                                      if (isSc || isVscLapExp) {
                                        const isSelected = selectedPaceBar?.driverNumber === driver.driver_number && selectedPaceBar?.lapNum === lapNum;
                                        return (
                                          <TouchableOpacity
                                            key={lapNum}
                                            activeOpacity={1}
                                            onPress={() => setSelectedPaceBar(isSelected ? null : { driverNumber: driver.driver_number, lapNum })}
                                            style={{ width: slotWidth, height: 120, position: 'relative', marginRight: 2, justifyContent: 'center', alignItems: 'center' }}
                                          >
                                            <Text style={{ position: 'absolute', top: 4, left: 0, right: 0, textAlign: 'center', fontSize: 6, color: '#444444', fontFamily: MONO }}>{lapNum}</Text>
                                            <View style={{ width: 14, height: 16, backgroundColor: '#000000', borderWidth: 1, borderColor: '#F39C12', borderRadius: 0, justifyContent: 'center', alignItems: 'center' }}>
                                              <Text style={{ color: '#F39C12', fontSize: 5, fontWeight: '700', fontFamily: MONO }}>{isVscLapExp ? 'VS' : 'SC'}</Text>
                                            </View>
                                          </TouchableOpacity>
                                        );
                                      }
                                      const centerY = 60;
                                      const delta = lap.time != null && driverAvg !== undefined ? Math.max(-2.0, Math.min(2.0, lap.time - driverAvg)) : 0;
                                      const { barTop, barH } = (() => {
                                        if (lap.time == null || driverAvg === undefined) return { barTop: centerY - 1, barH: 2 };
                                        if (delta === 0) return { barTop: centerY - 1, barH: 2 };
                                        const halfHeight = Math.max(2, Math.min(44, Math.round(Math.abs(delta) * 22)));
                                        return delta > 0 ? { barTop: centerY - halfHeight, barH: halfHeight } : { barTop: centerY, barH: halfHeight };
                                      })();
                                      return (
                                        <TouchableOpacity
                                          key={lapNum}
                                          activeOpacity={1}
                                          onPress={() => setSelectedPaceBar(prev => prev?.driverNumber === driver.driver_number && prev?.lapNum === lapNum ? null : { driverNumber: driver.driver_number, lapNum })}
                                          style={{ width: slotWidth, height: 120, position: 'relative', marginRight: 2 }}
                                        >
                                          <Text style={{ position: 'absolute', top: 4, left: 0, right: 0, textAlign: 'center', fontSize: 6, color: '#444444', fontFamily: MONO }}>{lapNum}</Text>
                                          <View style={{ position: 'absolute', top: barTop, left: 2, width: 11, height: barH, borderRadius: 0, backgroundColor: barColor, zIndex: 1 }} />
                                        </TouchableOpacity>
                                      );
                                    }
                                    const isVscLap = isVscLapFn(lapNum);
                                    if (isSc || isVscLap) {
                                      return (
                                        <View key={lapNum} style={{ width: slotWidth, height: 36, position: 'relative', marginRight: 1 }}>
                                          <View style={{ position: 'absolute', top: 11, left: 1, width: 12, height: 14, borderRadius: 0, backgroundColor: '#000000', borderWidth: 1, borderColor: '#F39C12', justifyContent: 'center', alignItems: 'center', zIndex: 1 }}>
                                            <Text style={{ color: '#F39C12', fontSize: 5, fontWeight: '700', fontFamily: MONO }}>{isVscLap ? 'VS' : 'SC'}</Text>
                                          </View>
                                        </View>
                                      );
                                    }
                                    const { barTop: collapsedBarTop, barH: collapsedBarH } = (() => {
                                      const centerY = 17;
                                      if (lap.time == null || driverAvg === undefined) return { barTop: centerY - 1, barH: 2 };
                                      const delta = Math.max(-2.0, Math.min(2.0, lap.time - driverAvg));
                                      const halfHeight = Math.max(1, Math.round(Math.abs(delta) * 4));
                                      return delta >= 0
                                        ? { barTop: centerY - halfHeight, barH: halfHeight }
                                        : { barTop: centerY, barH: halfHeight };
                                    })();
                                    return (
                                      <View key={lapNum} style={{ width: slotWidth, height: 36, position: 'relative', marginRight: 1 }}>
                                        <View style={{ position: 'absolute', top: 17, left: 0, right: 0, height: 1, backgroundColor: '#222222', zIndex: 0 }} />
                                        <View style={{ position: 'absolute', top: collapsedBarTop, left: 1, width: 12, height: collapsedBarH, borderRadius: 0, backgroundColor: barColor, zIndex: 1 }} />
                                      </View>
                                    );
                                  })}
                                  {isPaceExpanded && (() => {
                                    if (!selectedPaceBar || selectedPaceBar.driverNumber !== driver.driver_number) return null;
                                    const selLap = lapMap[selectedPaceBar.lapNum];
                                    if (!selLap) return null;
                                    const avg = driverAverages[driver.driver_number];
                                    const lapIdx = allLapNumbers.indexOf(selectedPaceBar.lapNum);
                                    const leftPos = lapIdx * (slotWidth + 2) - 4;
                                    const maxLeft = allLapNumbers.length * (slotWidth + 2) - 80;
                                    const clampedLeft = Math.max(2, Math.min(leftPos, maxLeft));
                                    // PIT/OUT: show label only (no delta vs avg)
                                    const { isSpecial: selIsSpecial, label: selLabel } = getPaceColor({ ...selLap, isSafetyCarLap: isScLapFn(selLap.lap) }, driver.driver_number, overallBestLap, driverAverages);
                                    if (selIsSpecial && selLabel) {
                                      return (
                                        <View key="callout" style={{ position: 'absolute', left: clampedLeft, top: 4, zIndex: 20, backgroundColor: '#1A1A1A', borderRadius: 3, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 0.5, borderColor: '#444444', minWidth: 70 }}>
                                          {selLap.time != null && (
                                            <Text style={{ color: '#FFFFFF', fontSize: 8, fontFamily: MONO }}>
                                              {Math.floor(selLap.time / 60)}:{(selLap.time % 60).toFixed(3).padStart(6, '0')}
                                            </Text>
                                          )}
                                          <Text style={{ color: '#FFFFFF', fontSize: 8, fontFamily: MONO }}>{selLabel}</Text>
                                        </View>
                                      );
                                    }
                                    if (selLap.time == null || avg === undefined) return null;
                                    const realDelta = selLap.time - avg;
                                    const clampedDelta = Math.max(-2.0, Math.min(2.0, realDelta));
                                    const topPos = clampedDelta > 0 ? 72 : 4;
                                    return (
                                      <View key="callout" style={{ position: 'absolute', left: clampedLeft, top: topPos, zIndex: 20, backgroundColor: '#1A1A1A', borderRadius: 3, paddingHorizontal: 6, paddingVertical: 3, borderWidth: 0.5, borderColor: '#444444', minWidth: 70 }}>
                                        <Text style={{ color: '#FFFFFF', fontSize: 8, fontFamily: MONO }}>
                                          {Math.floor(selLap.time / 60)}:{(selLap.time % 60).toFixed(3).padStart(6, '0')}
                                        </Text>
                                        <Text style={{ color: realDelta > 0 ? '#E10600' : '#27AE60', fontSize: 8, fontFamily: MONO }}>{realDelta > 0 ? '+' : ''}{realDelta.toFixed(3)}s</Text>
                                      </View>
                                    );
                                  })()}
                                </MotiView>
                              ))}
                            </View>
                          </ScrollView>
                          {rowData.some(r => r.isPaceExpanded) && (() => {
                            const expandedRow = rowData.find(r => r.isPaceExpanded);
                            if (!expandedRow) return null;
                            const avg = driverAverages[expandedRow.driver.driver_number];
                            if (avg === undefined) return null;
                            const m = Math.floor(avg / 60);
                            const s = (avg % 60).toFixed(3).padStart(6, '0');
                            return (
                              <View style={{ position: 'absolute', left: 54, bottom: avgOverlayBottom, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 2, paddingHorizontal: 3, paddingVertical: 1, pointerEvents: 'none' }}>
                                <Text style={{ color: '#666666', fontSize: 8, fontFamily: MONO }}>AVG {m}:{s}</Text>
                              </View>
                            );
                          })()}
                        </View>
                      </ScrollView>
                    );
                  })()}
                </View>
              );
            })()}
          </View>
        )}

        {raceLiveTab === 'stints' && (
          <View style={{ flex: 1, paddingHorizontal: 12, paddingTop: 8 }}>
            {/* Invisible width-measurement view, always rendered */}
            <View
              style={{ position: 'absolute', left: 12 + 80, right: 12, height: 0 }}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                console.log('STINTS timeline width:', w, 'raceLap:', raceLap, 'total:', raceTotalLaps);
                setStintsTimelineWidth(w);
              }}
            />
            {(!raceStintsRef.current.length || raceTotalLaps === null) ? (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#444', fontSize: 13 }}>Dati stints non disponibili</Text>
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {/* Lap scale header */}
                {(() => {
                  const total = raceTotalLaps!;
                  const ticks = [0, 0.25, 0.5, 0.75, 1].map(p => Math.round(p * (total - 1)) + 1);
                  return (
                    <View style={{ flexDirection: 'row', marginLeft: 80, marginBottom: 4, height: 12 }}>
                      {stintsTimelineWidth > 0 && ticks.map((lap, i) => (
                        <View key={i} style={{ position: 'absolute', left: (ticks[i] - 1) / (total - 1) * stintsTimelineWidth }}>
                          <Text style={{ color: '#444444', fontSize: 8, fontFamily: MONO_REG }}>{lap}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })()}
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20, paddingTop: 4 }}>
                  {(() => {
                    // Compute SC/VSC windows for stints section
                    const scWins: Array<{startLap: number, endLap: number}> = [];
                    let _ss: number | null = null;
                    for (const e of raceControlRef.current) {
                      const msg: string = e.message ?? '';
                      const ln: number | null = e.lap_number ?? null;
                      if (ln === null) continue;
                      const isStart = (msg.includes('SAFETY CAR DEPLOYED') && !msg.includes('VIRTUAL')) || msg.includes('VIRTUAL SAFETY CAR DEPLOYED') || msg.includes('VSC DEPLOYED');
                      const isEnd = msg.includes('SAFETY CAR IN THIS LAP') || msg.includes('VIRTUAL SAFETY CAR ENDING') || msg.includes('VSC ENDING');
                      if (isStart && _ss === null) _ss = ln;
                      if (isEnd && _ss !== null) { scWins.push({ startLap: _ss, endLap: ln }); _ss = null; }
                    }
                    if (_ss !== null) scWins.push({ startLap: _ss, endLap: 9999 });
                    const isScOrVscLap = (lap: number) => scWins.some(w => lap >= w.startLap && lap <= w.endLap);

                    // Compute driver averages for stints section
                    const stintDriverAvg: Record<number, number> = {};
                    for (const [numStr, laps] of Object.entries(paceData)) {
                      const valid = laps.filter(l => l.lap > 1 && !l.isPit && !l.isOut && !isScOrVscLap(l.lap) && l.time !== null && l.time > 60 && l.time < 200).map(l => l.time as number);
                      if (valid.length > 0) stintDriverAvg[Number(numStr)] = valid.reduce((a, b) => a + b, 0) / valid.length;
                    }

                    return raceDrivers.filter(d => !d.isDnf).map((driver, driverIdx) => {
                      const total = raceTotalLaps!;

                      // Dedup pass 1: unique by lap_start
                      const seen = new Set<number>();
                      const deduped1: any[] = [];
                      for (const s of raceStintsRef.current.filter((s: any) => s.driver_number === driver.driver_number).sort((a: any, b: any) => a.lap_start - b.lap_start)) {
                        if (!seen.has(s.lap_start)) { seen.add(s.lap_start); deduped1.push({ ...s }); }
                      }
                      // Dedup pass 2: merge consecutive same-compound stints within 2 laps
                      const driverStints: any[] = [];
                      for (const stint of deduped1) {
                        const prev = driverStints[driverStints.length - 1];
                        if (prev && prev.compound === stint.compound && stint.lap_start - prev.lap_start <= 2) {
                          prev.lap_end = stint.lap_end ?? total;
                        } else {
                          driverStints.push(stint);
                        }
                      }

                      const pitCount = Math.max(0, driverStints.length - 1);
                      const isExpanded = expandedStintDriver === driver.driver_number;
                      const teamColor = driver.team_colour ? (driver.team_colour.startsWith('#') ? driver.team_colour : `#${driver.team_colour}`) : '#FFFFFF';
                      const formatT = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(3).padStart(6, '0')}`;

                      return (
                        <View key={driver.driver_number} style={{ marginBottom: 6 }}>
                          <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setExpandedStintDriver(prev => prev === driver.driver_number ? null : driver.driver_number);
                            }}
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                          >
                            {/* Left column */}
                            <View style={{ width: 80, flexDirection: 'row', alignItems: 'center', paddingRight: 8 }}>
                              <View style={{ width: 2, height: 36, borderRadius: 1, backgroundColor: teamColor, marginRight: 6 }} />
                              <View>
                                <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', fontFamily: MONO }}>{driver.name_acronym ?? driver.acronym ?? String(driver.driver_number)}</Text>
                                <Text style={{ color: '#555555', fontSize: 8, fontFamily: MONO_REG, marginTop: 1 }}>{pitCount}-STOP</Text>
                              </View>
                            </View>
                            {/* Timeline */}
                            <View style={{ flex: 1, position: 'relative' }}>
                              <View style={{ height: 24, borderRadius: 3, backgroundColor: '#0A0A0A', flexDirection: 'row', overflow: 'hidden' }}>
                                {driverStints.map((stint: any, i: number) => {
                                  const lapEnd = stint.lap_end ?? total;
                                  const stintLaps = Math.max(1, lapEnd - stint.lap_start + 1);
                                  const widthPct = (stintLaps / total) * 100;
                                  const tyre = getTyreInfo(stint.compound);
                                  const blockWidthPx = stintsTimelineWidth > 0 ? (stintLaps / total) * stintsTimelineWidth : 0;
                                  const showAge = stint.tyre_age_at_start > 0 && blockWidthPx > 20;
                                  const gap = i < driverStints.length - 1 ? 1 : 0;
                                  return (
                                    <View key={i} style={{ width: `${widthPct}%` as any, height: 24, backgroundColor: tyre.bg, marginRight: gap, flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                      <Text style={{ color: tyre.textColor, fontSize: 10, fontWeight: '700', fontFamily: MONO, lineHeight: 12 }}>{tyre.label}</Text>
                                      {showAge && (
                                        <Text style={{ color: tyre.textColor, fontSize: 7, fontFamily: MONO_REG, opacity: 0.6, lineHeight: 8 }}>↺{stint.tyre_age_at_start}</Text>
                                      )}
                                    </View>
                                  );
                                })}
                              </View>
                              {/* NOW line */}
                              {stintsTimelineWidth > 0 && raceLap !== null && (
                                <View style={{ position: 'absolute', left: (raceLap / total) * stintsTimelineWidth, top: 0, bottom: 0, width: 1.5, backgroundColor: '#E10600', zIndex: 10 }}>
                                  {driverIdx === 0 && (
                                    <Text style={{ color: '#E10600', fontSize: 8, fontFamily: MONO, fontWeight: '700', position: 'absolute', top: -12, left: 2 }}>L{raceLap}</Text>
                                  )}
                                </View>
                              )}
                            </View>
                          </TouchableOpacity>
                          {/* Expand panel */}
                          {isExpanded && (
                            <View style={{ backgroundColor: '#0F0F0F', paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 0.5, borderTopColor: '#1A1A1A' }}>
                              {driverStints.map((stint: any, i: number) => {
                                const lapEnd = stint.lap_end ?? total;
                                const stintLen = lapEnd - stint.lap_start + 1;
                                const stintLapTimes = paceData[driver.driver_number]?.filter(l =>
                                  l.lap >= stint.lap_start &&
                                  l.lap <= lapEnd &&
                                  l.lap !== stint.lap_start &&
                                  (i === driverStints.length - 1 || l.lap !== lapEnd) &&
                                  !isScOrVscLap(l.lap) &&
                                  l.time !== null && l.time > 60 && l.time < 200
                                ) ?? [];
                                const stintAvg = stintLapTimes.length > 0
                                  ? stintLapTimes.reduce((s, l) => s + (l.time as number), 0) / stintLapTimes.length
                                  : null;
                                const raceAvg = stintDriverAvg[driver.driver_number];
                                const delta = stintAvg != null && raceAvg != null ? stintAvg - raceAvg : null;
                                const mid = Math.floor(stintLapTimes.length / 2);
                                const firstHalf = stintLapTimes.slice(0, mid);
                                const secondHalf = stintLapTimes.slice(mid);
                                const avgFirst = firstHalf.length > 0 ? firstHalf.reduce((s, l) => s + (l.time as number), 0) / firstHalf.length : null;
                                const avgSecond = secondHalf.length > 0 ? secondHalf.reduce((s, l) => s + (l.time as number), 0) / secondHalf.length : null;
                                const degradation = avgFirst != null && avgSecond != null ? avgSecond - avgFirst : null;
                                const scCount = paceData[driver.driver_number]?.filter(l =>
                                  l.lap >= stint.lap_start && l.lap <= lapEnd && isScOrVscLap(l.lap)
                                ).length ?? 0;
                                const tyre = getTyreInfo(stint.compound);
                                return (
                                  <View key={i} style={{ marginBottom: i < driverStints.length - 1 ? 12 : 0 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                                      <View style={{ backgroundColor: tyre.bg, borderRadius: 3, width: 20, height: 20, justifyContent: 'center', alignItems: 'center', marginRight: 8 }}>
                                        <Text style={{ color: tyre.textColor, fontSize: 10, fontWeight: '700', fontFamily: MONO }}>{tyre.label}</Text>
                                      </View>
                                      <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: MONO }}>
                                        STINT {i + 1} · G{stint.lap_start}–G{lapEnd} · {stintLen} GIRI
                                      </Text>
                                      {scCount > 0 && (
                                        <Text style={{ color: '#F39C12', fontSize: 8, fontFamily: MONO, marginLeft: 8 }}>{scCount} SC</Text>
                                      )}
                                    </View>
                                    <View style={{ flexDirection: 'row', gap: 16 }}>
                                      <View>
                                        <Text style={{ color: '#555555', fontSize: 7, fontFamily: MONO, marginBottom: 2 }}>MEDIA STINT</Text>
                                        <Text style={{ color: '#FFFFFF', fontSize: 10, fontFamily: MONO }}>
                                          {stintAvg != null ? formatT(stintAvg) : '—'}
                                        </Text>
                                      </View>
                                      <View>
                                        <Text style={{ color: '#555555', fontSize: 7, fontFamily: MONO, marginBottom: 2 }}>VS MEDIA GARA</Text>
                                        <Text style={{ color: delta == null ? '#555555' : delta > 0 ? '#E10600' : '#27AE60', fontSize: 10, fontFamily: MONO }}>
                                          {delta != null ? `${delta > 0 ? '+' : ''}${delta.toFixed(3)}s` : '—'}
                                        </Text>
                                      </View>
                                      <View>
                                        <Text style={{ color: '#555555', fontSize: 7, fontFamily: MONO, marginBottom: 2 }}>DEGRADO</Text>
                                        <Text style={{ color: degradation == null ? '#555555' : degradation > 0 ? '#E8A000' : '#27AE60', fontSize: 10, fontFamily: MONO }}>
                                          {degradation != null ? `${degradation > 0 ? '+' : ''}${degradation.toFixed(3)}s` : '—'}
                                        </Text>
                                      </View>
                                    </View>
                                  </View>
                                );
                              })}
                            </View>
                          )}
                        </View>
                      );
                    });
                  })()}
                </ScrollView>
              </View>
            )}
          </View>
        )}

        <BottomSheet
          ref={weatherBottomSheetRef}
          index={-1}
          snapPoints={['50%']}
          enablePanDownToClose={true}
          onClose={() => {}}
          backdropComponent={(props) => (
            <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
          )}
          backgroundStyle={{ backgroundColor: '#141414' }}
          handleIndicatorStyle={{ backgroundColor: '#2A2A2A' }}
        >
          <BottomSheetView style={{ padding: 24, paddingBottom: 40 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: MONO, letterSpacing: 2, marginBottom: 20 }}>CONDIZIONI PISTA</Text>
            {!raceWeather ? (
              <Text style={{ color: '#999999', fontSize: 13, textAlign: 'center', paddingVertical: 24 }}>Dati meteo non disponibili</Text>
            ) : (
              <>
                <Text style={{ color: '#555555', fontSize: 9, fontFamily: MONO, letterSpacing: 2, marginBottom: 8 }}>TEMPERATURA</Text>
                <View style={{ backgroundColor: '#1E1E1E', borderRadius: 4, padding: 14, marginBottom: 16 }}>
                  <WeatherRow label="Asfalto" value={`${raceWeather.track_temperature ?? '—'}°C`} />
                  <WeatherRow label="Aria" value={`${raceWeather.air_temperature ?? '—'}°C`} />
                </View>
                <Text style={{ color: '#555555', fontSize: 9, fontFamily: MONO, letterSpacing: 2, marginBottom: 8 }}>UMIDITÀ</Text>
                <View style={{ backgroundColor: '#1E1E1E', borderRadius: 4, padding: 14, marginBottom: 16 }}>
                  <WeatherRow label="Umidità" value={`${raceWeather.humidity ?? '—'}%`} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
                    <Text style={{ color: '#999999', fontSize: 11, fontFamily: MONO_REG }}>Pioggia in corso</Text>
                    <Text style={{ color: raceWeather.rainfall ? '#4FC3F7' : '#E8A000', fontSize: 12, fontFamily: MONO }}>{raceWeather.rainfall ? 'WET' : 'DRY'}</Text>
                  </View>
                  {raceRainRisk !== null && <WeatherRow label="Rischio pioggia" value={raceRainRisk} highlight={parseInt(raceRainRisk) > 30} />}
                </View>
                <Text style={{ color: '#555555', fontSize: 9, fontFamily: MONO, letterSpacing: 2, marginBottom: 8 }}>VENTO</Text>
                <View style={{ backgroundColor: '#1E1E1E', borderRadius: 4, padding: 14 }}>
                  <WeatherRow label="Velocità" value={`${raceWeather.wind_speed ?? '—'} m/s`} />
                  <WeatherRow label="Direzione" value={raceWeather.wind_direction != null ? `${raceWeather.wind_direction}° (${getWindDirection(raceWeather.wind_direction)})` : '—'} />
                </View>
              </>
            )}
          </BottomSheetView>
        </BottomSheet>
      </View>
    );
  }

  if (isQualifying) {
    const weatherLabel = !raceWeather ? '—' : raceWeather.rainfall ? 'WET' : 'DRY';
    const weatherColor = !raceWeather ? '#999' : raceWeather.rainfall ? '#4FC3F7' : '#E8A000';
    return (
      <View style={{ flex: 1, backgroundColor: "#0A0A0A", paddingTop: 52 }}>
        <View style={styles.navbar}>
          <Image source={logo} style={{ height: 32, width: 160, resizeMode: 'contain' }} />
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Animated.View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#E10600", marginRight: 8, opacity: pulseAnim }} />
            <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700", fontFamily: MONO, letterSpacing: 1 }}>
              {activeQualiPhase ? `${activeQualiPhase} IN CORSO` : "QUALIFICHE IN CORSO"}
            </Text>
          </View>
          <TouchableOpacity onPress={() => weatherBottomSheetRef.current?.expand()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: "#999999", fontSize: 13, fontFamily: MONO }}>{raceWeather?.track_temperature ?? "—"}°C{' '}</Text>
            <Text style={{ color: weatherColor, fontSize: 11, fontWeight: '700', fontFamily: MONO }}>{weatherLabel}</Text>
            <Text style={{ color: "#999999", fontSize: 13, fontFamily: MONO }}>{' '}›</Text>
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
                  paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4,
                  backgroundColor: isLive ? "#E10600" : isSelected ? "#2A2A2A" : "#1E1E1E",
                  borderWidth: isSelected ? 1 : 0,
                  borderColor: "#FFFFFF",
                }}
              >
                <Text style={{ color: isLive || isSelected ? "#FFFFFF" : "#555555", fontSize: 9, fontWeight: "700", fontFamily: MONO }}>{q}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {raceRedFlagActive && (
          <MotiView from={{ opacity: 0, translateY: -8 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 250 }}>
            <View style={{ backgroundColor: '#1A0000', borderWidth: 1, borderColor: '#E10600', marginHorizontal: 12, marginVertical: 4, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Animated.View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#E10600', opacity: pulseAnim }} />
                <Text style={{ color: '#E10600', fontSize: 10 }}>▲</Text>
                <Text style={{ color: '#E10600', fontSize: 12, fontWeight: '700', letterSpacing: 2, fontFamily: MONO }}>RED FLAG</Text>
              </View>
              <Text style={{ color: '#E10600', fontSize: 9, letterSpacing: 1.5, fontFamily: MONO, opacity: 0.7 }}>SESSIONE SOSPESA</Text>
            </View>
          </MotiView>
        )}
        {raceYellowSectors.length > 0 && (() => {
          const yellowLabel = raceYellowSectors[0] === -1
            ? "⚠️ BANDIERA GIALLA"
            : `⚠️ GIALLA ${raceYellowSectors.join(' · ')}`;
          return (
            <View style={{ backgroundColor: "#F39C12", marginHorizontal: 16, marginBottom: 8, borderRadius: 6, paddingVertical: 4, paddingHorizontal: 12, flexDirection: "row", alignItems: "center" }}>
              <Text style={{ color: "#000000", fontWeight: "700", fontSize: 11, letterSpacing: 0.5, fontFamily: MONO }}>{yellowLabel}</Text>
            </View>
          );
        })()}
        {raceEvents.length > 0 && (
          <View style={{ borderBottomWidth: 0.5, borderBottomColor: '#0D0D0D' }}>
            <TouchableOpacity
              onPress={() => setEventsExpanded(prev => !prev)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: eventsExpanded ? 0.5 : 0, borderBottomColor: '#0A0A0A' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{
                  backgroundColor: raceEvents[0].type === 'INV' ? '#F39C12' : raceEvents[0].type === 'FLAG' ? '#E10600' : '#1A1A1A',
                  borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1
                }}>
                  <Text style={{ color: raceEvents[0].type === 'INV' || raceEvents[0].type === 'FLAG' ? '#000' : '#555', fontSize: 9, fontWeight: '700' }}>{raceEvents[0].type}</Text>
                </View>
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: MONO_REG, flex: 1 }} numberOfLines={1}>{raceEvents[0].message}</Text>
              </View>
              <Text style={{ color: '#444', fontSize: 11 }}>{eventsExpanded ? '▲' : '▼'}</Text>
            </TouchableOpacity>
            {eventsExpanded && (
              <ScrollView style={{ height: 160 }} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
                {raceEvents.map((event, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: '#0A0A0A', opacity: i === 0 ? 1 : 0.5 }}>
                    <Text style={{ color: '#444', fontSize: 10, fontVariant: ['tabular-nums'], width: 56, marginRight: 6, fontFamily: MONO_REG }}>{event.time}</Text>
                    <View style={{
                      backgroundColor: event.type === 'INV' ? '#F39C12' : event.type === 'FLAG' ? '#E10600' : event.type === 'PEN' ? '#E10600' : '#1A1A1A',
                      borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1, marginRight: 8, minWidth: 32
                    }}>
                      <Text style={{ color: event.type === 'INV' || event.type === 'FLAG' || event.type === 'PEN' ? '#000' : '#555', fontSize: 9, fontWeight: '700' }}>{event.type}</Text>
                    </View>
                    <Text style={{ color: i === 0 ? '#FFFFFF' : '#999', fontSize: 11, flex: 1, lineHeight: 15, fontFamily: MONO_REG }}>{event.message}</Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#2A2A2A' }}>
          <Text style={{ width: 18, color: '#444444', fontSize: 8, fontFamily: MONO }}>{' '}</Text>
          <View style={{ width: 2 + 6 + 32 + 8 + 32, marginLeft: 12 }} />
          <Text style={{ width: 48, color: '#444444', fontSize: 8, fontFamily: MONO, textAlign: 'center' }}>S1</Text>
          <Text style={{ width: 48, color: '#444444', fontSize: 8, fontFamily: MONO, textAlign: 'center', marginLeft: 4 }}>S2</Text>
          <Text style={{ width: 48, color: '#444444', fontSize: 8, fontFamily: MONO, textAlign: 'center', marginLeft: 4 }}>S3</Text>
          <Text style={{ flex: 1, color: '#444444', fontSize: 8, fontFamily: MONO, marginLeft: 8 }}>TIME</Text>
          <Text style={{ color: '#444444', fontSize: 8, fontFamily: MONO }}>GAP</Text>
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
                    style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: "#1A1A1A" }}
                  >
                    <Text style={{ color: isEliminated ? "#555555" : "#999999", fontSize: 12, fontFamily: MONO_REG, width: 16 }}>{index + 1}</Text>
                    <View style={{ width: 2, height: 16, backgroundColor: teamColor, borderRadius: 2, marginRight: 6 }} />
                    {driver.headshot_url ? (
                      <Image source={{ uri: driver.headshot_url }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 6, backgroundColor: "#2A2A2A" }} resizeMode="cover" />
                    ) : (
                      <View style={{ width: 32, height: 32, borderRadius: 16, marginRight: 6, backgroundColor: "#2A2A2A" }} />
                    )}
                    <Text style={{ color: isEliminated ? "#555555" : "#FFFFFF", fontSize: 13, fontWeight: "700", fontFamily: MONO, width: 30 }}>{acronym}</Text>
                    <View style={{ flexDirection: "row", gap: 2, marginHorizontal: 6 }}>
                      <View style={{ width: 48, height: 18, borderRadius: 3, backgroundColor: isEliminated ? "#1A1A1A" : (driver.sector1 !== null ? driver.sector1_color : "#2A2A2A"), justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: isEliminated ? "#555555" : "#000000", fontSize: 8, fontWeight: "700", fontFamily: MONO }}>{driver.sector1 ? driver.sector1.toFixed(3) : ""}</Text>
                      </View>
                      <View style={{ width: 48, height: 18, borderRadius: 3, backgroundColor: isEliminated ? "#1A1A1A" : (driver.sector2 !== null ? driver.sector2_color : "#2A2A2A"), justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: isEliminated ? "#555555" : "#000000", fontSize: 8, fontWeight: "700", fontFamily: MONO }}>{driver.sector2 ? driver.sector2.toFixed(3) : ""}</Text>
                      </View>
                      <View style={{ width: 48, height: 18, borderRadius: 3, backgroundColor: isEliminated ? "#1A1A1A" : (driver.sector3 !== null ? driver.sector3_color : "#2A2A2A"), justifyContent: "center", alignItems: "center" }}>
                        <Text style={{ color: isEliminated ? "#555555" : "#000000", fontSize: 8, fontWeight: "700", fontFamily: MONO }}>{driver.sector3 ? driver.sector3.toFixed(3) : ""}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 6 }}>
                      <Text style={{ color: isEliminated ? "#555555" : "#FFFFFF", fontSize: 12, fontWeight: "700", fontFamily: MONO, fontVariant: ["tabular-nums"], minWidth: 72 }}>
                        {formatLapTime(driver.display_lap_duration)}
                      </Text>
                      <Text style={{ color: index === 0 ? "#E10600" : isEliminated ? "#555555" : "#FFFFFF", fontSize: 12, fontWeight: "700", fontFamily: MONO, fontVariant: ["tabular-nums"], marginLeft: 6, minWidth: 44 }}>
                        {index === 0 ? "LEADER" : gapStr}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  {isExpanded && (() => {
                    const { current: expandCurrent, prev: expandPrev } = getLastTwoLaps(
                      driver.driver_number,
                      driver.lap_phase,
                      lapsRef.current,
                      getPhaseWindow,
                      driver.best_lap_duration
                    );
                    const expandCompound = expandCurrent?.compound ?? null;
                    const compoundColors: Record<string, string> = {
                      SOFT: "#E10600", MEDIUM: "#F5D400", HARD: "#FFFFFF",
                      INTERMEDIATE: "#27AE60", WET: "#1E90FF",
                    };
                    const hasPrev = expandCurrent != null && expandPrev != null;
                    const sectorDeltas = hasPrev ? [1, 2, 3].map(n => {
                      const a = expandCurrent[`duration_sector_${n}`] as number | null;
                      const b = expandPrev[`duration_sector_${n}`] as number | null;
                      if (a == null || b == null) return null;
                      return a - b;
                    }) : [null, null, null];
                    const totDelta = hasPrev && expandCurrent.lap_duration != null && expandPrev.lap_duration != null
                      ? expandCurrent.lap_duration - expandPrev.lap_duration
                      : null;
                    const fmtD = (d: number | null): string => {
                      if (d == null) return "--";
                      return `${d <= 0 ? "" : "+"}${d.toFixed(3)}`;
                    };
                    return (
                      <View style={{ backgroundColor: "#0F0F0F", paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 0.5, borderTopColor: "#1A1A1A", borderBottomWidth: 0.5, borderBottomColor: "#1A1A1A" }}>
                        {expandCompound != null && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: compoundColors[expandCompound] ?? "#FFFFFF" }} />
                            <Text style={{ color: "#FFFFFF", fontSize: 11, fontFamily: MONO, letterSpacing: 0.5 }}>
                              {expandCompound}
                            </Text>
                          </View>
                        )}
                        {hasPrev && (
                          <View style={{ marginBottom: 8 }}>
                            <View style={{ flexDirection: "row", marginBottom: 4 }}>
                              <Text style={{ width: 36, fontSize: 9, color: "#555555", fontFamily: MONO_REG }}>{""}</Text>
                              {["S1", "S2", "S3", "TOT"].map(h => (
                                <Text key={h} style={{ flex: 1, fontSize: 9, color: "#555555", fontFamily: MONO_REG, textAlign: "center" }}>{h}</Text>
                              ))}
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 3 }}>
                              <Text style={{ width: 36, fontSize: 9, color: "#555555", fontFamily: MONO_REG }}>PREC</Text>
                              {[1, 2, 3].map(n => {
                                const seg = expandPrev[`segments_sector_${n}`] ?? null;
                                const val = expandPrev[`duration_sector_${n}`] as number | null;
                                return (
                                  <View key={n} style={{ flex: 1, alignItems: "center" }}>
                                    <View style={{ backgroundColor: getSectorColor(seg), borderRadius: 3, paddingHorizontal: 4, paddingVertical: 2 }}>
                                      <Text style={{ color: "#000000", fontSize: 10, fontFamily: MONO }}>
                                        {val != null ? val.toFixed(3) : "--"}
                                      </Text>
                                    </View>
                                  </View>
                                );
                              })}
                              <Text style={{ flex: 1, fontSize: 10, color: "#FFFFFF", fontFamily: MONO, textAlign: "center" }}>
                                {formatLapTime(expandPrev.lap_duration)}
                              </Text>
                            </View>
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                              <Text style={{ width: 36, fontSize: 9, color: "#555555", fontFamily: MONO_REG }}>Δ</Text>
                              {sectorDeltas.map((d, i) => (
                                <Text key={i} style={{ flex: 1, fontSize: 10, color: d == null ? "#555555" : "#FFFFFF", fontFamily: MONO, textAlign: "center" }}>
                                  {fmtD(d)}
                                </Text>
                              ))}
                              <Text style={{ flex: 1, fontSize: 10, color: totDelta == null ? "#555555" : "#FFFFFF", fontFamily: MONO, textAlign: "center" }}>
                                {fmtD(totDelta)}
                              </Text>
                            </View>
                          </View>
                        )}
                        {(hasPrev || expandCompound != null) && (
                          <View style={{ height: 0.5, backgroundColor: "#222222", marginBottom: 10 }} />
                        )}
                        <View style={{ flexDirection: "row" }}>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: "#444444", fontSize: 7, fontFamily: MONO, letterSpacing: 2, marginBottom: 4 }}>VS QUALI RECORD</Text>
                            <Text style={{ color: vsRecord ? vsRecord.color : "#555555", fontSize: 13, fontWeight: "700", fontFamily: MONO, fontVariant: ["tabular-nums"] }}>
                              {vsRecord ? vsRecord.text : "N/D"}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: "#444444", fontSize: 7, fontFamily: MONO, letterSpacing: 2, marginBottom: 4 }}>VS PB 2025</Text>
                            <Text style={{ color: vsPb ? vsPb.color : "#555555", fontSize: 13, fontWeight: "700", fontFamily: MONO, fontVariant: ["tabular-nums"] }}>
                              {vsPb ? vsPb.text : "N/D"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })()}
                </View>
              );
            });
          })()}
        </ScrollView>
        <BottomSheet
          ref={weatherBottomSheetRef}
          index={-1}
          snapPoints={['50%']}
          enablePanDownToClose={true}
          onClose={() => {}}
          backdropComponent={(props) => (
            <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} opacity={0.6} />
          )}
          backgroundStyle={{ backgroundColor: '#141414' }}
          handleIndicatorStyle={{ backgroundColor: '#2A2A2A' }}
        >
          <BottomSheetView style={{ padding: 24, paddingBottom: 40 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontFamily: MONO, letterSpacing: 2, marginBottom: 20 }}>CONDIZIONI PISTA</Text>
            {!raceWeather ? (
              <Text style={{ color: '#999999', fontSize: 13, textAlign: 'center', paddingVertical: 24 }}>Dati meteo non disponibili</Text>
            ) : (
              <>
                <Text style={{ color: '#555555', fontSize: 9, fontFamily: MONO, letterSpacing: 2, marginBottom: 8 }}>TEMPERATURA</Text>
                <View style={{ backgroundColor: '#1E1E1E', borderRadius: 4, padding: 14, marginBottom: 16 }}>
                  <WeatherRow label="Asfalto" value={`${raceWeather.track_temperature ?? '—'}°C`} />
                  <WeatherRow label="Aria" value={`${raceWeather.air_temperature ?? '—'}°C`} />
                </View>
                <Text style={{ color: '#555555', fontSize: 9, fontFamily: MONO, letterSpacing: 2, marginBottom: 8 }}>UMIDITÀ</Text>
                <View style={{ backgroundColor: '#1E1E1E', borderRadius: 4, padding: 14, marginBottom: 16 }}>
                  <WeatherRow label="Umidità" value={`${raceWeather.humidity ?? '—'}%`} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 }}>
                    <Text style={{ color: '#999999', fontSize: 11, fontFamily: MONO_REG }}>Pioggia in corso</Text>
                    <Text style={{ color: raceWeather.rainfall ? '#4FC3F7' : '#E8A000', fontSize: 12, fontFamily: MONO }}>{raceWeather.rainfall ? 'WET' : 'DRY'}</Text>
                  </View>
                  {raceRainRisk !== null && <WeatherRow label="Rischio pioggia" value={raceRainRisk} highlight={parseInt(raceRainRisk) > 30} />}
                </View>
                <Text style={{ color: '#555555', fontSize: 9, fontFamily: MONO, letterSpacing: 2, marginBottom: 8 }}>VENTO</Text>
                <View style={{ backgroundColor: '#1E1E1E', borderRadius: 4, padding: 14 }}>
                  <WeatherRow label="Velocità" value={`${raceWeather.wind_speed ?? '—'} m/s`} />
                  <WeatherRow label="Direzione" value={raceWeather.wind_direction != null ? `${raceWeather.wind_direction}° (${getWindDirection(raceWeather.wind_direction)})` : '—'} />
                </View>
              </>
            )}
          </BottomSheetView>
        </BottomSheet>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000000" }}>
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
        <View style={{ paddingBottom: 16, marginBottom: 8 }}>
          <Text style={[styles.cardLabel, { marginBottom: 6 }]}>Ultima gara</Text>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#FFFFFF", marginBottom: 10 }}>{lastRace.raceName}</Text>
          {lastRace.Results.slice(0, 3).map((r: any, i: number) => {
            const teamColor = HOME_TEAM_COLORS[r.Constructor.constructorId] || "#555555";
            const gap = i === 0 ? null : r.Time?.time ?? r.status;
            const acronym = r.Driver?.code;
            const headshotUrl = homeHeadshots[acronym];
            return (
              <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#0A0A0A" }}>
                <Text style={{ color: "#555555", fontSize: 11, width: 20 }}>{i + 1}</Text>
                {headshotUrl ? (
                  <Image source={{ uri: headshotUrl }} style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: "#111111" }} />
                ) : (
                  <View style={{ width: 32, height: 32, borderRadius: 16, marginRight: 8, backgroundColor: "#111111" }} />
                )}
                <View style={{ width: 2, height: 20, backgroundColor: teamColor, borderRadius: 1, marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: "600" }}>{r.Driver.familyName}</Text>
                  <Text style={{ color: "#555555", fontSize: 11, marginTop: 1 }}>{r.Constructor.name}</Text>
                </View>
                <View style={{ backgroundColor: i === 0 ? "#0D2B1A" : "#161616", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ color: i === 0 ? "#27AE60" : "#666666", fontSize: 11, fontWeight: "600" }}>
                    {i === 0 ? "LEADER" : gap}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <View style={{ marginBottom: 8 }}>
        <Text style={[styles.cardLabel, { marginBottom: 10 }]}>Classifica piloti</Text>
        {standings.map((s: any, i: number) => {
          const pts = parseFloat(s.points);
          const acronym = s.Driver?.code ?? s.Driver?.driverId?.slice(0, 3).toUpperCase();
          const headshotUrl = homeHeadshots[acronym];
          return (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#0A0A0A" }}>
              <Text style={{ color: "#333333", fontSize: 11, width: 20 }}>{s.position}</Text>
              {headshotUrl ? (
                <Image source={{ uri: headshotUrl }} style={{ width: 28, height: 28, borderRadius: 14, marginRight: 10, backgroundColor: "#111111" }} />
              ) : (
                <View style={{ width: 28, height: 28, borderRadius: 14, marginRight: 10, backgroundColor: "#111111" }} />
              )}
              <Text style={{ color: "#CCCCCC", fontSize: 15, fontWeight: "500", flex: 1 }}>{s.Driver.familyName}</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] }}>{pts.toLocaleString("it-IT")}</Text>
                <Text style={{ color: "#444444", fontSize: 11 }}>pt</Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={{ marginBottom: 8 }}>
        <Text style={[styles.cardLabel, { marginBottom: 10 }]}>Classifica costruttori</Text>
        {constructorStandings.map((s: any, i: number) => {
          const pts = parseFloat(s.points);
          return (
            <View key={i} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#0A0A0A" }}>
              <Text style={{ color: "#333333", fontSize: 11, width: 20 }}>{s.position}</Text>
              {TEAM_LOGOS[s.Constructor?.name] ? (
                <Image source={TEAM_LOGOS[s.Constructor?.name]} style={{ width: 32, height: 20, marginRight: 10, resizeMode: 'contain' }} />
              ) : (
                <View style={{ width: 32, height: 20, marginRight: 10 }} />
              )}
              <Text style={{ color: "#CCCCCC", fontSize: 15, fontWeight: "500", flex: 1 }}>{s.Constructor.name}</Text>
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: 2 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600", fontVariant: ["tabular-nums"] }}>{pts.toLocaleString("it-IT")}</Text>
                <Text style={{ color: "#444444", fontSize: 11 }}>pt</Text>
              </View>
            </View>
          );
        })}
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
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  content: { padding: 16, gap: 12, backgroundColor: "#0A0A0A" },
  navbar: { paddingVertical: 8, paddingTop: 8, marginBottom: 4 },

  countdownCard: {
    borderRadius: 16, padding: 24, alignItems: "center", gap: 4, marginBottom: 8,
  },
  countdownLabel: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  countdownCircuit: { fontSize: 13, color: "#999999", marginBottom: 16 },
  countdownRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-evenly", width: "100%", paddingHorizontal: 8, marginTop: 8 },
  countdownUnit: { alignItems: "center", flex: 1 },
  countdownNum: { fontSize: 52, fontWeight: "300", color: "#FFFFFF", letterSpacing: -2, textAlign: "center" },
  countdownUnitLabel: { fontSize: 9, fontWeight: "600", color: "#E10600", letterSpacing: 2, marginTop: 4, textAlign: "center" },
  countdownSep: { fontSize: 28, color: "#1A1A1A", marginBottom: 16 },
  card: { backgroundColor: "#141414", borderRadius: 12, padding: 14, gap: 8, marginBottom: 8 },
  cardLabel: { fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 4, color: "#FFFFFF" },
  podiumRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  podiumPos: { fontSize: 12, color: "#999", width: 20 },
  podiumDriver: { fontSize: 13, fontWeight: "500", flex: 1, color: "#FFFFFF" },
  podiumTeam: { fontSize: 11, color: "#999999" },
  podiumTime: { fontSize: 11, color: "#555555" },
  standingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: "#222222" },
  standingPos: { fontSize: 11, color: "#999", width: 16 },
  standingDriver: { fontSize: 13, fontWeight: "500", flex: 1, color: "#FFFFFF" },
  standingPts: { fontSize: 12, color: "#999999" },
  statCard: { borderLeftWidth: 2, borderLeftColor: "#E10600", paddingLeft: 12, paddingVertical: 10, gap: 6, marginBottom: 8 },
  statLabel: { fontSize: 10, color: "#E10600", textTransform: "uppercase", letterSpacing: 0.5 },
  statText: { fontSize: 13, color: "#FFFFFF", lineHeight: 20 },
});