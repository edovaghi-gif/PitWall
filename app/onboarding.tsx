import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Animated, Dimensions, Image, NativeScrollEvent, NativeSyntheticEvent, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const logo = require('../assets/images/PitWall Logo.png');
const photo = require('../assets/images/PitWall Photo.png');

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    key: "welcome",
    title: "Siediti al muretto",
    subtitle: "PitWall è il tuo centro di controllo per ogni Gran Premio. Qualifiche live, pronostici, statistiche storiche.",
    icon: "telemetry" as const,
  },
  {
    key: "home",
    title: "Sempre aggiornato",
    subtitle: "Countdown al prossimo GP, risultati dell'ultima gara, classifiche piloti e costruttori sempre aggiornate.",
    icon: "home" as const,
  },
  {
    key: "live",
    title: "Segui il live",
    subtitle: "Sabato, qualifiche in tempo reale con tempi per settore e distacchi. Domenica, gara live con posizioni, distacchi e statistiche.",
    icon: "flag" as const,
  },
  {
    key: "prediction",
    title: "Fai il tuo pronostico",
    subtitle: "Scegli il podio, prevedi safety car e ritiri. Guadagna punti se ci azzecchi.",
    icon: "trophy" as const,
  },
  {
    key: "explore",
    title: "Molto di più",
    subtitle: "Confronta statistiche storiche dei piloti, esplora i circuiti di tutto il mondo, segui le classifiche. Sempre più funzionalità in arrivo.",
    icon: "map" as const,
  },
];


function TelemetryIcon() {
  const bars = [
    { height: 32, color: "#555555" },
    { height: 48, color: "#555555" },
    { height: 64, color: "#E10600" },
    { height: 52, color: "#E10600" },
    { height: 36, color: "#555555" },
  ];
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 6 }}>
      {bars.map((bar, i) => (
        <View key={i} style={{ width: 16, height: bar.height, backgroundColor: bar.color, borderRadius: 3 }} />
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const photoScale = useRef(new Animated.Value(1)).current;
  const [showTransition, setShowTransition] = useState(false);

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true');

    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setShowTransition(true);
      Animated.timing(photoScale, {
        toValue: 1.8,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          router.replace('/(tabs)/home');
        });
      });
    });
  };

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  }

  function handleNext() {
    if (currentIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  }

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      <Animated.Image
        source={photo}
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          width: '100%',
          height: '100%',
          resizeMode: 'cover',
          opacity: 0.25,
          transform: [{ scale: photoScale }],
        }}
      />
      <TouchableOpacity style={styles.skipButton} onPress={completeOnboarding}>
        <Text style={styles.skipText}>Salta</Text>
      </TouchableOpacity>

      <Animated.View style={{ opacity: contentOpacity }}>
        <View style={{ paddingTop: 220, paddingBottom: 8, alignItems: "center" }}>
          <Image source={logo} style={{ height: 32, width: 160, resizeMode: 'contain' }} />
        </View>
      </Animated.View>

      <Animated.View style={{ flex: 1, opacity: contentOpacity }}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
        >
          {SLIDES.map((slide) => (
            <View key={slide.key} style={styles.slide}>
              <View style={styles.iconContainer}>
                {slide.icon === "telemetry" ? (
                  <TelemetryIcon />
                ) : (
                  <Ionicons name={slide.icon} size={64} color="#E10600" />
                )}
              </View>
              <Text style={styles.title}>{slide.title}</Text>
              <Text style={styles.subtitle}>{slide.subtitle}</Text>
            </View>
          ))}
        </ScrollView>
      </Animated.View>

      <Animated.View style={{ opacity: contentOpacity }}>
        <View style={styles.bottomBar}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>
              {isLast ? "Siediti al muretto →" : "Avanti"}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {showTransition && (
        <Animated.View style={{
          position: 'absolute',
          top: -200,
          left: -100,
          right: -100,
          bottom: -200,
          backgroundColor: '#000000',
          opacity: fadeAnim,
          zIndex: 999,
        }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A0A" },
  skipButton: { position: "absolute", top: 60, right: 24, zIndex: 10 },
  skipText: { fontSize: 14, color: "#555555" },
  slide: {
    width,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  logoTop: { fontSize: 28, fontWeight: "800", position: "absolute", top: 60 },
  iconContainer: { marginBottom: 48 },
  title: { fontSize: 28, fontWeight: "800", color: "#FFFFFF", textAlign: "center", marginBottom: 16 },
  subtitle: { fontSize: 16, color: "#999999", textAlign: "center", lineHeight: 24 },
  bottomBar: { paddingBottom: 52, paddingHorizontal: 32, gap: 24, alignItems: "center" },
  dots: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: "#E10600" },
  dotInactive: { width: 8, backgroundColor: "#333333" },
  button: {
    backgroundColor: "#E10600",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignSelf: "stretch",
    alignItems: "center",
  },
  buttonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
