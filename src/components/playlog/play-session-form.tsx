import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  ParticipantInput,
  Player,
  PlayerErrorCode,
  PlayOutcome,
  PlaySession,
  PlaySessionInput,
  PlayValidationErrorCode,
  Result,
} from '@/services/playlog-types';
import { getTodayIsoLocal } from '@/services/play-validation';
import { PlayerPicker } from './player-picker';

interface PlaySessionFormProps {
  visible: boolean;
  bggId: number;
  players: Player[];
  editingSession?: PlaySession | null;
  onClose: () => void;
  onSubmit: (
    input: PlaySessionInput,
    sessionId?: number
  ) => Promise<Result<PlaySession, PlayValidationErrorCode>>;
  onCreatePlayer: (name: string) => Promise<Result<Player, PlayerErrorCode>>;
  onRenamePlayer: (id: number, name: string) => Promise<Result<Player, PlayerErrorCode>>;
  onHidePlayer: (id: number, hidden: boolean) => Promise<void>;
  onDeletePlayer: (id: number) => Promise<Result<void, PlayerErrorCode>>;
}

interface DraftParticipant {
  playerId: number;
  playerName: string;
  scoreText: string;
  isWinner: boolean;
}

export function PlaySessionForm({
  visible,
  bggId,
  players,
  editingSession,
  onClose,
  onSubmit,
  onCreatePlayer,
  onRenamePlayer,
  onHidePlayer,
  onDeletePlayer,
}: PlaySessionFormProps) {
  const [playedOn, setPlayedOn] = useState(getTodayIsoLocal());
  const [durationText, setDurationText] = useState('');
  const [outcome, setOutcome] = useState<PlayOutcome>('COMPETITIVE');
  const [draftParticipants, setDraftParticipants] = useState<DraftParticipant[]>([]);
  const [comments, setComments] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (editingSession) {
      setPlayedOn(editingSession.playedOn);
      setDurationText(
        editingSession.durationMinutes ? String(editingSession.durationMinutes) : ''
      );
      setOutcome(editingSession.outcome);
      setDraftParticipants(
        editingSession.participants.map((p) => ({
          playerId: p.playerId,
          playerName: p.playerName,
          scoreText: p.score !== null && p.score !== undefined ? String(p.score) : '',
          isWinner: p.isWinner,
        }))
      );
      setComments(editingSession.comments ?? '');
    } else {
      setPlayedOn(getTodayIsoLocal());
      setDurationText('');
      setOutcome('COMPETITIVE');
      setDraftParticipants([]);
      setComments('');
    }
    setErrorMsg(null);
  }, [editingSession, visible]);

  const handleTogglePlayer = (player: Player) => {
    setDraftParticipants((prev) => {
      const exists = prev.some((p) => p.playerId === player.id);
      if (exists) {
        return prev.filter((p) => p.playerId !== player.id);
      }
      return [
        ...prev,
        {
          playerId: player.id,
          playerName: player.name,
          scoreText: '',
          isWinner: false,
        },
      ];
    });
  };

  const handleSave = async () => {
    setErrorMsg(null);
    const isCoop = outcome === 'COOP_WIN' || outcome === 'COOP_LOSS';

    let durationMinutes: number | null = null;
    if (durationText.trim() !== '') {
      const parsedDur = Number(durationText.trim());
      durationMinutes = parsedDur;
    }

    const participants: ParticipantInput[] = draftParticipants.map((dp) => {
      if (isCoop) {
        return {
          playerId: dp.playerId,
          score: null,
          isWinner: false,
        };
      }
      const hasScore = dp.scoreText.trim() !== '';
      return {
        playerId: dp.playerId,
        score: hasScore ? Number(dp.scoreText.trim()) : null,
        isWinner: dp.isWinner,
      };
    });

    const res = await onSubmit(
      {
        bggId,
        playedOn: playedOn.trim(),
        durationMinutes,
        outcome,
        participants,
        comments: comments.trim() || null,
      },
      editingSession?.id
    );

    if (!res.ok) {
      setErrorMsg(res.message);
      return;
    }
    onClose();
  };

  const isCoop = outcome === 'COOP_WIN' || outcome === 'COOP_LOSS';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {editingSession ? 'Editar Partida' : 'Registrar Nova Partida'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Cancelar</Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>Data (AAAA-MM-DD):</Text>
                <TextInput
                  style={styles.input}
                  value={playedOn}
                  onChangeText={setPlayedOn}
                  placeholder="2026-11-14"
                  placeholderTextColor="#64748b"
                />
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>Duração (minutos):</Text>
                <TextInput
                  style={styles.input}
                  value={durationText}
                  onChangeText={setDurationText}
                  keyboardType="number-pad"
                  placeholder="Ex: 60"
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>

            <Text style={styles.label}>Modo / Resultado:</Text>
            <View style={styles.outcomeRow}>
              {(
                [
                  { value: 'COMPETITIVE', label: 'Competitivo' },
                  { value: 'COOP_WIN', label: 'Vitória do grupo' },
                  { value: 'COOP_LOSS', label: 'Derrota do grupo' },
                ] as { value: PlayOutcome; label: string }[]
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.outcomeBtn,
                    outcome === opt.value && styles.outcomeBtnActive,
                  ]}
                  onPress={() => setOutcome(opt.value)}
                >
                  <Text
                    style={[
                      styles.outcomeText,
                      outcome === opt.value && styles.outcomeTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <PlayerPicker
              players={players}
              selectedPlayerIds={draftParticipants.map((d) => d.playerId)}
              onTogglePlayer={handleTogglePlayer}
              onCreatePlayer={onCreatePlayer}
              onRenamePlayer={onRenamePlayer}
              onHidePlayer={onHidePlayer}
              onDeletePlayer={onDeletePlayer}
            />

            {!isCoop && draftParticipants.length > 0 && (
              <View style={styles.scoresSection}>
                <Text style={styles.label}>Pontuação e Vencedores:</Text>
                {draftParticipants.map((dp) => (
                  <View key={dp.playerId} style={styles.participantRow}>
                    <Text style={styles.partName}>{dp.playerName}</Text>
                    <TextInput
                      style={styles.scoreInput}
                      placeholder="Pontos"
                      placeholderTextColor="#64748b"
                      keyboardType="numeric"
                      value={dp.scoreText}
                      onChangeText={(txt) =>
                        setDraftParticipants((prev) =>
                          prev.map((item) =>
                            item.playerId === dp.playerId
                              ? { ...item, scoreText: txt }
                              : item
                          )
                        )
                      }
                    />
                    <TouchableOpacity
                      style={[
                        styles.winnerToggle,
                        dp.isWinner && styles.winnerToggleActive,
                      ]}
                      onPress={() =>
                        setDraftParticipants((prev) =>
                          prev.map((item) =>
                            item.playerId === dp.playerId
                              ? { ...item, isWinner: !item.isWinner }
                              : item
                          )
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.winnerText,
                          dp.isWinner && styles.winnerTextActive,
                        ]}
                      >
                        🏆 Vencedor
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.label}>Comentários da Partida (opcional):</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              placeholder="Destaques, viradas épicas ou variantes usadas..."
              placeholderTextColor="#64748b"
              value={comments}
              onChangeText={setComments}
              maxLength={2000}
            />

            <TouchableOpacity style={styles.submitBtn} onPress={handleSave}>
              <Text style={styles.submitBtnText}>
                {editingSession ? 'Salvar Alterações' : 'Salvar Partida'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: '#1e293b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  closeText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 13,
  },
  content: {
    padding: 16,
    paddingBottom: 36,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 13,
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  outcomeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  outcomeBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  outcomeBtnActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#6366f1',
  },
  outcomeText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  outcomeTextActive: {
    color: '#ffffff',
  },
  scoresSection: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  partName: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  scoreInput: {
    width: 85,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: '#f8fafc',
    fontSize: 13,
  },
  winnerToggle: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  winnerToggleActive: {
    backgroundColor: '#d97706',
    borderColor: '#f59e0b',
  },
  winnerText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  winnerTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  submitBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});

