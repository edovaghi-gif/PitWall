import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const logo = require('../assets/images/PitWall Logo.png');

const SC_OPTIONS = ["0", "1", "2", "3+"];
const DNF_OPTIONS = ["0–3", "4–6", "7+"];
const POS_LABELS = ["1°", "2°", "3°"];

function BreakdownExpand({ record, scoreColor }: { record: any; scoreColor: string }) {
  const podioEsatto =
    record.myPodium?.[0] === record.realPodium?.[0] &&
    record.myPodium?.[1] === record.realPodium?.[1] &&
    record.myPodium?.[2] === record.realPodium?.[2];

  const posResult = (i: number) => {
    const myNum = record.myPodium?.[i];
    const realPodium: number[] = record.realPodium ?? [];
    if (myNum == null) return { label: "N/D", points: null, color: "#555555" };
    if (myNum === realPodium[i]) return { label: `P${i + 1} esatto`, points: 20, color: "#27AE60" };
    if (realPodium.includes(myNum)) return { label: "Sul podio", points: 7, color: "#27AE60" };
    return { label: "Fuori dal podio", points: 0, color: "#E10600" };
  };

  const scItem = record.breakdown?.find((b: any) => b.label?.toLowerCase().includes("safety car"));
  const rfItem = record.breakdown?.find((b: any) => b.label?.toLowerCase().includes("rossa") || b.label?.toLowerCase().includes("bandiera"));
  const dnfItem = record.breakdown?.find((b: any) => b.label?.toLowerCase().includes("dnf"));

  const scLabel = scItem
    ? (scItem.positive ? "Corretta ×1.1" : "Sbagliata −5pt")
    : "—";
  const rfLabel = rfItem
    ? (rfItem.positive ? "Corretta ×1.15" : "Sbagliata −8pt")
    : "—";
  const dnfLabel = dnfItem
    ? (dnfItem.positive ? "Corretto ×1.1" : "Sbagliato −5pt")
    : "—";

  const scColor = scItem ? (scItem.positive ? "#27AE60" : "#E10600") : "#555555";
  const rfColor = rfItem ? (rfItem.positive ? "#27AE60" : "#E10600") : "#555555";
  const dnfColor = dnfItem ? (dnfItem.positive ? "#27AE60" : "#E10600") : "#555555";

  const scVal = record.savedSafetyCar != null ? SC_OPTIONS[record.savedSafetyCar] : "—";
  const rfVal = record.savedRedFlag != null ? (record.savedRedFlag ? "Sì" : "No") : "—";
  const dnfVal = record.savedDnfRange != null ? DNF_OPTIONS[record.savedDnfRange] : "—";

  return (
    <View style={styles.expand}>
      <Text style={styles.expandSectionLabel}>IL TUO PRONOSTICO</Text>

      {podioEsatto && (
        <View style={styles.bdRow}>
          <Text style={[styles.bdLeft, { color: "#27AE60" }]}>Podio esatto</Text>
          <Text style={[styles.bdRight, { color: "#27AE60" }]}>+50pt</Text>
        </View>
      )}

      {[0, 1, 2].map(i => {
        const res = posResult(i);
        const name = record.myPodiumNames?.[i] ?? (record.myPodium?.[i] != null ? `#${record.myPodium[i]}` : "—");
        return (
          <View key={i} style={styles.bdRow}>
            <Text style={[styles.bdLeft, { color: res.points === 0 ? "#555555" : "#FFFFFF" }]}>
              {POS_LABELS[i]} {name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={[styles.bdLabel, { color: res.color }]}>{res.label}</Text>
              {res.points != null && (
                <Text style={[styles.bdRight, { color: res.color }]}>
                  {res.points > 0 ? `+${res.points}` : res.points}pt
                </Text>
              )}
            </View>
          </View>
        );
      })}

      <View style={styles.bdSep} />

      <View style={styles.bdRow}>
        <Text style={styles.bdLeft}>SC: {scVal}</Text>
        <Text style={[styles.bdRight, { color: scColor }]}>{scLabel}</Text>
      </View>
      <View style={styles.bdRow}>
        <Text style={styles.bdLeft}>RF: {rfVal}</Text>
        <Text style={[styles.bdRight, { color: rfColor }]}>{rfLabel}</Text>
      </View>
      <View style={styles.bdRow}>
        <Text style={styles.bdLeft}>Ritiri: {dnfVal}</Text>
        <Text style={[styles.bdRight, { color: dnfColor }]}>{dnfLabel}</Text>
      </View>

      <View style={styles.bdSep} />

      <View style={styles.bdTotalRow}>
        <Text style={styles.bdTotalLabel}>PUNTEGGIO FINALE</Text>
        <Text style={[styles.bdTotalScore, { color: scoreColor }]}>{record.finalScore} pt</Text>
      </View>
    </View>
  );
}

export default function SeasonResultsScreen() {
  const router = useRouter();
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);
  const [expandedRound, setExpandedRound] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("pitwall_scores").then(raw => {
      if (raw) setScoreHistory(JSON.parse(raw));
    }).catch(console.error);
  }, []);

  const sorted = [...scoreHistory].sort((a, b) => parseInt(a.round) - parseInt(b.round));
  const totalPoints = scoreHistory.reduce((sum, r) => sum + r.finalScore, 0);
  const season = scoreHistory[0]?.season ?? "2026";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Image source={logo} style={{ height: 28, width: 140, resizeMode: 'contain' }} />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.headerLabel}>STAGIONE {season}</Text>
          <Text style={styles.headerPoints}>{totalPoints}</Text>
          <Text style={styles.headerSub}>punti totali · {scoreHistory.length} GP valutati</Text>
        </View>

        {sorted.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nessun risultato ancora</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {sorted.map((record, i, arr) => {
              const scoreColor = record.finalScore >= 80 ? "#27AE60" : record.finalScore >= 50 ? "#F39C12" : "#E10600";
              const key = `${record.season}_${record.round}`;
              const isExpanded = expandedRound === key;
              return (
                <View key={key}>
                  <TouchableOpacity
                    onPress={() => setExpandedRound(isExpanded ? null : key)}
                    style={[
                      styles.row,
                      { borderLeftColor: scoreColor },
                      isExpanded
                        ? { borderBottomWidth: 0 }
                        : i < arr.length - 1
                          ? { borderBottomWidth: 0.5, borderBottomColor: "#2A2A2A" }
                          : {},
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rowName}>{record.raceName}</Text>
                      <Text style={styles.rowSub}>Round {record.round} · {record.season}</Text>
                    </View>
                    <Text style={[styles.rowScore, { color: scoreColor }]}>{record.finalScore}</Text>
                    <Text style={styles.rowPt}>pt</Text>
                  </TouchableOpacity>
                  {isExpanded && (
                    <View style={i < arr.length - 1 ? { borderBottomWidth: 0.5, borderBottomColor: "#2A2A2A" } : {}}>
                      <BreakdownExpand record={record} scoreColor={scoreColor} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0A0A0A" },
  navbar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: "#2A2A2A" },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  backText: { color: "#FFFFFF", fontSize: 22 },
  content: { padding: 16, gap: 12, paddingBottom: 48 },

  header: { backgroundColor: "#141414", borderRadius: 12, padding: 20, alignItems: "center", borderLeftWidth: 3, borderLeftColor: "#E10600" },
  headerLabel: { color: "#999999", fontSize: 11, letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 },
  headerPoints: { color: "#E10600", fontSize: 64, fontWeight: "800", lineHeight: 72 },
  headerSub: { color: "#555555", fontSize: 12, marginTop: 2 },

  emptyCard: { backgroundColor: "#141414", borderRadius: 12, padding: 24, alignItems: "center" },
  emptyText: { color: "#555555", fontSize: 14 },

  list: { backgroundColor: "#141414", borderRadius: 12, overflow: "hidden" },
  row: { flexDirection: "row", alignItems: "center", padding: 14, borderLeftWidth: 3 },
  rowName: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  rowSub: { color: "#555555", fontSize: 11, marginTop: 2 },
  rowScore: { fontSize: 26, fontWeight: "800" },
  rowPt: { color: "#555555", fontSize: 12, marginLeft: 4 },

  expand: { backgroundColor: "#1A1A1A", paddingHorizontal: 14, paddingTop: 4, paddingBottom: 14 },
  expandSectionLabel: { color: "#555555", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", marginTop: 10, marginBottom: 6 },

  bdRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: "#2A2A2A" },
  bdLeft: { color: "#FFFFFF", fontSize: 13, flex: 1 },
  bdLabel: { fontSize: 11 },
  bdRight: { fontSize: 13, fontWeight: "700" },
  bdSep: { height: 0.5, backgroundColor: "#333333", marginVertical: 8 },

  bdTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  bdTotalLabel: { color: "#999999", fontSize: 11, letterSpacing: 1, textTransform: "uppercase" },
  bdTotalScore: { fontSize: 22, fontWeight: "800" },
});
