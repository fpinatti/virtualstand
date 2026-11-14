import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Player, PlayerErrorCode, Result } from '@/services/playlog-types';

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
        <View style={styles.manageCard}>
          <Text style={styles.manageTitle}>Gerenciar "{managedPlayer.name}"</Text>
          <View style={styles.inlineRow}>
            <TextInput
              style={styles.input}
              value={renameText}
              onChangeText={setRenameText}
              maxLength={40}
            />
            <TouchableOpacity
              style={styles.smallBtn}
              onPress={async () => {
                const res = await onRenamePlayer(managedPlayer.id, renameText);
                if (!res.ok) {
                  setErrorMsg(res.message);
                } else {
                  setManagedPlayer(null);
                }
              }}
            >
              <Text style={styles.smallBtnText}>Renomear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeleteAttempt(managedPlayer)}
            >
              <Text style={styles.smallBtnText}>Excluir</Text>
            </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.hideBtn}
                onPress={async () => {
                  await onHidePlayer(managedPlayer.id, true);
                  setManagedPlayer(null);
                  setInUseWarningId(null);
                }}
              >
                <Text style={styles.smallBtnText}>Ocultar Jogador</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ) : null}

      <View style={styles.inlineRow}>
        <TextInput
          style={styles.input}
          placeholder="Novo jogador (ex: Ana, Bruno)..."
          placeholderTextColor="#64748b"
          value={newName}
          onChangeText={setNewName}
          maxLength={40}
          onSubmitEditing={handleAdd}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>+ Jogador</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 12,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  chip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  chipSelected: {
    backgroundColor: '#4f46e5',
    borderColor: '#6366f1',
  },
  chipText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#ffffff',
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 13,
  },
  addBtn: {
    backgroundColor: '#4338ca',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  manageCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#475569',
  },
  manageTitle: {
    color: '#f8fafc',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  smallBtn: {
    backgroundColor: '#4f46e5',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  deleteBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  smallBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    paddingHorizontal: 6,
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  inUseBox: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(245,158,11,0.15)',
    gap: 6,
  },
  inUseText: {
    color: '#fde68a',
    fontSize: 12,
  },
  hideBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#d97706',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
});

