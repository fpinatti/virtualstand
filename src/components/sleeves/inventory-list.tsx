import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SleeveInventoryItem } from '@/services/sleeve-types';
import { sleeveManagerService } from '@/services/sleeve-manager.service';
import { Button, Card, EmptyState, Input, SectionHeader, tokens } from '@/ui';

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
  const [looseSleeves] = useState('0');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddItem = async () => {
    setErrorMsg(null);
    const w = parseFloat(width);
    const h = parseFloat(height);
    const packs = parseInt(packsOwned, 10);
    const size = parseInt(packSize, 10);
    const loose = parseInt(looseSleeves, 10) || 0;

    if (isNaN(w) || isNaN(h) || isNaN(packs) || isNaN(size)) {
      setErrorMsg('Por favor, informe números válidos para medidas e quantidades.');
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
    } catch {
      setErrorMsg('Não foi possível cadastrar o item no estoque.');
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;
    try {
      await sleeveManagerService.deleteInventoryItem(id);
      onRefresh();
    } catch {
      setErrorMsg('Não foi possível remover o item do estoque.');
    }
  };

  return (
    <View style={styles.container}>
      <SectionHeader
        title="Meu Estoque de Sleeves"
        actionLabel={showAdd ? 'Fechar' : '+ Novo Pacote'}
        onAction={() => {
          setErrorMsg(null);
          setShowAdd(!showAdd);
        }}
      />

      {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

      {showAdd && (
        <Card variant="elevated" padding="md" style={styles.formCard}>
          <Text style={styles.formTitle}>Registrar Pacote Sobressalente</Text>

          <Input
            label="Marca"
            placeholder="Ex: Mayday, Dragon Shield, Gamegenic"
            value={brand}
            onChangeText={setBrand}
          />

          <Input
            label="Nome do Formato"
            placeholder="Ex: Standard Card Game"
            value={formatName}
            onChangeText={setFormatName}
          />

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Largura (mm)"
                placeholder="63.5"
                keyboardType="numeric"
                value={width}
                onChangeText={setWidth}
                tabularNums
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Altura (mm)"
                placeholder="88"
                keyboardType="numeric"
                value={height}
                onChangeText={setHeight}
                tabularNums
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="Pacotes Fechados"
                placeholder="Ex: 2"
                keyboardType="numeric"
                value={packsOwned}
                onChangeText={setPacksOwned}
                tabularNums
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="Sleeves por Pacote"
                placeholder="Ex: 100"
                keyboardType="numeric"
                value={packSize}
                onChangeText={setPackSize}
                tabularNums
              />
            </View>
          </View>

          <Button label="Salvar no Estoque" variant="primary" onPress={handleAddItem} />
        </Card>
      )}

      {inventory.length === 0 ? (
        <EmptyState
          title="Nenhum pacote sobressalente"
          description="Cadastre os sleeves que você tem sobrando em casa para abater da lista de compras."
        />
      ) : (
        inventory.map((item) => (
          <Card key={item.id} variant="elevated" padding="md" style={styles.itemCard}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemBrand}>{item.brand}</Text>
              <Text style={styles.itemFormat}>
                {item.formatName} • {item.widthMm} x {item.heightMm} mm
              </Text>
              <Text style={styles.itemStock}>
                {item.packsOwned} {item.packsOwned === 1 ? 'pacote' : 'pacotes'} de {item.packSize}
                {item.looseSleeves > 0 ? ` + ${item.looseSleeves} avulsos` : ''} (
                {item.packsOwned * item.packSize + item.looseSleeves} total)
              </Text>
            </View>

            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
              <Text style={styles.deleteBtnText}>✕</Text>
            </TouchableOpacity>
          </Card>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing.xl,
  },
  errorText: {
    color: tokens.colors.semantic.danger,
    fontSize: tokens.typography.scale.caption.fontSize,
    marginBottom: tokens.spacing.xs,
  },
  formCard: {
    marginBottom: tokens.spacing.md,
    borderColor: tokens.colors.border.strong,
  },
  formTitle: {
    fontSize: tokens.typography.scale.h3.fontSize,
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
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  itemInfo: {
    flex: 1,
  },
  itemBrand: {
    fontSize: tokens.typography.scale.h3.fontSize,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing['2xs'],
  },
  itemFormat: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing['2xs'],
    fontVariant: ['tabular-nums'],
  },
  itemStock: {
    fontSize: tokens.typography.scale.caption.fontSize,
    color: tokens.colors.semantic.success,
    fontWeight: tokens.typography.weights.semibold,
    fontVariant: ['tabular-nums'],
  },
  deleteBtn: {
    padding: tokens.spacing.xs,
  },
  deleteBtnText: {
    color: tokens.colors.text.muted,
    fontSize: tokens.typography.scale.h3.fontSize,
  },
});
