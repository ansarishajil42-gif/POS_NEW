import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform } from 'react-native';
import { AppHeader, ScreenBody, ScreenHeader } from '../Shell';
import { Card, StatCard } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button, Sheet, Field, Input } from '../ui/Primitives';
import { Toast, type ToastType } from '../ui/Toast';
import { useAuth } from '../../lib/auth';
import {
  AggregatorProvider,
  useAggregator,
  AggregatorConnection,
  SyncSummaryResult,
  SyncLogItem,
  ConnectionSettingsPayload,
} from '../../lib/AggregatorContext';
import { documentDirectory, writeAsStringAsync, EncodingType } from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  Zap,
  Building,
  Server,
  Clock,
  RefreshCw,
  CheckCircle2,
  Lock,
  UploadCloud,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Settings,
  History,
  Trash2,
} from 'lucide-react-native';

const CHANNELS = ['Talabat', 'Careem', 'InstaShop', 'Deliveroo'] as const;

export type TimeWindowOption = 'all' | '1h' | '24h' | '7d' | '30d';

export const TIME_WINDOW_OPTIONS: { id: TimeWindowOption; label: string; dialogBadge: string }[] = [
  { id: 'all', label: 'Current / All', dialogBadge: 'Current / All (Full Catalog)' },
  { id: '1h', label: 'Last 1 Hour', dialogBadge: 'Last 1 Hour' },
  { id: '24h', label: 'Last 24 Hours', dialogBadge: 'Last 24 Hours' },
  { id: '7d', label: 'Last 1 Week', dialogBadge: 'Last 1 Week' },
  { id: '30d', label: 'Last 1 Month', dialogBadge: 'Last 1 Month' },
];

