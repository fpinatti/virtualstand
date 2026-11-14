import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { gameRepository } from '@/db/repositories/game.repository';
import { BoxDimension } from '@/db/schema';

interface BoxDimensionEditorProps {
  bggId: number | null;
  gameTitle: string;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function BoxDimensionEditor({
  bggId,
  gameTitle,
  visible,
  onClose,
  onSaved,
}: BoxDimensionEditorProps) {
  const [dimensions, setDimensions] = useState<BoxDimension | null>(null);
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (bggId && visible) {
      gameRepository.getDimensionsByBggId(bggId).then((dim) => {
        if (dim) {
          setDimensions(dim);
          setWidth(String(dim.widthCm));
          setHeight(String(dim.heightCm));
          setDepth(String(dim.depthCm));
        } else {
          setDimensions(null);
          setWidth('29.7');
          setHeight('29.7');
          setDepth('7.1');
        }
      });
    }
  }, [bggId, visible]);

  if (!visible || !bggId) return null;

  const handleSave = async () => {
    const w = parseFloat(width);
    const h = parseFloat(height);
    const d = parseFloat(depth);

    if (isNaN(w) || isNaN(h) || isNaN(d) || w <= 0 || h <= 0 || d <= 0) {
      Alert.alert('Erro', 'Por favor, informe valores válidos maiores que zero em centímetros.');
      return;
    }

    setSaving(true);
    try {
      await gameRepository.updateDimensions(bggId, w, h, d);
      onSaved();
      onClose();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar as dimensões da caixa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Dimensões da Caixa 3D</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{gameTitle}</Text>

          {dimensions?.isEstimated ? (
            <View style={styles.estimatedBadge}>
              <Text style={styles.estimatedText}>Dimensões estimadas automaticamente</Text>
            </View>
          ) : (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>Dimensões verificadas do BGG ({dimensions?.versionName ?? 'Edição Física'})</Text>
            </View>
          )}

          <View style={styles.inputsRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Largura (cm)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={width}
                onChangeText={setWidth}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Altura (cm)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={height}
                onChangeText={setHeight}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profundidade (cm)</Text>
              <TextInput
                style={styles.input}
                keyboardType="decimal-pad"
                value={depth}
                onChangeText={setDepth}
              />
            </View>
          </View>

          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.btnCancel} onPress={onClose}>
              <Text style={styles.btnCancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSave} onPress={handleSave} disabled={saving}>
              <Text style={styles.btnSaveText}>{saving ? 'Salvando...' : 'Salvar Medidas'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    borderWidth: 1,
    borderColor: '#334155',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  estimatedBadge: {
    backgroundColor: '#854d0e',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  estimatedText: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: '600',
  },
  verifiedBadge: {
    backgroundColor: '#166534',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  verifiedText: {
    color: '#bbf7d0',
    fontSize: 11,
    fontWeight: '600',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  inputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    color: '#f8fafc',
    fontSize: 15,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  btnCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  btnCancelText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  btnSave: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#6366f1',
  },
  btnSaveText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

