import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Text,
} from "react-native";

const { width } = Dimensions.get("window");

const RINGS_SIZE = Math.min(width * 0.65, 260);
const FONT_SIZE  = Math.round(RINGS_SIZE / 9.5);

const LETTER_COLORS = [
  "#C084FC",
  "#A78BFA",
  "#C084FC",
  "#E879C6",
  "#A78BFA",
  "#C084FC",
  "#E879C6",
  "#A78BFA",
];
const DOT_COLOR     = "rgba(167,139,250,0.35)";
const DROP_COLOR    = "rgba(255,255,255,0.50)";
const TAGLINE_COLOR = "rgba(196,181,253,0.8)";

const DEFS = [
  { ch: "P", keep: true  },
  { ch: "O", keep: true  },
  { ch: "S", keep: false },
  { ch: "T", keep: false },
  { ch: ".", keep: false, dot: true },
  { ch: "S", keep: true  },
  { ch: "O", keep: true  },
  { ch: "M", keep: true  },
  { ch: "E", keep: true  },
  { ch: ".", keep: false, dot: true },
  { ch: "P", keep: true  },
  { ch: "L", keep: false },
  { ch: "A", keep: true  },
  { ch: "C", keep: false },
  { ch: "E", keep: false },
  { ch: "S", keep: false },
];

const SURVIVOR_IDX = [0, 1, 5, 6, 7, 8, 10, 12];

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

function mt(val: Animated.Value, toValue: number, duration: number, delayMs = 0) {
  return Animated.timing(val, {
    toValue, duration, delay: delayMs, easing: Easing.out(Easing.cubic), useNativeDriver: true,
  });
}

function mtSpring(val: Animated.Value, toValue: number, duration: number, delayMs = 0) {
  return Animated.spring(val, {
    toValue, duration, delay: delayMs, stiffness: 150, damping: 14, mass: 1, useNativeDriver: true,
  });
}

