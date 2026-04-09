import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

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

type Driver = {
  id: string;
  code: string;
  name: string;
  team: string;
  color: string;
  number: string;
};

export default function HeadToHeadScreen() {
  const navigation = useNavigation();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [driverL, setDriverL] = useState<Driver | null>(null);
  const [driverR, setDriverR] = useState<Driver | null>(null);
  const [tab, setTab] = useState("generale");
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectingSlot, setSelectingSlot] = useState<"left" | "right">("left");

  useEffect(() => {
    navigation.setOptions({ title: "", headerShown: false });
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    if (driverL && driverR) fetchStats();
  }, [driverL, driverR]);

  async function fetchDrivers() {
    try {
      const res = await fetch(`${ERGAST}/current/driverStandings.json`);
      const data = await res.json();
      const standings = data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
      const mapped: Driver[] = standings.map((s: any) => {
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
      });
      setDrivers(mapped);
      setDriverL(mapped[0] ?? null);
      setDriverR(mapped[1] ?? null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDrivers(false);
    }
  }

  async function fetchStats() {
    if (!driverL || !driverR) return;
    setLoading(true);
    try {
      async function fetchAllRaces(driverId: string) {
        let offset = 0;
        const limit = 100;
        let allRaces: any[] = [];
        while (true) {
          const res = await fetch(`${ERGAST}/drivers/${driverId}/results.json?limit=${limit}&offset=${offset}`);
          const data = await res.json();
          const races = data.MRData.RaceTable.Races;
          allRaces = [...allRaces, ...races];
          const total = parseInt(data.MRData.total);
          if (allRaces.length >= total) break;
          offset += limit;
        }
        return allRaces;
      }

      const [racesL, racesR] = await Promise.all([
        fetchAllRaces(driverL.id),
        fetchAllRaces(driverR.id),
      ]);

      const calcStats = (races: any[]) => {
        const wins = races.filter(r => r.Results[0].position === "1").length;
        const poles = races.filter(r => r.Results[0].grid === "1").length;
        const podiums = races.filter(r => parseInt(r.Results[0].position) <= 3).length;
        const winsFromPole = races.filter(r => r.Results[0].position === "1" && r.Results[0].grid === "1").length;
        const fastLaps = races.filter(r => r.Results[0].FastestLap?.rank === "1").length;
        const dnfs = races.filter(r => !["Finished", "+1 Lap", "+2 Laps"].includes(r.Results[0].status) && parseInt(r.Results[0].position) > 3).length;
        const totalPoints = races.reduce((sum: number, r: any) => sum + parseFloat(r.Results[0].points || "0"), 0);
        return { wins, poles, podiums, winsFromPole, fastLaps, dnfs, totalPoints, total: races.length };
      };

      setStats({ L: calcStats(racesL), R: calcStats(racesR) });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function StatBar({ label, valL, valR }: any) {
    const total = Math.max(valL + valR, 1);
    const fL = valL / total;
    return (
      <View style={styles.statRow}>
        <Text style={styles.statVal}>{valL}</Text>
        <View style={styles.statBarWrap}>
          <Text style={styles.statLabel}>{label}</Text>
          <View style={{ height: 5, flexDirection: "row", overflow: "visible" }}>
            <View style={{ width: `${fL * 100}%`, height: 5, backgroundColor: driverL?.color, borderTopLeftRadius: 4, borderBottomLeftRadius: 4, marginRight: 1 }} />
            <View style={{ flex: 1, height: 5, backgroundColor: driverR?.color, borderTopRightRadius: 4, borderBottomRightRadius: 4, marginLeft: 1 }} />
          </View>
        </View>
        <Text style={[styles.statVal, { textAlign: "right" }]}>{valR}</Text>
      </View>
    );
  }

  if (loadingDrivers) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator color="#E10600" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.navbar}>
        <Image source={logo} style={{ height: 32, width: 160, resizeMode: 'contain' }} />
      </View>

      <View style={styles.driverHeader}>
        <TouchableOpacity style={styles.driverSide} onPress={() => { setSelectingSlot("left"); setModalVisible(true); }}>
          <View style={[styles.colorBar, { backgroundColor: driverL?.color }]} />
          <Text style={[styles.driverNumber, { color: driverL?.color }]}>{driverL?.number}</Text>
          <Text style={styles.driverName}>{driverL?.name}</Text>
          <Text style={styles.driverTeam}>{driverL?.team}</Text>
        </TouchableOpacity>
        <View style={styles.vsBadge}><Text style={styles.vsText}>VS</Text></View>
        <TouchableOpacity style={styles.driverSide} onPress={() => { setSelectingSlot("right"); setModalVisible(true); }}>
          <View style={[styles.colorBar, { backgroundColor: driverR?.color }]} />
          <Text style={[styles.driverNumber, { color: driverR?.color }]}>{driverR?.number}</Text>
          <Text style={styles.driverName}>{driverR?.name}</Text>
          <Text style={styles.driverTeam}>{driverR?.team}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {["generale", "stagioni"].map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "generale" ? "Generale" : "Stagioni"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#E10600" style={{ marginTop: 32 }} />
      ) : stats ? (
        <View style={styles.statsContainer}>
          {tab === "generale" && (
            <>
              <Text style={styles.sectionTitle}>Carriera</Text>
              <StatBar label="Vittorie" valL={stats.L.wins} valR={stats.R.wins} />
              <StatBar label="Pole position" valL={stats.L.poles} valR={stats.R.poles} />
              <StatBar label="Podi" valL={stats.L.podiums} valR={stats.R.podiums} />
              <StatBar label="Vittorie dalla pole" valL={stats.L.winsFromPole} valR={stats.R.winsFromPole} />
              <StatBar label="Giri veloci" valL={stats.L.fastLaps} valR={stats.R.fastLaps} />
              <StatBar label="Ritiri" valL={stats.L.dnfs} valR={stats.R.dnfs} />
              <View style={styles.insight}>
                <Text style={styles.insightLabel}>Insight storico</Text>
                <Text style={styles.insightText}>
                  {stats.L.wins > stats.R.wins
                    ? `${driverL?.name} ha ${stats.L.wins - stats.R.wins} vittorie in più di ${driverR?.name} in carriera.`
                    : stats.R.wins > stats.L.wins
                    ? `${driverR?.name} ha ${stats.R.wins - stats.L.wins} vittorie in più di ${driverL?.name} in carriera.`
                    : `${driverL?.name} e ${driverR?.name} hanno lo stesso numero di vittorie in carriera.`}
                </Text>
              </View>
            </>
          )}
          {tab === "stagioni" && (
            <>
              <Text style={styles.sectionTitle}>Punti totali in carriera</Text>
              <StatBar label="Punti totali" valL={Math.round(stats.L.totalPoints)} valR={Math.round(stats.R.totalPoints)} />
              <StatBar label="Gare disputate" valL={stats.L.total} valR={stats.R.total} />
              <View style={styles.insight}>
                <Text style={styles.insightLabel}>Insight storico</Text>
                <Text style={styles.insightText}>
                  {`${driverL?.name} ha una media di ${(stats.L.totalPoints / stats.L.total).toFixed(1)} punti per gara, ${driverR?.name} di ${(stats.R.totalPoints / stats.R.total).toFixed(1)}.`}
                </Text>
              </View>
            </>
          )}
        </View>
      ) : null}

    </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerBox}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Scegli pilota</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.pickerClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={drivers}
              keyExtractor={d => d.id}
              renderItem={({ item: d }) => (
                <TouchableOpacity style={styles.pickerRow} onPress={() => {
                  if (selectingSlot === "left") setDriverL(d);
                  else setDriverR(d);
                  setModalVisible(false);
                }}>
                  <Text style={[styles.pickerNum, { color: d.color }]}>{d.number}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pickerName}>{d.name}</Text>
                    <Text style={styles.pickerTeam}>{d.team}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0A0A0A" },
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  content: { padding: 16, gap: 12 },
  navbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, paddingTop: 8 },

  driverHeader: { flexDirection: "row", borderWidth: 0.5, borderColor: "#2A2A2A", borderRadius: 12, overflow: "hidden", backgroundColor: "#141414" },
  driverSide: { flex: 1, padding: 12, alignItems: "center", gap: 2, position: "relative", backgroundColor: "#141414" },
  colorBar: { position: "absolute", top: 0, left: 0, right: 0, height: 3 },
  driverNumber: { fontSize: 24, fontWeight: "500", marginTop: 8 },
  driverName: { fontSize: 13, fontWeight: "500", color: "#FFFFFF" },
  driverTeam: { fontSize: 10, color: "#999999" },
  vsBadge: { width: 40, justifyContent: "center", alignItems: "center", borderLeftWidth: 0.5, borderRightWidth: 0.5, borderColor: "#2A2A2A", backgroundColor: "#141414" },
  vsText: { fontSize: 11, fontWeight: "500", color: "#999999" },
  tabs: { flexDirection: "row", borderBottomWidth: 0.5, borderColor: "#2A2A2A" },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive: { borderBottomColor: "#E10600" },
  tabText: { fontSize: 12, color: "#999999" },
  tabTextActive: { color: "#E10600", fontWeight: "500" },
  statsContainer: { gap: 8 },
  sectionTitle: { fontSize: 10, color: "#555555", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4, marginTop: 8 },
  statRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  statVal: { fontSize: 13, fontWeight: "500", width: 36, color: "#FFFFFF" },
  statBarWrap: { flex: 1, gap: 3 },
  statLabel: { fontSize: 11, color: "#999999", textAlign: "center" },
  insight: { borderLeftWidth: 2, borderLeftColor: "#E10600", paddingLeft: 12, paddingVertical: 10, marginTop: 8, backgroundColor: "#141414", borderTopWidth: 0.5, borderRightWidth: 0.5, borderBottomWidth: 0.5, borderTopColor: "#2A2A2A", borderRightColor: "#2A2A2A", borderBottomColor: "#2A2A2A", borderRadius: 12 },
  insightLabel: { fontSize: 10, color: "#999999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  insightText: { fontSize: 13, color: "#FFFFFF", lineHeight: 20 },
  pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  pickerBox: { height: "80%", backgroundColor: "#141414", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 16, borderTopWidth: 0.5, borderTopColor: "#2A2A2A" },
  pickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  pickerTitle: { fontSize: 15, fontWeight: "600", color: "#FFFFFF" },
  pickerClose: { fontSize: 16, color: "#999999", paddingHorizontal: 4 },
  pickerRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#2A2A2A" },
  pickerNum: { fontSize: 16, fontWeight: "500", width: 32 },
  pickerName: { fontSize: 13, fontWeight: "500", color: "#FFFFFF" },
  pickerTeam: { fontSize: 11, color: "#999999" },
});