export function getWindowStartDate(window: TimeWindowOption): string | null {
  const now = Date.now();
  if (window === '1h') return new Date(now - 60 * 60 * 1000).toISOString();
  if (window === '24h') return new Date(now - 24 * 60 * 60 * 1000).toISOString();
  if (window === '7d') return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (window === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

function calculateNextSyncTime(conn: AggregatorConnection): string {
  if (!conn.isActive) return 'Connection Inactive';
  if (conn.isPaused) return 'Automation Paused';

  const lastTime = conn.lastScheduledSyncAt ? new Date(conn.lastScheduledSyncAt).getTime() : 0;
  const now = Date.now();
  const rateLimitMs = 5 * 60 * 1000;

  if (conn.hasPendingChanges) {
    if (now - lastTime >= rateLimitMs) {
      return 'Sync Due (Next Interval)';
    }
    const eligibleDate = new Date(lastTime + rateLimitMs);
    return `Queued: ${eligibleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (conn.syncFrequency === 'hourly') {
    const nextDate = new Date((lastTime || now) + 60 * 60 * 1000);
    return nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (conn.syncFrequency === 'daily') {
    const nextDate = new Date((lastTime || now) + 24 * 60 * 60 * 1000);
    return nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return 'Up to date (Auto on sale)';
}

function AggregatorScreenContent({ onBack }: { onBack: () => void }) {
  const { branch } = useAuth();
  const {
    connections,
    branches,
    loading,
    refreshAll,
    getSyncSummary,
    triggerSync,
    previewCsv,
    fetchLogs,
    deleteLog,
    deleteAllLogsForConnection,
    updateConnectionSettings,
  } = useAggregator();
  const [channel, setChannel] = useState<string>('Talabat');

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const showToast = (message: string, type: ToastType = 'success') => setToast({ message, type });

  // Confirmation Modal state
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [activeConnForSync, setActiveConnForSync] = useState<AggregatorConnection | null>(null);
  const [syncSummary, setSyncSummary] = useState<SyncSummaryResult | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Time Window filter state per connection & active modal
  const [selectedTimeWindows, setSelectedTimeWindows] = useState<Record<string, TimeWindowOption>>({});
  const [activeWindowForSync, setActiveWindowForSync] = useState<TimeWindowOption>('all');
  const [loadingPreviewCardId, setLoadingPreviewCardId] = useState<string | null>(null);

  // History / Audit Logs modal state
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [activeConnForHistory, setActiveConnForHistory] = useState<AggregatorConnection | null>(null);
  const [connLogs, setConnLogs] = useState<SyncLogItem[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isDeletingLogId, setIsDeletingLogId] = useState<string | null>(null);
  const [isClearingAllLogs, setIsClearingAllLogs] = useState(false);

  // Connection Settings modal state
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [activeConnForSettings, setActiveConnForSettings] = useState<AggregatorConnection | null>(null);
  const [formFilenamePrefix, setFormFilenamePrefix] = useState('');
  const [formRemoteDir, setFormRemoteDir] = useState('assortment');
  const [formHost, setFormHost] = useState('');
  const [formPort, setFormPort] = useState('22');
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPriceFormat, setFormPriceFormat] = useState('price_discounted');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const handleOpenSyncModal = async (conn: AggregatorConnection) => {
    setActiveConnForSync(conn);
    const window = selectedTimeWindows[conn.id] || 'all';
    setActiveWindowForSync(window);
    setSyncSummary(null);
    setSyncModalOpen(true);
    setIsLoadingSummary(true);

    try {
      const windowStart = getWindowStartDate(window);
      const summary = await getSyncSummary(conn.id, windowStart);
      setSyncSummary(summary);
      if (!summary.success && summary.error) {
        showToast(summary.error, 'error');
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to fetch sync summary', 'error');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleDownloadOnly = async () => {
    if (!activeConnForSync) return;
    try {
      setIsDownloading(true);
      const windowStart = getWindowStartDate(activeWindowForSync);
      const res = await previewCsv(activeConnForSync.id, windowStart);
      if (!res.success || !res.csvContent) {
        showToast(res.error || 'Failed to generate CSV for download', 'error');
        return;
      }

      const filename = res.fileName || `assortment_${activeConnForSync.vendorId || 'store'}.csv`;

      if (Platform.OS === 'web') {
        const blob = new Blob([res.csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Downloaded ${filename} (${res.recordCount} records)`, 'success');
        setSyncModalOpen(false);
      } else {
        const fileUri = `${documentDirectory}${filename}`;
        await writeAsStringAsync(fileUri, res.csvContent, { encoding: EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Download Assortment CSV',
            UTI: 'public.comma-separated-values-text',
          });
        } else {
          Alert.alert('Download Complete', `File saved as ${filename}`);
        }
        showToast(`Downloaded ${filename} (${res.recordCount} records)`, 'success');
        setSyncModalOpen(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Download failed', 'error');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendToTalabat = async () => {
    if (!activeConnForSync) return;
    try {
      setIsSyncing(true);
      const windowStart = getWindowStartDate(activeWindowForSync);
      const res = await triggerSync(activeConnForSync.id, windowStart);
      if (res.success) {
        showToast(res.message || 'Catalog uploaded and verified with Talabat SFTP.', 'success');
        setSyncModalOpen(false);
      } else {
        showToast(res.error || 'SFTP transmission failed', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Sync failed', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePreviewCsvForCard = async (conn: AggregatorConnection) => {
    try {
      setLoadingPreviewCardId(conn.id);
      const window = selectedTimeWindows[conn.id] || 'all';
      const windowStart = getWindowStartDate(window);
      const res = await previewCsv(conn.id, windowStart);
      if (!res.success || !res.csvContent) {
        showToast(res.error || 'Failed to generate CSV preview', 'error');
        return;
      }

      const filename = res.fileName || `assortment_${conn.vendorId || 'store'}.csv`;

      if (Platform.OS === 'web') {
        const blob = new Blob([res.csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Downloaded ${filename} (${res.recordCount} items)`, 'success');
      } else {
        const fileUri = `${documentDirectory}${filename}`;
        await writeAsStringAsync(fileUri, res.csvContent, { encoding: EncodingType.UTF8 });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Preview Assortment CSV',
            UTI: 'public.comma-separated-values-text',
          });
        } else {
          Alert.alert('CSV Ready', `File saved as ${filename}`);
        }
        showToast(`Preview ready: ${filename} (${res.recordCount} items)`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Preview CSV failed', 'error');
    } finally {
      setLoadingPreviewCardId(null);
    }
  };

  const handleOpenHistoryModal = async (conn: AggregatorConnection) => {
    setActiveConnForHistory(conn);
    setConnLogs([]);
    setHistoryModalOpen(true);
    setIsLoadingLogs(true);
    try {
      const logs = await fetchLogs(conn.id);
      setConnLogs(logs);
    } catch (e: any) {
      showToast(e.message || 'Failed to fetch audit logs', 'error');
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleDeleteSingleLog = (logId: string) => {
    const doDelete = async () => {
      try {
        setIsDeletingLogId(logId);
        const res = await deleteLog(logId);
        if (res.success) {
          setConnLogs((prev) => prev.filter((l) => l.id !== logId));
          showToast('Audit log entry deleted', 'success');
        } else {
          showToast(res.error || 'Failed to delete log', 'error');
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to delete log', 'error');
      } finally {
        setIsDeletingLogId(null);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this audit log entry permanently?')) {
        doDelete();
      }
    } else {
      Alert.alert('Confirm Delete', 'Delete this audit log entry permanently?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleClearAllLogsForConn = () => {
    if (!activeConnForHistory) return;
    const doClear = async () => {
      try {
        setIsClearingAllLogs(true);
        const res = await deleteAllLogsForConnection(activeConnForHistory.id);
        if (res.success) {
          setConnLogs([]);
          showToast('All audit logs cleared for this connection', 'success');
        } else {
          showToast(res.error || 'Failed to clear logs', 'error');
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to clear logs', 'error');
      } finally {
        setIsClearingAllLogs(false);
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Clear all ${connLogs.length} audit logs for this connection?`)) {
        doClear();
      }
    } else {
      Alert.alert(
        'Clear All Logs',
        `Clear all ${connLogs.length} audit logs for this connection permanently?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear All', style: 'destructive', onPress: doClear },
        ]
      );
    }
  };

  const handleOpenSettingsModal = (conn: AggregatorConnection) => {
    setActiveConnForSettings(conn);
    setFormFilenamePrefix(conn.filenamePrefix || '');
    setFormRemoteDir(conn.remoteDirectory || 'assortment');
    setFormHost(conn.sftpHost || '');
    setFormPort(String(conn.sftpPort || 22));
    setFormUsername(conn.sftpUsername || '');
    setFormPassword('');
    setFormPriceFormat(conn.priceFormat || 'price_discounted');
    setSettingsModalOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!activeConnForSettings) return;
    try {
      setIsSavingSettings(true);
      const payload: ConnectionSettingsPayload = {
        filenamePrefix: formFilenamePrefix.trim(),
        remoteDirectory: formRemoteDir.trim().replace(/^\/+|\/+$/g, '').toLowerCase() || 'assortment',
        sftpHost: formHost.trim(),
        sftpPort: parseInt(formPort, 10) || 22,
        sftpUsername: formUsername.trim(),
        priceFormat: formPriceFormat,
      };
      if (formPassword.trim()) {
        payload.sftpPassword = formPassword.trim();
      }

      const res = await updateConnectionSettings(activeConnForSettings.id, payload);
      if (res.success) {
        showToast('Connection settings saved successfully', 'success');
        setSettingsModalOpen(false);
      } else {
        showToast(res.error || 'Failed to save settings', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <View style={styles.flex1}>
      <AppHeader roleLabel="HO" branch={branch} />
      <ScreenHeader title="Aggregator Sync" subtitle="Food delivery & SFTP integrations" onBack={onBack} />
      <ScreenBody>
        {/* Central SFTP Server Overview Banner */}
        <Card style={styles.summaryCard}>
          <View style={styles.summaryIconWrapper}>
            <Server size={18} color="#0f172a" />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.summaryTitle}>Talabat Central SFTP Engine</Text>
            <Text style={styles.summarySub}>
              Multi-store catalog & stock synchronization with automated rate-limit safeguards.
            </Text>
          </View>
          <TouchableOpacity onPress={refreshAll} style={styles.refreshBtn} activeOpacity={0.7}>
            <RefreshCw size={15} color="#15803d" />
          </TouchableOpacity>
        </Card>

        {/* Real Store Connection Cards Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Talabat Store Connections</Text>
          {loading && <ActivityIndicator size="small" color="#16a34a" />}
        </View>

        <View style={styles.listContainer}>
          {connections.map((conn) => {
            const branchMatch = branches.find((b) => b.id === conn.branchId);
            const branchDisplayName = conn.branchName || branchMatch?.name || 'Main Branch';
            const nextSync = calculateNextSyncTime(conn);

            return (
              <Card key={conn.id} style={styles.connCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.connHeaderLeft}>
                    <View style={styles.connIconBadge}>
                      <Text style={styles.connIconBadgeText}>
                        {(conn.aggregatorName || 'TA').substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.connTitle}>
                        {(conn.aggregatorName || 'Talabat').toUpperCase()} SFTP
                      </Text>
                      <View style={styles.branchSubRow}>
                        <Building size={12} color="#16a34a" style={{ marginRight: 4 }} />
                        <Text style={styles.branchSubText}>{branchDisplayName}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.cardHeaderRightActions}>
                    <TouchableOpacity
                      onPress={() => handleOpenHistoryModal(conn)}
                      style={styles.cardHeaderIconBtn}
                      activeOpacity={0.7}
                      accessibilityLabel="Audit Logs"
                    >
                      <History size={15} color="#475569" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleOpenSettingsModal(conn)}
                      style={styles.cardHeaderIconBtn}
                      activeOpacity={0.7}
                      accessibilityLabel="SFTP Settings"
                    >
                      <Settings size={15} color="#475569" />
                    </TouchableOpacity>

                    <Badge variant={conn.isActive ? 'success' : 'warn'}>
                      {conn.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </View>
                </View>

                {/* Connection Metadata Grid */}
                <View style={styles.connMetaContainer}>
                  <View style={styles.connMetaRow}>
                    <Text style={styles.connMetaLabel}>Vendor ID:</Text>
                    <Text style={styles.connMetaValueMono}>{conn.vendorId || conn.storeVendorId || '—'}</Text>
                  </View>

                  <View style={styles.connMetaRow}>
                    <Text style={styles.connMetaLabel}>Sync Schedule:</Text>
                    <Text style={styles.connMetaValue}>
                      {conn.syncFrequency ? conn.syncFrequency.toUpperCase() : 'MANUAL'}
                    </Text>
                  </View>

                  <View style={styles.connMetaRow}>
                    <Text style={styles.connMetaLabel}>Next Scheduled:</Text>
                    <Text style={styles.connMetaNextSync}>{nextSync}</Text>
                  </View>

                  {conn.lastScheduledSyncAt && (
                    <View style={styles.connMetaRow}>
                      <Text style={styles.connMetaLabel}>Last Synced:</Text>
                      <Text style={styles.connMetaValueSmall}>
                        {new Date(conn.lastScheduledSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Time Window Filter Selector */}
                <View style={styles.timeWindowContainer}>
                  <View style={styles.timeWindowHeaderRow}>
                    <Clock size={11} color="#64748b" style={{ marginRight: 4 }} />
                    <Text style={styles.timeWindowLabel}>Filter Time Window:</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.timeWindowScroll}
                    contentContainerStyle={styles.timeWindowScrollContent}
                  >
                    {TIME_WINDOW_OPTIONS.map((opt) => {
                      const isSelected = (selectedTimeWindows[conn.id] || 'all') === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.timeWindowPill, isSelected && styles.timeWindowPillActive]}
                          onPress={() => setSelectedTimeWindows((prev) => ({ ...prev, [conn.id]: opt.id }))}
                          activeOpacity={0.7}
                        >
                          <Text style={[styles.timeWindowPillText, isSelected && styles.timeWindowPillTextActive]}>
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Card Action & Footer */}
                <View style={styles.connCardActionRow}>
                  <View style={styles.footerStatusRow}>
                    <Lock size={12} color="#64748b" style={{ marginRight: 4 }} />
                    <Text style={styles.footerStatusText}>
                      {conn.isPaused
                        ? 'Automation Paused'
                        : conn.syncFrequency === 'manual'
                        ? 'Manual Sync Only'
                        : 'Auto-Sync Active'}
                    </Text>
                  </View>

                  <View style={styles.cardButtonsRow}>
                    <Button
                      variant="secondary"
                      style={styles.previewCsvBtn}
                      onClick={() => handlePreviewCsvForCard(conn)}
                      disabled={loadingPreviewCardId === conn.id}
                    >
                      <FileSpreadsheet size={12} color="#475569" style={{ marginRight: 4 }} />
                      {loadingPreviewCardId === conn.id ? 'Generating...' : 'Preview CSV'}
                    </Button>

                    <Button
                      variant="primary"
                      style={styles.syncNowBtn}
                      onClick={() => handleOpenSyncModal(conn)}
                      disabled={!conn.isActive}
                    >
                      <UploadCloud size={12} color="#0f172a" style={{ marginRight: 4 }} />
                      Sync Now
                    </Button>
                  </View>
                </View>
              </Card>
            );
          })}

          {!loading && connections.length === 0 && (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No SFTP Connections Configured</Text>
              <Text style={styles.emptySub}>
                Store connections configured in Head Office will appear here automatically.
              </Text>
            </Card>
          )}
        </View>

        {/* Channel Orders Mock Section (Preserved) */}
        <Text style={styles.sectionTitle}>Incoming Orders</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.channelsScroll}
          contentContainerStyle={styles.channelsScrollContent}
        >
          {CHANNELS.map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setChannel(c)}
              style={[styles.channelPill, channel === c ? styles.channelPillActive : styles.channelPillInactive]}
              activeOpacity={0.8}
            >
              <View style={styles.pillRow}>
                <Text
                  style={[
                    styles.channelPillText,
                    channel === c ? styles.channelPillTextActive : styles.channelPillTextInactive,
                  ]}
                >
                  {c}
                </Text>
                {c === 'Talabat' && <View style={styles.greenIndicatorDot} />}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.listContainer}>
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No Delivery Orders in Queue</Text>
            <Text style={styles.emptySub}>
              Live aggregator order ingestion (push webhooks / order polling API) is not connected yet. Real-time delivery orders will appear here once an active ingestion channel is configured.
            </Text>
            <View style={{ marginTop: 10, alignItems: 'flex-start' }}>
              <Badge variant="warn">Order Ingestion Disconnected</Badge>
            </View>
          </Card>
        </View>
      </ScreenBody>

      {/* Confirmation & Sync Now Modal */}
      <Sheet
        open={syncModalOpen}
        onClose={() => setSyncModalOpen(false)}
        title="Confirm Aggregator Sync"
        footer={
          <View style={styles.modalFooterBtnCol}>
            <Button
              variant="primary"
              style={{ width: '100%' }}
              onClick={handleSendToTalabat}
              disabled={isSyncing || isLoadingSummary}
            >
              <UploadCloud size={15} color="#0f172a" style={{ marginRight: 6 }} />
              {isSyncing ? 'Uploading to Talabat...' : 'Send to Talabat SFTP'}
            </Button>
            <Button
              variant="secondary"
              style={{ width: '100%' }}
              onClick={handleDownloadOnly}
              disabled={isDownloading || isLoadingSummary}
            >
              <Download size={15} color="#475569" style={{ marginRight: 6 }} />
              {isDownloading ? 'Downloading...' : 'Download CSV Only'}
            </Button>
            <Button
              variant="secondary"
              style={{ width: '100%', borderColor: '#cbd5e1' }}
              onClick={() => setSyncModalOpen(false)}
              disabled={isSyncing}
            >
              Cancel
            </Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          {isLoadingSummary ? (
            <View style={styles.loadingSummaryBox}>
              <ActivityIndicator size="small" color="#16a34a" />
              <Text style={styles.loadingSummaryText}>Calculating catalog sync payload...</Text>
            </View>
          ) : syncSummary ? (
            <>
              <View style={styles.storeSummaryBanner}>
                <Building size={16} color="#16a34a" style={{ marginRight: 6 }} />
                <Text style={styles.storeSummaryTitle}>
                  {activeConnForSync?.branchName || syncSummary.branchName || 'Selected Store'}
                </Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.halfCol}>
                  <StatCard
                    label="Record Count"
                    value={`${syncSummary.recordCount.toLocaleString()} items`}
                    icon={<FileSpreadsheet size={16} color="#0284c7" />}
                    accent="sky"
                  />
                </View>
                <View style={styles.halfCol}>
                  <StatCard
                    label="Est. File Size"
                    value={`~${(syncSummary.estimatedSizeBytes / 1024).toFixed(1)} KB`}
                    icon={<Clock size={16} color="#16a34a" />}
                    accent="brand"
                  />
                </View>
              </View>

              <View style={styles.payloadDetailsBox}>
                <View style={styles.payloadDetailRow}>
                  <Text style={styles.payloadDetailLabel}>Time Window:</Text>
                  <View style={styles.windowBadge}>
                    <Clock size={11} color="#15803d" style={{ marginRight: 4 }} />
                    <Text style={styles.windowBadgeText}>
                      {TIME_WINDOW_OPTIONS.find((o) => o.id === activeWindowForSync)?.dialogBadge || 'Current / All (Full Catalog)'}
                    </Text>
                  </View>
                </View>
                <View style={styles.payloadDetailRow}>
                  <Text style={styles.payloadDetailLabel}>File Name:</Text>
                  <Text style={styles.payloadDetailValMono}>{syncSummary.fileName}</Text>
                </View>
                <View style={styles.payloadDetailRow}>
                  <Text style={styles.payloadDetailLabel}>Remote Path:</Text>
                  <Text style={styles.payloadDetailValMono}>{syncSummary.remotePath}</Text>
                </View>
              </View>

              <View style={styles.safeguardNotice}>
                <AlertCircle size={14} color="#0284c7" style={{ marginRight: 6, marginTop: 1 }} />
                <Text style={styles.safeguardNoticeText}>
                  5-minute minimum rate-limit cooldown applies. Live SFTP upload verifies file presence in the remote directory before reporting completion.
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.emptyOrdersText}>Unable to load sync summary.</Text>
          )}
        </View>
      </Sheet>

      {/* Sync Audit Trail Sheet */}
      <Sheet
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title="Sync Audit Trail"
        footer={
          <View style={styles.modalFooterBtnCol}>
            {connLogs.length > 0 && (
              <Button
                variant="danger"
                style={{ width: '100%' }}
                onClick={handleClearAllLogsForConn}
                disabled={isClearingAllLogs}
              >
                <Trash2 size={14} color="#ffffff" style={{ marginRight: 6 }} />
                {isClearingAllLogs ? 'Clearing Logs...' : 'Clear All Audit Logs'}
              </Button>
            )}
            <Button
              variant="secondary"
              style={{ width: '100%', borderColor: '#cbd5e1' }}
              onClick={() => setHistoryModalOpen(false)}
            >
              Close
            </Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          {activeConnForHistory && (
            <View style={styles.storeSummaryBanner}>
              <Building size={16} color="#16a34a" style={{ marginRight: 6 }} />
              <Text style={styles.storeSummaryTitle}>
                {activeConnForHistory.branchName || 'Store'} — {connLogs.length} Records
              </Text>
            </View>
          )}

          {isLoadingLogs ? (
            <View style={styles.loadingSummaryBox}>
              <ActivityIndicator size="small" color="#16a34a" />
              <Text style={styles.loadingSummaryText}>Loading audit logs...</Text>
            </View>
          ) : connLogs.length === 0 ? (
            <View style={styles.emptyLogsBox}>
              <History size={24} color="#94a3b8" />
              <Text style={styles.emptyLogsTitle}>No Sync History Found</Text>
              <Text style={styles.emptyLogsSub}>
                Audit logs will appear here whenever a manual or scheduled SFTP transmission runs.
              </Text>
            </View>
          ) : (
            <View style={styles.logsListContainer}>
              {connLogs.map((log) => {
                const isSuccess = log.status === 'success';
                const isPreview = log.status === 'preview_only';
                const isDeleting = isDeletingLogId === log.id;

                return (
                  <View key={log.id} style={styles.logCard}>
                    <View style={styles.logCardHeader}>
                      <View style={styles.logCardStatusRow}>
                        <Badge variant={isSuccess ? 'success' : isPreview ? 'neutral' : 'destructive'}>
                          {log.status.toUpperCase()}
                        </Badge>
                        <Text style={styles.logSyncType}>
                          {log.syncType ? log.syncType.toUpperCase() : 'MANUAL'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleDeleteSingleLog(log.id)}
                        disabled={isDeleting}
                        style={styles.logDeleteBtn}
                        activeOpacity={0.7}
                      >
                        {isDeleting ? (
                          <ActivityIndicator size="small" color="#ef4444" />
                        ) : (
                          <Trash2 size={14} color="#ef4444" />
                        )}
                      </TouchableOpacity>
                    </View>

                    <View style={styles.logCardBody}>
                      <View style={styles.logDetailRow}>
                        <Text style={styles.logDetailLabel}>File:</Text>
                        <Text style={styles.logDetailValMono}>{log.fileName}</Text>
                      </View>
                      <View style={styles.logDetailRow}>
                        <Text style={styles.logDetailLabel}>Records:</Text>
                        <Text style={styles.logDetailVal}>{log.rowCount} items</Text>
                      </View>
                      <View style={styles.logDetailRow}>
                        <Text style={styles.logDetailLabel}>Time:</Text>
                        <Text style={styles.logDetailVal}>
                          {new Date(log.createdAt).toLocaleString()}
                        </Text>
                      </View>
                    </View>

                    {log.errorMessage && (
                      <View style={styles.logErrorBox}>
                        <AlertCircle size={12} color="#dc2626" style={{ marginRight: 4, marginTop: 1 }} />
                        <Text style={styles.logErrorText}>{log.errorMessage}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </Sheet>

      {/* Connection Settings Sheet */}
      <Sheet
        open={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        title="SFTP Connection Settings"
        footer={
          <View style={styles.modalFooterBtnCol}>
            <Button
              variant="primary"
              style={{ width: '100%' }}
              onClick={handleSaveSettings}
              disabled={isSavingSettings}
            >
              {isSavingSettings ? 'Saving Settings...' : 'Save Settings'}
            </Button>
            <Button
              variant="secondary"
              style={{ width: '100%', borderColor: '#cbd5e1' }}
              onClick={() => setSettingsModalOpen(false)}
              disabled={isSavingSettings}
            >
              Cancel
            </Button>
          </View>
        }
      >
        <View style={styles.modalForm}>
          {activeConnForSettings && (
            <View style={styles.storeSummaryBanner}>
              <Building size={16} color="#16a34a" style={{ marginRight: 6 }} />
              <Text style={styles.storeSummaryTitle}>
                {activeConnForSettings.branchName || 'Store'} Settings
              </Text>
            </View>
          )}

          <Input
            label="Filename Prefix"
            value={formFilenamePrefix}
            onChange={setFormFilenamePrefix}
            placeholder="e.g. danah, khaldiya, nahyan"
          />

          <Input
            label="Remote Directory"
            value={formRemoteDir}
            onChange={setFormRemoteDir}
            placeholder="e.g. assortment"
          />

          <Input
            label="SFTP Host"
            value={formHost}
            onChange={setFormHost}
            placeholder="e.g. sftp.talabat.com"
          />

          <Input
            label="SFTP Port"
            value={formPort}
            onChange={setFormPort}
            placeholder="22"
            type="numeric"
          />

          <Input
            label="SFTP Username / Vendor ID"
            value={formUsername}
            onChange={setFormUsername}
            placeholder="e.g. 776282"
          />

          <Input
            label="SFTP Password (leave empty to keep existing)"
            value={formPassword}
            onChange={setFormPassword}
            placeholder="••••••••"
            type="password"
          />

          <Field label="Price Format">
            <View style={styles.priceFormatRow}>
              {[
                { id: 'price_discounted', label: 'Price & Discount' },
                { id: 'original_discounted', label: 'Original & Discount' },
                { id: 'original_price', label: 'Original Price' },
              ].map((fmt) => {
                const isSelected = formPriceFormat === fmt.id;
                return (
                  <TouchableOpacity
                    key={fmt.id}
                    style={[styles.formatOptionPill, isSelected && styles.formatOptionPillActive]}
                    onPress={() => setFormPriceFormat(fmt.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.formatOptionText, isSelected && styles.formatOptionTextActive]}>
                      {fmt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>
        </View>
      </Sheet>

      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
    </View>
  );
}

export function AggregatorScreen(props: { onBack: () => void }) {
  return (
    <AggregatorProvider>
      <AggregatorScreenContent {...props} />
    </AggregatorProvider>
  );
}

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  summaryCard: {
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  summaryIconWrapper: {
    height: 36,
    width: 36,
    borderRadius: 10,
    backgroundColor: '#39ff14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  summarySub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 14,
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#dcfce7',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#475569',
    textTransform: 'uppercase',
  },
  listContainer: {
    gap: 10,
  },
  connCard: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  connHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  connIconBadge: {
    height: 34,
    width: 34,
    borderRadius: 8,
    backgroundColor: '#39ff14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connIconBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0f172a',
  },
  connTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  branchSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  branchSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
  connMetaContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  connMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  connMetaLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  connMetaValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  connMetaValueMono: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#0f172a',
  },
  connMetaNextSync: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  connMetaValueSmall: {
    fontSize: 10,
    color: '#64748b',
  },
  connCardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  timeWindowContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  timeWindowHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeWindowLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  timeWindowScroll: {
    marginBottom: 4,
  },
  timeWindowScrollContent: {
    gap: 6,
  },
  timeWindowPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  timeWindowPillActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  timeWindowPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  timeWindowPillTextActive: {
    color: '#15803d',
    fontWeight: '700',
  },
  cardButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewCsvBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  syncNowBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  windowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  windowBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  channelsScroll: {
    marginBottom: 12,
    marginTop: 10,
  },
  channelsScrollContent: {
    gap: 6,
  },
  channelPill: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  channelPillActive: {
    backgroundColor: '#39ff14',
  },
  channelPillInactive: {
    backgroundColor: '#f1f5f9',
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  channelPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  channelPillTextActive: {
    color: '#0f172a',
  },
  channelPillTextInactive: {
    color: '#475569',
  },
  greenIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
    marginLeft: 6,
  },
  emptyOrdersText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  productMeta: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  productPriceCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalForm: {
    gap: 12,
    paddingVertical: 8,
  },
  loadingSummaryBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingSummaryText: {
    fontSize: 12,
    color: '#64748b',
  },
  storeSummaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  storeSummaryTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  halfCol: {
    width: '50%',
    padding: 4,
  },
  payloadDetailsBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  payloadDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  payloadDetailLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  payloadDetailValMono: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#0f172a',
  },
  safeguardNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  safeguardNoticeText: {
    flex: 1,
    fontSize: 10,
    color: '#0369a1',
    lineHeight: 14,
  },
  modalFooterBtnCol: {
    gap: 8,
    width: '100%',
  },
  cardHeaderRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardHeaderIconBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyLogsBox: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyLogsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  emptyLogsSub: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 16,
  },
  logsListContainer: {
    gap: 10,
    paddingBottom: 8,
  },
  logCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logCardStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logSyncType: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  logDeleteBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logCardBody: {
    gap: 4,
  },
  logDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logDetailLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  logDetailValMono: {
    fontSize: 11,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#0f172a',
  },
  logDetailVal: {
    fontSize: 11,
    color: '#0f172a',
    fontWeight: '600',
  },
  logErrorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  logErrorText: {
    flex: 1,
    fontSize: 10,
    color: '#b91c1c',
    lineHeight: 14,
  },
  priceFormatRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  formatOptionPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  formatOptionPillActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  formatOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  formatOptionTextActive: {
    color: '#15803d',
    fontWeight: '700',
  },
});
