import React from 'react';
import { View } from 'react-native';
import { C } from '../constants/colors';

// Tiny 7×4 pixel poop stamp used as a calendar badge.
// 0 = transparent, 1 = body, 2 = highlight
const MARKER: number[][] = [
  [0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 1, 2, 1, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1],
];

const COLORS: Record<number, string> = {
  0: 'transparent',
  1: C.poop,
  2: C.poopLight,
};

export const MARKER_PIXEL = 2;
export const MARKER_WIDTH = MARKER[0].length * MARKER_PIXEL;
export const MARKER_HEIGHT = MARKER.length * MARKER_PIXEL;

export const PoopMarker = React.memo(function PoopMarker() {
  return (
    <View
      style={{ width: MARKER_WIDTH, height: MARKER_HEIGHT }}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {MARKER.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {row.map((code, x) => (
            <View
              key={x}
              style={{
                width: MARKER_PIXEL,
                height: MARKER_PIXEL,
                backgroundColor: COLORS[code],
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
});
