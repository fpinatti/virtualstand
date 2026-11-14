import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface PersonalRatingInputProps {
  rating: number | null;
  onChange: (rating: number | null) => Promise<void>;
}

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function PersonalRatingInput({ rating, onChange }: PersonalRatingInputProps) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>
          Sua Nota Pessoal (App):{' '}
          <Text style={styles.currentVal}>{rating ? `★ ${rating} / 10` : 'Sem nota'}</Text>
        </Text>
        {rating !== null && (
          <TouchableOpacity onPress={() => onChange(null)}>
            <Text style={styles.clearLink}>Limpar</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.buttonsRow}>
        {SCORES.map((val) => {
          const active = rating === val;
          return (
            <TouchableOpacity
              key={val}
              style={[styles.scoreBtn, active && styles.scoreBtnActive]}
              onPress={() => onChange(val)}
            >
              <Text style={[styles.scoreText, active && styles.scoreTextActive]}>
                {val}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
  currentVal: {
    color: '#34d399',
    fontWeight: '700',
  },
  clearLink: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  scoreBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  scoreBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#10b981',
  },
  scoreText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  scoreTextActive: {
    color: '#ffffff',
  },
});

