import { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const logo = require('../../assets/images/PitWall Logo.png');
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";

import abudhabiData  from "../../assets/circuits/abudhabi.json";
import austinData    from "../../assets/circuits/austin.json";
import bahrainData   from "../../assets/circuits/bahrain.json";
import bakuData      from "../../assets/circuits/baku.json";
import barcelonaData from "../../assets/circuits/barcelona.json";
import budapestData  from "../../assets/circuits/budapest.json";
import imolaData     from "../../assets/circuits/imola.json";
import jeddahData    from "../../assets/circuits/jeddah.json";
import lasVegasData  from "../../assets/circuits/lasvegas.json";
import lusailData    from "../../assets/circuits/lusail.json";
import melbourneData from "../../assets/circuits/melbourne.json";
import mexicoData    from "../../assets/circuits/mexico.json";
import miamiData     from "../../assets/circuits/miami.json";
import monacoData    from "../../assets/circuits/monaco.json";
import montrealData  from "../../assets/circuits/montreal.json";
import monzaData     from "../../assets/circuits/monza.json";
import saopauloData  from "../../assets/circuits/saopaulo.json";
import shanghaiData  from "../../assets/circuits/shanghai.json";
import silverstoneData from "../../assets/circuits/silverstone.json";
import singaporeData from "../../assets/circuits/singapore.json";
import spaData       from "../../assets/circuits/spa.json";
import spielbergData from "../../assets/circuits/spielberg.json";
import suzukaData    from "../../assets/circuits/suzuka.json";
import zandvoortData from "../../assets/circuits/zandvoort.json";
import madridData    from "../../assets/circuits/madrid.json";

const PAGE_W = Dimensions.get("window").width - 32;

const SECTOR_COLORS = ["#E10600", "#0067FF", "#FFC906"];

// Calendar order
const CIRCUITS = [
  { key: "bahrain",     data: bahrainData },
  { key: "jeddah",     data: jeddahData },
  { key: "melbourne",  data: melbourneData },
  { key: "suzuka",     data: suzukaData },
  { key: "shanghai",   data: shanghaiData },
  { key: "miami",      data: miamiData },
  { key: "imola",      data: imolaData },
  { key: "monaco",     data: monacoData },
  { key: "montreal",   data: montrealData },
  { key: "barcelona",  data: barcelonaData },
  { key: "spielberg",  data: spielbergData },
  { key: "silverstone",data: silverstoneData },
  { key: "budapest",   data: budapestData },
  { key: "spa",        data: spaData },
  { key: "zandvoort",  data: zandvoortData },
  { key: "monza",      data: monzaData },
  { key: "baku",       data: bakuData },
  { key: "singapore",  data: singaporeData },
  { key: "austin",     data: austinData },
  { key: "mexico",     data: mexicoData },
  { key: "saopaulo",   data: saopauloData },
  { key: "lasvegas",   data: lasVegasData },
  { key: "lusail",     data: lusailData },
  { key: "abudhabi",   data: abudhabiData },
  { key: "madrid",     data: madridData },
];

type Meta = {
  display: string;
  sub: string;
  dna: { tipo: string; usura: string; qualifica: string; sc: string; sorpassi: string };
};

const CIRCUIT_META: Record<string, Meta> = {
  bahrain:     { display: "Bahrain International Circuit",   sub: "Sakhir · 5.412 km · 57 giri",       dna: { tipo: "Permanente",  usura: "Alta",       qualifica: "Media",     sc: "4 su ultimi 10 GP", sorpassi: "Frequenti"  } },
  jeddah:      { display: "Jeddah Corniche Circuit",         sub: "Jeddah · 6.174 km · 50 giri",        dna: { tipo: "Cittadino",   usura: "Alta",       qualifica: "Alta",      sc: "5 su ultimi 10 GP", sorpassi: "Possibili"  } },
  melbourne:   { display: "Albert Park Circuit",             sub: "Melbourne · 5.278 km · 58 giri",     dna: { tipo: "Misto",       usura: "Media",      qualifica: "Alta",      sc: "5 su ultimi 10 GP", sorpassi: "Difficili"  } },
  suzuka:      { display: "Suzuka Circuit",                  sub: "Suzuka · 5.807 km · 53 giri",        dna: { tipo: "Permanente",  usura: "Alta",       qualifica: "Altissima", sc: "3 su ultimi 10 GP", sorpassi: "Difficili"  } },
  shanghai:    { display: "Shanghai International Circuit",  sub: "Shanghai · 5.451 km · 56 giri",      dna: { tipo: "Permanente",  usura: "Alta",       qualifica: "Media",     sc: "4 su ultimi 10 GP", sorpassi: "Possibili"  } },
  miami:       { display: "Miami International Autodrome",   sub: "Miami · 5.412 km · 57 giri",         dna: { tipo: "Cittadino",   usura: "Media",      qualifica: "Alta",      sc: "4 su ultimi 10 GP", sorpassi: "Possibili"  } },
  imola:       { display: "Autodromo Enzo e Dino Ferrari",   sub: "Imola · 4.909 km · 63 giri",         dna: { tipo: "Permanente",  usura: "Bassa",      qualifica: "Alta",      sc: "5 su ultimi 10 GP", sorpassi: "Rarissimi"  } },
  monaco:      { display: "Circuit de Monaco",               sub: "Monte Carlo · 3.337 km · 78 giri",   dna: { tipo: "Cittadino",   usura: "Bassa",      qualifica: "Altissima", sc: "8 su ultimi 10 GP", sorpassi: "Rarissimi"  } },
  montreal:    { display: "Circuit Gilles Villeneuve",       sub: "Montréal · 4.361 km · 70 giri",      dna: { tipo: "Cittadino",   usura: "Media",      qualifica: "Alta",      sc: "5 su ultimi 10 GP", sorpassi: "Difficili"  } },
  barcelona:   { display: "Circuit de Barcelona-Catalunya",  sub: "Barcelona · 4.657 km · 66 giri",     dna: { tipo: "Permanente",  usura: "Molto Alta", qualifica: "Alta",      sc: "3 su ultimi 10 GP", sorpassi: "Possibili"  } },
  spielberg:   { display: "Red Bull Ring",                   sub: "Spielberg · 4.318 km · 71 giri",     dna: { tipo: "Permanente",  usura: "Molto Alta", qualifica: "Bassa",     sc: "3 su ultimi 10 GP", sorpassi: "Frequenti"  } },
  silverstone: { display: "Silverstone Circuit",             sub: "Silverstone · 5.891 km · 52 giri",   dna: { tipo: "Permanente",  usura: "Alta",       qualifica: "Alta",      sc: "4 su ultimi 10 GP", sorpassi: "Frequenti"  } },
  budapest:    { display: "Hungaroring",                     sub: "Budapest · 4.381 km · 70 giri",      dna: { tipo: "Permanente",  usura: "Alta",       qualifica: "Altissima", sc: "4 su ultimi 10 GP", sorpassi: "Rarissimi"  } },
  spa:         { display: "Circuit de Spa-Francorchamps",    sub: "Spa · 7.004 km · 44 giri",           dna: { tipo: "Permanente",  usura: "Bassa",      qualifica: "Alta",      sc: "5 su ultimi 10 GP", sorpassi: "Frequenti"  } },
  zandvoort:   { display: "Circuit Zandvoort",               sub: "Zandvoort · 4.259 km · 72 giri",     dna: { tipo: "Permanente",  usura: "Molto Alta", qualifica: "Alta",      sc: "4 su ultimi 10 GP", sorpassi: "Rarissimi"  } },
  monza:       { display: "Autodromo Nazionale Monza",       sub: "Monza · 5.793 km · 53 giri",         dna: { tipo: "Permanente",  usura: "Bassa",      qualifica: "Altissima", sc: "4 su ultimi 10 GP", sorpassi: "Frequenti"  } },
  baku:        { display: "Baku City Circuit",               sub: "Baku · 6.003 km · 51 giri",          dna: { tipo: "Cittadino",   usura: "Bassa",      qualifica: "Alta",      sc: "6 su ultimi 10 GP", sorpassi: "Possibili"  } },
  singapore:   { display: "Marina Bay Street Circuit",       sub: "Singapore · 4.940 km · 62 giri",     dna: { tipo: "Cittadino",   usura: "Media",      qualifica: "Alta",      sc: "7 su ultimi 10 GP", sorpassi: "Difficili"  } },
  austin:      { display: "Circuit of the Americas",         sub: "Austin · 5.513 km · 56 giri",        dna: { tipo: "Permanente",  usura: "Alta",       qualifica: "Alta",      sc: "4 su ultimi 10 GP", sorpassi: "Possibili"  } },
  mexico:      { display: "Autodromo Hermanos Rodriguez",    sub: "Mexico City · 4.304 km · 71 giri",   dna: { tipo: "Permanente",  usura: "Bassa",      qualifica: "Media",     sc: "3 su ultimi 10 GP", sorpassi: "Frequenti"  } },
  saopaulo:    { display: "Autodromo Jose Carlos Pace",      sub: "São Paulo · 4.309 km · 71 giri",     dna: { tipo: "Misto",       usura: "Alta",       qualifica: "Alta",      sc: "5 su ultimi 10 GP", sorpassi: "Possibili"  } },
  lasvegas:    { display: "Las Vegas Street Circuit",        sub: "Las Vegas · 6.201 km · 50 giri",     dna: { tipo: "Cittadino",   usura: "Bassa",      qualifica: "Alta",      sc: "3 su ultimi 10 GP", sorpassi: "Possibili"  } },
  lusail:      { display: "Lusail International Circuit",    sub: "Lusail · 5.380 km · 57 giri",        dna: { tipo: "Permanente",  usura: "Molto Alta", qualifica: "Alta",      sc: "3 su ultimi 10 GP", sorpassi: "Possibili"  } },
  abudhabi:    { display: "Yas Marina Circuit",              sub: "Abu Dhabi · 5.281 km · 58 giri",     dna: { tipo: "Permanente",  usura: "Media",      qualifica: "Alta",      sc: "3 su ultimi 10 GP", sorpassi: "Possibili"  } },
  madrid:      { display: "Madrid Street Circuit",           sub: "Madrid · 5.474 km · 52 giri",        dna: { tipo: "Cittadino",   usura: "Media",      qualifica: "Alta",      sc: "3 su ultimi 10 GP", sorpassi: "Possibili"  } },
};

const CIRCUIT_INFO_MAP: Record<string, any> = {
  abudhabi:   require("../../assets/circuit-info/abudhabi.json"),
  austin:     require("../../assets/circuit-info/austin.json"),
  bahrain:    require("../../assets/circuit-info/bahrain.json"),
  baku:       require("../../assets/circuit-info/baku.json"),
  barcelona:  require("../../assets/circuit-info/barcelona.json"),
  budapest:   require("../../assets/circuit-info/budapest.json"),
  imola:      require("../../assets/circuit-info/imola.json"),
  jeddah:     require("../../assets/circuit-info/jeddah.json"),
  lasvegas:   require("../../assets/circuit-info/lasvegas.json"),
  lusail:     require("../../assets/circuit-info/lusail.json"),
  melbourne:  require("../../assets/circuit-info/melbourne.json"),
  mexico:     require("../../assets/circuit-info/mexico.json"),
  miami:      require("../../assets/circuit-info/miami.json"),
  monaco:     require("../../assets/circuit-info/monaco.json"),
  montreal:   require("../../assets/circuit-info/montreal.json"),
  monza:      require("../../assets/circuit-info/monza.json"),
  saopaulo:   require("../../assets/circuit-info/saopaulo.json"),
  shanghai:   require("../../assets/circuit-info/shanghai.json"),
  silverstone:require("../../assets/circuit-info/silverstone.json"),
  singapore:  require("../../assets/circuit-info/singapore.json"),
  spa:        require("../../assets/circuit-info/spa.json"),
  spielberg:  require("../../assets/circuit-info/spielberg.json"),
  suzuka:     require("../../assets/circuit-info/suzuka.json"),
  zandvoort:  require("../../assets/circuit-info/zandvoort.json"),
  madrid:     require("../../assets/circuit-info/madrid.json"),
};

const CIRCUIT_COUNTRY: Record<string, string> = {
  bahrain: "Bahrain", jeddah: "Arabia Saudita", melbourne: "Australia",
  suzuka: "Giappone", shanghai: "Cina", miami: "USA", imola: "Italia",
  monaco: "Monaco", montreal: "Canada", barcelona: "Spagna",
  spielberg: "Austria", silverstone: "Gran Bretagna", budapest: "Ungheria",
  spa: "Belgio", zandvoort: "Olanda", monza: "Italia", baku: "Azerbaijan",
  singapore: "Singapore", austin: "USA", mexico: "Messico",
  saopaulo: "Brasile", lasvegas: "USA", lusail: "Qatar", abudhabi: "Abu Dhabi",
  madrid: "Spagna",
};

const CORNERS = [
  { id: 1,  name: "Sainte Devote",    sector: 1, desc: "Prima curva del GP, spesso teatro di incidenti al via.",           speed: "65 km/h",  g: "3.2G", pointIndex: 0  },
  { id: 2,  name: "Massenet",         sector: 1, desc: "Curva veloce in salita verso il Casino.",                          speed: "120 km/h", g: "2.8G", pointIndex: 10 },
  { id: 3,  name: "Casino",           sector: 2, desc: "La curva più famosa di Monaco, davanti al Casino.",                speed: "75 km/h",  g: "3.1G", pointIndex: 20 },
  { id: 4,  name: "Mirabeau",         sector: 2, desc: "Curva tecnica in discesa verso il tunnel.",                        speed: "70 km/h",  g: "3.0G", pointIndex: 30 },
  { id: 5,  name: "Tunnel",           sector: 2, desc: "L'unico tunnel della F1. Da buio a luce in un secondo.",           speed: "290 km/h", g: "1.2G", pointIndex: 42 },
  { id: 6,  name: "Nouvelle Chicane", sector: 3, desc: "La frenata più brusca del circuito.",                              speed: "55 km/h",  g: "3.8G", pointIndex: 52 },
  { id: 7,  name: "Tabac",            sector: 3, desc: "Curva veloce sul lungomare.",                                      speed: "95 km/h",  g: "2.9G", pointIndex: 62 },
  { id: 8,  name: "Piscine",          sector: 3, desc: "Doppia curva accanto alla piscina olimpica.",                      speed: "80 km/h",  g: "3.3G", pointIndex: 72 },
  { id: 9,  name: "Rascasse",         sector: 3, desc: "La curva più lenta di Monaco — il 'parcheggio' di Schumacher nel 2006.", speed: "45 km/h", g: "2.5G", pointIndex: 75 },
  { id: 10, name: "Anthoines",        sector: 3, desc: "Ultima curva prima del rettilineo di partenza.",                   speed: "105 km/h", g: "2.7G", pointIndex: 80 },
];

function getAvgSpeed(lapRecordTime: string | undefined, distanceStr: string): { kmh: number; label: string; pct: number; color: string } {
  if (!lapRecordTime) return { kmh: 0, label: "N/D", pct: 0, color: "#555555" };
  try {
    const parts = lapRecordTime.split(':');
    const secs = parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    const distMatch = distanceStr.match(/([\d.]+)\s*km/);
    if (!distMatch) return { kmh: 0, label: "N/D", pct: 0, color: "#555555" };
    const dist = parseFloat(distMatch[1]);
    const kmh = (dist / secs) * 3600;
    const label = kmh >= 240 ? "Altissima" : kmh >= 220 ? "Alta" : kmh >= 200 ? "Media" : "Bassa";
    const pct = Math.min(1, Math.max(0, (kmh - 160) / 100));
    return { kmh: Math.round(kmh), label, pct, color: "#3498DB" };
  } catch {
    return { kmh: 0, label: "N/D", pct: 0, color: "#555555" };
  }
}

function getAeroLoad(corners: any[]): { value: number; label: string; pct: number } {
  if (!corners?.length) return { value: 0, label: "N/D", pct: 0 };
  const avg = corners.reduce((s: number, c: any) => s + (parseFloat(c.g) || 0), 0) / corners.length;
  const pct = Math.min(1, avg / 5.5);
  const label = avg >= 4.5 ? "Altissimo" : avg >= 3.8 ? "Alto" : avg >= 3.0 ? "Medio" : "Basso";
  return { value: avg, label, pct };
}

function getTractionRating(trazione: string): { label: string; color: string } {
  switch (trazione) {
    case "Altissima": return { label: "Altissima", color: "#F39C12" };
    case "Alta": return { label: "Alta", color: "#F39C12" };
    case "Media": return { label: "Media", color: "#F39C12" };
    case "Bassa": return { label: "Bassa", color: "#F39C12" };
    default: return { label: "N/D", color: "#555555" };
  }
}

function getBlocks(rating: string, color: string) {
  const filled = rating === "Altissima" || rating === "Altissimo" || rating === "Molto Alta" ? 4
    : rating === "Alta" || rating === "Alto" ? 3
    : rating === "Media" || rating === "Medio" ? 2
    : rating === "Bassa" || rating === "Basso" ? 1
    : 0;
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[0, 1, 2, 3].map(i => (
        <View key={i} style={{
          width: 18, height: 8, borderRadius: 2,
          backgroundColor: i < filled ? color : "#2A2A2A"
        }} />
      ))}
    </View>
  );
}

