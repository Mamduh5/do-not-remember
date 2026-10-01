import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, AccessibilityInfo } from 'react-native';
import { C } from '../constants/colors';

// ---------------------------------------------------------------------------
// Pixel art grid — 13×16 bitmap of the poop character.
//
// Color codes:
//   0 = transparent
//   1 = body (poop brown)
//   2 = body highlight (lighter brown)
//   3 = dark outline / shadow
//   4 = white (eye whites, glint)
//   5 = near-black pupil
//   6 = blush / mouth (muted pink-brown)
//   7 = leg (same as body)
// ---------------------------------------------------------------------------

const _ = 0; // transparent
const B = 1; // body
const L = 2; // light highlight
const D = 3; // dark outline
const W = 4; // white
const P = 5; // pupil
const M = 6; // mouth/blush
const G = 7; // leg

type Grid = number[][];

/** Base sprite — standing */
const BASE: Grid = [
  [_,_,_,D,D,D,D,D,_,_,_,_,_],
  [_,_,D,B,B,B,B,B,D,_,_,_,_],
  [_,D,B,B,L,L,B,B,B,D,_,_,_],
  [_,D,B,L,L,L,L,B,B,D,_,_,_],
  [D,B,B,B,L,L,B,B,B,B,D,_,_],
  [D,B,B,B,B,B,B,B,B,B,D,_,_],
  [D,B,W,W,B,B,W,W,B,B,D,_,_],
  [D,B,W,P,B,B,W,P,B,B,D,_,_],
  [D,B,B,B,B,B,B,B,B,B,D,_,_],
  [D,B,B,B,M,M,M,B,B,B,D,_,_],
  [_,D,B,B,B,B,B,B,B,D,_,_,_],
  [_,_,D,B,B,B,B,B,D,_,_,_,_],
  [_,_,_,D,D,D,D,D,_,_,_,_,_],
  [_,_,G,G,_,_,G,G,_,_,_,_,_],
  [_,_,G,G,_,_,G,G,_,_,_,_,_],
  [_,_,D,D,_,_,D,D,_,_,_,_,_],
];

/** Blink frame — pupils closed */
const BLINK: Grid = BASE.map((row, y) => {
  if (y !== 7) return row;
  return row.map((c, x) => {
    if ((x === 2 || x === 3 || x === 6 || x === 7) && c !== B) return D;
    return c;
  });
});

/** Hop frame 1 — legs up */
const HOP1: Grid = [
  [_,_,_,D,D,D,D,D,_,_,_,_,_],
  [_,_,D,B,B,B,B,B,D,_,_,_,_],
  [_,D,B,B,L,L,B,B,B,D,_,_,_],
  [_,D,B,L,L,L,L,B,B,D,_,_,_],
  [D,B,B,B,L,L,B,B,B,B,D,_,_],
  [D,B,B,B,B,B,B,B,B,B,D,_,_],
  [D,B,W,W,B,B,W,W,B,B,D,_,_],
  [D,B,W,P,B,B,W,P,B,B,D,_,_],
  [D,B,B,B,B,B,B,B,B,B,D,_,_],
  [D,B,B,B,M,M,M,B,B,B,D,_,_],
  [_,D,B,B,B,B,B,B,B,D,_,_,_],
  [_,_,D,B,B,B,B,B,D,_,_,_,_],
  [_,_,_,D,D,D,D,D,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_],
  [_,_,G,_,_,_,G,_,_,_,_,_,_],
  [_,_,_,_,_,_,_,_,_,_,_,_,_],
];

const COLOR_MAP: Record<number, string> = {
  0: 'transparent',
  1: C.poop,
  2: C.poopLight,
  3: C.ink,
  4: C.white,
  5: C.ink,
  6: '#A0685A',
  7: C.poop,
};

// ---------------------------------------------------------------------------
// Pixel renderer
// ---------------------------------------------------------------------------

interface PixelRowProps {
  row: number[];
  pixelSize: number;
}

const PixelRow = React.memo(({ row, pixelSize }: PixelRowProps) => (
  <View style={{ flexDirection: 'row' }}>
    {row.map((code, x) => (
      <View
        key={x}
        style={{
          width: pixelSize,
          height: pixelSize,
          backgroundColor: COLOR_MAP[code] ?? 'transparent',
        }}
      />
    ))}
  </View>
));

// ---------------------------------------------------------------------------
// Character component
// ---------------------------------------------------------------------------

export type CharacterState = 'idle' | 'hop' | 'happy';

interface PoopCharacterProps {
  /** Pixel scale multiplier — default 4 */
  scale?: number;
  state?: CharacterState;
}

export function PoopCharacter({ scale = 4, state = 'idle' }: PoopCharacterProps) {
  const pixelSize = scale;

  // Blink animation
  const blinkOpacity = useRef(new Animated.Value(1)).current;

  // Vertical bob (idle)
  const bobY = useRef(new Animated.Value(0)).current;

  // Hop for logging event
  const hopY = useRef(new Animated.Value(0)).current;
  const hopScale = useRef(new Animated.Value(1)).current;

  // Blink loop
  useEffect(() => {
    let blinkLoop: Animated.CompositeAnimation;

    const startBlink = () => {
      blinkLoop = Animated.loop(
        Animated.sequence([
          Animated.delay(2800 + Math.random() * 1500),
          Animated.timing(blinkOpacity, {
            toValue: 0,
            duration: 80,
            useNativeDriver: true,
          }),
          Animated.timing(blinkOpacity, {
            toValue: 1,
            duration: 80,
            useNativeDriver: true,
          }),
        ])
      );
      blinkLoop.start();
    };

    startBlink();
    return () => blinkLoop?.stop();
  }, [blinkOpacity]);

  // Idle bob loop
  useEffect(() => {
    const bobLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bobY, {
          toValue: -pixelSize,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bobY, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    bobLoop.start();
    return () => bobLoop.stop();
  }, [bobY, pixelSize]);

  // Hop animation when state = 'hop'
  useEffect(() => {
    if (state === 'hop') {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(hopY, {
            toValue: -pixelSize * 5,
            duration: 150,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(hopScale, {
            toValue: 1.12,
            duration: 150,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(hopY, {
            toValue: 0,
            duration: 200,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
          Animated.timing(hopScale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [state, hopY, hopScale, pixelSize]);

  const width = BASE[0].length * pixelSize;
  const height = BASE.length * pixelSize;

  return (
    <Animated.View
      accessibilityLabel="poop character"
      accessibilityRole="image"
      style={{
        width,
        height,
        transform: [
          { translateY: Animated.add(bobY, hopY) },
          { scale: hopScale },
        ],
      }}
    >
      {/* Base body — always visible */}
      <View style={StyleSheet.absoluteFill}>
        {BASE.map((row, y) => (
          <PixelRow key={y} row={row} pixelSize={pixelSize} />
        ))}
      </View>

      {/* Blink overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: Animated.subtract(new Animated.Value(1), blinkOpacity) }]}
      >
        {BLINK.map((row, y) => (
          <PixelRow key={y} row={row} pixelSize={pixelSize} />
        ))}
      </Animated.View>
    </Animated.View>
  );
}
