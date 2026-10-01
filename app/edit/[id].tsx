import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { C } from '../../constants/colors';
import { FONT } from '../../constants/typography';
import { PixelText, PixelDivider } from '../../components/Typography';
import { PrimaryButton, TextButton, StatusChip } from '../../components/Controls';
import { usePoopContext } from '../../context/PoopContext';
import { POOP_STATUSES } from '../../types/poop';
import type { PoopStatus } from '../../types/poop';

// ---------------------------------------------------------------------------
// Status options
// ---------------------------------------------------------------------------
const STATUS_OPTIONS = POOP_STATUSES;

// ---------------------------------------------------------------------------
// Date/time helpers
// ---------------------------------------------------------------------------
function toDateInput(iso: string) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function toTimeInput(iso: string) {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${min}`;
}

function combineDateTime(dateStr: string, timeStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || !/^\d{2}:\d{2}$/.test(timeStr)) {
    throw new Error('Invalid date or time');
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  const [hour, minute] = timeStr.split(':').map(Number);
  const date = new Date(year, month - 1, day, hour, minute);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 ||
      date.getDate() !== day || date.getHours() !== hour || date.getMinutes() !== minute) {
    throw new Error('Invalid date or time');
  }
  return date.toISOString();
}

// ---------------------------------------------------------------------------
// EDIT RECORD screen
// ---------------------------------------------------------------------------
export default function EditRecordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { records, update, remove, isSaving } = usePoopContext();

  const record = records.find(r => r.id === id);

  const [dateStr, setDateStr] = useState(record ? toDateInput(record.timestamp) : '');
  const [timeStr, setTimeStr] = useState(record ? toTimeInput(record.timestamp) : '');
  const [status, setStatus] = useState<PoopStatus | undefined>(record?.status);
  const [note, setNote] = useState(record?.note ?? '');

  const handleSave = useCallback(async () => {
    if (!record) return;
    let timestamp: string;
    try {
      timestamp = combineDateTime(dateStr, timeStr);
      if (isNaN(new Date(timestamp).getTime())) throw new Error('invalid');
    } catch {
      Alert.alert('Bad date', 'Please enter a valid date and time.');
      return;
    }
    try {
      await update(record.id, { timestamp, status, note: note.trim() || undefined });
      router.back();
    } catch (error) {
      Alert.alert('Could not save', error instanceof Error ? error.message : 'Please try again.');
    }
  }, [record, dateStr, timeStr, status, note, update, router]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'DELETE RECORD?',
      'This cannot be undone.',
      [
        { text: 'CANCEL', style: 'cancel' },
        {
          text: 'DELETE',
          style: 'destructive',
          onPress: async () => {
            if (!record) return;
            try {
              await remove(record.id);
              router.back();
            } catch (error) {
              Alert.alert('Could not delete', error instanceof Error ? error.message : 'Please try again.');
            }
          },
        },
      ]
    );
  }, [record, remove, router]);

  if (!record) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TextButton label="BACK" color={C.ink} size="xs" onPress={() => router.back()} />
        </View>
        <View style={styles.notFound}>
          <PixelText size="xs" color={C.muted} align="center">RECORD NOT FOUND</PixelText>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TextButton label="BACK" color={C.ink} size="xs" onPress={() => router.back()} />
          <PixelText size="xs" color={C.ink}>EDIT RECORD</PixelText>
          <TextButton label="DELETE" color="#9B3A3A" size="xs" onPress={handleDelete} disabled={isSaving} />
        </View>

        <PixelDivider color={C.tile} />

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ─ Date ─ */}
          <View style={styles.field}>
            <PixelText size="xxs" color={C.muted} style={styles.fieldLabel}>DATE</PixelText>
            <TextInput
              style={styles.input}
              value={dateStr}
              onChangeText={setDateStr}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={C.muted}
              keyboardType="numeric"
              maxLength={10}
              accessibilityLabel="Date"
            />
          </View>

          <PixelDivider color={C.tile} />

          {/* ─ Time ─ */}
          <View style={styles.field}>
            <PixelText size="xxs" color={C.muted} style={styles.fieldLabel}>TIME</PixelText>
            <TextInput
              style={styles.input}
              value={timeStr}
              onChangeText={setTimeStr}
              placeholder="HH:MM"
              placeholderTextColor={C.muted}
              keyboardType="numeric"
              maxLength={5}
              accessibilityLabel="Time"
            />
          </View>

          <PixelDivider color={C.tile} />

          {/* ─ Status ─ */}
          <View style={styles.field}>
            <PixelText size="xxs" color={C.muted} style={[styles.fieldLabel, { marginBottom: 16 }]}>
              STATUS
            </PixelText>
            <View style={styles.chipRow}>
              {STATUS_OPTIONS.map(opt => (
                <StatusChip
                  key={opt}
                  label={opt}
                  selected={status === opt}
                  onPress={() => setStatus(status === opt ? undefined : opt)}
                />
              ))}
            </View>
          </View>

          <PixelDivider color={C.tile} />

          {/* ─ Note ─ */}
          <View style={styles.field}>
            <PixelText size="xxs" color={C.muted} style={styles.fieldLabel}>NOTE</PixelText>
            <TextInput
              style={[styles.input, styles.noteInput]}
              value={note}
              onChangeText={text => setNote(text.slice(0, 80))}
              placeholder="optional"
              placeholderTextColor={C.muted}
              multiline
              maxLength={80}
              accessibilityLabel="Note"
            />
            <PixelText size="xxs" color={C.muted} align="right" style={{ marginTop: 4 }}>
              {note.length}/80
            </PixelText>
          </View>

          <PixelDivider color={C.tile} />

          {/* ─ Save ─ */}
          <View style={styles.saveRow}>
            <PrimaryButton label="SAVE" onPress={() => { void handleSave(); }} disabled={isSaving} />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  field: {
    paddingVertical: 20,
  },
  fieldLabel: {
    marginBottom: 12,
    letterSpacing: 1,
  },
  input: {
    fontFamily: FONT.body,
    fontSize: 18,
    color: C.ink,
    borderBottomWidth: 1,
    borderBottomColor: C.muted,
    paddingBottom: 6,
    paddingTop: 2,
  },
  noteInput: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  saveRow: {
    paddingTop: 32,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
