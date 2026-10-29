import React, { useEffect, useState, useRef, useCallback } from 'react';
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

/** Base sprite — standing idle */
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

/** Walk Frame A — left foot lifted 1 pixel, right foot grounded */
const WALK_A: Grid = [
  BASE[0],
  BASE[1],
  BASE[2],
  BASE[3],
  BASE[4],
  BASE[5],
  BASE[6],
  BASE[7],
  BASE[8],
  BASE[9],
  BASE[10],
  BASE[11],
  BASE[12],
  [_,_,G,G,_,_,G,G,_,_,_,_,_],
  [_,_,D,D,_,_,G,G,_,_,_,_,_],
  [_,_,_,_,_,_,D,D,_,_,_,_,_],
];

/** Walk Frame B — right foot lifted 1 pixel, left foot grounded */
const WALK_B: Grid = [
  BASE[0],
  BASE[1],
  BASE[2],
  BASE[3],
  BASE[4],
  BASE[5],
  BASE[6],
  BASE[7],
  BASE[8],
  BASE[9],
  BASE[10],
  BASE[11],
  BASE[12],
  [_,_,G,G,_,_,G,G,_,_,_,_,_],
  [_,_,G,G,_,_,D,D,_,_,_,_,_],
  [_,_,D,D,_,_,_,_,_,_,_,_,_],
];

/** Look Left — pupils shifted left */
const LOOK_LEFT: Grid = BASE.map((row, y) => {
  if (y !== 7) return row;
  return [D,B,P,W,B,B,P,W,B,B,D,_,_];
});

/** Look Right — pupils shifted right */
const LOOK_RIGHT: Grid = BASE.map((row, y) => {
  if (y !== 7) return row;
  return [D,B,W,W,P,B,W,W,P,B,D,_,_];
});

/** Blink frame — pupils closed */
const BLINK: Grid = BASE.map((row, y) => {
  if (y !== 7) return row;
  return [D,B,D,D,B,B,D,D,B,B,D,_,_];
});

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

const PixelRow = React.memo(function PixelRow({ row, pixelSize }: PixelRowProps) {
  return (
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
  );
});

// ---------------------------------------------------------------------------
// Character component
// ---------------------------------------------------------------------------

export type CharacterState = 'idle' | 'hop' | 'happy';
type FrameType = 'base' | 'walk_a' | 'walk_b' | 'look_left' | 'look_right' | 'blink';

interface PoopCharacterProps {
  /** Pixel scale multiplier — default 4 */
  scale?: number;
  state?: CharacterState;
}

// Discrete walk anchor points inside bathroom center stage (in pixels from center)
const WALK_POINTS = [-48, -24, 0, 24, 48];

