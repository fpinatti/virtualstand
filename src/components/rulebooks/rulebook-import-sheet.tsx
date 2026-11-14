import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
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
            <View style={styles.dupBox}>
              <Text style={styles.dupTitle}>Arquivo Duplicado</Text>
              <Text style={styles.dupText}>{duplicatePending.message}</Text>
              <View style={styles.dupActions}>
                <TouchableOpacity
                  style={styles.skipBtn}
                  onPress={() => setDuplicatePending(null)}
                >
                  <Text style={styles.skipBtnText}>Pular</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.forceBtn}
                  onPress={() =>
                    duplicatePending.mode === 'device'
                      ? runDeviceImport(true)
                      : runUrlImport(true)
                  }
                >
                  <Text style={styles.forceBtnText}>Importar mesmo assim</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <View style={styles.body}>
            <Text style={styles.label}>Nome do Documento (opcional):</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Regras Base (Português)"
              placeholderTextColor="#64748b"
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

            <TouchableOpacity
              style={styles.deviceBtn}
              disabled={isDownloading}
              onPress={() => runDeviceImport(false)}
            >
              <Text style={styles.deviceBtnText}>📁 Adicionar do aparelho</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.label}>Ou adicionar por link HTTPS:</Text>
            <TextInput
              style={styles.input}
              placeholder="https://exemplo.com/manual.pdf"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="url"
              value={url}
              onChangeText={setUrl}
            />

            {isDownloading ? (
              <View style={styles.progressBox}>
                <View style={styles.progressRow}>
                  <ActivityIndicator size="small" color="#6366f1" />
                  <Text style={styles.progressText}>
                    Baixando PDF...{' '}
                    {percent !== null
                      ? `${percent}%`
                      : downloadProgress
                      ? `${(downloadProgress.bytesWritten / 1024).toFixed(0)} KB`
                      : ''}
                  </Text>
                </View>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancelDownload}>
                  <Text style={styles.cancelBtnText}>Cancelar Download</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.urlBtn}
                onPress={() => runUrlImport(false)}
              >
                <Text style={styles.urlBtnText}>🌐 Baixar e salvar offline</Text>
              </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: '#1e293b',
    paddingBottom: 28,
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
    marginTop: 12,
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
  dupBox: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  dupTitle: {
    color: '#fcd34d',
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4,
  },
  dupText: {
    color: '#fde68a',
    fontSize: 13,
    marginBottom: 10,
  },
  dupActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  skipBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  skipBtnText: {
    color: '#e2e8f0',
    fontSize: 12,
    fontWeight: '600',
  },
  forceBtn: {
    backgroundColor: '#d97706',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  forceBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    padding: 16,
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
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#f8fafc',
    fontSize: 14,
    marginBottom: 12,
  },
  typeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  typeChip: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  typeChipActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#6366f1',
  },
  typeChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: '#ffffff',
  },
  deviceBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  deviceBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
    marginVertical: 14,
  },
  urlBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  urlBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  progressBox: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    padding: 12,
    gap: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressText: {
    color: '#e2e8f0',
    fontSize: 13,
  },
  cancelBtn: {
    backgroundColor: '#ef4444',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
});

