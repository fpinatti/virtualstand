import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Player, PlayerErrorCode, Result } from '@/services/playlog-types';
import { Button, Card, tokens } from '@/ui';

interface PlayerPickerProps {
  players: Player[];
  selectedPlayerIds: number[];
  onTogglePlayer: (player: Player) => void;
  onCreatePlayer: (name: string) => Promise<Result<Player, PlayerErrorCode>>;
  onRenamePlayer: (id: number, name: string) => Promise<Result<Player, PlayerErrorCode>>;
  onHidePlayer: (id: number, hidden: boolean) => Promise<void>;
  onDeletePlayer: (id: number) => Promise<Result<void, PlayerErrorCode>>;
}

export function PlayerPicker({
  players,
  selectedPlayerIds,
  onTogglePlayer,
  onCreatePlayer,
  onRenamePlayer,
  onHidePlayer,
  onDeletePlayer,
}: PlayerPickerProps) {
  const [newName, setNewName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [managedPlayer, setManagedPlayer] = useState<Player | null>(null);
  const [renameText, setRenameText] = useState('');
  const [inUseWarningId, setInUseWarningId] = useState<number | null>(null);

  const handleAdd = async () => {
    setErrorMsg(null);
    const res = await onCreatePlayer(newName);
    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }
    setNewName('');
    onTogglePlayer(res.value);
  };

  const handleDeleteAttempt = async (player: Player) => {
    setErrorMsg(null);
    const res = await onDeletePlayer(player.id);
    if (!res.ok) {
      if (res.code === 'PLAYER_IN_USE') {
        setInUseWarningId(player.id);
      } else {
        setErrorMsg(res.message);
      }
      return;
    }
    setManagedPlayer(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Jogadores (toque para selecionar, segure para gerenciar):</Text>

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      <View style={styles.chipsRow}>
        {players.map((p) => {
          const isSelected = selectedPlayerIds.includes(p.id);
          return (
            <TouchableOpacity
              key={p.id}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onTogglePlayer(p)}
              onLongPress={() => {
                setManagedPlayer(p);
                setRenameText(p.name);
                setInUseWarningId(null);
              }}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {isSelected ? '✓ ' : ''}
                {p.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {managedPlayer ? (
        <Card variant="sunken" padding="sm" style={styles.manageCard}>
          <Text style={styles.manageTitle}>Gerenciar "{managedPlayer.name}"</Text>
          <View style={styles.inlineRow}>
            <TextInput
              style={styles.input}
              value={renameText}
              onChangeText={setRenameText}
              maxLength={40}
            />
            <Button
              label="Renomear"
              variant="primary"
              size="sm"
              onPress={async () => {
                const res = await onRenamePlayer(managedPlayer.id, renameText);
                if (!res.ok) {
                  setErrorMsg(res.message);
                } else {
                  setManagedPlayer(null);
                }
              }}
            />
            <Button
              label="Excluir"
              variant="danger"
              size="sm"
              onPress={() => handleDeleteAttempt(managedPlayer)}
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setManagedPlayer(null)}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {inUseWarningId === managedPlayer.id && (
            <View style={styles.inUseBox}>
              <Text style={styles.inUseText}>
                Este jogador aparece em partidas passadas e não pode ser apagado. Deseja ocultá-lo da lista rápida?
              </Text>
              <Button
                label="Ocultar Jogador"
                variant="secondary"
                size="sm"
                onPress={async () => {
                  await onHidePlayer(managedPlayer.id, true);
                  setManagedPlayer(null);
                  setInUseWarningId(null);
                }}
              />
            </View>
          )}
        </Card>
      ) : null}

      <View style={styles.inlineRow}>
        <TextInput
          style={styles.input}
          placeholder="Novo jogador (ex: Ana, Bruno)..."
          placeholderTextColor={tokens.colors.text.muted}
          value={newName}
          onChangeText={setNewName}
          maxLength={40}
          onSubmitEditing={handleAdd}
        />
        <Button label="+ Jogador" variant="secondary" size="sm" onPress={handleAdd} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.md,
  },
  label: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
    marginBottom: tokens.spacing.xs,
  },
  errorText: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.caption.fontSize,
    marginBottom: tokens.spacing['2xs'],
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
  },
  chip: {
    backgroundColor: tokens.colors.surface.sunken,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 7,
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  chipSelected: {
    backgroundColor: tokens.colors.accent.primary,
    borderColor: tokens.colors.accent.primary,
  },
  chipText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  chipTextSelected: {
    color: tokens.colors.text.inverse,
    fontWeight: tokens.typography.weights.bold,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: tokens.colors.surface.sunken,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
    borderRadius: tokens.radius.md,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.xs,
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.caption.fontSize,
  },
  manageCard: {
    marginBottom: tokens.spacing.xs,
    borderColor: tokens.colors.border.strong,
  },
  manageTitle: {
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.bold,
    marginBottom: tokens.spacing['2xs'],
  },
  closeBtn: {
    paddingHorizontal: tokens.spacing['2xs'],
  },
  closeBtnText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.bodySm.fontSize,
  },
  inUseBox: {
    marginTop: tokens.spacing.xs,
    padding: tokens.spacing.xs,
    borderRadius: tokens.radius.sm,
    backgroundColor: tokens.colors.surface.elevated,
    borderWidth: 1,
    borderColor: tokens.colors.semantic.warning,
    gap: tokens.spacing['2xs'],
  },
  inUseText: {
    color: tokens.colors.semantic.warning,
    fontSize: tokens.typography.scale.caption.fontSize,
  },
});
