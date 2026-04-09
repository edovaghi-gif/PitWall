import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const logo = require('../../assets/images/PitWall Logo.png');
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

const ERGAST = "https://api.jolpi.ca/ergast/f1";

const TEAM_COLORS: Record<string, string> = {
  ferrari: "#E8002D",
  red_bull: "#3671C6",
  mclaren: "#FF8000",
  mercedes: "#27F4D2",
  williams: "#00A3E0",
  alpine: "#FF87BC",
  aston_martin: "#229971",
  haas: "#B6BABD",
  rb: "#6692FF",
  sauber: "#52E252",
};

const SC_OPTIONS = ["0", "1", "2", "3+"];
const DNF_OPTIONS = ["0–3", "4–6", "7+"];

const SLOT_LABELS = ["1°", "2°", "3°"];
const SLOT_HEIGHTS = [88, 72, 60];

type Driver = { id: string; code: string; name: string; team: string; color: string; number: string };
type Podium = [Driver | null, Driver | null, Driver | null];

export default function PredictionScreen() {
  const navigation = useNavigation();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [nextRace, setNextRace] = useState<any>(null);
  const [loadingRace, setLoadingRace] = useState(true);
  const [podium, setPodium] = useState<Podium>([null, null, null]);
  const [safetyCar, setSafetyCar] = useState<number | null>(null);
  const [redFlag, setRedFlag] = useState<boolean | null>(null);
  const [dnfRange, setDnfRange] = useState<number | null>(null);
  const [lockDisplay, setLockDisplay] = useState<string>("");
  const [lockUrgent, setLockUrgent] = useState(false);
  const [sessionKey, setSessionKey] = useState<number | null>(null);
  const [raceResultsAvailable, setRaceResultsAvailable] = useState(false);
  const [showScoring, setShowScoring] = useState(false);
  const [scoreBreakdown, setScoreBreakdown] = useState<any>(null);

  useEffect(() => {
    navigation.setOptions({ title: "", headerShown: false });
  }, []);

  useEffect(() => {
    fetch(`${ERGAST}/current/driverStandings.json`)
      .then(r => r.json())
      .then(data => {
        const standings = data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
        setDrivers(standings.map((s: any) => {
          const d = s.Driver;
          const constructorId = s.Constructors[0]?.constructorId ?? "";
          return {
            id: d.driverId,
            code: d.code ?? d.familyName.slice(0, 3).toUpperCase(),
            name: d.familyName,
            team: s.Constructors[0]?.name ?? constructorId,
            color: TEAM_COLORS[constructorId] ?? "#999",
            number: d.permanentNumber ?? "0",
          };
        }));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch(`${ERGAST}/current.json`)
      .then(r => r.json())
      .then(data => {
        const races = data.MRData.RaceTable.Races;
        const now = Date.now();
        const upcoming = races.find((r: any) => new Date(r.date).getTime() > now);
        setNextRace(upcoming || races[races.length - 1]);
      })
      .catch(console.error)
      .finally(() => setLoadingRace(false));
  }, []);

  useEffect(() => {
    if (!nextRace) return;
    const raceDate = new Date(`${nextRace.date}T14:00:00`);
    const qualTime = new Date(raceDate.getTime() - 24 * 60 * 60 * 1000);
    qualTime.setHours(15, 0, 0, 0);
    function update() {
      const diff = qualTime.getTime() - Date.now();
      if (diff <= 0) { setLockDisplay("Pronostico bloccato"); setLockUrgent(true); return; }
      const totalMin = Math.floor(diff / 60000);
      const days = Math.floor(totalMin / (60 * 24));
      const hours = Math.floor((totalMin % (60 * 24)) / 60);
      const minutes = totalMin % 60;
      if (diff < 60 * 60 * 1000) {
        setLockDisplay(`Ultime ${minutes}m!`);
        setLockUrgent(true);
      } else {
        const parts: string[] = [];
        if (days > 0) parts.push(`${days}g`);
        if (hours > 0) parts.push(`${hours}h`);
        parts.push(`${minutes}m`);
        setLockDisplay(`Modificabile ancora per ${parts.join(" ")}`);
        setLockUrgent(false);
      }
    }
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [nextRace]);

  const fetchSessionKey = async (raceName: string, year: number): Promise<number | null> => {
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
    const res = await fetch(`https://api.openf1.org/v1/sessions?year=${year}&circuit_short_name=${encodeURIComponent(circuitShortName)}&session_name=Race`);
    const data = await res.json();
    if (data && data.length > 0) return data[0].session_key;
    return null;
  };

  const checkRaceResults = async () => {
    if (!nextRace) return;
    const year = new Date(nextRace.date).getFullYear();
    const key = await fetchSessionKey(nextRace.raceName, year);
    if (!key) return;
    setSessionKey(key);
    const res = await fetch(`https://api.openf1.org/v1/position?session_key=${key}`);
    const data = await res.json();
    if (!Array.isArray(data)) return;
    const finalPositions = data.filter((p: any) => p.position <= 3);
    const uniqueDrivers = [...new Map(finalPositions.map((p: any) => [p.driver_number, p])).values()];
    if (uniqueDrivers.length >= 3) setRaceResultsAvailable(true);
  };

  useEffect(() => {
    if (nextRace) checkRaceResults();
  }, [nextRace]);

  const calculateScore = async () => {
    if (!sessionKey || podium.some(d => d === null)) return;

    const myPodium = podium.map(d => parseInt(d!.number));

    const posRes = await fetch(`https://api.openf1.org/v1/position?session_key=${sessionKey}`);
    const posData = await posRes.json();
    const sorted = posData.sort((a: any, b: any) => a.position - b.position);
    const seen = new Set();
    const realPodium: any[] = [];
    for (const p of sorted) {
      if (!seen.has(p.driver_number) && p.position <= 3) {
        seen.add(p.driver_number);
        realPodium.push(p);
      }
    }
    realPodium.sort((a: any, b: any) => a.position - b.position);

    const rcRes = await fetch(`https://api.openf1.org/v1/race_control?session_key=${sessionKey}`);
    const rcData = await rcRes.json();
    const realSC = rcData.filter((e: any) => e.category === "SafetyCar" && e.message?.includes("DEPLOYED")).length;
    const realRF = rcData.some((e: any) => e.category === "RedFlag");

    const lapsRes = await fetch(`https://api.openf1.org/v1/laps?session_key=${sessionKey}&lap_number=1`);
    const lapsData = await lapsRes.json();
    const totalLapsRes = await fetch(`https://api.openf1.org/v1/laps?session_key=${sessionKey}`);
    const totalLapsData = await totalLapsRes.json();
    const maxLap = Math.max(...totalLapsData.map((l: any) => l.lap_number));
    const lastLapDrivers = new Set(totalLapsData.filter((l: any) => l.lap_number === maxLap).map((l: any) => l.driver_number));
    const allDrivers = new Set(lapsData.map((l: any) => l.driver_number));
    const realDNF = [...allDrivers].filter(d => !lastLapDrivers.has(d)).length;

    const realNumbers = realPodium.map((p: any) => p.driver_number);
    let basePoints = 0;
    const breakdown: any[] = [];

    const exactOrder = myPodium[0] === realNumbers[0] && myPodium[1] === realNumbers[1] && myPodium[2] === realNumbers[2];
    if (exactOrder) {
      basePoints += 50;
      breakdown.push({ label: "Podio esatto", points: 50, positive: true });
    }

    for (let i = 0; i < 3; i++) {
      if (myPodium[i] === realNumbers[i]) {
        basePoints += 20;
        breakdown.push({ label: `P${i + 1} esatto`, points: 20, positive: true });
      } else if (realNumbers.includes(myPodium[i])) {
        basePoints += 7;
        breakdown.push({ label: `P${i + 1} sul podio`, points: 7, positive: true });
      } else {
        breakdown.push({ label: `P${i + 1} sbagliato`, points: 0, positive: false });
      }
    }

    let multiplier = 1;
    const scPredicted = safetyCar === 3 ? 3 : safetyCar ?? 0;
    const scCorrect = safetyCar !== null && (safetyCar === 3 ? realSC >= 3 : realSC === scPredicted);
    const rfCorrect = redFlag !== null && redFlag === realRF;
    const dnfRanges: [number, number][] = [[0, 3], [4, 6], [7, 999]];
    const dnfCorrect = dnfRange !== null && realDNF >= dnfRanges[dnfRange][0] && realDNF <= dnfRanges[dnfRange][1];

    if (safetyCar !== null && scCorrect && safetyCar > 0) {
      multiplier *= 1.1;
      breakdown.push({ label: "Safety Car corretta ×1.1", points: null, positive: true });
    } else if (safetyCar !== null && !scCorrect) {
      breakdown.push({ label: "Safety Car sbagliata", points: -5, positive: false });
    }

    if (redFlag !== null && rfCorrect) {
      multiplier *= 1.15;
      breakdown.push({ label: "Bandiera rossa corretta ×1.15", points: null, positive: true });
    } else if (redFlag !== null && !rfCorrect) {
      breakdown.push({ label: "Bandiera rossa sbagliata", points: -8, positive: false });
    }

    if (dnfRange !== null && dnfCorrect) {
      multiplier *= 1.1;
      breakdown.push({ label: "Range DNF corretto ×1.1", points: null, positive: true });
    } else if (dnfRange !== null && !dnfCorrect) {
      breakdown.push({ label: "Range DNF sbagliato", points: -5, positive: false });
    }

    let malus = 0;
    if (safetyCar !== null && !scCorrect) malus += 5;
    if (redFlag !== null && !rfCorrect) malus += 8;
    if (dnfRange !== null && !dnfCorrect) malus += 5;

    const finalScore = Math.round(basePoints * multiplier) - malus;

    setScoreBreakdown({ realPodium, breakdown, basePoints, multiplier, malus, finalScore });
    setShowScoring(true);
  };

  const allFilled = podium[0] !== null && podium[1] !== null && podium[2] !== null;

  function reset() {
    setPodium([null, null, null]);
    setSafetyCar(null);
    setRedFlag(null);
    setDnfRange(null);
    setStep(1);
  }

  const advancedSummary = [
    `Safety car: ${safetyCar !== null ? SC_OPTIONS[safetyCar] : "—"}`,
    `Bandiera rossa: ${redFlag === null ? "—" : redFlag ? "Sì" : "No"}`,
    `Ritiri: ${dnfRange !== null ? DNF_OPTIONS[dnfRange] : "—"}`,
  ].join(" · ");

  const raceCard = (
    <View style={styles.raceCard}>
      {loadingRace ? (
        <ActivityIndicator color="#E10600" />
      ) : nextRace ? (
        <>
          <Text style={styles.raceRound}>Round {nextRace.round} · {nextRace.season}</Text>
          <Text style={styles.raceName}>{nextRace.raceName}</Text>
          <Text style={styles.raceCircuit}>{nextRace.Circuit.circuitName}</Text>
          <Text style={styles.raceDate}>{new Date(nextRace.date).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</Text>
        </>
      ) : (
        <Text style={styles.raceCircuit}>Gara non disponibile</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>

      {/* ── Step 1: Podio ── */}
      {step === 1 && (
        <>
          <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.navbar}>
              <Image source={logo} style={{ height: 32, width: 160, resizeMode: 'contain' }} />
            </View>
            {raceCard}
            <Text style={styles.sectionTitle}>Seleziona il podio</Text>
            <View style={styles.podiumRow}>
              {([1, 0, 2] as const).map(slotIndex => {
                const driver = podium[slotIndex];
                const isCenter = slotIndex === 0;
                return (
                  <TouchableOpacity
                    key={slotIndex}
                    style={[styles.podiumSlot, { height: SLOT_HEIGHTS[slotIndex] }, isCenter && styles.podiumSlotCenter]}
                    onPress={() => {
                      if (driver) {
                        const updated = [...podium] as Podium;
                        updated[slotIndex] = null;
                        setPodium(updated);
                      }
                    }}
                  >
                    <Text style={[styles.podiumPosition, isCenter && styles.podiumPositionCenter]}>
                      {SLOT_LABELS[slotIndex]}
                    </Text>
                    {driver ? (
                      <>
                        <View style={[styles.podiumColorDot, { backgroundColor: driver.color }]} />
                        <Text style={styles.podiumDriverCode}>{driver.code}</Text>
                      </>
                    ) : (
                      <Text style={{ fontSize: 11, color: "#555555", marginTop: 2 }}>Seleziona</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.selectionList}>
              {drivers.map(driver => {
                const slotIndex = podium.findIndex(d => d?.id === driver.id);
                const placed = slotIndex !== -1;
                return (
                  <TouchableOpacity
                    key={driver.id}
                    style={[styles.driverRow, placed && styles.driverRowPlaced]}
                    onPress={() => {
                      if (placed) return;
                      const slot = ([0, 1, 2] as const).find(i => podium[i] === null) ?? null;
                      if (slot === null) return;
                      const updated = [...podium] as Podium;
                      updated[slot] = driver;
                      setPodium(updated);
                    }}
                  >
                    <Text style={[styles.driverNum, { color: driver.color }]}>{driver.number}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.driverName}>{driver.name}</Text>
                      <Text style={styles.driverTeam}>{driver.team}</Text>
                    </View>
                    {placed && (
                      <View style={[styles.placedBadge, { backgroundColor: driver.color + "22" }]}>
                        <Text style={[styles.placedBadgeText, { color: driver.color }]}>{SLOT_LABELS[slotIndex]}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          {allFilled && (
            <View style={styles.stickyBar}>
              <TouchableOpacity style={styles.stickyButton} onPress={() => setStep(2)}>
                <Text style={styles.stickyButtonText}>Scegli parametri avanzati →</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {/* ── Step 2: Avanzati ── */}
      {step === 2 && (
        <>
          <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.navbar}>
              <Image source={logo} style={{ height: 32, width: 160, resizeMode: 'contain' }} />
            </View>
            {raceCard}
            <Text style={styles.sectionTitle}>Parametri avanzati</Text>
            <View style={styles.advancedCard}>
              <Text style={styles.advancedLabel}>Safety car</Text>
              <View style={styles.segmentRow}>
                {SC_OPTIONS.map((label, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.segmentBtn, safetyCar === i && styles.segmentBtnActive]}
                    onPress={() => setSafetyCar(safetyCar === i ? null : i)}
                  >
                    <Text style={[styles.segmentText, safetyCar === i && styles.segmentTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.advancedLabel}>Bandiera rossa</Text>
              <View style={styles.segmentRow}>
                {(["No", "Sì"] as const).map((label, i) => {
                  const val = i === 1;
                  const active = redFlag === val;
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.segmentBtn, { flex: 1 }, active && styles.segmentBtnActive]}
                      onPress={() => setRedFlag(active ? null : val)}
                    >
                      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.advancedLabel}>Ritiri</Text>
              <View style={styles.segmentRow}>
                {DNF_OPTIONS.map((label, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.segmentBtn, dnfRange === i && styles.segmentBtnActive]}
                    onPress={() => setDnfRange(dnfRange === i ? null : i)}
                  >
                    <Text style={[styles.segmentText, dnfRange === i && styles.segmentTextActive]}>{label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          <View style={styles.stickyBar}>
            <TouchableOpacity style={styles.stickyButton} onPress={() => setStep(3)}>
              <Text style={styles.stickyButtonText}>Conferma pronostico</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── Step 3: Recap ── */}
      {step === 3 && (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <View style={styles.navbar}>
            <Image source={logo} style={{ height: 32, width: 160, resizeMode: 'contain' }} />
          </View>
          {raceCard}
          <View style={styles.confirmedBanner}>
            <Text style={styles.confirmedBannerTitle}>Pronostico confermato</Text>
            {nextRace && <Text style={styles.confirmedBannerRace}>{nextRace.raceName}</Text>}
            {lockDisplay ? (
              <Text style={[styles.lockCountdown, lockUrgent && styles.lockCountdownUrgent]}>{lockDisplay}</Text>
            ) : null}
          </View>
          <Text style={styles.sectionTitle}>Il tuo podio</Text>
          <View style={styles.confirmedCard}>
            {(podium as Driver[]).map((driver, i) => (
              <View key={i} style={styles.confirmedRow}>
                <Text style={styles.confirmedPosition}>{SLOT_LABELS[i]}</Text>
                <View style={[styles.confirmedSwatch, { backgroundColor: driver.color }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.confirmedName}>{driver.name}</Text>
                  <Text style={styles.confirmedTeam}>{driver.team}</Text>
                </View>
                <Text style={[styles.confirmedNumber, { color: driver.color }]}>{driver.number}</Text>
              </View>
            ))}
          </View>
          <View style={styles.confirmedAdvanced}>
            <Text style={styles.confirmedAdvancedText}>{advancedSummary}</Text>
          </View>
          {(() => {
            let pts = 110;
            if (safetyCar !== null && safetyCar > 0) pts *= 1.1;
            if (redFlag === true) pts *= 1.15;
            if (dnfRange !== null) pts *= 1.1;
            return (
              <View style={styles.maxPtsCard}>
                <Text style={styles.maxPtsLabel}>PUNTEGGIO MASSIMO OTTENIBILE</Text>
                <Text style={styles.maxPtsValue}>{Math.round(pts)}</Text>
                <Text style={styles.maxPtsSubtitle}>se il tuo podio è esatto</Text>
              </View>
            );
          })()}
          {raceResultsAvailable ? (
            <TouchableOpacity style={styles.scoringButton} onPress={calculateScore}>
              <Text style={styles.scoringButtonText}>SCOPRI IL RISULTATO</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.confirmedNote}>
              <Text style={styles.confirmedNoteText}>I risultati saranno disponibili dopo la gara</Text>
            </View>
          )}
          <TouchableOpacity style={styles.resetButton} onPress={reset}>
            <Text style={styles.resetButtonText}>Modifica pronostico</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      <Modal visible={showScoring} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: "#0A0A0A", padding: 24, paddingTop: 48 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "800", marginBottom: 4 }}>RISULTATO</Text>
          <Text style={{ color: "#999999", fontSize: 13, marginBottom: 24 }}>{nextRace?.raceName}</Text>
          {scoreBreakdown?.breakdown.map((item: any, i: number) => (
            <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#2A2A2A" }}>
              <Text style={{ color: item.positive ? "#FFFFFF" : "#555555", fontSize: 14 }}>{item.label}</Text>
              {item.points !== null && (
                <Text style={{ color: item.positive ? "#27AE60" : "#E10600", fontSize: 14, fontWeight: "700" }}>
                  {item.positive ? `+${item.points}` : `${item.points}`}pt
                </Text>
              )}
              {item.points === null && (
                <Text style={{ color: "#27AE60", fontSize: 13 }}>
                  {item.label.includes("×") ? item.label.split(" ").pop() : ""}
                </Text>
              )}
            </View>
          ))}
          <View style={{ alignItems: "center", marginTop: 32 }}>
            <Text style={{ color: "#999999", fontSize: 11, letterSpacing: 2 }}>PUNTEGGIO FINALE</Text>
            <Text style={{ color: "#E10600", fontSize: 72, fontWeight: "800" }}>{scoreBreakdown?.finalScore}</Text>
            <Text style={{ color: "#555555", fontSize: 12 }}>su ~110 punti massimi</Text>
          </View>
          <TouchableOpacity onPress={() => setShowScoring(false)} style={{ marginTop: 32, padding: 16, backgroundColor: "#141414", borderRadius: 12, alignItems: "center" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }}>Chiudi</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0A0A0A" },
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  content: { padding: 16, gap: 12, paddingBottom: 100, backgroundColor: "#0A0A0A" },
  navbar: { flexDirection: "row", alignItems: "center", paddingVertical: 8, paddingTop: 8 },


  raceCard: { backgroundColor: "#141414", borderRadius: 12, padding: 16, gap: 3, borderLeftWidth: 3, borderLeftColor: "#E10600" },
  raceRound: { fontSize: 10, color: "#999999", textTransform: "uppercase", letterSpacing: 0.5 },
  raceName: { fontSize: 17, fontWeight: "600", color: "#FFFFFF" },
  raceCircuit: { fontSize: 12, color: "#999999" },
  raceDate: { fontSize: 12, color: "#555555", marginTop: 2 },

  sectionTitle: { fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginTop: 4 },

  podiumRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  podiumSlot: { flex: 1, borderRadius: 10, alignItems: "center", justifyContent: "center", gap: 4, backgroundColor: "#1A1A1A" },
  podiumSlotCenter: { borderWidth: 1, borderColor: "#E10600", backgroundColor: "#1F0A0A" },
  podiumPosition: { fontSize: 11, color: "#999999", fontWeight: "500" },
  podiumPositionCenter: { color: "#E10600" },
  podiumColorDot: { width: 8, height: 8, borderRadius: 4 },
  podiumDriverCode: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },
  podiumEmpty: { fontSize: 9, color: "#333333", letterSpacing: 0.5 },

  selectionList: { backgroundColor: "#141414", borderRadius: 12, overflow: "hidden" },
  driverRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12, borderBottomWidth: 0.5, borderBottomColor: "#222222" },
  driverRowPlaced: { backgroundColor: "#1A1A1A" },
  driverNum: { fontSize: 16, fontWeight: "500", width: 32 },
  driverName: { fontSize: 13, fontWeight: "500", color: "#FFFFFF" },
  driverTeam: { fontSize: 11, color: "#999999" },
  placedBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  placedBadgeText: { fontSize: 11, fontWeight: "600" },

  stickyBar: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: "#141414", borderTopWidth: 0.5, borderTopColor: "#222222" },
  stickyButton: { backgroundColor: "#E10600", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  stickyButtonText: { fontSize: 14, fontWeight: "600", color: "#fff" },

  advancedCard: { backgroundColor: "#141414", borderRadius: 12, padding: 14, gap: 10 },
  advancedLabel: { fontSize: 11, color: "#999999", fontWeight: "500" },
  segmentRow: { flexDirection: "row", gap: 6 },
  segmentBtn: { flex: 1, paddingVertical: 8, borderWidth: 0.5, borderColor: "#333333", borderRadius: 8, alignItems: "center", backgroundColor: "#1A1A1A" },
  segmentBtnActive: { backgroundColor: "#E10600", borderColor: "#E10600" },
  segmentText: { fontSize: 12, color: "#999999", fontWeight: "500" },
  segmentTextActive: { color: "#fff" },

  confirmedBanner: { borderRadius: 12, backgroundColor: "#141414", borderLeftWidth: 3, borderLeftColor: "#27AE60", padding: 16, gap: 4 },
  confirmedBannerTitle: { fontSize: 15, fontWeight: "600", color: "#27AE60" },
  confirmedBannerRace: { fontSize: 13, color: "#999999" },
  lockCountdown: { fontSize: 12, color: "#999999", marginTop: 4 },
  lockCountdownUrgent: { color: "#E10600" },

  confirmedCard: { backgroundColor: "#141414", borderRadius: 12, overflow: "hidden" },
  confirmedRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 0.5, borderBottomColor: "#222222" },
  confirmedPosition: { fontSize: 13, fontWeight: "600", color: "#999999", width: 24 },
  confirmedSwatch: { width: 4, height: 32, borderRadius: 2 },
  confirmedName: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  confirmedTeam: { fontSize: 11, color: "#999999" },
  confirmedNumber: { fontSize: 20, fontWeight: "500" },

  confirmedAdvanced: { backgroundColor: "#141414", borderRadius: 12, padding: 14 },
  confirmedAdvancedText: { fontSize: 13, color: "#999999", lineHeight: 20 },

  confirmedNote: { backgroundColor: "#141414", borderRadius: 12, padding: 14 },
  confirmedNoteText: { fontSize: 13, color: "#555555", textAlign: "center" },

  maxPtsCard: { backgroundColor: "#141414", borderRadius: 12, padding: 16, alignItems: "center" },
  maxPtsLabel: { fontSize: 10, color: "#999999", letterSpacing: 1.5 },
  maxPtsValue: { fontSize: 28, fontWeight: "800", color: "#E10600" },
  maxPtsSubtitle: { fontSize: 11, color: "#555555" },

  scoringButton: { backgroundColor: "#E10600", borderRadius: 12, padding: 16, width: "100%", alignItems: "center" },
  scoringButtonText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },

  resetButton: { backgroundColor: "#141414", borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  resetButtonText: { fontSize: 13, color: "#999999" },
});
