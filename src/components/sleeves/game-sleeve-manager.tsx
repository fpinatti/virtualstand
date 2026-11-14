import React, { useState, useEffect } from 'react';
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
import { GameSleeveItem } from '@/services/sleeve-types';
import { sleeveManagerService } from '@/services/sleeve-manager.service';

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
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New sleeve form fields
  const [newSetName, setNewSetName] = useState('');
  const [newFormatName, setNewFormatName] = useState('Standard Card Game');
  const [newWidth, setNewWidth] = useState('63.5');
  const [newHeight, setNewHeight] = useState('88');
  const [newCount, setNewCount] = useState('50');

  const loadSleeves = async () => {
    setLoading(true);
    try {
      const data = await sleeveManagerService.getGameSleeves(bggId);
      setSleeves(data);
    } catch (err) {
      console.error('Failed to load sleeves:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && bggId) {
      loadSleeves();
    }
  }, [visible, bggId]);

  const handleToggle = async (sleeve: GameSleeveItem) => {
    if (!sleeve.id) return;
    try {
      await sleeveManagerService.toggleSleeveStatus(sleeve.id, !sleeve.isSleeved);
      await loadSleeves();
      onUpdated?.();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível atualizar o status de envelopamento.');
    }
  };

  const handleAddSleeve = async () => {
    const w = parseFloat(newWidth);
    const h = parseFloat(newHeight);
    const count = parseInt(newCount, 10);

    if (isNaN(w) || isNaN(h) || isNaN(count) || count <= 0) {
      Alert.alert('Erro', 'Por favor, informe medidas e quantidade de cartas válidas.');
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
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível cadastrar o formato de sleeve.');
    }
  };

  const handleDeleteSleeve = async (id?: number) => {
    if (!id) return;
    try {
      await sleeveManagerService.deleteGameSleeve(id);
      await loadSleeves();
      onUpdated?.();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível excluir o formato de sleeve.');
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Sleeves do Jogo</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{gameTitle}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.list}>
            {sleeves.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum formato de sleeve cadastrado para este jogo.</Text>
                <Text style={styles.emptySubtext}>Adicione manualmente caso este jogo use cartas.</Text>
              </View>
            ) : (
              sleeves.map((s) => (
                <View key={s.id || s.cardSetName} style={styles.sleeveCard}>
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
                </View>
              ))
            )}

            {showAddForm ? (
              <View style={styles.formCard}>
                <Text style={styles.formTitle}>Novo Formato de Carta</Text>

                <TextInput
                  style={styles.input}
                  placeholder="Nome do baralho (ex: Cartas de Ação)"
                  placeholderTextColor="#64748b"
                  value={newSetName}
                  onChangeText={setNewSetName}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Nome do Formato (ex: Standard American)"
                  placeholderTextColor="#64748b"
                  value={newFormatName}
                  onChangeText={setNewFormatName}
                />

                <View style={styles.row}>
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Largura mm (ex: 63.5)"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={newWidth}
                    onChangeText={setNewWidth}
                  />
                  <TextInput
                    style={[styles.input, styles.halfInput]}
                    placeholder="Altura mm (ex: 88)"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={newHeight}
                    onChangeText={setNewHeight}
                  />
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Quantidade de cartas (ex: 54)"
                  placeholderTextColor="#64748b"
                  keyboardType="numeric"
                  value={newCount}
                  onChangeText={setNewCount}
                />

                <View style={styles.formButtonsRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowAddForm(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleAddSleeve}>
                    <Text style={styles.saveBtnText}>Adicionar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addTriggerBtn}
                onPress={() => setShowAddForm(true)}
              >
                <Text style={styles.addTriggerText}>+ Adicionar Outro Tamanho de Carta</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 2,
    maxWidth: 280,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: 'bold',
  },
  list: {
    marginBottom: 20,
  },
  sleeveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkboxCheck: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sleeveInfo: {
    flex: 1,
  },
  setName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 2,
  },
  formatText: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#a5b4fc',
  },
  deleteBtn: {
    padding: 8,
  },
  deleteBtnText: {
    color: '#64748b',
    fontSize: 14,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  addTriggerBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4338ca',
    marginTop: 8,
  },
  addTriggerText: {
    color: '#a5b4fc',
    fontSize: 13,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#4338ca',
    marginTop: 8,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 10,
    color: '#f8fafc',
    fontSize: 13,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  halfInput: {
    flex: 1,
  },
  formButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#334155',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: '#6366f1',
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});