export default function LogoAnimation() {
  const anims = useRef(DEFS.map(() => ({
    opacity:    new Animated.Value(0),
    translateY: new Animated.Value(-20),
    translateX: new Animated.Value(0),
  }))).current;
  
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const breatheScale   = useRef(new Animated.Value(1)).current;
  const shimmer        = useRef(new Animated.Value(0)).current;
  const shimmerAnimRef = useRef<Animated.CompositeAnimation | null>(null);

  const letterLayouts = useRef<{x: number; width: number}[]>(DEFS.map(() => ({ x: 0, width: 0 }))).current;
  const layoutsReady  = useRef(false);
  const rowWidth      = useRef(0);
  const isRunning     = useRef(false);

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.6, 1, 0.6],
  });

  function resetAnims() {
    anims.forEach((a) => {
      a.opacity.setValue(0);
      a.translateY.setValue(-20);
      a.translateX.setValue(0);
    });
    taglineOpacity.setValue(0);
    breatheScale.setValue(1);
    shimmer.setValue(0);
    if (shimmerAnimRef.current) {
      shimmerAnimRef.current.stop();
      shimmerAnimRef.current = null;
    }
    layoutsReady.current = false;
  }

  function runSpring() {
    if (!isRunning.current) return;
    
    const survivors = SURVIVOR_IDX.map((si) => ({
      idx: si,
      origX: letterLayouts[si].x,
      w: letterLayouts[si].width,
    }));

    const charWidths = SURVIVOR_IDX.map(si => letterLayouts[si].width);
    const totalTargetW = charWidths.reduce((s, w) => s + w, 0);
    const startX = (rowWidth.current - totalTargetW) / 2;
    
    let cursor = startX;
    survivors.forEach((p, i) => {
      const targetX = cursor;
      const delta = targetX - p.origX;
      cursor += p.w;
      
      mtSpring(anims[p.idx].translateX, delta, 500, i * 60).start();
    });
  }

  async function runSequence() {
    isRunning.current = true;
    
    await wait(400);

    Animated.parallel(
      anims.flatMap((a, i) => [
        mt(a.opacity,    1, 150, i * 40),
        mt(a.translateY, 0, 150, i * 40),
      ])
    ).start();
    await wait(DEFS.length * 40 + 250);
    await wait(600);

    const drop = (idx: number, dl = 0) =>
      Animated.parallel([
        mt(anims[idx].opacity, 0, 300, dl + 150),
        mt(anims[idx].translateY, 80, 350, dl),
      ]).start();

    drop(2, 0); drop(3, 60);
    drop(11, 120); drop(13, 180); drop(14, 240); drop(15, 300);
    await wait(500);

    Animated.parallel([
      mt(anims[4].opacity, 0, 250),
      mt(anims[4].translateY, 80, 300),
    ]).start();
    Animated.parallel([
      mt(anims[9].opacity, 0, 250),
      mt(anims[9].translateY, 80, 300),
    ]).start();
    await wait(500);

    if (isRunning.current) {
      runSpring();
    }

    await wait(700);

    if (isRunning.current) {
      mt(taglineOpacity, 1, 500).start();
    }

    await wait(600);

    if (isRunning.current) {
      shimmerAnimRef.current = Animated.loop(
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        })
      );
      shimmerAnimRef.current.start();
    }

    if (isRunning.current) {
      await new Promise<void>((resolve) => {
        Animated.loop(
          Animated.sequence([
            mt(breatheScale, 1.05, 1600),
            mt(breatheScale, 1,     1600),
          ]),
          { iterations: 4 }
        ).start(({ finished }) => { if (finished) resolve(); });
      });
    }

    if (isRunning.current) {
      await wait(3000);
    }

    if (isRunning.current) {
      Animated.parallel([
        mt(taglineOpacity, 0, 400),
        ...anims.map(a => mt(a.opacity, 0, 400)),
      ]).start();
      await wait(500);
    }

    isRunning.current = false;
  }

  useEffect(() => {
    async function cycle() {
      while (true) {
        resetAnims();
        await runSequence();
        await wait(1000);
      }
    }
    cycle();
    return () => { isRunning.current = false; };
  }, []);

  return (
    <View style={s.root}>
      <Animated.View
        style={[s.row, { transform: [{ scale: breatheScale }] }]}
        onLayout={(e) => {
          rowWidth.current = e.nativeEvent.layout.width;
        }}
      >
        {DEFS.map((def, i) => {
          const a    = anims[i];
          const cidx = SURVIVOR_IDX.indexOf(i);
          const color = def.dot
            ? DOT_COLOR
            : def.keep
            ? LETTER_COLORS[cidx >= 0 ? cidx % LETTER_COLORS.length : 0]
            : DROP_COLOR;
          const isSurvivor = cidx >= 0;

          const animStyle = {
            opacity: isSurvivor 
              ? Animated.multiply(a.opacity, shimmerOpacity)
              : a.opacity,
            transform: [
              { translateY: a.translateY },
              { translateX: a.translateX },
            ],
          };

          return (
            <Animated.Text
              key={i}
              onLayout={(e) => {
                letterLayouts[i] = {
                  x: e.nativeEvent.layout.x,
                  width: e.nativeEvent.layout.width,
                };
                if (SURVIVOR_IDX.every((si) => letterLayouts[si].width > 0)) {
                  layoutsReady.current = true;
                }
              }}
              style={[s.letter, { color }, animStyle]}
            >
              {def.ch}
            </Animated.Text>
          );
        })}
      </Animated.View>

      <Animated.Text style={[s.tagline, { opacity: taglineOpacity }]}>
        post some places
      </Animated.Text>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  letter: {
    fontSize:      FONT_SIZE,
    fontWeight:    "700",
    lineHeight:    FONT_SIZE * 1.2,
    textAlign:     "center",
  },
  tagline: {
    fontSize:      11,
    letterSpacing: 4,
    color:         TAGLINE_COLOR,
    fontFamily:    "Georgia",
    fontWeight:    "400",
    textAlign:     "center",
  },
});
