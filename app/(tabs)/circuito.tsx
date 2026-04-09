import { useEffect, useState } from "react";
import { Dimensions, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

  useEffect(() => {
    navigation.setOptions({ title: "", headerShown: false });
  }, []);

  const current = CIRCUITS[currentIndex];
  const meta = CIRCUIT_META[current.key];
  const isMonaco = current.key === "monaco";

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.navbar}>
          <Image source={logo} style={{ height: 32, width: 160, resizeMode: 'contain' }} />
        </View>

        <View style={styles.circuitHeader}>
          <Text style={styles.circuitName}>{meta.display}</Text>
          <Text style={styles.circuitSub}>{meta.sub}</Text>
        </View>

        <View style={styles.sectorLegend}>
          {["Settore 1", "Settore 2", "Settore 3"].map((s, i) => (
            <View key={i} style={styles.sectorBadge}>
              <View style={[styles.sectorDot, { backgroundColor: SECTOR_COLORS[i] }]} />
              <Text style={styles.sectorLabel}>{s}</Text>
            </View>
          ))}
        </View>

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
            }}
          >
            {CIRCUITS.map(({ key, data }) => {
              const points = data.points;
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

        {/* DNA */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>DNA del circuito</Text>
          <View style={styles.dnaRow}><Text style={styles.dnaKey}>Tipo</Text><Text style={styles.dnaVal}>{meta.dna.tipo}</Text></View>
          <View style={styles.dnaRow}><Text style={styles.dnaKey}>Usura gomme</Text><Text style={styles.dnaVal}>{meta.dna.usura}</Text></View>
          <View style={styles.dnaRow}><Text style={styles.dnaKey}>Importanza qualifica</Text><Text style={styles.dnaVal}>{meta.dna.qualifica}</Text></View>
          <View style={styles.dnaRow}><Text style={styles.dnaKey}>Safety car</Text><Text style={styles.dnaVal}>{meta.dna.sc}</Text></View>
          <View style={styles.dnaRow}><Text style={styles.dnaKey}>Sorpassi</Text><Text style={styles.dnaVal}>{meta.dna.sorpassi}</Text></View>
        </View>
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
