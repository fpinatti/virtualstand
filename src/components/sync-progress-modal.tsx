import React from 'react';
import { Modal, View, Text, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { SyncProgressUpdate } from '@/api/contracts';

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
        <View style={styles.card}>
          <Text style={styles.title}>Sincronização BGG</Text>

          {!isCompleted && !isFailed && (
            <ActivityIndicator size="large" color="#6366f1" style={styles.spinner} />
          )}

          <Text style={styles.message}>{progress.message}</Text>

          {progress.totalItems > 0 && (
            <View style={styles.progressBarContainer}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, (progress.itemsProcessed / progress.totalItems) * 100)}%` },
                ]}
              />
            </View>
          )}

          {progress.totalItems > 0 && (
            <Text style={styles.counter}>
              {progress.itemsProcessed} / {progress.totalItems} itens
            </Text>
          )}

          <TouchableOpacity
            style={[styles.button, isCompleted ? styles.buttonSuccess : styles.buttonCancel]}
            onPress={onCancel}
          >
            <Text style={styles.buttonText}>{isCompleted ? 'Concluir' : isFailed ? 'Fechar' : 'Cancelar'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 16,
  },
  spinner: {
    marginVertical: 12,
  },
  message: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    marginVertical: 8,
    lineHeight: 20,
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#334155',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 16,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
  },
  counter: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 6,
  },
  button: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonCancel: {
    backgroundColor: '#475569',
  },
  buttonSuccess: {
    backgroundColor: '#10b981',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
});

