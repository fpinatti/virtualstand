import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { gameRepository } from '@/db/repositories/game.repository';
import { BoxDimension } from '@/db/schema';
import { Badge, Button, Card, Input, tokens } from '@/ui';

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
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (bggId && visible) {
      setErrorMsg(null);
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
    setErrorMsg(null);
    const w = parseFloat(width);
    const h = parseFloat(height);
    const d = parseFloat(depth);

    if (isNaN(w) || isNaN(h) || isNaN(d) || w <= 0 || h <= 0 || d <= 0) {
      setErrorMsg('Informe valores numéricos maiores que zero em centímetros.');
      return;
    }

    setSaving(true);
    try {
      await gameRepository.updateDimensions(bggId, w, h, d);
      onSaved();
      onClose();
    } catch {
      setErrorMsg('Não foi possível salvar as dimensões da caixa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text style={styles.title}>Dimensões da Caixa 3D</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {gameTitle}
          </Text>

          <View style={styles.badgeWrap}>
            {dimensions?.isEstimated ? (
              <Badge tone="warning" label="Dimensões estimadas automaticamente" />
            ) : (
              <Badge
                tone="success"
                label={`Dimensões verificadas (${dimensions?.versionName ?? 'Edição Física'})`}
              />
            )}
          </View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <View style={styles.inputsRow}>
            <View style={styles.inputGroup}>
              <Input
                label="Largura (cm)"
                keyboardType="decimal-pad"
                value={width}
                onChangeText={setWidth}
                tabularNums
              />
            </View>
            <View style={styles.inputGroup}>
              <Input
                label="Altura (cm)"
                keyboardType="decimal-pad"
                value={height}
                onChangeText={setHeight}
                tabularNums
              />
            </View>
            <View style={styles.inputGroup}>
              <Input
                label="Profund. (cm)"
                keyboardType="decimal-pad"
                value={depth}
                onChangeText={setDepth}
                tabularNums
              />
            </View>
          </View>

          <View style={styles.buttonsRow}>
            <Button label="Cancelar" variant="secondary" size="sm" onPress={onClose} />
            <Button
              label={saving ? 'Salvando...' : 'Salvar Medidas'}
              variant="primary"
              size="sm"
              onPress={handleSave}
              disabled={saving}
              loading={saving}
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
  },
  title: {
    fontSize: tokens.typography.scale.h2.fontSize,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing['2xs'],
  },
  subtitle: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.sm,
  },
  badgeWrap: {
    marginBottom: tokens.spacing.md,
  },
  errorText: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.caption.fontSize,
    marginBottom: tokens.spacing.xs,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.xs,
  },
  inputGroup: {
    flex: 1,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing.sm,
  },
});
