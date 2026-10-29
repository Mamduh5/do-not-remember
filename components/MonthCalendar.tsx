import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { C } from '../constants/colors';
import { FONT, SIZE } from '../constants/typography';
import { PixelText } from './Typography';
import { TextButton } from './Controls';
import { PoopMarker, MARKER_WIDTH } from './PoopMarker';
import {
  MONTH_NAMES,
  DAYS_OF_WEEK,
  getDaysInMonth,
  getFirstDayOfWeek,
  toLocalDateString,
} from '../utils/dateTime';

interface MonthCalendarProps {
  /** Selected date in local YYYY-MM-DD */
  value: string;
  /** Callback when date is selected */
  onChange: (value: string) => void;
  /** Number of records per local YYYY-MM-DD; days with a count > 0 get a poop marker */
  markedDates?: Record<string, number>;
}

type CalendarCell =
  | { type: 'empty'; key: string }
  | { type: 'day'; day: number; dateStr: string; key: string };

export function MonthCalendar({ value, onChange, markedDates }: MonthCalendarProps) {
  // Parse initial view from value or fallback to today
  const initialDate = useMemo(() => {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number);
      return { year: y, month: m - 1, day: d };
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth(), day: today.getDate() };
  }, [value]);

  const [prevValue, setPrevValue] = useState(value);
  const [viewYear, setViewYear] = useState(initialDate.year);
  const [viewMonth, setViewMonth] = useState(initialDate.month);

  // Adjust state during render when prop changes (React recommended pattern)
  if (value !== prevValue) {
    setPrevValue(value);
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m] = value.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
    }
  }

  const todayStr = useMemo(() => toLocalDateString(new Date()), []);

  const goToPrevMonth = useCallback(() => {
    void Haptics.selectionAsync();
    setViewMonth(prev => {
      if (prev === 0) {
        setViewYear(y => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    void Haptics.selectionAsync();
    setViewMonth(prev => {
      if (prev === 11) {
        setViewYear(y => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const daysInMonth = useMemo(() => getDaysInMonth(viewYear, viewMonth + 1), [viewYear, viewMonth]);
  const firstDayOfWeek = useMemo(() => getFirstDayOfWeek(viewYear, viewMonth + 1), [viewYear, viewMonth]);

  const cells = useMemo(() => {
    const list: CalendarCell[] = [];

    // Leading empty slots
    for (let i = 0; i < firstDayOfWeek; i++) {
      list.push({ type: 'empty', key: `empty-${i}` });
    }

    // Days in current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      list.push({ type: 'day', day: d, dateStr, key: `day-${d}` });
    }

    // Trailing empty slots to complete the final row
    const remainder = list.length % 7;
    if (remainder > 0) {
      const trailing = 7 - remainder;
      for (let i = 0; i < trailing; i++) {
        list.push({ type: 'empty', key: `trail-${i}` });
      }
    }

    return list;
  }, [viewYear, viewMonth, daysInMonth, firstDayOfWeek]);

  const handleDayPress = useCallback(
    (dateStr: string) => {
      void Haptics.selectionAsync();
      onChange(dateStr);
    },
    [onChange]
  );

  return (
    <View style={styles.container}>
      {/* ── Month Navigation Header ── */}
      <View style={styles.header}>
        <TextButton label="PREV" color={C.muted} size="xs" onPress={goToPrevMonth} />
        <PixelText size="xs" color={C.ink} align="center">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </PixelText>
        <TextButton label="NEXT" color={C.muted} size="xs" onPress={goToNextMonth} />
      </View>

      {/* ── Days of Week Row ── */}
      <View style={styles.weekRow}>
        {DAYS_OF_WEEK.map(dayName => (
          <View key={dayName} style={styles.weekCol}>
            <Text style={styles.weekText}>{dayName}</Text>
          </View>
        ))}
      </View>

      {/* ── Days Grid ── */}
      <View style={styles.grid}>
        {cells.map(cell => {
          if (cell.type === 'empty') {
            return <View key={cell.key} style={styles.cellWrapper} />;
          }

          const isSelected = cell.dateStr === value;
          const isToday = cell.dateStr === todayStr;
          const count = markedDates?.[cell.dateStr] ?? 0;

          return (
            <View key={cell.key} style={styles.cellWrapper}>
              <Pressable
                onPress={() => handleDayPress(cell.dateStr)}
                accessibilityRole="button"
                accessibilityLabel={`${cell.day} ${MONTH_NAMES[viewMonth]} ${viewYear}${isSelected ? ', selected' : ''}${isToday ? ', today' : ''}${count > 0 ? `, ${count} logged` : ''}`}
                style={({ pressed }) => [
                  styles.dayBox,
                  isSelected && styles.dayBoxSelected,
                  pressed && { opacity: 0.7 },
                ]}
              >
                <View style={styles.numberSlot}>
                  <Text style={[styles.dayText, styles.dayTextNormal]}>{cell.day}</Text>
                  {isToday && !isSelected ? <View style={styles.todayUnderline} /> : null}
                </View>
                <View style={styles.markerSlot}>
                  {count > 0 ? (
                    <>
                      <PoopMarker />
                      {count > 1 ? (
                        <Text style={styles.countText}>{count > 9 ? '9+' : count}</Text>
                      ) : null}
                    </>
                  ) : null}
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekCol: {
    flex: 1,
    alignItems: 'center',
  },
  weekText: {
    fontFamily: FONT.pixel,
    fontSize: SIZE.xxs,
    color: C.muted,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cellWrapper: {
    width: '14.2857%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBox: {
    width: 38,
    height: 46,
    alignItems: 'center',
    borderRadius: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayBoxSelected: {
    borderColor: C.ink,
  },
  numberSlot: {
    height: 26,
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayUnderline: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 2,
    backgroundColor: C.ink,
  },
  markerSlot: {
    height: 10,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  countText: {
    position: 'absolute',
    left: '50%',
    marginLeft: MARKER_WIDTH / 2 + 2,
    fontFamily: FONT.pixel,
    fontSize: 6,
    color: C.muted,
  },
  dayText: {
    fontFamily: FONT.pixel,
    fontSize: SIZE.xs,
  },
  dayTextNormal: {
    color: C.ink,
  },
});
