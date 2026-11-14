import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { CollectionWithGame, collectionRepository } from '@/db/repositories/collection.repository';
import { BoxDimensionEditor } from './box-dimension-editor';
import { GameSleeveManagerModal } from './sleeves/game-sleeve-manager';

interface GameDetailSheetProps {
  item: CollectionWithGame | null;
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function GameDetailSheet({ item, visible, onClose, onSaved }: GameDetailSheetProps) {
  if (!item) return null;

  const { game, collection } = item;
  const [notes, setNotes] = useState(collection.localNotes ?? '');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(
    collection.customTags ? JSON.parse(collection.customTags) : []
  );
  const [saving, setSaving] = useState(false);
  const [showDimensionEditor, setShowDimensionEditor] = useState(false);
  const [showSleeveModal, setShowSleeveModal] = useState(false);

  const handleAddTag = () => {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await collectionRepository.updateLocalEnrichments(
        collection.collId,
        notes.trim() === '' ? null : notes.trim(),
        tags.length > 0 ? tags : undefined
      );
      onSaved();
      onClose();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível salvar as anotações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{game.title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.meta}>
              {game.yearPublished ? `${game.yearPublished} • ` : ''}
              {game.minPlayers && game.maxPlayers ? `${game.minPlayers}-${game.maxPlayers} jogadores • ` : ''}
              {game.minPlaytime ? `${game.minPlaytime} min` : ''}
            </Text>

            {collection.bggRating ? (
              <View style={styles.ratingRow}>
                <Text style={styles.ratingLabel}>Sua Avaliação no BGG:</Text>
                <Text style={styles.ratingValue}>★ {collection.bggRating.toFixed(1)} / 10</Text>
              </View>
            ) : null}

            {collection.bggComment ? (
              <View style={styles.bggCommentBox}>
                <Text style={styles.bggCommentTitle}>Comentário importado do BGG:</Text>
                <Text style={styles.bggCommentText}>{collection.bggComment}</Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Anotações Pessoais (Salvas apenas no app):</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="ex: Componentes guardados em ziplocks; jogado na ludoteca dia 10..."
                placeholderTextColor="#64748b"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Tags Personalizadas:</Text>
              <View style={styles.tagInputRow}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="Nova tag (ex: favoritos, cooperativo)..."
                  placeholderTextColor="#64748b"
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={handleAddTag}
                />
                <TouchableOpacity style={styles.addTagBtn} onPress={handleAddTag}>
                  <Text style={styles.addTagBtnText}>Adicionar</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.tagsContainer}>
                {tags.map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    style={styles.tagBadge}
                    onPress={() => handleRemoveTag(tag)}
                  >
                    <Text style={styles.tagBadgeText}>#{tag} ✕</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Proteção de Cartas (Sleeves):</Text>
              <TouchableOpacity
                style={styles.dimBtn}
                onPress={() => setShowSleeveModal(true)}
              >
                <Text style={styles.dimBtnText}>🃏 Gerenciar Sleeves e Quantidade de Cartas</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Dimensões Físicas da Caixa (Estante 3D):</Text>
              <TouchableOpacity
                style={styles.dimBtn}
                onPress={() => setShowDimensionEditor(true)}
              >
                <Text style={styles.dimBtnText}>📐 Visualizar / Calibrar Medidas da Caixa</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Salvando...' : 'Salvar Anotações'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <BoxDimensionEditor
          bggId={game.bggId}
          gameTitle={game.title}
          visible={showDimensionEditor}
          onClose={() => setShowDimensionEditor(false)}
          onSaved={onSaved}
        />

        <GameSleeveManagerModal
          bggId={game.bggId}
          gameTitle={game.title}
          visible={showSleeveModal}
          onClose={() => setShowSleeveModal(false)}
          onUpdated={onSaved}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f8fafc',
    flex: 1,
    marginRight: 12,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  meta: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  ratingLabel: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  ratingValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fbbf24',
  },
  bggCommentBox: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bggCommentTitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 4,
  },
  bggCommentText: {
    fontSize: 13,
    color: '#cbd5e1',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addTagBtn: {
    backgroundColor: '#4338ca',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  addTagBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  tagBadgeText: {
    color: '#93c5fd',
    fontSize: 12,
  },
  dimBtn: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#4338ca',
    alignItems: 'center',
  },
  dimBtnText: {
    color: '#a5b4fc',
    fontSize: 14,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
