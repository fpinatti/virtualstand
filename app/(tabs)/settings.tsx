import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useSync } from '@/hooks/use-sync';
import { collectionSyncService } from '@/services/collection-sync.service';
import { SyncProgressModal } from '@/components/sync-progress-modal';
import { batchSyncService, isLocalhostOrDev } from '@/services/batch-sync.service';
import { catalogService } from '@/services/catalog.service';
import {
  RulebookBatchReport,
  SleeveBatchAuditStatus,
  SleeveBatchReport,
} from '@/services/batch-sync-types';
import { Badge, Button, Card, Input, ScreenContainer, SectionHeader, tokens } from '@/ui';

const TOKEN_STORAGE_KEY = 'virtualstand_bgg_api_token';
const USERNAME_STORAGE_KEY = 'virtualstand_bgg_username';

function readWebStorage(key: string): string {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key) ?? '';
    }
  } catch {
    // Ignore storage errors
  }
  return '';
}

function writeWebStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage errors
  }
}

export default function SettingsScreen() {
  const [username, setUsername] = useState(() => readWebStorage(USERNAME_STORAGE_KEY));
  const [apiToken, setApiToken] = useState(() => readWebStorage(TOKEN_STORAGE_KEY));
  const [showToken, setShowToken] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { isSyncing, progress, startSync, cancelSync } = useSync();

  const isDev = isLocalhostOrDev();
  const [sleeveAudit, setSleeveAudit] = useState<SleeveBatchAuditStatus | null>(null);
  const [rulebookAudit, setRulebookAudit] = useState<{
    totalGames: number;
    alreadyHadCount: number;
    pendingCount: number;
    estimatedTokensTotal: number;
  } | null>(null);
  const [isSyncingRulebooks, setIsSyncingRulebooks] = useState(false);
  const [rulebookReport, setRulebookReport] = useState<RulebookBatchReport | null>(null);
  const [rulebookProgress, setRulebookProgress] = useState<string | null>(null);
  const [isSyncingSleeves, setIsSyncingSleeves] = useState(false);
  const [sleeveReport, setSleeveReport] = useState<SleeveBatchReport | null>(null);
  const [sleeveProgress, setSleeveProgress] = useState<string | null>(null);
  const [isExportingCatalog, setIsExportingCatalog] = useState(false);
  const [isSeedingCatalog, setIsSeedingCatalog] = useState(false);
  const [catalogMessage, setCatalogMessage] = useState<string | null>(null);

  const loadAudits = useCallback(async () => {
    if (!isDev) return;
    try {
      const [sAudit, rAudit] = await Promise.all([
        batchSyncService.auditCollectionSleeves(),
        batchSyncService.auditCollectionRulebooks(),
      ]);
      setSleeveAudit(sAudit);
      setRulebookAudit(rAudit);
    } catch {
      // Ignore in case DB empty
    }
  }, [isDev]);

  useEffect(() => {
    loadAudits();
  }, [loadAudits]);

  const handleSyncRulebooks = async () => {
    setIsSyncingRulebooks(true);
    setRulebookReport(null);
    setRulebookProgress('Iniciando auditoria de manuais...');
    try {
      const report = await batchSyncService.syncMissingRulebooks((p) => {
        setRulebookProgress(p.message);
      });
      setRulebookReport(report);
      setRulebookProgress(null);
      await loadAudits();
    } finally {
      setIsSyncingRulebooks(false);
    }
  };

  const handleSyncSleeves = async () => {
    setIsSyncingSleeves(true);
    setSleeveReport(null);
    setSleeveProgress('Iniciando auditoria de sleeves...');
    try {
      const report = await batchSyncService.syncMissingSleeves((p) => {
        setSleeveProgress(p.message);
      });
      setSleeveReport(report);
      setSleeveProgress(null);
      await loadAudits();
    } finally {
      setIsSyncingSleeves(false);
    }
  };

  const handleExportCatalog = async () => {
    setIsExportingCatalog(true);
    setCatalogMessage(null);
    try {
      const exported = await catalogService.exportCatalogToJson();
      const saved = await catalogService.saveCatalogToDisk(exported);
      if (saved) {
        setCatalogMessage(`✓ Catálogo físico exportado com sucesso! (${exported.totalGames} jogos em assets/data/virtualstand-catalog.json)`);
      } else {
        setCatalogMessage(`✓ Snapshot gerado com ${exported.totalGames} jogos.`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCatalogMessage(`✗ Erro ao exportar catálogo: ${msg}`);
    } finally {
      setIsExportingCatalog(false);
    }
  };

  const handleSeedCatalog = async () => {
    setIsSeedingCatalog(true);
    setCatalogMessage(null);
    try {
      const count = await catalogService.seedFromBundledCatalog();
      await loadAudits();
      setCatalogMessage(`✓ SQLite restaurado do catálogo físico com sucesso (${count} jogos novos/atualizados).`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCatalogMessage(`✗ Erro ao restaurar catálogo: ${msg}`);
    } finally {
      setIsSeedingCatalog(false);
    }
  };

  useEffect(() => {
    if (username.trim()) {
      collectionSyncService.getLastSyncTimestamp(username.trim()).then((date) => {
        if (date) {
          setLastSync(date.toLocaleString('pt-BR'));
        }
      });
    }
  }, [username]);

  const handleStartSync = async () => {
    if (!username.trim()) {
      setValidationError('Por favor, informe seu nome de usuário do BoardGameGeek.');
      return;
    }

    setValidationError(null);
    writeWebStorage(USERNAME_STORAGE_KEY, username.trim());
    writeWebStorage(TOKEN_STORAGE_KEY, apiToken.trim());

    setModalVisible(true);
    const result = await startSync(username.trim(), apiToken.trim() || undefined);
    if (result.success) {
      setLastSync(new Date().toLocaleString('pt-BR'));
    }
  };

  return (
    <ScreenContainer scrollable>
      <SectionHeader
        title="Integração BoardGameGeek"
        subtitle="Conecte sua conta do BGG para importar sua coleção de jogos de tabuleiro e sincronizar avaliações."
      />

      <Input
        label="Nome de Usuário no BGG"
        placeholder="ex: seu_usuario_bgg"
        autoCapitalize="none"
        autoCorrect={false}
        value={username}
        onChangeText={(txt) => {
          setUsername(txt);
          if (validationError) setValidationError(null);
        }}
        errorText={validationError}
      />

      <Input
        label="Token da API BGG (Bearer Token Secreto)"
        placeholder="Cole o código secreto gerado ao clicar em Create Token"
        helperText='Atenção: cole o código secreto exibido uma única vez ao clicar em "Create Token" (e não o nome do token).'
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={!showToken}
        value={apiToken}
        onChangeText={setApiToken}
      />

      <View style={styles.tokenToggleRow}>
        <Button
          label={showToken ? 'Ocultar Token' : 'Mostrar Token Digitado'}
          variant="ghost"
          size="sm"
          onPress={() => setShowToken((prev) => !prev)}
        />
      </View>

      {lastSync ? (
        <Text style={styles.lastSyncText}>Última sincronização com sucesso: {lastSync}</Text>
      ) : null}

      <View style={styles.buttonWrap}>
        <Button
          label={isSyncing ? 'Sincronizando...' : 'Sincronizar Coleção Agora'}
          variant="primary"
          size="lg"
          onPress={handleStartSync}
          disabled={!username.trim() || isSyncing}
          loading={isSyncing}
        />
      </View>

      {isDev ? (
        <Card variant="elevated" padding="md" style={styles.devCard}>
          <View style={styles.devHeaderRow}>
            <Text style={styles.devTitle}>Manutenção Local de Dados</Text>
            <Badge tone="accent" label="Localhost / Dev" />
          </View>
          <Text style={styles.devSubtitle}>
            Utilitários para auditar toda a sua coleção, baixar manuais em lote e obter especificações de sleeves via catálogo ou IA.
          </Text>

          <View style={styles.devBlock}>
            <View style={styles.devBlockHeaderRow}>
              <Text style={styles.devBlockTitle}>📖 Manuais Oficiais em PDF</Text>
              {rulebookAudit ? (
                <Badge
                  tone={rulebookAudit.pendingCount > 0 ? 'warning' : 'success'}
                  label={`${rulebookAudit.pendingCount} sem manual em assets`}
                  tabularNums
                />
              ) : null}
            </View>
            <Text style={styles.devBlockDesc}>
              Registra e vincula os manuais em PDF existentes na pasta assets/rulebooks/ para todos os jogos da sua coleção. Para títulos pendentes, localize o PDF oficial no Ludopedia ou site da editora e anexe diretamente.
            </Text>
            <Button
              label={isSyncingRulebooks ? 'Verificando manuais...' : '📥 Verificar e Vincular Manuais de assets/rulebooks/'}
              variant="secondary"
              onPress={handleSyncRulebooks}
              disabled={isSyncingRulebooks || isSyncingSleeves}
              loading={isSyncingRulebooks}
            />
            {rulebookProgress && isSyncingRulebooks ? (
              <Text style={styles.devProgressText}>{rulebookProgress}</Text>
            ) : null}
            {rulebookReport ? (
              <Text style={styles.devResultText}>
                ✓ {rulebookReport.totalGames} jogos: {rulebookReport.newlySyncedCount} novos manuais sincronizados, {rulebookReport.alreadyHadCount} já possuíam manual{rulebookReport.unavailableCount > 0 ? ` (${rulebookReport.unavailableCount} sem manual oficial disponível para download automático)` : ''}.
              </Text>
            ) : null}
          </View>

          <View style={styles.devBlock}>
            <View style={styles.devBlockHeaderRow}>
              <Text style={styles.devBlockTitle}>🃏 Sleeves & Descoberta por IA</Text>
              {sleeveAudit ? (
                <Badge
                  tone={sleeveAudit.pendingAiCount > 0 ? 'warning' : 'success'}
                  label={`${sleeveAudit.pendingAiCount} sem sleeve • ~${sleeveAudit.estimatedTokensTotal} tokens`}
                  tabularNums
                />
              ) : null}
            </View>
            <Text style={styles.devBlockDesc}>
              Aplica primeiro o catálogo comunitário offline (0 tokens) e jogos sem cartas. Para títulos não catalogados, consulta o Gemini AI em JSON com orçamento controlado.
            </Text>
            <Button
              label={isSyncingSleeves ? 'Buscando sleeves...' : '✨ Verificar e Obter Sleeves (Catálogo + IA)'}
              variant="secondary"
              onPress={handleSyncSleeves}
              disabled={isSyncingSleeves || isSyncingRulebooks}
              loading={isSyncingSleeves}
            />
            {sleeveProgress && isSyncingSleeves ? (
              <Text style={styles.devProgressText}>{sleeveProgress}</Text>
            ) : null}
            {sleeveReport ? (
              <Text style={styles.devResultText}>
                ✓ {sleeveReport.totalGames} jogos: {sleeveReport.catalogMatchedCount} do catálogo, {sleeveReport.zeroCardCount} sem cartas, {sleeveReport.aiDiscoveredCount} via IA (~{sleeveReport.tokensUsedEstimate} tokens).
              </Text>
            ) : null}
          </View>

          <View style={styles.devBlock}>
            <View style={styles.devBlockHeaderRow}>
              <Text style={styles.devBlockTitle}>📦 Catálogo Físico Versionável</Text>
              <Badge tone="accent" label="assets/data" />
            </View>
            <Text style={styles.devBlockDesc}>
              Exporta todos os jogos cadastrados, sleeves, manuais e notas para o arquivo físico versionável em git (assets/data/virtualstand-catalog.json), que é carregado automaticamente pelo app mobile.
            </Text>
            <View style={styles.catalogButtonsRow}>
              <Button
                label={isExportingCatalog ? 'Exportando catálogo...' : '💾 Exportar Banco para assets/data/'}
                variant="secondary"
                onPress={handleExportCatalog}
                disabled={isExportingCatalog || isSyncing}
                loading={isExportingCatalog}
              />
              <Button
                label={isSeedingCatalog ? 'Restaurando catálogo...' : '📥 Restaurar do Catálogo Físico'}
                variant="ghost"
                onPress={handleSeedCatalog}
                disabled={isSeedingCatalog || isSyncing}
                loading={isSeedingCatalog}
              />
            </View>
            {catalogMessage ? (
              <Text style={styles.devResultText}>{catalogMessage}</Text>
            ) : null}
          </View>
        </Card>
      ) : null}

      <Card variant="elevated" padding="md" style={styles.authCard}>
        <View style={styles.authHeaderRow}>
          <Text style={styles.infoTitle}>Autenticação Bearer Token (BGG XMLAPI2)</Text>
          <Badge tone="warning" label="Obrigatório no BGG" />
        </View>
        <Text style={styles.infoItem}>
          O BoardGameGeek exige autenticação <Text style={styles.bold}>Bearer Token</Text> em todas as consultas à <Text style={styles.bold}>XMLAPI2</Text>.
        </Text>
        <Text style={styles.infoItem}>
          • Acesse <Text style={styles.bold}>boardgamegeek.com/applications</Text>, clique em <Text style={styles.bold}>Create Token</Text> e copie o código secreto exibido no modal para o campo acima.
        </Text>
      </Card>

      <Card variant="elevated" padding="md">
        <Text style={styles.infoTitle}>Como funciona o processo?</Text>
        <Text style={styles.infoItem}>
          • <Text style={styles.bold}>Fila do BGG (HTTP 202)</Text>: O BGG processa coleções em segundo plano. O app aguarda automaticamente com tentativas progressivas.
        </Text>
        <Text style={styles.infoItem}>
          • <Text style={styles.bold}>100% Offline</Text>: Todos os jogos, capas e notas são salvos localmente em SQLite.
        </Text>
        <Text style={styles.infoItem}>
          • <Text style={styles.bold}>Proteção de Dados Locais</Text>: Sincronizações nunca apagam suas anotações ou tags personalizadas.
        </Text>
      </Card>

      <SyncProgressModal
        visible={modalVisible}
        progress={progress}
        onCancel={() => {
          if (isSyncing) cancelSync();
          setModalVisible(false);
        }}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  lastSyncText: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    color: tokens.colors.semantic.success,
    marginBottom: tokens.spacing.md,
    fontVariant: ['tabular-nums'],
  },
  tokenToggleRow: {
    alignItems: 'flex-start',
    marginTop: -tokens.spacing.xs,
    marginBottom: tokens.spacing.sm,
  },
  buttonWrap: {
    gap: tokens.spacing.sm,
    marginBottom: tokens.spacing.xl,
  },
  devCard: {
    marginBottom: tokens.spacing.lg,
    borderWidth: 1,
    borderColor: tokens.colors.accent.primary,
  },
  devHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  devTitle: {
    fontSize: tokens.typography.scale.h3.fontSize,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
  },
  devSubtitle: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.md,
  },
  devBlock: {
    backgroundColor: tokens.colors.surface.card,
    borderRadius: tokens.radius.md,
    padding: tokens.spacing.sm,
    marginBottom: tokens.spacing.sm,
  },
  devBlockHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing['2xs'],
  },
  devBlockTitle: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    fontWeight: tokens.typography.weights.semibold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing['2xs'],
  },
  devBlockDesc: {
    fontSize: tokens.typography.scale.caption.fontSize,
    color: tokens.colors.text.muted,
    marginBottom: tokens.spacing.sm,
  },
  catalogButtonsRow: {
    gap: tokens.spacing.xs,
  },
  devProgressText: {
    fontSize: tokens.typography.scale.caption.fontSize,
    color: tokens.colors.accent.primary,
    fontStyle: 'italic',
    marginTop: tokens.spacing.xs,
  },
  devResultText: {
    fontSize: tokens.typography.scale.caption.fontSize,
    color: tokens.colors.semantic.success,
    fontWeight: tokens.typography.weights.semibold,
    marginTop: tokens.spacing.xs,
  },
  authCard: {
    marginBottom: tokens.spacing.md,
  },
  authHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing.xs,
  },
  infoTitle: {
    fontSize: tokens.typography.scale.h3.fontSize,
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
    marginBottom: tokens.spacing.xs,
  },
  infoItem: {
    fontSize: tokens.typography.scale.bodySm.fontSize,
    color: tokens.colors.text.secondary,
    marginBottom: tokens.spacing.xs,
    lineHeight: tokens.typography.scale.bodySm.lineHeight,
  },
  bold: {
    fontWeight: tokens.typography.weights.bold,
    color: tokens.colors.text.primary,
  },
});
