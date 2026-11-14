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
import { Button, Card, Input, tokens } from '@/ui';

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
                <Input
                  label="Data (AAAA-MM-DD)"
                  value={playedOn}
                  onChangeText={setPlayedOn}
                  placeholder="2026-11-14"
                  tabularNums
                />
              </View>
              <View style={styles.col}>
                <Input
                  label="Duração (minutos)"
                  value={durationText}
                  onChangeText={setDurationText}
                  keyboardType="number-pad"
                  placeholder="Ex: 60"
                  tabularNums
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
              <Card variant="sunken" padding="sm" style={styles.scoresSection}>
                <Text style={styles.label}>Pontuação e Vencedores:</Text>
                {draftParticipants.map((dp) => (
                  <View key={dp.playerId} style={styles.participantRow}>
                    <Text style={styles.partName}>{dp.playerName}</Text>
                    <TextInput
                      style={styles.scoreInput}
                      placeholder="Pontos"
                      placeholderTextColor={tokens.colors.text.muted}
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
              </Card>
            )}

            <Input
              label="Comentários da Partida (opcional)"
              multiline
              placeholder="Destaques, viradas épicas ou variantes usadas..."
              value={comments}
              onChangeText={setComments}
              maxLength={2000}
              style={styles.textArea}
            />

            <Button
              label={editingSession ? 'Salvar Alterações' : 'Salvar Partida'}
              variant="primary"
              size="lg"
              onPress={handleSave}
            />
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
    maxHeight: '90%',
    borderTopWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: tokens.colors.border.subtle,
  },
  title: {
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.h3.fontSize,
    fontWeight: tokens.typography.weights.bold,
  },
  closeText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.bodySm.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  errorBox: {
    marginHorizontal: tokens.spacing.md,
    marginTop: tokens.spacing.xs,
    padding: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.colors.surface.sunken,
    borderWidth: 1,
    borderColor: tokens.colors.semantic.danger,
  },
  errorText: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.caption.fontSize,
  },
  content: {
    padding: tokens.spacing.md,
    paddingBottom: tokens.spacing.xl,
  },
  row: {
    flexDirection: 'row',
    gap: tokens.spacing.xs,
  },
  col: {
    flex: 1,
  },
  label: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
    marginBottom: tokens.spacing['2xs'],
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  outcomeRow: {
    flexDirection: 'row',
    gap: tokens.spacing['2xs'],
    marginBottom: tokens.spacing.md,
  },
  outcomeBtn: {
    flex: 1,
    backgroundColor: tokens.colors.surface.sunken,
    paddingVertical: tokens.spacing.xs,
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  outcomeBtnActive: {
    backgroundColor: tokens.colors.accent.primary,
    borderColor: tokens.colors.accent.primary,
  },
  outcomeText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  outcomeTextActive: {
    color: tokens.colors.text.inverse,
    fontWeight: tokens.typography.weights.bold,
  },
  scoresSection: {
    marginBottom: tokens.spacing.md,
    gap: tokens.spacing.xs,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  partName: {
    flex: 1,
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.bodySm.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  scoreInput: {
    width: 85,
    backgroundColor: tokens.colors.surface.elevated,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
    borderRadius: tokens.radius.sm,
    paddingHorizontal: tokens.spacing.xs,
    paddingVertical: 6,
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontVariant: ['tabular-nums'],
  },
  winnerToggle: {
    backgroundColor: tokens.colors.surface.elevated,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: 7,
    borderRadius: tokens.radius.sm,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  winnerToggleActive: {
    backgroundColor: tokens.colors.accent.primary,
    borderColor: tokens.colors.accent.primary,
  },
  winnerText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  winnerTextActive: {
    color: tokens.colors.text.inverse,
    fontWeight: tokens.typography.weights.bold,
  },
});
