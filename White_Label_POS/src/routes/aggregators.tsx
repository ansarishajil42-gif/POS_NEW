import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getSessionServerFn, roleRoutes, type Role } from "@/lib/auth";
import {
  Eye,
  EyeOff,
  Link2,
  RefreshCw,
  Rocket,
  Server,
  FileText,
  UploadCloud,
  CheckCircle2,
  Settings,
  Plus,
  Lock,
  Trash2,
  Info,
  PauseCircle,
  PlayCircle,
  Clock,
  Building,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Download,
  Loader2,
} from "lucide-react";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  getAggregatorConnectionsServerFn,
  getAggregatorBranchesServerFn,
  saveAggregatorConnectionServerFn,
  togglePauseAutomationServerFn,
  deleteAggregatorConnectionServerFn,
  getSyncSummaryServerFn,
  previewAggregatorCsvServerFn,
  triggerAggregatorSyncServerFn,
  getAggregatorSyncLogsServerFn,
  deleteAggregatorSyncLogServerFn,
  deleteAllAggregatorSyncLogsServerFn,
  type ConnectionConfig,
} from "@/lib/aggregator-sftp";

export const Route = createFileRoute("/aggregators")({
  beforeLoad: async () => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session) throw redirect({ to: "/login" });
    const role = res.session.role as Role;
    if (!["Head Office Admin", "Branch Manager", "Inventory Manager", "Purchasing Officer"].includes(role)) {
      throw redirect({ to: roleRoutes[role] });
    }
  },
  head: () => ({
    meta: [
      { title: "Aggregator & SFTP Sync Engine — cloudynationpos" },
      {
        name: "description",
        content:
          "Multi-Branch Aggregator SFTP Sync Engine with background automation scheduler.",
      },
      { property: "og:title", content: "cloudynationpos Aggregator & SFTP Sync Engine" },
      { property: "og:description", content: "Multi-branch SFTP engine and background scheduler." },
    ],
  }),
  component: Aggregators,
});

