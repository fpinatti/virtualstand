import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { GameSleeveInfoProps, GameSleeveItem } from '@/services/sleeve-types';
import { sleeveManagerService } from '@/services/sleeve-manager.service';
import { Badge, Button, Card, Input, SectionHeader, tokens } from '@/ui';

export function GameSleeveInfoSection({ bggId }: GameSleeveInfoProps) {
  const [sleeves, setSleeves] = useState<GameSleeveItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [newSetName, setNewSetName] = useState('');
  const [newFormatName, setNewFormatName] = useState('Standard Card Game');
  const [newWidth, setNewWidth] = useState('63.5');
  const [newHeight, setNewHeight] = useState('88');
  const [newCount, setNewCount] = useState('54');

  const loadSleeves = useCallback(async () => {
    try {
      const data = await sleeveManagerService.getGameSleeves(bggId);
      setSleeves(data);
    } catch (err) {
      console.error('Failed to load game sleeves:', err);
    }
  }, [bggId]);

  useEffect(() => {
    setShowAddForm(false);
    setErrorMsg(null);
    loadSleeves();
  }, [loadSleeves]);

  const handleAddSleeve = async () => {
    setErrorMsg(null);
    const w = parseFloat(newWidth);
    const h = parseFloat(newHeight);
    const count = parseInt(newCount, 10);

    if (isNaN(w) || isNaN(h) || isNaN(count) || w <= 0 || h <= 0 || count <= 0) {
      setErrorMsg('Informe medidas em milímetros e quantidade de cartas válidas.');
      return;
    }

    try {
      await sleeveManagerService.saveGameSleeve({
        bggId,
        cardSetName: newSetName.trim() || 'Baralho Principal',
        formatName: newFormatName.trim() || 'Custom',
        widthMm: w,
        heightMm: h,
        cardCount: count,
        isSleeved: false,
      });

      setShowAddForm(false);
      setNewSetName('');
      await loadSleeves();
    } catch {
      setErrorMsg('Não foi possível salvar a especificação de sleeve.');
    }
  };

  const handleDeleteSleeve = async (id?: number) => {
    if (!id) return;
    setErrorMsg(null);
    try {
      await sleeveManagerService.deleteGameSleeve(id);
      await loadSleeves();
    } catch {
      setErrorMsg('Não foi possível remover o formato de sleeve.');
    }
  };

  const totalCards = sleeves.reduce((sum, s) => sum + s.cardCount, 0);

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Sleeves Necessários"
        badgeText={totalCards > 0 ? `${totalCards} cartas` : undefined}
        actionLabel={showAddForm ? 'Fechar' : '+ Formato'}
        onAction={() => {
          setErrorMsg(null);
          setShowAddForm((prev) => !prev);
        }}
      />

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      {sleeves.length === 0 && !showAddForm ? (
        <Text style={styles.emptyText}>
          Nenhum requisito de sleeve registrado para este jogo.
        </Text>
      ) : (
        sleeves.map((s) => (
          <Card
            key={s.id || `${s.cardSetName}-${s.widthMm}x${s.heightMm}`}
            variant="sunken"
            padding="sm"
            style={styles.sleeveRow}
          >
            <View style={styles.sleeveInfo}>
              <Text style={styles.setName}>{s.cardSetName}</Text>
              <Text style={styles.formatText}>
                {s.formatName} • {s.widthMm} x {s.heightMm} mm
              </Text>
            </View>

            <Badge tone="accent" label={`${s.cardCount} un.`} tabularNums />

            {s.id ? (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDeleteSleeve(s.id)}
              >
                <Text style={styles.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </Card>
        ))
      )}

      {showAddForm && (
        <Card variant="sunken" padding="md" style={styles.formCard}>
          <Input
            label="Conjunto de cartas"
            placeholder="Ex: Baralho Principal, Cartas de Objetivo"
            value={newSetName}
            onChangeText={setNewSetName}
          />

          <Input
            label="Formato do sleeve"
            placeholder="Ex: Standard (Padrão), Chimera, Mini Euro"
            value={newFormatName}
            onChangeText={setNewFormatName}
          />

          <View style={styles.row}>
            <View style={styles.col}>
              <Input
                label="Largura (mm)"
                placeholder="63.5"
                keyboardType="numeric"
                value={newWidth}
                onChangeText={setNewWidth}
                tabularNums
              />
            </View>
            <View style={styles.col}>
              <Input
                label="Altura (mm)"
                placeholder="88"
                keyboardType="numeric"
                value={newHeight}
                onChangeText={setNewHeight}
                tabularNums
              />
            </View>
            <View style={styles.col}>
              <Input
                label="Qtd. Cartas"
                placeholder="54"
                keyboardType="numeric"
                value={newCount}
                onChangeText={setNewCount}
                tabularNums
              />
            </View>
          </View>

          <View style={styles.formButtonsRow}>
            <Button
              label="Cancelar"
              variant="secondary"
              size="sm"
              onPress={() => setShowAddForm(false)}
            />
            <Button
              label="Salvar Formato"
              variant="primary"
              size="sm"
              onPress={handleAddSleeve}
            />
          </View>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: tokens.spacing['2xs'],
  },
  errorText: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.caption.fontSize,
    marginBottom: tokens.spacing.xs,
  },
  emptyText: {
    color: tokens.colors.text.muted,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontStyle: 'italic',
  },
  sleeveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xs,
  },
  sleeveInfo: {
    flex: 1,
  },
  setName: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.text.primary,
    marginBottom: 2,
  },
  formatText: {
    fontSize: tokens.typography.scale.caption.fontSize,
    color: tokens.colors.text.secondary,
    fontVariant: ['tabular-nums'],
  },
  deleteBtn: {
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: tokens.spacing['2xs'],
  },
  deleteBtnText: {
    color: tokens.colors.text.muted,
    fontSize: tokens.typography.scale.caption.fontSize,
  },
  formCard: {
    marginTop: tokens.spacing.xs,
    borderColor: tokens.colors.border.strong,
  },
  row: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
  },
  col: {
    flex: 1,
  },
  formButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing.xs,
  },
});