export function PoopCharacter({ scale = 4, state = 'idle' }: PoopCharacterProps) {
  const pixelSize = scale;

  const [frame, setFrame] = useState<FrameType>('base');
  const [facing, setFacing] = useState<'left' | 'right'>('right');
  const [reduceMotion, setReduceMotion] = useState(false);

  // Position & animation values stored in state to satisfy compiler rules
  const [posX] = useState(() => new Animated.Value(0));
  const [bobY] = useState(() => new Animated.Value(0));
  const [hopY] = useState(() => new Animated.Value(0));
  const [hopScale] = useState(() => new Animated.Value(1));

  // Mutable values during events/timeouts
  const stateRef = useRef(state);
  const currentX = useRef(0);
  const isWalking = useRef(false);
  const stepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routineTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const blinkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bobAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const scheduleActionRef = useRef<() => void>(() => {});

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // 1. Accessibility: Detect Reduced Motion
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      setReduceMotion(enabled);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
      setReduceMotion(enabled);
    });
    return () => sub?.remove();
  }, []);

  // 2. Idle vertical bob loop
  const startBob = useCallback(() => {
    if (bobAnimation.current) bobAnimation.current.stop();
    bobAnimation.current = Animated.loop(
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
    bobAnimation.current.start();
  }, [bobY, pixelSize]);

  const stopBob = useCallback(() => {
    if (bobAnimation.current) {
      bobAnimation.current.stop();
      bobAnimation.current = null;
    }
    bobY.setValue(0);
  }, [bobY]);

  // 3. Regular Blink Cycle (while standing)
  useEffect(() => {
    let active = true;

    const scheduleBlink = () => {
      if (!active) return;
      const delay = 2500 + Math.random() * 2000;
      blinkTimer.current = setTimeout(() => {
        if (!active) return;
        if (!isWalking.current && stateRef.current !== 'hop') {
          setFrame('blink');
          setTimeout(() => {
            if (active && !isWalking.current && stateRef.current !== 'hop') {
              setFrame('base');
            }
          }, 90);
        }
        scheduleBlink();
      }, delay);
    };

    scheduleBlink();

    return () => {
      active = false;
      if (blinkTimer.current) clearTimeout(blinkTimer.current);
    };
  }, []);

  // 4. Logging reaction when state = 'hop'
  useEffect(() => {
    if (state === 'hop') {
      if (stepTimer.current) clearTimeout(stepTimer.current);
      if (routineTimer.current) clearTimeout(routineTimer.current);
      isWalking.current = false;
      stopBob();

      Animated.sequence([
        Animated.parallel([
          Animated.timing(hopY, {
            toValue: -pixelSize * 6,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(hopScale, {
            toValue: 1.15,
            duration: 160,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(hopY, {
            toValue: 0,
            duration: 220,
            easing: Easing.bounce,
            useNativeDriver: true,
          }),
          Animated.timing(hopScale, {
            toValue: 1,
            duration: 220,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        startBob();
      });
    }
  }, [state, hopY, hopScale, pixelSize, startBob, stopBob]);

  // 5. Wandering Routine
  const wanderStepTo = useCallback(
    (targetX: number, onComplete: () => void) => {
      isWalking.current = true;
      stopBob();

      const stepSize = 4; // 1 pixel sprite unit
      const dir = targetX > currentX.current ? 1 : -1;
      setFacing(dir > 0 ? 'right' : 'left');

      let currentStep = currentX.current;
      let walkToggle = false;

      const step = () => {
        if (stateRef.current === 'hop') {
          isWalking.current = false;
          return;
        }

        if (currentStep === targetX) {
          currentX.current = targetX;
          isWalking.current = false;
          setFrame('base');
          startBob();
          onComplete();
          return;
        }

        currentStep += dir * stepSize;
        currentX.current = currentStep;
        posX.setValue(currentStep);

        walkToggle = !walkToggle;
        setFrame(walkToggle ? 'walk_a' : 'walk_b');

        stepTimer.current = setTimeout(step, 110);
      };

      step();
    },
    [stopBob, startBob, posX]
  );

  // Keep scheduleActionRef current
  useEffect(() => {
    scheduleActionRef.current = () => {
      if (reduceMotion || stateRef.current === 'hop') return;

      const pauseMs = 3000 + Math.random() * 2500;

      routineTimer.current = setTimeout(() => {
        if (stateRef.current === 'hop' || isWalking.current || reduceMotion) return;

        const roll = Math.random();

        // 20% chance: Look around at current spot
        if (roll < 0.2) {
          setFrame('look_left');
          setTimeout(() => {
            if (!isWalking.current && stateRef.current !== 'hop') {
              setFrame('look_right');
              setTimeout(() => {
                if (!isWalking.current && stateRef.current !== 'hop') {
                  setFrame('base');
                  scheduleActionRef.current();
                }
              }, 600);
            }
          }, 700);
          return;
        }

        // 15% chance: Tiny hop of joy in place
        if (roll < 0.35) {
          Animated.sequence([
            Animated.timing(hopY, {
              toValue: -pixelSize * 2,
              duration: 110,
              useNativeDriver: true,
            }),
            Animated.timing(hopY, {
              toValue: 0,
              duration: 110,
              useNativeDriver: true,
            }),
          ]).start(() => {
            scheduleActionRef.current();
          });
          return;
        }

        // 65% chance: Walk to another position
        const validTargets = WALK_POINTS.filter(pt => pt !== currentX.current);
        const target = validTargets[Math.floor(Math.random() * validTargets.length)];

        wanderStepTo(target, () => {
          scheduleActionRef.current();
        });
      }, pauseMs);
    };
  }, [reduceMotion, pixelSize, hopY, wanderStepTo]);

  // Start wandering loop on mount (unless reduced motion is active)
  useEffect(() => {
    if (reduceMotion) {
      posX.setValue(0);
      currentX.current = 0;
      startBob();
      return;
    }

    startBob();
    scheduleActionRef.current();

    return () => {
      if (routineTimer.current) clearTimeout(routineTimer.current);
      if (stepTimer.current) clearTimeout(stepTimer.current);
      stopBob();
    };
  }, [reduceMotion, startBob, stopBob, posX]);

  // Derived active frame
  const activeFrame: FrameType = state === 'hop' ? 'base' : frame;

  const activeGrid = (() => {
    switch (activeFrame) {
      case 'walk_a':
        return WALK_A;
      case 'walk_b':
        return WALK_B;
      case 'look_left':
        return LOOK_LEFT;
      case 'look_right':
        return LOOK_RIGHT;
      case 'blink':
        return BLINK;
      default:
        return BASE;
    }
  })();

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
          { translateX: posX },
          { translateY: Animated.add(bobY, hopY) },
          { scaleX: facing === 'left' ? -1 : 1 },
          { scale: hopScale },
        ],
      }}
    >
      <View style={StyleSheet.absoluteFill}>
        {activeGrid.map((row, y) => (
          <PixelRow key={y} row={row} pixelSize={pixelSize} />
        ))}
      </View>
    </Animated.View>
  );
}
