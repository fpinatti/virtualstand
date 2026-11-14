import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card, tokens } from '@/ui';

interface PersonalRatingInputProps {
  rating: number | null;
  onChange: (rating: number | null) => Promise<void>;
}

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function PersonalRatingInput({ rating, onChange }: PersonalRatingInputProps) {
  return (
    <Card variant="sunken" padding="sm" style={styles.container}>
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
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  label: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  currentVal: {
    color: tokens.colors.accent.primary,
    fontWeight: tokens.typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  clearLink: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: tokens.spacing['2xs'],
  },
  scoreBtn: {
    flex: 1,
    backgroundColor: tokens.colors.surface.elevated,
    paddingVertical: 7,
    borderRadius: tokens.radius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  scoreBtnActive: {
    backgroundColor: tokens.colors.accent.primary,
    borderColor: tokens.colors.accent.primary,
  },
  scoreText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  scoreTextActive: {
    color: tokens.colors.text.inverse,
  },
});
