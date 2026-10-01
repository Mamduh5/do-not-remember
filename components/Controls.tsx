import React from 'react';
import { Pressable, View, Text, StyleSheet, PressableProps } from 'react-native';
import { C } from '../constants/colors';
import { FONT, SIZE } from '../constants/typography';

// ---------------------------------------------------------------------------
// Primary action button — large, chunky, full-width
// ---------------------------------------------------------------------------

interface PrimaryButtonProps extends PressableProps {
  label: string;
}

export function PrimaryButton({ label, ...rest }: PrimaryButtonProps) {
  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.primary,
        pressed && styles.primaryPressed,
      ]}
    >
      <Text style={styles.primaryLabel}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Text-only action — dead-simple pressable text
// ---------------------------------------------------------------------------

interface TextButtonProps extends PressableProps {
  label: string;
  color?: string;
  size?: keyof typeof SIZE;
}

export function TextButton({ label, color = C.muted, size = 'xs', ...rest }: TextButtonProps) {
  return (
    <Pressable
      {...rest}
      accessibilityRole="button"
      style={({ pressed }) => [styles.textBtn, pressed && { opacity: 0.5 }]}
      hitSlop={12}
    >
      <Text style={[styles.textBtnLabel, { color, fontSize: SIZE[size] }]}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Inline nav — plain uppercase text, used for TODAY / HISTORY tabs
// ---------------------------------------------------------------------------

interface NavItemProps extends PressableProps {
  label: string;
  active?: boolean;
}

export function NavItem({ label, active = false, ...rest }: NavItemProps) {
  return (
    <Pressable
      {...rest}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={({ pressed }) => [styles.navItem, pressed && { opacity: 0.5 }]}
      hitSlop={8}
    >
      <Text style={[styles.navLabel, active ? styles.navActive : styles.navInactive]}>
        {label}
      </Text>
      {active && <View style={styles.navUnderline} />}
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Status chip — text-only, tappable
// ---------------------------------------------------------------------------

interface StatusChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function StatusChip({ label, selected = false, onPress }: StatusChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.chipSelected,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  primary: {
    borderWidth: 2,
    borderColor: C.ink,
    backgroundColor: C.ink,
    paddingVertical: 18,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderRadius: 2,
  },
  primaryPressed: {
    backgroundColor: C.accent,
    borderColor: C.accent,
  },
  primaryLabel: {
    fontFamily: FONT.pixel,
    fontSize: SIZE.sm,
    color: C.bg,
    letterSpacing: 1.5,
  },

  textBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  textBtnLabel: {
    fontFamily: FONT.pixel,
    letterSpacing: 0.8,
  },

  navItem: {
    paddingHorizontal: 4,
    paddingVertical: 8,
    alignItems: 'center',
  },
  navLabel: {
    fontFamily: FONT.pixel,
    fontSize: SIZE.xs,
    letterSpacing: 1.2,
  },
  navActive: {
    color: C.ink,
  },
  navInactive: {
    color: C.muted,
  },
  navUnderline: {
    height: 2,
    backgroundColor: C.ink,
    width: '100%',
    marginTop: 4,
  },

  chip: {
    borderWidth: 1,
    borderColor: C.muted,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 2,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    borderColor: C.ink,
    backgroundColor: C.ink,
  },
  chipLabel: {
    fontFamily: FONT.pixel,
    fontSize: SIZE.xxs,
    color: C.muted,
    letterSpacing: 0.5,
  },
  chipLabelSelected: {
    color: C.bg,
  },
});
