import React, { useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, Animated, Easing,
  TouchableOpacity, SafeAreaView, StatusBar, Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Circle, Defs, Line as SvgLine, LinearGradient as SvgGradient,
  Path as SvgPath, Rect as SvgRect, Stop, Text as SvgText,
} from "react-native-svg";
import LogoAnimation from "./components/LogoAnimation";

const { width, height } = Dimensions.get("window");

const G_START = "#7B6CF6";
const G_END   = "#E879C6";
const BTN_S   = "#350660";
const BTN_E   = "#E879C9";

/* ── AnimatedOrbitalRings ── */
const RINGS_SIZE = Math.min(width * 0.92, 360);
const AnimatedOrbitalRings = () => {
  const rotate  = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(rotate, { toValue: 1, duration: 32000, useNativeDriver: true, easing: Easing.linear })).start();
  }, []);
  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  return (
    <Animated.View pointerEvents="none" style={{
      position: "absolute", width: RINGS_SIZE, height: RINGS_SIZE,
      alignSelf: "center", top: "50%", marginTop: -RINGS_SIZE / 2,
      opacity: 0.35, transform: [{ rotate: spin }],
    }}>
      <Svg width={RINGS_SIZE} height={RINGS_SIZE} viewBox="0 0 360 360">
        <Circle cx="278" cy="142" r="4"   fill="#7B6CF6" opacity="0.7"  />
        <Circle cx="94"  cy="218" r="3"   fill="#E879C6" opacity="0.55" />
        <Circle cx="244" cy="232" r="2.5" fill="#C084FC" opacity="0.65" />
        <Circle cx="120" cy="110" r="2"   fill="#7B6CF6" opacity="0.45" />
        <Circle cx="200" cy="60"  r="3"   fill="#E879C9" opacity="0.5"  />
        <Circle cx="50"  cy="160" r="2"   fill="#A78BFA" opacity="0.4"  />
        <Circle cx="300" cy="200" r="2.5" fill="#C084FC" opacity="0.45" />
        <Circle cx="160" cy="290" r="2"   fill="#E879C6" opacity="0.4"  />
      </Svg>
    </Animated.View>
  );
};

/* ── HowItWorks ── */
const IC = 13;
const IC_C = "#9B7FD4";
const IconSearch   = () => (<Svg width={IC} height={IC} viewBox="0 0 24 24" fill="none"><Circle cx="10.5" cy="10.5" r="6.5" stroke={IC_C} strokeWidth="2" /><SvgLine x1="15.5" y1="15.5" x2="21" y2="21" stroke={IC_C} strokeWidth="2" strokeLinecap="round" /></Svg>);
const IconCalendar = () => (<Svg width={IC} height={IC} viewBox="0 0 24 24" fill="none"><SvgRect x="3" y="4" width="18" height="17" rx="3" stroke={IC_C} strokeWidth="2" /><SvgLine x1="3" y1="9" x2="21" y2="9" stroke={IC_C} strokeWidth="2" /><SvgLine x1="8" y1="2" x2="8" y2="6" stroke={IC_C} strokeWidth="2" strokeLinecap="round" /><SvgLine x1="16" y1="2" x2="16" y2="6" stroke={IC_C} strokeWidth="2" strokeLinecap="round" /></Svg>);
const IconCheck    = () => (<Svg width={IC} height={IC} viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="9" stroke={IC_C} strokeWidth="2" /><SvgPath d="M8 12.5l3 3 5-5.5" stroke={IC_C} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></Svg>);
const STEPS = [
  { Icon: IconSearch,   label: "Search"      },
  { Icon: IconCalendar, label: "Pick a slot" },
  { Icon: IconCheck,    label: "Confirm"     },
] as const;
const HowItWorks = () => (
  <View style={hw.row}>
    {STEPS.map(({ Icon, label }, i) => (
      <React.Fragment key={label}>
        <View style={hw.pill}><Icon /><Text style={hw.label}>{label}</Text></View>
        {i < STEPS.length - 1 && <Text style={hw.arrow}>›</Text>}
      </React.Fragment>
    ))}
  </View>
);
const hw = StyleSheet.create({
  row:   { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 24, gap: 6 },
  pill:  { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 4, paddingHorizontal: 8 },
  label: { fontSize: 12, fontWeight: "500", color: "#6D4FA8", letterSpacing: 0.1 },
  arrow: { fontSize: 14, color: "rgba(167,139,250,0.4)", fontWeight: "300", marginHorizontal: 2 },
});

