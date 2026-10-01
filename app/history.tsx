import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { C } from '../constants/colors';
import { FONT, SIZE } from '../constants/typography';
import { PixelText, PixelDivider } from '../components/Typography';
import { NavItem } from '../components/Controls';
import { usePoopContext } from '../context/PoopContext';
import { useElapsedTime } from '../hooks/useElapsedTime';
import type { PoopRecord } from '../types/poop';

// ---------------------------------------------------------------------------
// History row
// ---------------------------------------------------------------------------

function HistoryRow({ record, onEdit }: { record: PoopRecord; onEdit: () => void }) {
  const date = new Date(record.timestamp);

  const dateStr = date.toLocaleDateString([], { month: 'short', day: '2-digit' }).toUpperCase();
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  return (
    <Pressable
      onPress={onEdit}
      accessibilityRole="button"
      accessibilityLabel={`${dateStr} at ${timeStr}${record.status ? `, ${record.status}` : ''}. Tap to edit.`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowLeft}>
        <Text style={styles.rowDate}>{dateStr}</Text>
        <Text style={styles.rowTime}>{timeStr}</Text>
      </View>
      <View style={styles.rowRight}>
        {record.status ? (
          <Text style={styles.rowStatus}>{record.status}</Text>
        ) : null}
        {record.note ? (
          <Text style={styles.rowNote} numberOfLines={1}>{record.note}</Text>
        ) : null}
      </View>
      <Text style={styles.rowEdit}>EDIT</Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Empty history
// ---------------------------------------------------------------------------
function EmptyHistory() {
  return (
    <View style={styles.empty}>
      <PixelText size="xs" color={C.muted} align="center">
        NO RECORDS YET
      </PixelText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Header summary
// ---------------------------------------------------------------------------
function GapSummary({ latestTimestamp }: { latestTimestamp: string | null }) {
  const { primary } = useElapsedTime(latestTimestamp);
  if (!latestTimestamp) return null;

  return (
    <View style={styles.summary}>
      <PixelText size="xxs" color={C.muted}>CURRENT GAP</PixelText>
      <PixelText size="sm" color={C.ink}>{primary}</PixelText>
    </View>
  );
}

// ---------------------------------------------------------------------------
// HISTORY screen
// ---------------------------------------------------------------------------
export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { records, latest } = usePoopContext();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Navigation ── */}
      <View style={styles.nav}>
        <NavItem label="TODAY" onPress={() => router.replace('/')} />
        <NavItem label="HISTORY" active />
      </View>

      {/* ── Screen heading ── */}
      <View style={styles.heading}>
        <PixelText size="lg" color={C.ink}>THE RECORD</PixelText>
        <GapSummary latestTimestamp={latest?.timestamp ?? null} />
      </View>

      <PixelDivider color={C.tile} />

      {/* ── Records ── */}
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {records.length === 0 ? (
          <EmptyHistory />
        ) : (
          records.map((record, index) => (
            <React.Fragment key={record.id}>
              <HistoryRow
                record={record}
                onEdit={() => router.push(`/edit/${record.id}`)}
              />
              {index < records.length - 1 && <PixelDivider color={C.tile} />}
            </React.Fragment>
          ))
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
  heading: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  summary: {
    alignItems: 'flex-end',
    gap: 4,
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: 8,
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  rowPressed: {
    backgroundColor: C.tile,
  },
  rowLeft: {
    minWidth: 88,
    gap: 4,
  },
  rowDate: {
    fontFamily: FONT.pixel,
    fontSize: SIZE.xxs,
    color: C.ink,
    letterSpacing: 0.5,
  },
  rowTime: {
    fontFamily: FONT.pixel,
    fontSize: SIZE.xxs,
    color: C.muted,
    letterSpacing: 0.5,
  },
  rowRight: {
    flex: 1,
    gap: 2,
  },
  rowStatus: {
    fontFamily: FONT.pixel,
    fontSize: SIZE.xxs,
    color: C.ink,
    letterSpacing: 0.3,
  },
  rowNote: {
    fontFamily: FONT.body,
    fontSize: 11,
    color: C.muted,
    fontStyle: 'italic',
  },
  rowEdit: {
    fontFamily: FONT.pixel,
    fontSize: SIZE.xxs,
    color: C.muted,
    letterSpacing: 0.8,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
});
