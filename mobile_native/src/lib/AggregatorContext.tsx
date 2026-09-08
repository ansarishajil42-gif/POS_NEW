import React, { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { apiClient } from './apiClient';

export interface AggregatorConnection {
  id: string;
  tenantId?: string;
  branchId: string;
  branchName?: string;
  aggregatorName: string; // e.g. "talabat"
  sftpHost: string;
  sftpPort: number;
  sftpUsername: string;
  sftpPassword?: string;
  remoteDirectory: string;
  vendorId: string;
  storeVendorId?: string;
  filenamePrefix?: string;
  priceFormat: string;
  syncFrequency: string;
  isPaused: boolean;
  consecutiveFailures: number;
  lastScheduledSyncAt?: string;
  hasPendingChanges?: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AggregatorBranch {
  id: string;
  name: string;
  address?: string;
  status: string;
}

export interface SyncSummaryResult {
  success: boolean;
  fileName: string;
  remotePath: string;
  branchName?: string;
  recordCount: number;
  estimatedSizeBytes: number;
  timeWindow?: string | null;
  error?: string;
}

export interface SyncExecutionResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface PreviewCsvResult {
  success: boolean;
  fileName: string;
  remotePath: string;
  recordCount: number;
  fileSizeBytes: number;
  csvContent: string;
  timeWindow?: string | null;
  warning?: string;
  error?: string;
}

export interface SyncLogItem {
  id: string;
  aggregatorConnectionId: string;
  syncType: string;
  status: string;
  fileName: string;
  rowCount: number;
  errorMessage?: string | null;
  createdAt: string;
}

export interface ConnectionSettingsPayload {
  filenamePrefix?: string;
  remoteDirectory?: string;
  sftpHost?: string;
  sftpPort?: number;
  sftpUsername?: string;
  sftpPassword?: string;
  priceFormat?: string;
}

interface AggregatorContextProps {
  connections: AggregatorConnection[];
  branches: AggregatorBranch[];
  loading: boolean;
  error: string | null;
  fetchConnections: () => Promise<void>;
  fetchBranches: () => Promise<void>;
  refreshAll: () => Promise<void>;
  getSyncSummary: (connectionId: string, windowStart?: string | null) => Promise<SyncSummaryResult>;
  triggerSync: (connectionId: string, windowStart?: string | null) => Promise<SyncExecutionResult>;
  previewCsv: (connectionId: string, windowStart?: string | null) => Promise<PreviewCsvResult>;
  fetchLogs: (connectionId: string) => Promise<SyncLogItem[]>;
  deleteLog: (logId: string) => Promise<{ success: boolean; error?: string }>;
  deleteAllLogsForConnection: (connectionId: string) => Promise<{ success: boolean; error?: string }>;
  updateConnectionSettings: (connectionId: string, settings: ConnectionSettingsPayload) => Promise<{ success: boolean; connection?: any; error?: string }>;
}

const AggregatorContext = createContext<AggregatorContextProps | null>(null);

export function AggregatorProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<AggregatorConnection[]>([]);
  const [branches, setBranches] = useState<AggregatorBranch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBranches = async () => {
    try {
      const res = (await apiClient.get('/aggregator-sftp/branches')) as any;
      if (res?.success && Array.isArray(res.branches)) {
        setBranches(res.branches);
      }
    } catch (e: any) {
      console.warn('fetchBranches error:', e);
    }
  };

  const fetchConnections = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = (await apiClient.get('/aggregator-sftp/connections')) as any;
      if (res?.success && Array.isArray(res.connections)) {
        setConnections(res.connections);
      }
    } catch (e: any) {
      console.warn('fetchConnections error:', e);
      setError(e.message || 'Failed to load connections');
    } finally {
      setLoading(false);
    }
  };

  const getSyncSummary = async (connectionId: string, windowStart?: string | null): Promise<SyncSummaryResult> => {
    try {
      const url = windowStart
        ? `/aggregator-sftp/summary/${connectionId}?windowStart=${encodeURIComponent(windowStart)}`
        : `/aggregator-sftp/summary/${connectionId}`;
      const res = (await apiClient.get(url)) as SyncSummaryResult;
      return res;
    } catch (e: any) {
      return {
        success: false,
        fileName: '',
        remotePath: '',
        recordCount: 0,
        estimatedSizeBytes: 0,
        error: e.message || 'Failed to fetch sync summary',
      };
    }
  };

  const triggerSync = async (connectionId: string, windowStart?: string | null): Promise<SyncExecutionResult> => {
    try {
      const payload = windowStart ? { windowStart } : {};
      const res = (await apiClient.post(`/aggregator-sftp/sync/${connectionId}`, payload)) as SyncExecutionResult;
      await fetchConnections();
      return res;
    } catch (e: any) {
      await fetchConnections();
      return {
        success: false,
        error: e.message || 'Sync failed',
      };
    }
  };

  const previewCsv = async (connectionId: string, windowStart?: string | null): Promise<PreviewCsvResult> => {
    try {
      const url = windowStart
        ? `/aggregator-sftp/preview-csv/${connectionId}?windowStart=${encodeURIComponent(windowStart)}`
        : `/aggregator-sftp/preview-csv/${connectionId}`;
      const res = (await apiClient.get(url)) as PreviewCsvResult;
      return res;
    } catch (e: any) {
      return {
        success: false,
        fileName: '',
        remotePath: '',
        recordCount: 0,
        fileSizeBytes: 0,
        csvContent: '',
        error: e.message || 'Failed to preview CSV',
      };
    }
  };

  const fetchLogs = async (connectionId: string): Promise<SyncLogItem[]> => {
    try {
      const res = (await apiClient.get(`/aggregator-sftp/logs/${connectionId}`)) as any;
      if (res?.success && Array.isArray(res.logs)) {
        return res.logs;
      }
      return [];
    } catch (e: any) {
      console.warn('fetchLogs error:', e);
      return [];
    }
  };

  const deleteLog = async (logId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = (await apiClient.delete(`/aggregator-sftp/logs/${logId}`)) as any;
      return { success: Boolean(res?.success) };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to delete log' };
    }
  };

  const deleteAllLogsForConnection = async (connectionId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = (await apiClient.delete(`/aggregator-sftp/logs/connection/${connectionId}`)) as any;
      return { success: Boolean(res?.success) };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to clear logs' };
    }
  };

  const updateConnectionSettings = async (
    connectionId: string,
    settings: ConnectionSettingsPayload
  ): Promise<{ success: boolean; connection?: any; error?: string }> => {
    try {
      const payload = {
        id: connectionId,
        ...settings,
      };
      const res = (await apiClient.post('/aggregator-sftp/connections', payload)) as any;
      await fetchConnections();
      if (res?.success) {
        return { success: true, connection: res.connection };
      }
      return { success: false, error: res?.error || 'Failed to update connection settings' };
    } catch (e: any) {
      await fetchConnections();
      return { success: false, error: e.message || 'Failed to update connection settings' };
    }
  };

  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchConnections(), fetchBranches()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const value = useMemo(
    () => ({
      connections,
      branches,
      loading,
      error,
      fetchConnections,
      fetchBranches,
      refreshAll,
      getSyncSummary,
      triggerSync,
      previewCsv,
      fetchLogs,
      deleteLog,
      deleteAllLogsForConnection,
      updateConnectionSettings,
    }),
    [connections, branches, loading, error]
  );

  return <AggregatorContext.Provider value={value}>{children}</AggregatorContext.Provider>;
}

export function useAggregator() {
  const context = useContext(AggregatorContext);
  if (!context) {
    throw new Error('useAggregator must be used within an AggregatorProvider');
  }
  return context;
}