/* ── LandingScreen ── */
export default function LandingScreen() {
  const router = useRouter();
  const scale  = useRef(new Animated.Value(1)).current;
  const pressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();
  const DARK_H = height * 0.52;

  return (
    <View style={s.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["#1A0836","#270E62","#350660"]} start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }} style={[s.darkHalf, { height: DARK_H }]} />
      <LinearGradient colors={["#F3EEFF","#EDE9FE","#FBF0FF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.lightHalf, { top: DARK_H }]} />
      <LinearGradient colors={["rgba(26,8,54,0.0)","rgba(39,14,98,0.88)","rgba(80,36,148,0.45)","rgba(196,181,253,0.12)","rgba(243,238,255,0.0)"]} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} pointerEvents="none" style={[s.splitShadow, { top: DARK_H - 50, height: 100 }]} />
      <View pointerEvents="none" style={[s.orb, s.orb1, { top: DARK_H * 0.15 }]} />
      <View pointerEvents="none" style={[s.orb, s.orb2, { top: DARK_H * 0.35 }]} />
      <SafeAreaView style={s.safe}>
        <View style={[s.darkContent, { height: DARK_H - 40 }]}>
          <AnimatedOrbitalRings />
          <View style={s.eyebrow}><Text style={s.eyebrowTxt}>Your Space, Your Time</Text></View>
          <LogoAnimation />
        </View>
        <View style={s.lightContent}>
          <Text style={s.headline}>Find your{"\n"}perfect space</Text>
          <Text style={s.body}>Discover and book unique spaces{"\n"}around you — in seconds.</Text>
          <HowItWorks />
          <Animated.View style={{ transform: [{ scale }], width: "100%", marginTop: 28 }}>
            <TouchableOpacity onPressIn={pressIn} onPressOut={pressOut} onPress={() => router.replace("/(tabs)")} activeOpacity={1}>
              <LinearGradient colors={[BTN_S, BTN_E]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                <Text style={s.btnTxt}>Get Started  →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
          <Text style={s.finePrint}>DISCOVER · BOOK · ENJOY</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1 },
  darkHalf:     { position: "absolute", top: 0, left: 0, right: 0 },
  lightHalf:    { position: "absolute", left: 0, right: 0, bottom: 0 },
  splitShadow:  { position: "absolute", left: 0, right: 0, zIndex: 2 },
  orb:          { position: "absolute", borderRadius: 999 },
  orb1:         { width: 260, height: 260, left: -80,  backgroundColor: "rgba(124,92,246,0.26)" },
  orb2:         { width: 200, height: 200, right: -60, backgroundColor: "rgba(232,121,201,0.16)" },
  safe:         { flex: 1, alignItems: "center", paddingHorizontal: 24, paddingTop: height * 0.04, paddingBottom: 28 },
  darkContent:  { width: "100%", alignItems: "center", justifyContent: "center", position: "relative", gap: 12 },
  eyebrow:      { borderWidth: 1, borderColor: "rgba(228,176,245,0.32)", borderRadius: 30, paddingVertical: 6, paddingHorizontal: 18, backgroundColor: "rgba(255,255,255,0.04)" },
  eyebrowTxt:   { fontSize: 11, letterSpacing: 0.5, color: "rgba(228,176,245,0.70)", fontWeight: "500" },
  lightContent: { flex: 1, width: "100%", alignItems: "center", paddingTop: 28 },
  headline:     { fontSize: 32, fontWeight: "800", color: "#3B0764", textAlign: "center", lineHeight: 40, letterSpacing: -0.5, fontFamily: "Georgia" },
  body:         { marginTop: 12, fontSize: 14, color: "#7C6FB0", textAlign: "center", lineHeight: 22 },
  btn:          { paddingVertical: 17, borderRadius: 16, alignItems: "center", shadowColor: "#7B6CF6", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.32, shadowRadius: 18, elevation: 8 },
  btnTxt:       { fontSize: 16, fontWeight: "700", color: "#fff", letterSpacing: 0.4 },
  finePrint:    { marginTop: 14, fontSize: 9.5, letterSpacing: 2.8, color: "#B09FE8", textAlign: "center", fontWeight: "500" },
});
