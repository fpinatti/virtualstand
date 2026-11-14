import React from 'react';
import { Modal, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SyncProgressUpdate } from '@/api/contracts';
import { Button, Card, tokens } from '@/ui';

interface SyncProgressModalProps {
  visible: boolean;
  progress: SyncProgressUpdate | null;
  onCancel: () => void;
}

export function SyncProgressModal({ visible, progress, onCancel }: SyncProgressModalProps) {
  if (!visible || !progress) return null;

  const isCompleted = progress.stage === 'COMPLETED';
  const isFailed = progress.stage === 'FAILED';

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text style={styles.title}>Sincronização BGG</Text>

          {!isCompleted && !isFailed && (
            <ActivityIndicator
              size="large"
              color={tokens.colors.accent.primary}
              style={styles.spinner}
            />
          )}

          <Text style={styles.message}>{progress.message}</Text>

          {progress.totalItems > 0 && (
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${Math.min(
                      100,
                      (progress.itemsProcessed / progress.totalItems) * 100
                    )}%`,
                  },
                ]}
              />
            </View>
          )}

          {progress.totalItems > 0 && (
            <Text style={styles.counter}>
              {progress.itemsProcessed} / {progress.totalItems} itens
            </Text>
          )}

          <View style={styles.buttonWrap}>
            <Button
              label={isCompleted ? 'Concluir' : isFailed ? 'Fechar' : 'Cancelar'}
              variant={isCompleted ? 'primary' : 'secondary'}
              onPress={onCancel}
            />
          </View>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: tokens.colors.surface.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: tokens.typography.scale.h1.fontSize,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.md,
  },
  spinner: {
    marginVertical: tokens.spacing.sm,
  },
  message: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    color: tokens.colors.text.secondary,
    textAlign: 'center',
    marginVertical: tokens.spacing.xs,
    lineHeight: tokens.typography.scale.bodySm.lineHeight,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: tokens.colors.surface.sunken,
    borderRadius: tokens.radius.sm,
    overflow: 'hidden',
    marginTop: tokens.spacing.md,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: tokens.colors.accent.primary,
  },
  counter: {
    fontSize: tokens.typography.scale.caption.fontSize,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing.xs,
    fontVariant: ['tabular-nums'],
  },
  buttonWrap: {
    marginTop: tokens.spacing.lg,
    width: '100%',
  },
});
