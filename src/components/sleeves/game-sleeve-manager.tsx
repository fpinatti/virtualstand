import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { GameSleeveItem } from '@/services/sleeve-types';
import { sleeveManagerService } from '@/services/sleeve-manager.service';
import { Button, Card, EmptyState, Input, tokens } from '@/ui';

interface GameSleeveManagerModalProps {
  bggId: number;
  gameTitle: string;
  visible: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

export function GameSleeveManagerModal({
  bggId,
  gameTitle,
  visible,
  onClose,
  onUpdated,
}: GameSleeveManagerModalProps) {
  const [sleeves, setSleeves] = useState<GameSleeveItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New sleeve form fields
  const [newSetName, setNewSetName] = useState('');
  const [newFormatName, setNewFormatName] = useState('Standard Card Game');
  const [newWidth, setNewWidth] = useState('63.5');
  const [newHeight, setNewHeight] = useState('88');
  const [newCount, setNewCount] = useState('50');

  const loadSleeves = useCallback(async () => {
    try {
      const data = await sleeveManagerService.getGameSleeves(bggId);
      setSleeves(data);
    } catch (err) {
      console.error('Failed to load sleeves:', err);
    }
  }, [bggId]);

  useEffect(() => {
    if (visible && bggId) {
      setErrorMsg(null);
      loadSleeves();
    }
  }, [visible, bggId, loadSleeves]);

  const handleToggle = async (sleeve: GameSleeveItem) => {
    if (!sleeve.id) return;
    setErrorMsg(null);
    try {
      await sleeveManagerService.toggleSleeveStatus(sleeve.id, !sleeve.isSleeved);
      await loadSleeves();
      onUpdated?.();
    } catch {
      setErrorMsg('Não foi possível atualizar o status de envelopamento.');
    }
  };

  const handleAddSleeve = async () => {
    setErrorMsg(null);
    const w = parseFloat(newWidth);
    const h = parseFloat(newHeight);
    const count = parseInt(newCount, 10);

    if (isNaN(w) || isNaN(h) || isNaN(count) || count <= 0) {
      setErrorMsg('Por favor, informe medidas e quantidade de cartas válidas.');
      return;
    }

    try {
      await sleeveManagerService.saveGameSleeve({
        bggId,
        cardSetName: newSetName.trim() || 'Baralho Adicional',
        formatName: newFormatName.trim() || 'Custom Size',
        widthMm: w,
        heightMm: h,
        cardCount: count,
        isSleeved: false,
      });

      setShowAddForm(false);
      setNewSetName('');
      await loadSleeves();
      onUpdated?.();
    } catch {
      setErrorMsg('Não foi possível cadastrar o formato de sleeve.');
    }
  };

  const handleDeleteSleeve = async (id?: number) => {
    if (!id) return;
    setErrorMsg(null);
    try {
      await sleeveManagerService.deleteGameSleeve(id);
      await loadSleeves();
      onUpdated?.();
    } catch {
      setErrorMsg('Não foi possível excluir o formato de sleeve.');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>Sleeves do Jogo</Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {gameTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          <ScrollView style={styles.list}>
            {sleeves.length === 0 ? (
              <EmptyState
                title="Nenhum formato de sleeve cadastrado"
                description="Adicione manualmente caso este jogo utilize cartas."
              />
            ) : (
              sleeves.map((s) => (
                <Card key={s.id || s.cardSetName} variant="sunken" padding="sm" style={styles.sleeveCard}>
                  <TouchableOpacity
                    style={[styles.checkbox, s.isSleeved && styles.checkboxActive]}
                    onPress={() => handleToggle(s)}
                  >
                    <Text style={styles.checkboxCheck}>{s.isSleeved ? '✓' : ''}</Text>
                  </TouchableOpacity>

                  <View style={styles.sleeveInfo}>
                    <Text style={styles.setName}>{s.cardSetName}</Text>
                    <Text style={styles.formatText}>
                      {s.formatName} • {s.widthMm} x {s.heightMm} mm
                    </Text>
                    <Text style={styles.countText}>
                      {s.cardCount} cartas {s.isSleeved ? '(Envelopado)' : '(Pendente)'}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteSleeve(s.id)}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </Card>
              ))
            )}

            {showAddForm ? (
              <Card variant="sunken" padding="md" style={styles.formCard}>
                <Text style={styles.formTitle}>Novo Formato de Carta</Text>

                <Input
                  label="Nome do baralho"
                  placeholder="Ex: Cartas de Ação"
                  value={newSetName}
                  onChangeText={setNewSetName}
                />

                <Input
                  label="Nome do formato"
                  placeholder="Ex: Standard American"
                  value={newFormatName}
                  onChangeText={setNewFormatName}
                />

                <View style={styles.row}>
                  <View style={styles.halfInput}>
                    <Input
                      label="Largura (mm)"
                      placeholder="63.5"
                      keyboardType="numeric"
                      value={newWidth}
                      onChangeText={setNewWidth}
                      tabularNums
                    />
                  </View>
                  <View style={styles.halfInput}>
                    <Input
                      label="Altura (mm)"
                      placeholder="88"
                      keyboardType="numeric"
                      value={newHeight}
                      onChangeText={setNewHeight}
                      tabularNums
                    />
                  </View>
                </View>

                <Input
                  label="Quantidade de cartas"
                  placeholder="Ex: 54"
                  keyboardType="numeric"
                  value={newCount}
                  onChangeText={setNewCount}
                  tabularNums
                />

                <View style={styles.formButtonsRow}>
                  <Button
                    label="Cancelar"
                    variant="secondary"
                    size="sm"
                    onPress={() => setShowAddForm(false)}
                  />
                  <Button
                    label="Adicionar"
                    variant="primary"
                    size="sm"
                    onPress={handleAddSleeve}
                  />
                </View>
              </Card>
            ) : (
              <View style={styles.addTriggerWrap}>
                <Button
                  label="+ Adicionar Outro Tamanho de Carta"
                  variant="secondary"
                  onPress={() => setShowAddForm(true)}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: tokens.colors.surface.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: tokens.colors.surface.elevated,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    maxHeight: '82%',
    padding: tokens.spacing.lg,
    borderTopWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing.md,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: tokens.spacing.sm,
  },
  title: {
    fontSize: tokens.typography.scale.h2.fontSize,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
  },
  subtitle: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    color: tokens.colors.text.secondary,
    marginTop: tokens.spacing['2xs'],
  },
  closeBtn: {
    padding: tokens.spacing['2xs'],
  },
  closeBtnText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.h2.fontSize,
    fontWeight: tokens.typography.weights.bold,
  },
  errorText: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.caption.fontSize,
    marginBottom: tokens.spacing.xs,
  },
  list: {
    marginBottom: tokens.spacing.md,
  },
  sleeveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: tokens.radius.sm,
    borderWidth: 2,
    borderColor: tokens.colors.accent.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing.sm,
  },
  checkboxActive: {
    backgroundColor: tokens.colors.semantic.success,
    borderColor: tokens.colors.semantic.success,
  },
  checkboxCheck: {
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.bodySm.fontSize,
    fontWeight: tokens.typography.weights.bold,
  },
  sleeveInfo: {
    flex: 1,
  },
  setName: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing['2xs'],
  },
  formatText: {
    fontSize: tokens.typography.scale.caption.fontSize,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing['2xs'],
    fontVariant: ['tabular-nums'],
  },
  countText: {
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.medium,
    color: tokens.colors.accent.primary,
    fontVariant: ['tabular-nums'],
  },
  deleteBtn: {
    padding: tokens.spacing.xs,
  },
  deleteBtnText: {
    color: tokens.colors.text.muted,
    fontSize: tokens.typography.scale.bodySm.fontSize,
  },
  addTriggerWrap: {
    marginTop: tokens.spacing.xs,
  },
  formCard: {
    marginTop: tokens.spacing.xs,
    borderColor: tokens.colors.border.strong,
  },
  formTitle: {
    fontSize: tokens.typography.scale.body.fontSize,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
  },
  halfInput: {
    flex: 1,
  },
  formButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing.xs,
    marginTop: tokens.spacing['2xs'],
  },
});
