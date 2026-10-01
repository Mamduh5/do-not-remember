import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { C } from '../constants/colors';
import { FONT, SIZE, LINE_HEIGHT } from '../constants/typography';

// ---------------------------------------------------------------------------
// PixelText — pixel font text with sensible defaults
// ---------------------------------------------------------------------------

interface PixelTextProps {
  children: React.ReactNode;
  size?: keyof typeof SIZE;
  color?: string;
  align?: 'left' | 'center' | 'right';
  style?: object;
}

export function PixelText({
  children,
  size = 'md',
  color = C.ink,
  align = 'left',
  style,
}: PixelTextProps) {
  return (
    <Text
      style={[
        {
          fontFamily: FONT.pixel,
          fontSize: SIZE[size],
          lineHeight: LINE_HEIGHT[size],
          color,
          textAlign: align,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// BodyText — system font for longer prose / inputs
// ---------------------------------------------------------------------------

interface BodyTextProps {
  children: React.ReactNode;
  size?: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
  style?: object;
}

export function BodyText({
  children,
  size = 14,
  color = C.ink,
  align = 'left',
  style,
}: BodyTextProps) {
  return (
    <Text
      style={[{ fontFamily: FONT.body, fontSize: size, color, textAlign: align, lineHeight: size * 1.5 }, style]}
    >
      {children}
    </Text>
  );
}

// ---------------------------------------------------------------------------
// PixelBox — a flat box with a thick pixel border
// ---------------------------------------------------------------------------

interface PixelBoxProps {
  children: React.ReactNode;
  style?: ViewStyle;
  borderColor?: string;
  borderWidth?: number;
  padding?: number;
}

export function PixelBox({
  children,
  style,
  borderColor = C.ink,
  borderWidth = 2,
  padding = 16,
}: PixelBoxProps) {
  return (
    <View style={[styles.box, { borderColor, borderWidth, padding }, style]}>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Divider
// ---------------------------------------------------------------------------

export function PixelDivider({ color = C.muted }: { color?: string }) {
  return <View style={[styles.divider, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  box: {
    borderRadius: 2,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 0,
  },
});
