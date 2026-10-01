import React from 'react';
import { View, StyleSheet } from 'react-native';
import { C } from '../constants/colors';

// ---------------------------------------------------------------------------
// Pixel bathroom scene — sparse tiled floor, toilet silhouette
// ---------------------------------------------------------------------------

const TILE_SIZE = 12;
const TILE_COLS = 9;
const TILE_ROWS = 3;

function Floor() {
  return (
    <View style={styles.floorContainer}>
      {Array.from({ length: TILE_ROWS }).map((_, row) => (
        <View key={row} style={styles.tileRow}>
          {Array.from({ length: TILE_COLS }).map((_, col) => (
            <View
              key={col}
              style={[
                styles.tile,
                (row + col) % 2 === 0 ? styles.tileA : styles.tileB,
              ]}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function Toilet() {
  // Pixel-block toilet silhouette — tank + bowl
  return (
    <View style={styles.toiletWrapper} accessibilityLabel="toilet" accessibilityRole="image">
      {/* Tank */}
      <View style={styles.tank}>
        <View style={styles.tankLid} />
        <View style={styles.tankBody} />
      </View>
      {/* Bowl seat */}
      <View style={styles.bowlSeat} />
      {/* Bowl base */}
      <View style={styles.bowlBase} />
      {/* Floor footing */}
      <View style={styles.footing} />
    </View>
  );
}

function Plant() {
  return (
    <View style={styles.plantWrapper} accessibilityLabel="plant" accessibilityRole="image">
      {/* Pot */}
      <View style={styles.pot} />
      {/* Stem */}
      <View style={styles.stem} />
      {/* Leaf left */}
      <View style={[styles.leaf, styles.leafLeft]} />
      {/* Leaf right */}
      <View style={[styles.leaf, styles.leafRight]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Exported scene
// ---------------------------------------------------------------------------

interface PixelSceneProps {
  children?: React.ReactNode;
}

export function PixelScene({ children }: PixelSceneProps) {
  return (
    <View style={styles.scene}>
      {/* Back wall */}
      <View style={styles.wall}>
        {/* Single tiny window — one pixel row of lighter color */}
        <View style={styles.windowRow} />
      </View>

      {/* Object layer */}
      <View style={styles.objectLayer}>
        <Plant />
        <View style={styles.centerStage}>{children}</View>
        <Toilet />
      </View>

      {/* Floor */}
      <Floor />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scene: {
    alignItems: 'center',
  },

  wall: {
    width: '100%',
    height: 24,
    backgroundColor: C.tile,
    justifyContent: 'flex-end',
  },
  windowRow: {
    height: 3,
    backgroundColor: C.surface,
  },

  objectLayer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 0,
  },
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },

  // Floor
  floorContainer: {
    width: '100%',
  },
  tileRow: {
    flexDirection: 'row',
  },
  tile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: C.surface,
    flex: 1,
  },
  tileA: { backgroundColor: C.tile },
  tileB: { backgroundColor: C.surface },

  // Toilet
  toiletWrapper: {
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 0,
  },
  tank: {
    alignItems: 'center',
    marginBottom: 0,
  },
  tankLid: {
    width: 28,
    height: 4,
    backgroundColor: C.muted,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tankBody: {
    width: 26,
    height: 32,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.muted,
  },
  bowlSeat: {
    width: 36,
    height: 6,
    backgroundColor: C.muted,
    borderRadius: 2,
    marginTop: 2,
  },
  bowlBase: {
    width: 30,
    height: 22,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.muted,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  footing: {
    width: 36,
    height: 4,
    backgroundColor: C.muted,
    borderRadius: 1,
  },

  // Plant
  plantWrapper: {
    alignItems: 'center',
    marginLeft: 8,
    marginBottom: 0,
  },
  pot: {
    width: 22,
    height: 18,
    backgroundColor: '#C48B6A',
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    marginTop: 20,
  },
  stem: {
    position: 'absolute',
    bottom: 18,
    width: 3,
    height: 16,
    backgroundColor: C.accent,
  },
  leaf: {
    position: 'absolute',
    width: 12,
    height: 8,
    backgroundColor: C.accent,
    borderRadius: 4,
  },
  leafLeft: {
    bottom: 26,
    left: 2,
    transform: [{ rotate: '-30deg' }],
  },
  leafRight: {
    bottom: 30,
    right: 2,
    transform: [{ rotate: '25deg' }],
  },
});
