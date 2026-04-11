import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const logo = require('../assets/images/PitWall Logo.png');

const SC_OPTIONS = ["0", "1", "2", "3+"];
const DNF_OPTIONS = ["0–3", "4–6", "7+"];
const POS_LABELS = ["1°", "2°", "3°"];

const MEDALS = ["🥇", "🥈", "🥉"];

function BreakdownExpand({ record }: { record: any }) {
  const realPodium: number[] = record.realPodium ?? [];

  const podioEsatto =
    record.myPodium?.[0] === realPodium[0] &&
    record.myPodium?.[1] === realPodium[1] &&
    record.myPodium?.[2] === realPodium[2];

  const posResult = (i: number) => {
    const myNum = record.myPodium?.[i];
    if (myNum == null) return { label: "N/D", points: null, ptColor: "#555555" };
    if (myNum === realPodium[i]) return { label: `P${i + 1} esatto`, points: 20, ptColor: "#27AE60" };
    if (realPodium.includes(myNum)) return { label: "Sul podio", points: 7, ptColor: "#27AE60" };
    return { label: "Fuori dal podio", points: 0, ptColor: "#E10600" };
  };

  const scItem = record.breakdown?.find((b: any) => b.label?.toLowerCase().includes("safety car"));
  const rfItem = record.breakdown?.find((b: any) => b.label?.toLowerCase().includes("rossa") || b.label?.toLowerCase().includes("bandiera"));
  const dnfItem = record.breakdown?.find((b: any) => b.label?.toLowerCase().includes("dnf"));

  const hasParams = record.savedSafetyCar != null || record.savedRedFlag != null || record.savedDnfRange != null;

  type ParamRow = { left: string; label: string; color: string };
  const paramRows: ParamRow[] = [];
  if (record.savedSafetyCar != null && scItem) {
    paramRows.push({
      left: `SC: ${SC_OPTIONS[record.savedSafetyCar]}`,
      label: scItem.positive ? "Corretta ×1.1" : "Sbagliata −5pt",
      color: scItem.positive ? "#27AE60" : "#E10600",
    });
  }
  if (record.savedRedFlag != null && rfItem) {
    paramRows.push({
      left: `RF: ${record.savedRedFlag ? "Sì" : "No"}`,
      label: rfItem.positive ? "Corretta ×1.15" : "Sbagliata −8pt",
      color: rfItem.positive ? "#27AE60" : "#E10600",
    });
  }
  if (record.savedDnfRange != null && dnfItem) {
    paramRows.push({
      left: `Ritiri: ${DNF_OPTIONS[record.savedDnfRange]}`,
      label: dnfItem.positive ? "Corretto ×1.1" : "Sbagliato −5pt",
      color: dnfItem.positive ? "#27AE60" : "#E10600",
    });
  }

  return (
    <View style={styles.expand}>

      <Text style={styles.sectionLbl}>IL TUO PODIO</Text>

      {[0, 1, 2].map(i => {
        const res = posResult(i);
        const name = record.myPodiumNames?.[i] ?? (record.myPodium?.[i] != null ? `#${record.myPodium[i]}` : "—");
        return (
          <View key={i} style={styles.bdRow}>
            <Text style={[styles.bdLeft, { color: res.points === 0 ? "#555555" : "#FFFFFF" }]}>
              {MEDALS[i]} {name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Text style={{ color: "#999999", fontSize: 11 }}>{res.label}</Text>
              {res.points != null && (
                <Text style={[styles.bdPts, { color: res.ptColor }]}>
                  {res.points > 0 ? `+${res.points}` : res.points}pt
                </Text>
              )}
            </View>
          </View>
        );
      })}

      {podioEsatto && (
        <>
          <View style={styles.bdSep} />
          <View style={styles.bdRow}>
            <Text style={{ color: "#27AE60", fontSize: 13 }}>Podio esatto</Text>
            <Text style={[styles.bdPts, { color: "#27AE60" }]}>+50pt</Text>
          </View>
        </>
      )}

      {hasParams && paramRows.length > 0 && (
        <>
          <Text style={[styles.sectionLbl, { marginTop: 12 }]}>PARAMETRI</Text>
          {paramRows.map((row, j) => (
            <View key={j} style={styles.bdRow}>
              <Text style={styles.bdLeft}>{row.left}</Text>
              <Text style={[styles.bdPts, { color: row.color }]}>{row.label}</Text>
            </View>
          ))}
        </>
      )}

      <View style={styles.bdSep} />

      <View style={styles.bdTotalRow}>
        <Text style={styles.sectionLbl}>PUNTEGGIO FINALE</Text>
        <Text style={styles.bdTotalScore}>{record.finalScore} pt</Text>
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
                      <BreakdownExpand record={record} />
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

  expand: { backgroundColor: "#1A1A1A", paddingHorizontal: 12, paddingTop: 10, paddingBottom: 10 },
  sectionLbl: { color: "#999999", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 },

  bdRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 7, borderBottomWidth: 0.5, borderBottomColor: "#2A2A2A" },
  bdLeft: { color: "#FFFFFF", fontSize: 13, flex: 1 },
  bdPts: { fontSize: 13, fontWeight: "700" },
  bdSep: { height: 0.5, backgroundColor: "#2A2A2A", marginVertical: 10 },

  bdTotalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bdTotalScore: { color: "#27AE60", fontSize: 20, fontWeight: "800" },
});