function Aggregators() {
  // SFTP State
  const [connections, setConnections] = useState<ConnectionConfig[]>([]);
  const [realBranches, setRealBranches] = useState<{ id: string; name: string; address?: string }[]>([]);
  const [selectedConnId, setSelectedConnId] = useState<string>("");
  const [sftpLogs, setSftpLogs] = useState<any[]>([]);

  // CSV Preview state
  const [csvPreview, setCsvPreview] = useState<{
    fileName: string;
    remotePath: string;
    recordCount: number;
    fileSizeBytes: number;
    csvContent: string;
    warning?: string;
  } | null>(null);

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showSyncConfirmModal, setShowSyncConfirmModal] = useState(false);
  const [syncSummary, setSyncSummary] = useState<{
    fileName: string;
    remotePath: string;
    recordCount: number;
    estimatedSizeBytes: number;
  } | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [timeWindow, setTimeWindow] = useState<"all" | "1h" | "24h" | "7d" | "30d">("all");

  function getWindowStartDate(window: "all" | "1h" | "24h" | "7d" | "30d"): string | null {
    const now = Date.now();
    if (window === "1h") return new Date(now - 60 * 60 * 1000).toISOString();
    if (window === "24h") return new Date(now - 24 * 60 * 60 * 1000).toISOString();
    if (window === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    if (window === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    return null;
  }

  // Audit Log Pagination & Deletion State
  const [logPage, setLogPage] = useState(1);
  const [logPageSize] = useState(10);
  const [logToDelete, setLogToDelete] = useState<any | null>(null);
  const [isDeletingLog, setIsDeletingLog] = useState(false);
  const [showClearAllLogsModal, setShowClearAllLogsModal] = useState(false);

  // Connection modal form state (initializes clean with empty values)
  const [formConn, setFormConn] = useState<ConnectionConfig>({
    aggregatorName: "talabat",
    branchId: "",
    sftpHost: "",
    sftpPort: 22,
    sftpUsername: "",
    sftpPassword: "",
    remoteDirectory: "/Assortment",
    vendorId: "",
    priceFormat: "price_discounted",
    syncFrequency: "manual",
    isPaused: false,
    isActive: false,
  });

  useEffect(() => {
    loadConnections();
    loadRealBranches();
  }, []);

  async function loadRealBranches() {
    try {
      const res = await getAggregatorBranchesServerFn();
      if (res?.success && res.branches) {
        setRealBranches(res.branches);
        if (res.branches.length > 0) {
          setFormConn((prev) => ({
            ...prev,
            branchId: prev.branchId || res.branches[0].id,
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadConnections() {
    try {
      const res = await getAggregatorConnectionsServerFn();
      if (res?.success && res.connections) {
        setConnections(res.connections);
        if (res.connections.length > 0 && !selectedConnId) {
          setSelectedConnId(res.connections[0].id || "");
          loadLogs(res.connections[0].id || "");
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadLogs(connId: string) {
    if (!connId) return;
    try {
      const res = await getAggregatorSyncLogsServerFn({ data: { connectionId: connId } });
      if (res?.success && res.logs) {
        setSftpLogs(res.logs);
        setLogPage(1);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const activeConnection = connections.find((c) => c.id === selectedConnId) || connections[0];

  async function handlePreviewCsv(connId?: string) {
    const targetId = connId || selectedConnId || activeConnection?.id;
    if (!targetId) return;

    setIsLoadingPreview(true);
    try {
      const windowStart = getWindowStartDate(timeWindow);
      const res = await previewAggregatorCsvServerFn({ data: { connectionId: targetId, windowStart } });
      if (res?.success) {
        setCsvPreview(res);
        toast.success("Single File CSV preview generated in-memory", {
          description: `${res.recordCount} products & promotions formatted per spec.`,
        });
        if (res.warning) {
          toast.warning(res.warning);
        }
        loadLogs(targetId);
      } else if (res?.error) {
        toast.error("Failed to generate CSV preview: " + res.error);
      }
    } catch (e: any) {
      toast.error("Failed to generate CSV preview: " + e.message);
    } finally {
      setIsLoadingPreview(false);
    }
  }

  function handleDownloadCsv(fileName: string, content: string) {
    if (!content) return;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName || "assortment.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("CSV file downloaded", { description: fileName });
  }

  async function handleExecuteSync() {
    if (!selectedConnId || !activeConnection) return;
    setIsSyncing(true);

    try {
      const payloadToSend = csvPreview ? {
        fileName: csvPreview.fileName,
        csvContent: csvPreview.csvContent,
        recordCount: csvPreview.recordCount,
      } : undefined;

      const windowStart = getWindowStartDate(timeWindow);
      const res = await triggerAggregatorSyncServerFn({
        data: {
          connectionId: selectedConnId,
          preGeneratedPayload: payloadToSend,
          windowStart,
        },
      });
      if (!res.success) {
        toast.error("Sync Rejected (Protection Active)", {
          description: res.error || "Sync is disabled until this connection is verified and activated.",
        });
        loadLogs(selectedConnId);
      } else {
        toast.success("Manual Sync executed successfully");
        loadLogs(selectedConnId);
      }
    } catch (e: any) {
      toast.error("SFTP Sync error: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  }

  async function handleOpenSyncModal() {
    const targetId = selectedConnId || activeConnection?.id;
    if (!targetId || !activeConnection?.isActive) return;

    setCsvPreview(null);
    const t_client_start = Date.now();
    console.log(`[TIMING CLIENT] (click) 'Sync Now' clicked at ${new Date(t_client_start).toISOString()}, timeWindow: ${timeWindow}`);
    setIsLoadingPreview(true);
    try {
      const windowStart = getWindowStartDate(timeWindow);
      console.log(`[TIMING CLIENT] Dispatching lightweight getSyncSummaryServerFn with windowStart: ${windowStart}`);
      const res = await getSyncSummaryServerFn({ data: { connectionId: targetId, windowStart } });
      const t_client_end = Date.now();
      console.log(`[TIMING CLIENT] (f) Client received sync summary: +${t_client_end - t_client_start}ms total roundtrip!`, res);
      if (res?.success) {
        setSyncSummary({
          fileName: res.fileName,
          remotePath: res.remotePath,
          recordCount: res.recordCount,
          estimatedSizeBytes: res.estimatedSizeBytes,
        });
        setShowSyncConfirmModal(true);
      } else if (res?.error) {
        toast.error("Failed to prepare sync: " + res.error);
      }
    } catch (e: any) {
      console.error(`[TIMING CLIENT] Error after ${Date.now() - t_client_start}ms:`, e);
      toast.error("Failed to prepare sync: " + e.message);
    } finally {
      setIsLoadingPreview(false);
    }
  }

  async function handleSendToTalabatFromModal() {
    setShowSyncConfirmModal(false);
    await handleExecuteSync();
  }

  async function handleDownloadOnlyFromModal() {
    if (csvPreview?.csvContent) {
      handleDownloadCsv(csvPreview.fileName, csvPreview.csvContent);
      setShowSyncConfirmModal(false);
      return;
    }

    const targetId = selectedConnId || activeConnection?.id;
    if (!targetId) return;

    setIsLoadingPreview(true);
    try {
      const windowStart = getWindowStartDate(timeWindow);
      const res = await previewAggregatorCsvServerFn({ data: { connectionId: targetId, windowStart } });
      if (res?.success && res.csvContent) {
        setCsvPreview(res);
        handleDownloadCsv(res.fileName, res.csvContent);
        setShowSyncConfirmModal(false);
      } else {
        toast.error("Failed to download CSV: " + (res?.error || "Unknown error"));
      }
    } catch (e: any) {
      toast.error("Failed to download CSV: " + e.message);
    } finally {
      setIsLoadingPreview(false);
    }
  }

  async function handleSaveConnection(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await saveAggregatorConnectionServerFn({ data: formConn });
      if (res?.success) {
        toast.success("Connection saved successfully.");
        setShowConfigModal(false);
        await loadConnections();
      }
    } catch (e: any) {
      toast.error("Failed to save connection: " + e.message);
    }
  }

  async function handleTogglePause(connId: string, currentPaused: boolean) {
    try {
      const res = await togglePauseAutomationServerFn({ data: { id: connId, isPaused: !currentPaused } });
      if (res?.success) {
        toast.success(`Scheduled automation ${!currentPaused ? "PAUSED" : "RESUMED"}`);
        await loadConnections();
      }
    } catch (e: any) {
      toast.error("Failed to toggle pause status: " + e.message);
    }
  }

  async function handleDeleteConn(connId: string) {
    try {
      await deleteAggregatorConnectionServerFn({ data: { id: connId } });
      toast.success("Connection deleted.");
      await loadConnections();
    } catch (e: any) {
      toast.error("Failed to delete connection: " + e.message);
    }
  }

  async function handleConfirmDeleteLog() {
    if (!logToDelete?.id) return;
    setIsDeletingLog(true);
    try {
      const res = await deleteAggregatorSyncLogServerFn({ data: { logId: logToDelete.id } });
      if (res?.success) {
        toast.success("Audit log record permanently deleted from database.");
        if (selectedConnId) await loadLogs(selectedConnId);
      } else {
        toast.error(res?.error || "Failed to delete log record from database.");
      }
    } catch (e: any) {
      toast.error("Failed to delete log: " + e.message);
    } finally {
      setIsDeletingLog(false);
      setLogToDelete(null);
    }
  }

  async function handleConfirmClearAllLogs() {
    if (!selectedConnId) return;
    setIsDeletingLog(true);
    try {
      const res = await deleteAllAggregatorSyncLogsServerFn({ data: { connectionId: selectedConnId } });
      if (res?.success) {
        toast.success("All audit log records deleted from database.");
        await loadLogs(selectedConnId);
      } else {
        toast.error(res?.error || "Failed to clear logs from database.");
      }
    } catch (e: any) {
      toast.error("Failed to clear logs: " + e.message);
    } finally {
      setIsDeletingLog(false);
      setShowClearAllLogsModal(false);
    }
  }

  async function handleToggleActive(conn: ConnectionConfig) {
    try {
      const updatedConn = { ...conn, isActive: !conn.isActive };
      const res = await saveAggregatorConnectionServerFn({ data: updatedConn });
      if (res?.success) {
        toast.success(`Connection ${!conn.isActive ? "ACTIVATED" : "DEACTIVATED"}`);
        await loadConnections();
      }
    } catch (e: any) {
      toast.error("Failed to toggle active status: " + e.message);
    }
  }

  function calculateNextSyncTime(conn: ConnectionConfig): string {
    if (!conn.isActive) return "Connection Inactive";
    if (conn.isPaused) return "Automation Paused";

    const lastTime = conn.lastScheduledSyncAt ? new Date(conn.lastScheduledSyncAt).getTime() : 0;
    const now = Date.now();
    const rateLimitMs = 5 * 60 * 1000;

    if (conn.hasPendingChanges) {
      if (now - lastTime >= rateLimitMs) {
        return "Sync Due (Next Interval)";
      }
      const eligibleDate = new Date(lastTime + rateLimitMs);
      return `Queued: ${eligibleDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    if (conn.syncFrequency === "hourly") {
      const nextDate = new Date((lastTime || now) + 60 * 60 * 1000);
      return nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (conn.syncFrequency === "daily") {
      const nextDate = new Date((lastTime || now) + 24 * 60 * 60 * 1000);
      return nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    return "Up to date (Auto on sale)";
  }

  return (
    <DemoShell
      title="Aggregator & SFTP Sync Engine"
      subtitle="Phase 3 multi-branch SFTP engine with background automation scheduler."
      actions={
        <div className="flex flex-wrap sm:flex-nowrap gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            className="rounded-xl font-semibold border-primary/30 text-primary hover:bg-primary/5 flex-1 sm:flex-initial text-xs sm:text-sm"
            onClick={() => {
              setFormConn({
                aggregatorName: "talabat",
                branchId: realBranches[0]?.id || "",
                sftpHost: "",
                sftpPort: 22,
                sftpUsername: "",
                sftpPassword: "",
                remoteDirectory: "/Assortment",
                vendorId: "",
                priceFormat: "price_discounted",
                syncFrequency: "manual",
                isPaused: false,
                isActive: false,
              });
              setShowConfigModal(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4 shrink-0" /> Add SFTP Connection
          </Button>
          <div className="flex-1 sm:flex-initial" title="Live channel API publishing is disconnected. Assortment & promo sync is managed via Central SFTP Server tab.">
            <Button
              className="rounded-xl font-semibold opacity-50 cursor-not-allowed w-full sm:w-auto text-xs sm:text-sm"
              disabled
            >
              <Rocket className="mr-1.5 h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Publish to channels (API Disconnected)</span>
              <span className="sm:hidden">Publish (Disconnected)</span>
            </Button>
          </div>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Live orders in queue" value="0" delta="Ingestion pending" icon={RefreshCw} />
        <StatCard label="Channels connected" value="1 (Talabat SFTP)" delta="SFTP Active" icon={Link2} tone="success" />
        <StatCard label="SFTP Engine" value="Multi-Branch & Automation" delta="Safe Background Scheduler" icon={Server} tone="accent" />
        <StatCard label="Database Sync Status" value="Active" icon={CheckCircle2} tone="accent" />
      </div>

      <Tabs defaultValue="sftp" className="mt-8">
        <TabsList className="rounded-xl w-full sm:w-auto justify-start overflow-x-auto flex flex-nowrap p-1 max-w-full">
          <TabsTrigger value="sftp" className="font-semibold text-primary shrink-0 text-xs sm:text-sm">
            Central SFTP Server
          </TabsTrigger>
          <TabsTrigger value="queue" className="shrink-0 text-xs sm:text-sm">Order queue</TabsTrigger>
          <TabsTrigger value="stock" className="shrink-0 text-xs sm:text-sm">Stock sync</TabsTrigger>
        </TabsList>

        {/* --- CENTRAL SFTP SERVER TAB --- */}
        <TabsContent value="sftp" className="mt-5 space-y-6">
          {/* Automation Notice */}
          <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-sky-50/90 p-4 sm:p-5 shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 shrink-0 shadow-2xs">
                <Clock className="h-5 w-5" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-slate-900 text-sm">Real-time Background Automation Active</p>
                <p className="mt-1 text-slate-600 leading-relaxed">
                  Stock updates automatically sync after till sales with a <strong className="text-slate-800 font-bold">5-minute minimum rate limit</strong> per Talabat guidelines. Automation can be paused/resumed independently. 3 consecutive failures will auto-deactivate connection for protection.
                </p>
              </div>
            </div>
          </div>

          {/* Configured Connections List Grouped by Branch */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {connections.map((conn) => {
              const isSelected = conn.id === selectedConnId;
              const branchMatch = realBranches.find((b) => b.id === conn.branchId);
              const nextSync = calculateNextSyncTime(conn);

              return (
                <div
                  key={conn.id}
                  onClick={() => {
                    setSelectedConnId(conn.id || "");
                    loadLogs(conn.id || "");
                  }}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${
                    isSelected
                      ? "border-[#39ff14] bg-[#39ff14]/5 ring-2 ring-[#39ff14]/30 shadow-md shadow-[#39ff14]/10 -translate-y-0.5"
                      : "border-slate-200/90 bg-white hover:border-[#39ff14]/60 hover:shadow-md hover:-translate-y-0.5 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#39ff14] text-slate-950 font-black text-sm capitalize shadow-sm shadow-[#39ff14]/30">
                        {conn.aggregatorName.substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm capitalize tracking-tight">{conn.aggregatorName} SFTP</h3>
                        <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="h-3 w-3 text-[#25b507] shrink-0" /> {branchMatch?.name || "Main Branch"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className={`h-7 text-xs font-bold rounded-full shrink-0 transition-all ${
                          conn.isActive
                            ? "border-[#39ff14] bg-[#39ff14]/20 text-[#25b507] hover:bg-[#39ff14]/30 shadow-2xs"
                            : "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100/80 shadow-2xs"
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(conn);
                        }}
                        title={conn.isActive ? "Click to Deactivate Connection" : "Click to Activate Connection"}
                      >
                        {conn.isActive ? "Active" : <span>Inactive<span className="hidden sm:inline"> (Activate)</span></span>}
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-500">
                    <div className="flex justify-between items-center bg-slate-50/80 rounded-lg px-2.5 py-1.5 border border-slate-100">
                      <span className="font-medium text-slate-500">Vendor ID:</span>
                      <span className="font-mono font-bold text-slate-800 truncate max-w-[150px]">{conn.vendorId || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="font-medium">Sync Schedule:</span>
                      <span className="capitalize font-bold text-slate-800">{conn.syncFrequency || "manual"}</span>
                    </div>
                    <div className="flex justify-between items-center px-1">
                      <span className="font-medium">Next Scheduled:</span>
                      <span className="font-mono text-xs text-[#25b507] font-bold">{nextSync}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                    {/* Pause/Resume Automation Toggle */}
                    {conn.syncFrequency !== "manual" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs font-semibold px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePause(conn.id!, conn.isPaused);
                        }}
                      >
                        {conn.isPaused ? (
                          <span className="text-amber-600 flex items-center gap-1">
                            <PlayCircle className="h-3.5 w-3.5" /> Resume
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <PauseCircle className="h-3.5 w-3.5" /> Pause
                          </span>
                        )}
                      </Button>
                    )}

                    {conn.syncFrequency === "manual" && (
                      <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Manual Only
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg"
                        title="Edit Connection Settings"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormConn({ ...conn });
                          setShowConfigModal(true);
                        }}
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10"
                        title="Delete Connection"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteConn(conn.id!);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Connection Controls */}
          {activeConnection && (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-5">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-slate-900 capitalize tracking-tight">
                      {activeConnection.aggregatorName} SFTP Controls
                    </h3>
                    <Badge variant="outline" className="font-mono text-[11px] bg-slate-50 text-slate-700 border-slate-200 font-bold">
                      {activeConnection.priceFormat || "price_discounted"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 break-all sm:break-normal">
                    Host: <code className="font-semibold text-slate-800 break-all bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/80">{activeConnection.sftpHost}</code> | Target Directory:{" "}
                    <code className="font-semibold text-[#25b507] break-all bg-[#39ff14]/20 px-1.5 py-0.5 rounded border border-[#39ff14]/40 font-bold">{activeConnection.remoteDirectory}</code> | Vendor ID:{" "}
                    <code className="font-semibold text-slate-800 break-all bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200/80">{activeConnection.vendorId}</code>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                  {/* Time Window Filter Selector */}
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
                    <Clock className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="text-[11px] font-semibold text-slate-500 shrink-0">Filter:</span>
                    <select
                      className="bg-transparent font-bold text-slate-800 text-xs focus:outline-none cursor-pointer"
                      value={timeWindow}
                      onChange={(e) => {
                        const val = e.target.value as any;
                        setTimeWindow(val);
                        setCsvPreview(null);
                      }}
                    >
                      <option value="all">Current / All (Full Catalog)</option>
                      <option value="1h">Last 1 Hour</option>
                      <option value="24h">Last 24 Hours</option>
                      <option value="7d">Last 1 Week</option>
                      <option value="30d">Last 1 Month</option>
                    </select>
                  </div>

                  <Button
                    variant="outline"
                    className="rounded-xl font-bold border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-400 shadow-2xs transition-all text-xs sm:text-sm flex-1 sm:flex-initial"
                    onClick={() => handlePreviewCsv(activeConnection.id)}
                    disabled={isLoadingPreview}
                  >
                    <FileText className="mr-1.5 h-4 w-4 text-slate-600" />
                    {isLoadingPreview ? "Generating..." : "Preview CSV"}
                  </Button>

                  <div className="flex-1 sm:flex-initial" title={!activeConnection.isActive ? "Sync is disabled until this connection is verified and activated." : ""}>
                    <Button
                      className={`rounded-xl font-black border-0 shadow-md transition-all text-xs sm:text-sm w-full sm:w-auto ${
                        !activeConnection.isActive
                          ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                          : "bg-[#39ff14] hover:bg-[#32e012] text-slate-950 shadow-[#39ff14]/35 hover:shadow-lg hover:shadow-[#39ff14]/45 hover:scale-[1.02] active:scale-[0.98]"
                      }`}
                      disabled={!activeConnection.isActive || isSyncing || isLoadingPreview}
                      onClick={handleOpenSyncModal}
                    >
                      <UploadCloud className="mr-1.5 h-4 w-4" />
                      {isLoadingPreview ? "Preparing..." : "Sync Now"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Single File Format Rules & Column Spec */}
              <div className="rounded-2xl bg-gradient-to-br from-slate-50 via-[#39ff14]/10 to-slate-50 border border-slate-200/90 p-5 shadow-2xs space-y-3">
                <p className="font-bold text-slate-800 text-xs flex items-center gap-2 tracking-wide uppercase">
                  <Info className="h-4 w-4 text-[#25b507]" /> Delivery Hero Single File Format Specification Rules
                </p>
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 font-mono text-[11px] break-words">
                  <div className="bg-white/90 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs">
                    <span className="text-slate-900 font-bold">1. Product ID:</span> <code className="text-[#25b507] font-bold bg-[#39ff14]/20 px-1 py-0.5 rounded border border-[#39ff14]/30">barcode</code> OR <code className="text-[#25b507] font-bold bg-[#39ff14]/20 px-1 py-0.5 rounded border border-[#39ff14]/30">sku</code> (Exclusive)
                  </div>
                  <div className="bg-white/90 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs">
                    <span className="text-slate-900 font-bold">2. Assortment:</span> <code className="text-[#25b507] font-bold bg-[#39ff14]/20 px-1 py-0.5 rounded border border-[#39ff14]/30">price</code> & <code className="text-[#25b507] font-bold bg-[#39ff14]/20 px-1 py-0.5 rounded border border-[#39ff14]/30">active</code> (Always required)
                  </div>
                  <div className="bg-white/90 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs">
                    <span className="text-slate-900 font-bold">3. Promo Reason:</span> <code className="text-[#25b507] font-bold bg-[#39ff14]/20 px-1 py-0.5 rounded border border-[#39ff14]/30">'competitiveness'</code>
                  </div>
                  <div className="bg-white/90 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs">
                    <span className="text-slate-900 font-bold">4. Promo Dates:</span> <code className="text-[#25b507] font-bold bg-[#39ff14]/20 px-1 py-0.5 rounded border border-[#39ff14]/30">YYYY-MM-DD HH:MM:SS</code>
                  </div>
                  <div className="bg-white/90 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs">
                    <span className="text-slate-900 font-bold">5. Promo Fields:</span> All filled together or all left blank
                  </div>
                  <div className="bg-white/90 border border-slate-200/80 rounded-xl p-2.5 shadow-2xs">
                    <span className="text-slate-900 font-bold">6. File Name:</span> <code className="text-[#25b507] font-bold break-all bg-[#39ff14]/20 px-1 py-0.5 rounded border border-[#39ff14]/30">&lt;filename_prefix&gt;_&lt;store_vendor_id&gt;.csv (e.g. danah_776282.csv)</code>
                  </div>
                </div>
              </div>

              {/* Live CSV In-Memory Preview Display */}
              {csvPreview && (
                <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-ink flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary shrink-0" /> Generated Single File Payload Preview ({csvPreview.fileName})
                      </h4>
                      <p className="text-[11px] text-muted-foreground break-all">
                        Target Path: <code className="font-mono text-primary break-all">{csvPreview.remotePath}</code> | {csvPreview.recordCount} Items | {csvPreview.fileSizeBytes} Bytes
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl font-bold text-xs border-[#39ff14]/60 bg-[#39ff14]/15 text-[#25b507] hover:bg-[#39ff14] hover:text-slate-950 shadow-2xs transition-all"
                      onClick={() => handleDownloadCsv(csvPreview.fileName, csvPreview.csvContent)}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" /> Download CSV
                    </Button>
                  </div>

                  <div className="max-h-60 overflow-y-auto overflow-x-auto rounded-lg bg-surface-2 p-3 font-mono text-xs text-ink leading-relaxed">
                    <pre className="whitespace-pre overflow-x-auto max-w-full">{csvPreview.csvContent}</pre>
                  </div>
                </div>
              )}

              {/* Audit Log Table for Selected Connection */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#25b507]" /> SFTP Sync Audit Trail & Execution History
                    <Badge variant="outline" className="font-mono text-[10px] bg-slate-100 text-slate-700 border-slate-200 font-bold">
                      {sftpLogs.length} Records
                    </Badge>
                  </h4>

                  {sftpLogs.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-3 text-xs font-bold border border-rose-200 bg-rose-50/80 text-rose-600 hover:bg-rose-500 hover:text-white transition-all rounded-xl shadow-2xs flex items-center gap-1.5"
                      onClick={() => setShowClearAllLogsModal(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Clear All Logs
                    </Button>
                  )}
                </div>

                {sftpLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 italic bg-slate-50 p-6 rounded-2xl border border-slate-200/80 text-center font-medium">
                    No sync logs recorded yet for this connection.
                  </p>
                ) : (
                  <>
                    {(() => {
                      const totalLogPages = Math.ceil(sftpLogs.length / logPageSize) || 1;
                      const currentPage = Math.min(logPage, totalLogPages);
                      const startIndex = (currentPage - 1) * logPageSize;
                      const paginatedLogs = sftpLogs.slice(startIndex, startIndex + logPageSize);

                      return (
                        <div className="space-y-3">
                          <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white w-full shadow-2xs">
                            <table className="w-full text-left text-xs min-w-[650px]">
                              <thead className="bg-slate-100/70 text-slate-600 border-b border-slate-200/80">
                                <tr>
                                  <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Timestamp</th>
                                  <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Sync Type</th>
                                  <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Status</th>
                                  <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">File Name</th>
                                  <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Records</th>
                                  <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider">Details / Error</th>
                                  <th className="p-3.5 font-bold uppercase text-[10px] tracking-wider text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 text-slate-700">
                                {paginatedLogs.map((log) => (
                                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="p-3.5 font-mono text-[11px] text-slate-500 font-medium">
                                      {new Date(log.createdAt).toLocaleString()}
                                    </td>
                                    <td className="p-3.5 capitalize font-bold text-slate-900">{log.syncType}</td>
                                    <td className="p-3.5">
                                      <Badge
                                        variant="outline"
                                        className={
                                          log.status === "success"
                                            ? "border-[#39ff14]/50 bg-[#39ff14]/20 text-[#25b507] font-bold rounded-full shadow-2xs"
                                            : log.status === "preview_only"
                                            ? "border-sky-200 bg-sky-50 text-sky-700 font-bold shadow-2xs"
                                            : "border-rose-200 bg-rose-50 text-rose-700 font-bold shadow-2xs"
                                        }
                                      >
                                        {log.status}
                                      </Badge>
                                    </td>
                                    <td className="p-3.5 font-mono text-[11px] font-semibold text-slate-800">{log.fileName}</td>
                                    <td className="p-3.5 font-mono font-bold text-slate-800">{log.rowCount}</td>
                                    <td className="p-3.5 text-slate-500 max-w-xs truncate font-medium" title={log.errorMessage || ""}>
                                      {log.errorMessage || "—"}
                                    </td>
                                    <td className="p-3.5 text-right">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-xl text-rose-600 hover:bg-rose-500 hover:text-white transition-all"
                                        title="Delete Log Record (Warning: Database Delete)"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setLogToDelete(log);
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Pagination Footer */}
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground px-1 pt-1">
                            <div>
                              Showing{" "}
                              <span className="font-semibold text-ink">
                                {startIndex + 1}
                              </span>{" "}
                              to{" "}
                              <span className="font-semibold text-ink">
                                {Math.min(startIndex + logPageSize, sftpLogs.length)}
                              </span>{" "}
                              of <span className="font-semibold text-ink">{sftpLogs.length}</span> audit logs
                            </div>

                            {totalLogPages > 1 && (
                              <div className="flex items-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2.5 text-xs font-semibold rounded-lg"
                                  disabled={currentPage <= 1}
                                  onClick={() => setLogPage((prev) => Math.max(prev - 1, 1))}
                                >
                                  <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
                                </Button>

                                <span className="px-2 font-mono text-xs font-semibold text-ink">
                                  Page {currentPage} of {totalLogPages}
                                </span>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-7 px-2.5 text-xs font-semibold rounded-lg"
                                  disabled={currentPage >= totalLogPages}
                                  onClick={() => setLogPage((prev) => Math.min(prev + 1, totalLogPages))}
                                >
                                  Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          )}
        </TabsContent>

        {/* --- ORDER QUEUE TAB (HONEST EMPTY PENDING STATE) --- */}
        <TabsContent value="queue" className="mt-5">
          <div className="panel p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-ink">No Delivery Orders in Queue</h3>
            <p className="max-w-md mx-auto text-xs text-muted-foreground">
              Live aggregator order ingestion (push webhooks / order polling API) is not connected yet. Real-time delivery orders will appear here once an active ingestion channel is configured.
            </p>
            <div className="pt-2">
              <Button variant="outline" size="sm" className="rounded-xl" disabled>
                Order Ingestion Disconnected
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* --- STOCK SYNC TAB (HONEST EMPTY PENDING STATE) --- */}
        <TabsContent value="stock" className="mt-5">
          <div className="panel p-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Rocket className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-ink">Real-Time Stock Auto-Sync Disconnected</h3>
            <p className="max-w-md mx-auto text-xs text-muted-foreground">
              Instant till sale stock deductions across delivery aggregator APIs are not connected yet. Menu price and stock catalog syncing is managed through the <strong>Central SFTP Server</strong> tab.
            </p>
            <div className="pt-2">
              <Button variant="outline" size="sm" className="rounded-xl" disabled>
                Real-Time Stock Push Disabled
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* --- ADD / EDIT CONNECTION MODAL --- */}
      <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
        <DialogContent className="w-[95vw] sm:max-w-[550px] max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-ink">
              <Server className="h-5 w-5 text-primary" /> Add / Edit SFTP Connection
            </DialogTitle>
            <DialogDescription>
              Configure aggregator connection settings. Passwords are encrypted at rest with AES-256.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveConnection} className="space-y-4 py-2" autoComplete="off">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="aggregatorName" className="text-xs font-semibold">Aggregator Channel</Label>
                <select
                  id="aggregatorName"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-ink shadow-sm"
                  value={formConn.aggregatorName}
                  onChange={(e) => setFormConn({ ...formConn, aggregatorName: e.target.value })}
                >
                  <option value="talabat">Talabat / Delivery Hero</option>
                  <option value="careem" disabled>Careem (Coming soon — format specification pending)</option>
                  <option value="instashop" disabled>InstaShop (Coming soon — format specification pending)</option>
                  <option value="deliveroo" disabled>Deliveroo (Coming soon — format specification pending)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="branchId" className="text-xs font-semibold">Target Branch</Label>
                <select
                  id="branchId"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-ink shadow-sm"
                  value={formConn.branchId}
                  onChange={(e) => setFormConn({ ...formConn, branchId: e.target.value })}
                >
                  {realBranches.length === 0 ? (
                    <option value="" disabled>No active branches found</option>
                  ) : (
                    realBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.address ? `(${b.address})` : ""}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="vendorId" className="text-xs font-semibold">Username / Vendor ID</Label>
                <Input
                  id="vendorId"
                  name="sftp_vendor_id"
                  autoComplete="off"
                  value={formConn.vendorId}
                  onChange={(e) => setFormConn({ ...formConn, vendorId: e.target.value, sftpUsername: e.target.value })}
                  placeholder="e.g. TB_AE_4e9a0d34-3ba4-4396"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="filenamePrefix" className="text-xs font-semibold">Filename Prefix</Label>
                <Input
                  id="filenamePrefix"
                  name="filename_prefix"
                  autoComplete="off"
                  value={formConn.filenamePrefix || ""}
                  onChange={(e) => setFormConn({ ...formConn, filenamePrefix: e.target.value })}
                  placeholder="e.g. danah, khaldiya, nahyan"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="sftpHost" className="text-xs font-semibold">SFTP Host</Label>
                <Input
                  id="sftpHost"
                  name="sftp_host"
                  autoComplete="off"
                  value={formConn.sftpHost}
                  onChange={(e) => setFormConn({ ...formConn, sftpHost: e.target.value })}
                  placeholder="e.g. sftp.talabat.com"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sftpPort" className="text-xs font-semibold">SFTP Port</Label>
                <Input
                  id="sftpPort"
                  name="sftp_port"
                  autoComplete="off"
                  type="number"
                  value={formConn.sftpPort}
                  onChange={(e) => setFormConn({ ...formConn, sftpPort: Number(e.target.value) })}
                  placeholder="22"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="priceFormat" className="text-xs font-semibold">Price Format Option</Label>
                <select
                  id="priceFormat"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-ink shadow-sm font-mono"
                  value={formConn.priceFormat}
                  onChange={(e) => setFormConn({ ...formConn, priceFormat: e.target.value as any })}
                >
                  <option value="price_discounted">price + discounted_price (Standard)</option>
                  <option value="original_discounted">original_price + discounted_price</option>
                  <option value="original_price">original_price + price</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="syncFrequency" className="text-xs font-semibold">Sync Frequency Schedule</Label>
                <select
                  id="syncFrequency"
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-ink shadow-sm"
                  value={formConn.syncFrequency}
                  onChange={(e) => setFormConn({ ...formConn, syncFrequency: e.target.value as any })}
                >
                  <option value="manual">Manual Only (Sync Now Button)</option>
                  <option value="15min">Every 15 Minutes</option>
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sftpPassword" className="text-xs font-semibold">SFTP Password</Label>
                <div className="relative">
                  <Input
                    id="sftpPassword"
                    name="sftp_password"
                    autoComplete="new-password"
                    type={showPass ? "text" : "password"}
                    value={formConn.sftpPassword || ""}
                    onChange={(e) => setFormConn({ ...formConn, sftpPassword: e.target.value })}
                    placeholder="Enter password..."
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-ink"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="remoteDirectory" className="text-xs font-semibold">Target Remote Directory</Label>
                <Input
                  id="remoteDirectory"
                  name="remote_directory"
                  autoComplete="off"
                  value={formConn.remoteDirectory}
                  onChange={(e) => setFormConn({ ...formConn, remoteDirectory: e.target.value })}
                  placeholder="/Assortment"
                  required
                />
              </div>

              <div className="flex items-center justify-between rounded-xl border border-border bg-surface/50 p-3 sm:col-span-2 mt-1">
                <div>
                  <Label htmlFor="formIsActive" className="text-xs font-bold text-ink cursor-pointer">
                    Activate SFTP Connection
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Enables manual sync and scheduled background SFTP transmission.
                  </p>
                </div>
                <input
                  id="formIsActive"
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                  checked={formConn.isActive}
                  onChange={(e) => setFormConn({ ...formConn, isActive: e.target.checked })}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setShowConfigModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Connection</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* --- CONFIRM DELETE SINGLE LOG RECORD WARNING DIALOG --- */}
      <Dialog open={!!logToDelete} onOpenChange={(open) => !open && setLogToDelete(null)}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Confirm Database Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Warning: This audit log entry will be permanently removed from the database table <code className="font-mono text-ink font-semibold">aggregator_sync_logs</code>.
            </DialogDescription>
          </DialogHeader>

          {logToDelete && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs space-y-1.5 my-2">
              <div className="flex justify-between font-mono">
                <span className="text-muted-foreground">File:</span>
                <span className="font-semibold text-ink truncate max-w-[220px]">{logToDelete.fileName}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-muted-foreground">Timestamp:</span>
                <span className="text-ink">{new Date(logToDelete.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-muted-foreground">Sync Type / Status:</span>
                <span className="capitalize text-ink">{logToDelete.syncType} ({logToDelete.status})</span>
              </div>
              <p className="text-destructive font-semibold text-[11px] pt-1 border-t border-destructive/20 mt-1">
                ⚠️ Yeh record database se permanent delete ho jayega. Continue?
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" size="sm" onClick={() => setLogToDelete(null)} disabled={isDeletingLog}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmDeleteLog} disabled={isDeletingLog}>
              {isDeletingLog ? "Deleting..." : "Yes, Delete from Database"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- CONFIRM CLEAR ALL LOGS WARNING DIALOG --- */}
      <Dialog open={showClearAllLogsModal} onOpenChange={setShowClearAllLogsModal}>
        <DialogContent className="w-[95vw] sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" /> Clear All Audit Logs Warning
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Warning: Are you sure you want to delete ALL audit log entries for this connection?
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs space-y-1.5 my-2">
            <p className="text-ink font-bold">
              Total {sftpLogs.length} audit log entries will be deleted.
            </p>
            <p className="text-destructive font-semibold text-[11px]">
              ⚠️ Yeh saarey log records database (aggregator_sync_logs) se permanently clear ho jayenge.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" size="sm" onClick={() => setShowClearAllLogsModal(false)} disabled={isDeletingLog}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmClearAllLogs} disabled={isDeletingLog}>
              {isDeletingLog ? "Clearing All..." : "Yes, Clear All Logs"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- CONFIRM AGGREGATOR SYNC DIALOG (DOWNLOAD ONLY VS SEND TO TALABAT) --- */}
      <Dialog open={showSyncConfirmModal} onOpenChange={(open) => !open && !isSyncing && setShowSyncConfirmModal(false)}>
        <DialogContent className="w-[95vw] sm:max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UploadCloud className="h-5 w-5 text-[#25b507]" /> Confirm Aggregator Sync
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1">
              Review the generated file payload before deciding to download locally or transmit directly to Talabat SFTP.
            </DialogDescription>
          </DialogHeader>

          {activeConnection && (syncSummary || csvPreview) && (() => {
            const displayData = syncSummary || csvPreview!;
            const sizeBytes = syncSummary?.estimatedSizeBytes ?? csvPreview?.fileSizeBytes ?? 0;
            return (
              <div className="rounded-xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-[#39ff14]/5 to-slate-50 p-4 text-xs space-y-2.5 my-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                  <span className="text-slate-500 font-medium">Store & Branch:</span>
                  <span className="font-bold text-slate-900">
                    {realBranches.find((b) => b.id === activeConnection.branchId)?.name || "Al Danah"} ({activeConnection.storeVendorId || activeConnection.vendorId})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Time Window:</span>
                  <Badge variant="outline" className="font-semibold text-[11px] bg-white border-slate-300 text-slate-800">
                    {timeWindow === "all" ? "Current / All (Full Catalog)" :
                     timeWindow === "1h" ? "Last 1 Hour" :
                     timeWindow === "24h" ? "Last 24 Hours" :
                     timeWindow === "7d" ? "Last 1 Week" : "Last 1 Month"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">File Name:</span>
                  <code className="font-mono font-bold text-[#25b507] bg-[#39ff14]/20 px-1.5 py-0.5 rounded border border-[#39ff14]/30">
                    {displayData.fileName}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Target Directory:</span>
                  <code className="font-mono text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {displayData.remotePath || activeConnection.remoteDirectory || "/assortment"}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Total Products:</span>
                  <span className="font-bold text-slate-900">
                    {displayData.recordCount.toLocaleString()} items
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Estimated Payload Size:</span>
                  <span className="font-mono text-slate-700">
                    {sizeBytes.toLocaleString()} bytes ({(sizeBytes / (1024 * 1024)).toFixed(2)} MB)
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-600 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-[#25b507] shrink-0" />
                  <span>
                    <strong>Download Only</strong> saves the file to your computer. <strong>Send to Talabat</strong> immediately transmits to the live SFTP server.
                  </span>
                </div>
              </div>
            );
          })()}

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 mt-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-semibold text-slate-700 bg-white border-slate-300 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => setShowSyncConfirmModal(false)}
              disabled={isSyncing || isLoadingPreview}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl text-xs font-bold border-2 border-slate-300 bg-white text-slate-900 hover:bg-slate-100 hover:text-slate-950 shadow-sm"
              onClick={handleDownloadOnlyFromModal}
              disabled={isSyncing || (!syncSummary && !csvPreview) || isLoadingPreview}
            >
              {isLoadingPreview ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin text-slate-800" />
                  Generating CSV...
                </>
              ) : (
                <>
                  <Download className="mr-1.5 h-3.5 w-3.5 text-slate-800" />
                  Download Only
                </>
              )}
            </Button>
            <Button
              type="button"
              size="sm"
              className="rounded-xl text-xs font-black bg-[#39ff14] hover:bg-[#32e012] text-slate-950 shadow-md shadow-[#39ff14]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={handleSendToTalabatFromModal}
              disabled={isSyncing || (!syncSummary && !csvPreview) || isLoadingPreview}
            >
              {isSyncing ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Sending to SFTP...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-1.5 h-3.5 w-3.5" />
                  Send to Talabat
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DemoShell>
  );
}
