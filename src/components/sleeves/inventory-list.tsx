import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SleeveInventoryItem } from '@/services/sleeve-types';
import { sleeveManagerService } from '@/services/sleeve-manager.service';

interface InventoryListViewProps {
  inventory: SleeveInventoryItem[];
  onRefresh: () => void;
}

export function InventoryListView({ inventory, onRefresh }: InventoryListViewProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [brand, setBrand] = useState('Mayday Games');
  const [formatName, setFormatName] = useState('Standard Card Game');
  const [width, setWidth] = useState('63.5');
  const [height, setHeight] = useState('88');
  const [packsOwned, setPacksOwned] = useState('1');
  const [packSize, setPackSize] = useState('100');
  const [looseSleeves, setLooseSleeves] = useState('0');

  const handleAddItem = async () => {
    const w = parseFloat(width);
    const h = parseFloat(height);
    const packs = parseInt(packsOwned, 10);
    const size = parseInt(packSize, 10);
    const loose = parseInt(looseSleeves, 10) || 0;

    if (isNaN(w) || isNaN(h) || isNaN(packs) || isNaN(size)) {
      Alert.alert('Erro', 'Por favor, informe números válidos para medidas e quantidades.');
      return;
    }

    try {
      await sleeveManagerService.saveInventoryItem({
        brand: brand.trim() || 'Genérico',
        formatName: formatName.trim() || 'Custom',
        widthMm: w,
        heightMm: h,
        packsOwned: packs,
        packSize: size,
        looseSleeves: loose,
      });

      setShowAdd(false);
      onRefresh();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível cadastrar o item no estoque.');
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      await sleeveManagerService.deleteInventoryItem(id);
      onRefresh();
    } catch (err) {
      Alert.alert('Erro', 'Não foi possível remover o item do estoque.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>Meu Estoque de Sleeves</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowAdd(!showAdd)}
        >
          <Text style={styles.addBtnText}>{showAdd ? 'Fechar' : '+ Novo Pacote'}</Text>
        </TouchableOpacity>
      </View>

      {showAdd && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Registrar Pacote Sobressalente</Text>

          <TextInput
            style={styles.input}
            placeholder="Marca (ex: Mayday, Dragon Shield, Gamegenic)"
            placeholderTextColor="#64748b"
            value={brand}
            onChangeText={setBrand}
          />

          <TextInput
            style={styles.input}
            placeholder="Nome do Formato (ex: Standard Card Game)"
            placeholderTextColor="#64748b"
            value={formatName}
            onChangeText={setFormatName}
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Largura mm (63.5)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={width}
              onChangeText={setWidth}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Altura mm (88)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Pacotes Fechados (ex: 2)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={packsOwned}
              onChangeText={setPacksOwned}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Sleeves por Pacote (ex: 100)"
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={packSize}
              onChangeText={setPackSize}
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleAddItem}>
            <Text style={styles.submitBtnText}>Salvar no Estoque</Text>
          </TouchableOpacity>
        </View>
      )}

      {inventory.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Você ainda não cadastrou pacotes sobressalentes.</Text>
          <Text style={styles.emptySubtext}>
            Cadastre os sleeves que você tem sobrando em casa para abater da lista de compras.
          </Text>
        </View>
      ) : (
        inventory.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemBrand}>{item.brand}</Text>
              <Text style={styles.itemFormat}>
                {item.formatName} • {item.widthMm} x {item.heightMm} mm
              </Text>
              <Text style={styles.itemStock}>
                {item.packsOwned} {item.packsOwned === 1 ? 'pacote' : 'pacotes'} de {item.packSize}
                {item.looseSleeves > 0 ? ` + ${item.looseSleeves} avulsos` : ''} ({item.packsOwned * item.packSize + item.looseSleeves} total)
              </Text>
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  addBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addBtnText: {
    color: '#a5b4fc',
    fontSize: 13,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4338ca',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 10,
    color: '#f8fafc',
    fontSize: 14,
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
  submitBtn: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyText: {
    color: '#cbd5e1',
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtext: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  itemInfo: {
    flex: 1,
  },
  itemBrand: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginBottom: 2,
  },
  itemFormat: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 4,
  },
  itemStock: {
    fontSize: 12,
    color: '#34d399',
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 8,
  },
  deleteBtnText: {
    color: '#64748b',
    fontSize: 16,
  },
});

