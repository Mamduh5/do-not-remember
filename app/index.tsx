import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  AccessibilityInfo,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { C } from '../constants/colors';
import { FONT, SIZE } from '../constants/typography';
import { PoopCharacter, CharacterState } from '../components/PoopCharacter';
import { PixelScene } from '../components/PixelScene';
import { PixelText, PixelDivider } from '../components/Typography';
import { PrimaryButton, TextButton, NavItem } from '../components/Controls';
import { usePoopContext } from '../context/PoopContext';
import { useElapsedTime } from '../hooks/useElapsedTime';

// ---------------------------------------------------------------------------
// Dry confirmation lines — one is picked randomly after logging
// ---------------------------------------------------------------------------
const CONFIRMATIONS = [
  'Evidence recorded.',
  'There. Now we know.',
  'Good. We have a timestamp.',
  'Mystery solved.',
  'Case closed.',
  'Noted.',
  'The record stands.',
];

function pickConfirmation() {
  return CONFIRMATIONS[Math.floor(Math.random() * CONFIRMATIONS.length)];
}

// ---------------------------------------------------------------------------
// Empty state — no records ever
// ---------------------------------------------------------------------------
function EmptyState({ onLog }: { onLog: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <PixelText size="xs" color={C.muted} align="center" style={{ marginBottom: 24 }}>
        NO EVIDENCE YET
      </PixelText>
      <PixelText size="xxs" color={C.muted} align="center" style={{ marginBottom: 40 }}>
        Next time it happens, tell me.
      </PixelText>
      <PrimaryButton label="I POOPED" onPress={onLog} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main TODAY screen
// ---------------------------------------------------------------------------
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { latest, create, records } = usePoopContext();

  const [charState, setCharState] = useState<CharacterState>('idle');
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [justLogged, setJustLogged] = useState(false);
  const confirmOpacity = useRef(new Animated.Value(0)).current;

  // Recalculate elapsed every minute
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const elapsed = useElapsedTime(latest?.timestamp ?? null);

  const handleLog = useCallback(() => {
    // Immediately record
    create({ timestamp: new Date().toISOString() });
    setJustLogged(true);

    // Pick confirmation line
    const msg = pickConfirmation();
    setConfirmation(msg);

    // Hop animation
    setCharState('hop');
    setTimeout(() => setCharState('idle'), 600);

    // Fade in confirmation
    confirmOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(confirmOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(confirmOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start(() => {
      setJustLogged(false);
      setConfirmation(null);
    });
  }, [create, confirmOpacity]);

  const isEmpty = records.length === 0;

  if (isEmpty) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.nav}>
          <NavItem label="TODAY" active />
          <NavItem label="HISTORY" onPress={() => router.push('/history')} />
        </View>
        <PixelScene>
          <PoopCharacter scale={4} state={charState} />
        </PixelScene>
        <View style={{ flex: 1 }}>
          <EmptyState onLog={handleLog} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Navigation ── */}
      <View style={styles.nav}>
        <NavItem label="TODAY" active />
        <NavItem label="HISTORY" onPress={() => router.push('/history')} />
      </View>

      {/* ── Scene ── */}
      <PixelScene>
        <PoopCharacter scale={4} state={charState} />
      </PixelScene>

      {/* ── Main content ── */}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ─ Elapsed time ─ */}
        <View style={styles.timeBlock}>
          <Text
            style={styles.elapsed}
            accessibilityLabel={`Last poop was ${elapsed.primary} ago`}
            accessibilityRole="text"
          >
            {elapsed.primary}
          </Text>
          <PixelText size="xxs" color={C.muted} align="center" style={{ marginTop: 6 }}>
            {elapsed.secondary.toLowerCase()}
          </PixelText>
        </View>

        <PixelDivider color={C.tile} />

        {/* ─ Action ─ */}
        <View style={styles.actionBlock}>
          <PrimaryButton
            label="I POOPED"
            onPress={handleLog}
            accessibilityHint="Records a poop event right now"
          />

          {/* Confirmation line */}
          <Animated.View style={[styles.confirmRow, { opacity: confirmOpacity }]}>
            <PixelText size="xxs" color={C.accent} align="center">
              {confirmation ?? ''}
            </PixelText>
          </Animated.View>

          {/* Correction link — only show right after logging */}
          {justLogged && (
            <TextButton
              label="NOT NOW? CHANGE TIME"
              color={C.muted}
              size="xxs"
              onPress={() => {
                if (latest) router.push(`/edit/${latest.id}`);
              }}
              style={{ marginTop: 2 }}
            />
          )}
        </View>

        {/* ─ Status hint ─ */}
        {latest?.status && (
          <View style={styles.statusHint}>
            <PixelText size="xxs" color={C.muted} align="center">
              {latest.status}
            </PixelText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  nav: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 20,
    borderBottomWidth: 1,
    borderBottomColor: C.tile,
  },
  content: {
    paddingHorizontal: 32,
    flexGrow: 1,
  },
  timeBlock: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  elapsed: {
    fontFamily: FONT.pixel,
    fontSize: SIZE.heroXl,
    color: C.ink,
    lineHeight: 52,
    textAlign: 'center',
  },
  actionBlock: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 16,
  },
  confirmRow: {
    height: 20,
    justifyContent: 'center',
  },
  statusHint: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
});