function makeSectorPaths(points: { x: number; y: number; z: number }[]) {
  const n = points.length;
  const s1End = Math.floor(n / 3);       // boundary between sector 1 and 2
  const s2End = Math.floor(2 * n / 3);   // boundary between sector 2 and 3
  const toPath = (seg: typeof points) =>
    seg.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return [
    toPath(points.slice(0, s1End + 3)),              // [0 .. s1End+2]
    toPath(points.slice(Math.max(0, s1End - 1), s2End + 3)),  // [s1End-1 .. s2End+2]
    toPath(points.slice(Math.max(0, s2End - 1))),    // [s2End-1 .. end]
  ];
}

export default function CircuitoScreen() {
  const navigation = useNavigation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCorner, setSelectedCorner] = useState<any>(null);
  const [anecdotes, setAnecdotes] = useState<{titolo: string, testo: string}[]>([]);
  const [loadingAnecdotes, setLoadingAnecdotes] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: "", headerShown: false });
    const c = CIRCUITS[0];
    const m = CIRCUIT_META[c.key];
    fetchAnecdotes(c.key, m.display, CIRCUIT_INFO_MAP[c.key]?.lapRecord?.time ?? '—', CIRCUIT_COUNTRY[c.key] ?? '');
  }, []);

  async function fetchAnecdotes(circuitKey: string, circuitName: string, lapRecord: string, country: string) {
    const cacheKey = `anecdotes_${circuitKey}`;
    try {
      const cached = await AsyncStorage.getItem(cacheKey);
      if (cached) {
        setAnecdotes(JSON.parse(cached));
        return;
      }
    } catch {}

    setLoadingAnecdotes(true);
    try {
      const response = await fetch('https://a.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `Sei un esperto di Formula 1. Genera 2 aneddoti storici brevi e interessanti sul circuito ${circuitName} in ${country}. Il lap record è ${lapRecord}. Rispondi SOLO con un array JSON valido, nessun testo aggiuntivo, nessun markdown: [{"titolo": "...", "testo": "..."}]. Ogni testo massimo 120 caratteri. Solo fatti reali verificabili.`
          }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text ?? '[]';
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        setAnecdotes(parsed);
        await AsyncStorage.setItem(cacheKey, JSON.stringify(parsed));
      }
    } catch {
      setAnecdotes([]);
    } finally {
      setLoadingAnecdotes(false);
    }
  }

  const current = CIRCUITS[currentIndex];
  const meta = CIRCUIT_META[current.key];
  const isMonaco = current.key === "monaco";
  const circuitInfo = CIRCUIT_INFO_MAP[current.key];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.navbar}>
          <Image source={logo} style={{ height: 32, width: 160, resizeMode: 'contain' }} />
        </View>

        <View style={{ gap: 4, marginBottom: 4 }}>
          <Text style={{ color: "#999999", fontSize: 11, fontWeight: "700", letterSpacing: 2 }}>
            ROUND {currentIndex + 1} · {meta.sub.split('·')[0].trim().toUpperCase()}
          </Text>
          <Text style={{ color: "#FFFFFF", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 }}>
            {meta.display.toUpperCase()}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 2 }}>
            <Text style={{ color: "#999999", fontSize: 12 }}>
              {meta.sub.split('·').slice(1).join('·').trim()}
            </Text>
          </View>
        </View>

        <View style={styles.sectorLegend}>
          {["Settore 1", "Settore 2", "Settore 3"].map((s, i) => (
            <View key={i} style={styles.sectorBadge}>
              <View style={[styles.sectorDot, { backgroundColor: SECTOR_COLORS[i] }]} />
              <Text style={styles.sectorLabel}>{s}</Text>
            </View>
          ))}
        </View>

        {circuitInfo?.lapRecord && (
          <View style={{ backgroundColor: "#141414", borderRadius: 12, padding: 16, marginBottom: 4 }}>
            <Text style={{ color: "#999999", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 4 }}>LAP RECORD</Text>
            <Text style={{ color: "#E10600", fontSize: 32, fontWeight: "900", letterSpacing: -1 }}>
              {circuitInfo.lapRecord.time}
            </Text>
            <Text style={{ color: "#999999", fontSize: 12, marginTop: 4 }}>
              {circuitInfo.lapRecord.driver} · {circuitInfo.lapRecord.year}
            </Text>
          </View>
        )}

        {/* Horizontal pager */}
        <View>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / PAGE_W);
              setCurrentIndex(index);
              setSelectedCorner(null);
              setAnecdotes([]);
              const c = CIRCUITS[index];
              const m = CIRCUIT_META[c.key];
              fetchAnecdotes(c.key, m.display, CIRCUIT_INFO_MAP[c.key]?.lapRecord?.time ?? '—', CIRCUIT_COUNTRY[c.key] ?? '');
            }}
          >
            {CIRCUITS.map(({ key, data }) => {
              const points = data.points;
              if (points.length === 0) {
                return (
                  <View key={key} style={[styles.mapCard, { width: PAGE_W }]}>
                    <View style={{ width: "100%", height: 280, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: "#555555", fontSize: 13, textAlign: "center" }}>Tracciato non disponibile{"\n"}Prima edizione 2026</Text>
                    </View>
                  </View>
                );
              }
              const [path1, path2, path3] = makeSectorPaths(points);
              return (
                <View key={key} style={[styles.mapCard, { width: PAGE_W }]}>
                  <Svg viewBox="0 0 300 300" style={styles.svg}>
                    <Path d={path1} fill="none" stroke={SECTOR_COLORS[0]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d={path2} fill="none" stroke={SECTOR_COLORS[1]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    <Path d={path3} fill="none" stroke={SECTOR_COLORS[2]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    {key === "monaco" && CORNERS.map(c => {
                      const p = points[c.pointIndex] as any;
                      if (!p) return null;
                      const isSelected = selectedCorner?.id === c.id;
                      return (
                        <Circle
                          key={c.id}
                          cx={p.x} cy={p.y}
                          r={isSelected ? 8 : 5}
                          fill={isSelected ? "#fff" : SECTOR_COLORS[c.sector - 1]}
                          stroke={isSelected ? SECTOR_COLORS[c.sector - 1] : "#fff"}
                          strokeWidth={1.5}
                          onPress={() => setSelectedCorner(c.id === selectedCorner?.id ? null : c)}
                        />
                      );
                    })}
                  </Svg>
                </View>
              );
            })}
          </ScrollView>

          {/* Page dots */}
          <View style={styles.dotsRow}>
            {CIRCUITS.map((_, i) => (
              <View key={i} style={[styles.dot, i === currentIndex && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* Stats grid */}
        {(() => {
          const parts = meta.sub.split('·').map((s: string) => s.trim());
          const giri = parts[2] ?? '—';
          const km = parts[1] ?? '—';
          const numCurve = circuitInfo?.turns ?? '—';
          const gMax = circuitInfo?.corners
            ? Math.max(...circuitInfo.corners.map((c: any) => parseFloat(c.g))).toFixed(1) + 'G'
            : '—';
          return (
            <>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
                <View style={{ flex: 1, backgroundColor: "#141414", borderRadius: 12, padding: 14 }}>
                  <Text style={{ color: "#999999", fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>GIRI</Text>
                  <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "800", marginTop: 4 }}>{giri}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: "#141414", borderRadius: 12, padding: 14 }}>
                  <Text style={{ color: "#999999", fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>DISTANZA</Text>
                  <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "800", marginTop: 4 }}>{km}</Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
                <View style={{ flex: 1, backgroundColor: "#141414", borderRadius: 12, padding: 14 }}>
                  <Text style={{ color: "#999999", fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>CURVE</Text>
                  <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "800", marginTop: 4 }}>{numCurve}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: "#141414", borderRadius: 12, padding: 14 }}>
                  <Text style={{ color: "#999999", fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>G-MAX</Text>
                  <Text style={{ color: "#FFFFFF", fontSize: 24, fontWeight: "800", marginTop: 4 }}>{gMax}</Text>
                </View>
              </View>
            </>
          );
        })()}

        {/* Corner detail (Monaco only) */}
        {isMonaco && selectedCorner ? (
          <View style={[styles.cornerCard, { borderLeftColor: SECTOR_COLORS[selectedCorner.sector - 1] }]}>
            <View style={styles.cornerHeader}>
              <Text style={styles.cornerName}>Curva {selectedCorner.id} · {selectedCorner.name}</Text>
              <TouchableOpacity onPress={() => setSelectedCorner(null)}>
                <Text style={styles.cornerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cornerDesc}>{selectedCorner.desc}</Text>
            <View style={styles.cornerStats}>
              <View style={styles.cornerStat}>
                <Text style={styles.cornerStatLabel}>Velocità</Text>
                <Text style={styles.cornerStatVal}>{selectedCorner.speed}</Text>
              </View>
              <View style={styles.cornerStat}>
                <Text style={styles.cornerStatLabel}>Forza laterale</Text>
                <Text style={styles.cornerStatVal}>{selectedCorner.g}</Text>
              </View>
              <View style={styles.cornerStat}>
                <Text style={styles.cornerStatLabel}>Settore</Text>
                <Text style={[styles.cornerStatVal, { color: SECTOR_COLORS[selectedCorner.sector - 1] }]}>S{selectedCorner.sector}</Text>
              </View>
            </View>
          </View>
        ) : isMonaco ? (
          <View style={styles.hintCard}>
            <Text style={styles.hintText}>Tocca un punto sulla mappa per scoprire i dettagli della curva</Text>
          </View>
        ) : null}

        {/* Profilo Tecnico */}
        {circuitInfo?.corners?.length > 0 && (() => {
          const avgSpeed = getAvgSpeed(circuitInfo?.lapRecord?.time, meta.sub);
          const aeroLoad = getAeroLoad(circuitInfo.corners);
          const traction = getTractionRating(circuitInfo?.trazione ?? "");
          const tyreWear = meta.dna.usura;

          const profiloRows = [
            { label: "Velocità media", sublabel: avgSpeed.kmh > 0 ? `${avgSpeed.kmh} km/h` : "—", rating: avgSpeed.label, color: "#3498DB" },
            { label: "Carico aerodinamico", sublabel: aeroLoad.value > 0 ? `${aeroLoad.value.toFixed(1)}G avg` : "", rating: aeroLoad.label, color: "#9B59B6" },
            { label: "Trazione", sublabel: "", rating: traction.label, color: "#F39C12" },
            { label: "Usura gomme", sublabel: "", rating: tyreWear, color: "#E10600" },
          ];

          return (
            <View style={{ backgroundColor: "#141414", borderRadius: 12, padding: 16, marginBottom: 4 }}>
              <Text style={{ color: "#999999", fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 4 }}>PROFILO TECNICO</Text>
              {profiloRows.map((row, i) => (
                <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: i < profiloRows.length - 1 ? 0.5 : 0, borderBottomColor: "#2A2A2A" }}>
                  <View>
                    <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "600" }}>{row.label}</Text>
                    {row.sublabel ? <Text style={{ color: "#555555", fontSize: 10, marginTop: 2 }}>{row.sublabel}</Text> : null}
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    {getBlocks(row.rating, row.color)}
                    <Text style={{ color: row.color, fontSize: 10, fontWeight: "700" }}>{row.rating}</Text>
                  </View>
                </View>
              ))}
            </View>
          );
        })()}

        {/* DNA */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DNA del circuito</Text>
          <View style={styles.dnaRow}><Text style={styles.dnaKey}>Tipo</Text><Text style={styles.dnaVal}>{meta.dna.tipo}</Text></View>

          <View style={styles.dnaRow}><Text style={styles.dnaKey}>Importanza qualifica</Text><Text style={styles.dnaVal}>{meta.dna.qualifica}</Text></View>
          <View style={styles.dnaRow}><Text style={styles.dnaKey}>Safety car</Text><Text style={styles.dnaVal}>{meta.dna.sc}</Text></View>
          <View style={styles.dnaRow}><Text style={styles.dnaKey}>Sorpassi</Text><Text style={styles.dnaVal}>{meta.dna.sorpassi}</Text></View>
        </View>
        {anecdotes.length > 0 && (
          <View style={{ backgroundColor: "#141414", borderRadius: 12, padding: 16, gap: 14 }}>
            <Text style={{ color: "#999999", fontSize: 10, fontWeight: "700", letterSpacing: 1 }}>ANEDDOTI</Text>
            {anecdotes.map((a, i) => (
              <View key={i} style={{ borderLeftWidth: 2, borderLeftColor: "#E10600", paddingLeft: 12 }}>
                <Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "700", marginBottom: 4 }}>{a.titolo}</Text>
                <Text style={{ color: "#999999", fontSize: 12, lineHeight: 18 }}>{a.testo}</Text>
              </View>
            ))}
          </View>
        )}
        {loadingAnecdotes && (
          <View style={{ padding: 16, alignItems: "center" }}>
            <ActivityIndicator size="small" color="#E10600" />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0A0A0A" },
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  content: { padding: 16, gap: 12, backgroundColor: "#0A0A0A" },
  navbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, paddingTop: 8 },

  circuitHeader: { gap: 2 },
  circuitName: { fontSize: 22, fontWeight: "500", color: "#FFFFFF" },
  circuitSub: { fontSize: 12, color: "#999999" },
  sectorLegend: { flexDirection: "row", gap: 16 },
  sectorBadge: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectorDot: { width: 8, height: 8, borderRadius: 4 },
  sectorLabel: { fontSize: 12, color: "#999999" },
  mapCard: { borderRadius: 12, padding: 16, backgroundColor: "#141414" },
  svg: { width: "100%", height: 280 },
  dotsRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 3, paddingTop: 10 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#333333" },
  dotActive: { backgroundColor: "#E10600", width: 6, height: 6, borderRadius: 3 },
  cornerCard: { backgroundColor: "#141414", borderRadius: 12, borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 12, paddingRight: 12, gap: 8 },
  cornerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cornerName: { fontSize: 14, fontWeight: "500", color: "#FFFFFF" },
  cornerClose: { fontSize: 14, color: "#999999" },
  cornerDesc: { fontSize: 13, color: "#999999", lineHeight: 20 },
  cornerStats: { flexDirection: "row", gap: 16, marginTop: 4 },
  cornerStat: { gap: 2 },
  cornerStatLabel: { fontSize: 10, color: "#555555", textTransform: "uppercase", letterSpacing: 0.5 },
  cornerStatVal: { fontSize: 14, fontWeight: "500", color: "#FFFFFF" },
  hintCard: { backgroundColor: "#141414", borderRadius: 12, padding: 14 },
  hintText: { fontSize: 13, color: "#999999", textAlign: "center" },
  card: { backgroundColor: "#141414", borderRadius: 12, padding: 14, gap: 8 },
  cardLabel: { fontSize: 10, color: "#999999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  dnaRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5, borderBottomWidth: 0.5, borderBottomColor: "#222222" },
  dnaKey: { fontSize: 13, color: "#999999" },
  dnaVal: { fontSize: 13, fontWeight: "500", color: "#FFFFFF" },
});
