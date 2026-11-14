import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  DownloadProgress,
  ImportOptions,
  Rulebook,
  RulebookDocType,
  RulebookImportResult,
} from '@/services/rulebook-types';
import { Button, Card, Input, tokens } from '@/ui';

const DOC_TYPES: { value: RulebookDocType; label: string }[] = [
  { value: 'BASE_RULES', label: 'Regras base' },
  { value: 'EXPANSION', label: 'Expansão' },
  { value: 'QUICK_REFERENCE', label: 'Referência rápida' },
  { value: 'FAQ', label: 'FAQ' },
  { value: 'OTHER', label: 'Outro' },
];

interface RulebookImportSheetProps {
  visible: boolean;
  isDownloading: boolean;
  downloadProgress: DownloadProgress | null;
  onClose: () => void;
  onImportDevice: (options?: ImportOptions) => Promise<RulebookImportResult>;
  onImportUrl: (url: string, options?: ImportOptions) => Promise<RulebookImportResult>;
  onCancelDownload: () => Promise<void>;
  onImported: (rulebook: Rulebook) => void;
}

export function RulebookImportSheet({
  visible,
  isDownloading,
  downloadProgress,
  onClose,
  onImportDevice,
  onImportUrl,
  onCancelDownload,
  onImported,
}: RulebookImportSheetProps) {
  const [label, setLabel] = useState('');
  const [docType, setDocType] = useState<RulebookDocType>('BASE_RULES');
  const [url, setUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [duplicatePending, setDuplicatePending] = useState<{
    mode: 'device' | 'url';
    message: string;
  } | null>(null);

  const resetForm = () => {
    setLabel('');
    setDocType('BASE_RULES');
    setUrl('');
    setErrorMessage(null);
    setDuplicatePending(null);
  };

  const handleClose = () => {
    if (isDownloading) return;
    resetForm();
    onClose();
  };

  const runDeviceImport = async (allowDuplicate = false) => {
    setErrorMessage(null);
    setDuplicatePending(null);
    const res = await onImportDevice({
      label: label.trim() || undefined,
      docType,
      allowDuplicate,
    });
    if (res.ok) {
      resetForm();
      onImported(res.rulebook);
      return;
    }
    if (res.code === 'DUPLICATE') {
      setDuplicatePending({ mode: 'device', message: res.message });
      return;
    }
    if (res.code !== 'CANCELLED') {
      setErrorMessage(res.message);
    }
  };

  const runUrlImport = async (allowDuplicate = false) => {
    setErrorMessage(null);
    setDuplicatePending(null);
    const res = await onImportUrl(url, {
      label: label.trim() || undefined,
      docType,
      allowDuplicate,
    });
    if (res.ok) {
      resetForm();
      onImported(res.rulebook);
      return;
    }
    if (res.code === 'DUPLICATE') {
      setDuplicatePending({ mode: 'url', message: res.message });
      return;
    }
    if (res.code !== 'CANCELLED') {
      setErrorMessage(res.message);
    }
  };

  const percent =
    downloadProgress && downloadProgress.totalBytes
      ? Math.round((downloadProgress.bytesWritten / downloadProgress.totalBytes) * 100)
      : null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Anexar Manual em PDF</Text>
            <TouchableOpacity onPress={handleClose} disabled={isDownloading}>
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {duplicatePending ? (
            <Card variant="sunken" padding="sm" style={styles.dupBox}>
              <Text style={styles.dupTitle}>Arquivo Duplicado</Text>
              <Text style={styles.dupText}>{duplicatePending.message}</Text>
              <View style={styles.dupActions}>
                <Button
                  label="Pular"
                  variant="secondary"
                  size="sm"
                  onPress={() => setDuplicatePending(null)}
                />
                <Button
                  label="Importar mesmo assim"
                  variant="primary"
                  size="sm"
                  onPress={() =>
                    duplicatePending.mode === 'device'
                      ? runDeviceImport(true)
                      : runUrlImport(true)
                  }
                />
              </View>
            </Card>
          ) : null}

          <View style={styles.body}>
            <Input
              label="Nome do Documento (opcional)"
              placeholder="Ex: Regras Base (Português)"
              value={label}
              onChangeText={setLabel}
              maxLength={120}
            />

            <Text style={styles.label}>Tipo de Documento:</Text>
            <View style={styles.typeChips}>
              {DOC_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeChip, docType === t.value && styles.typeChipActive]}
                  onPress={() => setDocType(t.value)}
                >
                  <Text
                    style={[
                      styles.typeChipText,
                      docType === t.value && styles.typeChipTextActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              label="📁 Adicionar do aparelho"
              variant="primary"
              disabled={isDownloading}
              onPress={() => runDeviceImport(false)}
            />

            <View style={styles.divider} />

            <Input
              label="Ou adicionar por link HTTPS"
              placeholder="https://exemplo.com/manual.pdf"
              autoCapitalize="none"
              keyboardType="url"
              value={url}
              onChangeText={setUrl}
            />

            {isDownloading ? (
              <Card variant="sunken" padding="sm" style={styles.progressBox}>
                <View style={styles.progressRow}>
                  <ActivityIndicator size="small" color={tokens.colors.accent.primary} />
                  <Text style={styles.progressText}>
                    Baixando PDF...{' '}
                    {percent !== null
                      ? `${percent}%`
                      : downloadProgress
                      ? `${(downloadProgress.bytesWritten / 1024).toFixed(0)} KB`
                      : ''}
                  </Text>
                </View>
                <Button
                  label="Cancelar Download"
                  variant="danger"
                  size="sm"
                  onPress={onCancelDownload}
                />
              </Card>
            ) : (
              <Button
                label="🌐 Baixar e salvar offline"
                variant="secondary"
                onPress={() => runUrlImport(false)}
              />
            )}
          </View>
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
    borderTopWidth: 1,
    borderColor: tokens.colors.border.subtle,
    paddingBottom: tokens.spacing.xl,
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
    marginTop: tokens.spacing.sm,
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
  dupBox: {
    marginHorizontal: tokens.spacing.md,
    marginTop: tokens.spacing.sm,
    borderColor: tokens.colors.semantic.warning,
  },
  dupTitle: {
    color: tokens.colors.semantic.warning,
    fontWeight: tokens.typography.weights.bold,
    fontSize: tokens.typography.scale.bodySm.fontSize,
    marginBottom: tokens.spacing['2xs'],
  },
  dupText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    marginBottom: tokens.spacing.xs,
  },
  dupActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing.xs,
  },
  body: {
    padding: tokens.spacing.md,
  },
  label: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
    marginBottom: tokens.spacing['2xs'],
  },
  typeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing['2xs'],
    marginBottom: tokens.spacing.md,
  },
  typeChip: {
    backgroundColor: tokens.colors.surface.sunken,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing['2xs'],
    borderRadius: tokens.radius.pill,
    borderWidth: 1,
    borderColor: tokens.colors.border.subtle,
  },
  typeChipActive: {
    backgroundColor: tokens.colors.accent.primary,
    borderColor: tokens.colors.accent.primary,
  },
  typeChipText: {
    color: tokens.colors.text.secondary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontWeight: tokens.typography.weights.semibold,
  },
  typeChipTextActive: {
    color: tokens.colors.text.inverse,
    fontWeight: tokens.typography.weights.bold,
  },
  divider: {
    height: 1,
    backgroundColor: tokens.colors.border.subtle,
    marginVertical: tokens.spacing.md,
  },
  progressBox: {
    gap: tokens.spacing.xs,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.xs,
  },
  progressText: {
    color: tokens.colors.text.primary,
    fontSize: tokens.typography.scale.caption.fontSize,
    fontVariant: ['tabular-nums'],
  },
});
