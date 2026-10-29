import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Pressable,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { C } from '../constants/colors';
import { FONT, SIZE } from '../constants/typography';
import { PixelText } from './Typography';

const ITEM_HEIGHT = 44;
const VISIBLE_COUNT = 3;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT;

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

interface WheelColumnProps {
  label: string;
  items: string[];
  selectedItem: string;
  onSelect: (item: string) => void;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}

function WheelColumn({
  label,
  items,
  selectedItem,
  onSelect,
  onInteractionStart,
  onInteractionEnd,
}: WheelColumnProps) {
  const listRef = useRef<FlatList<string>>(null);
  const selectedIndex = useMemo(() => {
    const idx = items.indexOf(selectedItem);
    return idx >= 0 ? idx : 0;
  }, [items, selectedItem]);

  const lastReportedIndex = useRef(selectedIndex);

  // Scroll to selected item on mount and whenever external selection changes significantly
  useEffect(() => {
    lastReportedIndex.current = selectedIndex;
    const timer = setTimeout(() => {
      try {
        listRef.current?.scrollToIndex({
          index: selectedIndex,
          animated: false,
        });
      } catch {
        // FlatList layout not yet measured
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedIndex]);

  const handleScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = e.nativeEvent.contentOffset.y;
      const index = Math.round(offsetY / ITEM_HEIGHT);
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      if (clamped !== lastReportedIndex.current) {
        lastReportedIndex.current = clamped;
        void Haptics.selectionAsync();
        onSelect(items[clamped]);
      }
    },
    [items, onSelect]
  );

  const handleItemPress = useCallback(
    (index: number) => {
      onInteractionStart?.();
      try {
        listRef.current?.scrollToIndex({ index, animated: true });
      } catch {
        // ignore
      }
      if (index !== lastReportedIndex.current) {
        lastReportedIndex.current = index;
        void Haptics.selectionAsync();
        onSelect(items[index]);
      }
      onInteractionEnd?.();
    },
    [items, onSelect, onInteractionStart, onInteractionEnd]
  );

  const getItemLayout = useCallback(
    (_: unknown, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  return (
    <View
      style={styles.columnContainer}
      onTouchStart={onInteractionStart}
      onTouchCancel={onInteractionEnd}
    >
      <PixelText size="xxs" color={C.muted} align="center" style={styles.columnLabel}>
        {label}
      </PixelText>
      <View style={styles.wheelWrapper}>
        <FlatList
          ref={listRef}
          data={items}
          keyExtractor={item => item}
          getItemLayout={getItemLayout}
          initialScrollIndex={selectedIndex}
          nestedScrollEnabled={true}
          overScrollMode="never"
          disableIntervalMomentum={false}
          onScrollToIndexFailed={info => {
            setTimeout(() => {
              listRef.current?.scrollToOffset({
                offset: info.index * ITEM_HEIGHT,
                animated: false,
              });
            }, 100);
          }}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          snapToAlignment="center"
          decelerationRate="fast"
          contentContainerStyle={styles.listContent}
          onScrollBeginDrag={onInteractionStart}
          onMomentumScrollBegin={onInteractionStart}
          onMomentumScrollEnd={e => {
            handleScrollEnd(e);
            onInteractionEnd?.();
          }}
          onScrollEndDrag={e => {
            // Trigger if dragging ended without momentum scroll
            if (e.nativeEvent.velocity?.y === 0) {
              handleScrollEnd(e);
              onInteractionEnd?.();
            }
          }}
          renderItem={({ item, index }) => {
            const isSelected = item === selectedItem;
            return (
              <Pressable
                onPress={() => handleItemPress(index)}
                style={styles.itemSlot}
                accessibilityRole="button"
                accessibilityLabel={`${label} ${item}${isSelected ? ', selected' : ''}`}
              >
                <Text
                  style={[
                    styles.itemText,
                    isSelected ? styles.itemTextSelected : styles.itemTextMuted,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />
      </View>
    </View>
  );
}

interface TimeWheelPickerProps {
  /** "HH:MM" e.g. "12:00" */
  value: string;
  onChange: (value: string) => void;
  /** Invoked when user touches or begins dragging a wheel */
  onInteractionStart?: () => void;
  /** Invoked when interaction and momentum complete */
  onInteractionEnd?: () => void;
}

export function TimeWheelPicker({
  value,
  onChange,
  onInteractionStart,
  onInteractionEnd,
}: TimeWheelPickerProps) {
  const isInteracting = useRef(false);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startInteraction = useCallback(() => {
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
    if (!isInteracting.current) {
      isInteracting.current = true;
      onInteractionStart?.();
    }
  }, [onInteractionStart]);

  const endInteraction = useCallback(() => {
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
    }
    // Small settling buffer so rapid successive touches don't jitter parent scroll state
    safetyTimer.current = setTimeout(() => {
      if (isInteracting.current) {
        isInteracting.current = false;
        onInteractionEnd?.();
      }
    }, 120);
  }, [onInteractionEnd]);

  useEffect(() => {
    return () => {
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
      if (isInteracting.current) {
        onInteractionEnd?.();
      }
    };
  }, [onInteractionEnd]);

  const [currentHour, currentMinute] = useMemo(() => {
    if (/^\d{2}:\d{2}$/.test(value)) {
      const [h, m] = value.split(':');
      return [h, m];
    }
    return ['12', '00'];
  }, [value]);

  const handleHourSelect = useCallback(
    (hour: string) => {
      onChange(`${hour}:${currentMinute}`);
    },
    [currentMinute, onChange]
  );

  const handleMinuteSelect = useCallback(
    (minute: string) => {
      onChange(`${currentHour}:${minute}`);
    },
    [currentHour, onChange]
  );

  return (
    <View
      style={styles.pickerContainer}
      onTouchStart={startInteraction}
      onTouchCancel={endInteraction}
    >
      {/* Selection lines spanning both wheels */}
      <View style={styles.selectionZone} pointerEvents="none">
        <View style={styles.selectionLine} />
        <View style={styles.selectionMiddleSpace} />
        <View style={styles.selectionLine} />
      </View>

      <View style={styles.wheelsRow}>
        <WheelColumn
          label="HOUR"
          items={HOURS}
          selectedItem={currentHour}
          onSelect={handleHourSelect}
          onInteractionStart={startInteraction}
          onInteractionEnd={endInteraction}
        />

        <View style={styles.separatorContainer}>
          <Text style={styles.separatorText}>:</Text>
        </View>

        <WheelColumn
          label="MINUTE"
          items={MINUTES}
          selectedItem={currentMinute}
          onSelect={handleMinuteSelect}
          onInteractionStart={startInteraction}
          onInteractionEnd={endInteraction}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pickerContainer: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 280,
  },
  columnContainer: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    marginBottom: 8,
    letterSpacing: 1,
  },
  wheelWrapper: {
    height: WHEEL_HEIGHT,
    width: '100%',
    overflow: 'hidden',
  },
  listContent: {
    paddingVertical: ITEM_HEIGHT, // Leaves space so index 0 and index N can center
  },
  itemSlot: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontFamily: FONT.pixel,
    textAlign: 'center',
  },
  itemTextSelected: {
    fontSize: SIZE.xl,
    color: C.ink,
  },
  itemTextMuted: {
    fontSize: SIZE.md,
    color: C.muted,
    opacity: 0.35,
  },
  separatorContainer: {
    width: 28,
    height: WHEEL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 18, // offsets label difference
  },
  separatorText: {
    fontFamily: FONT.pixel,
    fontSize: SIZE.xl,
    color: C.ink,
    textAlign: 'center',
  },
  selectionZone: {
    position: 'absolute',
    top: 38, // 12 paddingVertical + ~18 label
    left: 20,
    right: 20,
    height: ITEM_HEIGHT,
    justifyContent: 'space-between',
  },
  selectionLine: {
    height: 1,
    backgroundColor: C.tile,
    width: '100%',
  },
  selectionMiddleSpace: {
    flex: 1,
  },
});
