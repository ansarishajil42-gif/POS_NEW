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
import { outlets } from "@/lib/demo-data";
import { toast } from "sonner";
import {
  getAggregatorConnectionsServerFn,
  saveAggregatorConnectionServerFn,
  togglePauseAutomationServerFn,
  deleteAggregatorConnectionServerFn,
  previewAggregatorCsvServerFn,
  triggerAggregatorSyncServerFn,
  getAggregatorSyncLogsServerFn,
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
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Connection modal form state (initializes clean with empty values)
  const [formConn, setFormConn] = useState<ConnectionConfig>({
    aggregatorName: "talabat",
    branchId: outlets[0]?.id || "",
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
  }, []);

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
      const res = await previewAggregatorCsvServerFn({ data: { connectionId: targetId } });
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

  async function handleExecuteSync() {
    if (!selectedConnId || !activeConnection) return;
    setIsSyncing(true);

    try {
      const res = await triggerAggregatorSyncServerFn({ data: { connectionId: selectedConnId } });
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

  function calculateNextSyncTime(conn: ConnectionConfig): string {
    if (conn.syncFrequency === "manual") return "Manual Sync Only";
    if (conn.isPaused) return "Automation Paused";
    if (!conn.isActive) return "Connection Inactive";

    const lastTime = conn.lastScheduledSyncAt ? new Date(conn.lastScheduledSyncAt).getTime() : Date.now();
    let addMs = 15 * 60 * 1000;
    if (conn.syncFrequency === "hourly") addMs = 60 * 60 * 1000;
    if (conn.syncFrequency === "daily") addMs = 24 * 60 * 60 * 1000;

    const nextDate = new Date(lastTime + addMs);
    return nextDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <DemoShell
      title="Aggregator & SFTP Sync Engine"
      subtitle="Phase 3 multi-branch SFTP engine with background automation scheduler."
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-xl font-semibold border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => {
              setFormConn({
                aggregatorName: "talabat",
                branchId: outlets[0]?.id || "",
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
            <Plus className="mr-1.5 h-4 w-4" /> Add SFTP Connection
          </Button>
          <div title="Live channel API publishing is disconnected. Assortment & promo sync is managed via Central SFTP Server tab.">
            <Button
              className="rounded-xl font-semibold opacity-50 cursor-not-allowed"
              disabled
            >
              <Rocket className="mr-1.5 h-4 w-4" />
              Publish to channels (API Disconnected)
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
        <TabsList className="rounded-xl">
          <TabsTrigger value="sftp" className="font-semibold text-primary">
            Central SFTP Server
          </TabsTrigger>
          <TabsTrigger value="queue">Order queue</TabsTrigger>
          <TabsTrigger value="stock">Stock sync</TabsTrigger>
        </TabsList>

        {/* --- CENTRAL SFTP SERVER TAB --- */}
        <TabsContent value="sftp" className="mt-5 space-y-6">
          {/* Automation Notice */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-blue-900 dark:text-blue-200">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">Background Automation & Multi-Branch Management Active</p>
                <p className="mt-0.5 text-blue-800/90 dark:text-blue-300">
                  Scheduled syncs enforce a <strong>5-minute minimum rate limit</strong> for assortment files. Automation can be paused/resumed independently without changing connection status. 3 consecutive failures will auto-deactivate connection for protection.
                </p>
              </div>
            </div>
          </div>

          {/* Configured Connections List Grouped by Branch */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {connections.map((conn) => {
              const isSelected = conn.id === selectedConnId;
              const outletMatch = outlets.find((o) => o.id === conn.branchId) || outlets[0];
              const nextSync = calculateNextSyncTime(conn);

              return (
                <div
                  key={conn.id}
                  onClick={() => {
                    setSelectedConnId(conn.id || "");
                    loadLogs(conn.id || "");
                  }}
                  className={`cursor-pointer rounded-2xl border p-5 transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-sm"
                      : "border-border bg-surface hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold capitalize">
                        {conn.aggregatorName.substring(0, 2)}
                      </div>
                      <div>
                        <h3 className="font-bold text-ink text-sm capitalize">{conn.aggregatorName} SFTP</h3>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Building className="h-3 w-3 text-primary" /> {outletMatch?.name || "Main Branch"}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant="outline"
                      className={
                        conn.isActive
                          ? "border-success/30 bg-success/10 text-success font-semibold"
                          : "border-amber-500/30 bg-amber-500/10 text-amber-600 font-semibold"
                      }
                    >
                      {conn.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Vendor ID:</span>
                      <span className="font-mono font-semibold text-ink">{conn.vendorId || "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sync Schedule:</span>
                      <span className="capitalize font-semibold text-ink">{conn.syncFrequency || "manual"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Next Scheduled:</span>
                      <span className="font-mono text-xs text-primary font-semibold">{nextSync}</span>
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
            <div className="panel p-6 space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-ink capitalize">
                      {activeConnection.aggregatorName} SFTP Controls
                    </h3>
                    <Badge variant="outline" className="font-mono text-xs">
                      {activeConnection.priceFormat || "price_discounted"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Host: <code className="font-semibold text-ink">{activeConnection.sftpHost}</code> | Target Directory:{" "}
                    <code className="font-semibold text-primary">{activeConnection.remoteDirectory}</code> | Vendor ID:{" "}
                    <code className="font-semibold text-ink">{activeConnection.vendorId}</code>
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl font-semibold"
                    onClick={() => handlePreviewCsv(activeConnection.id)}
                    disabled={isLoadingPreview}
                  >
                    <FileText className="mr-1.5 h-4 w-4" />
                    {isLoadingPreview ? "Generating..." : "Preview CSV"}
                  </Button>

                  <div title={!activeConnection.isActive ? "Sync is disabled until this connection is verified and activated." : ""}>
                    <Button
                      className={`rounded-xl font-semibold ${!activeConnection.isActive ? "opacity-50 cursor-not-allowed" : ""}`}
                      disabled={!activeConnection.isActive || isSyncing}
                      onClick={handleExecuteSync}
                    >
                      <UploadCloud className="mr-1.5 h-4 w-4" />
                      Sync Now
                    </Button>
                  </div>
                </div>
              </div>

              {/* Single File Format Rules & Column Spec */}
              <div className="rounded-xl bg-surface-2 p-4 text-xs text-muted-foreground space-y-2">
                <p className="font-bold text-ink flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-primary" /> Delivery Hero Single File Format Specification Rules
                </p>
                <div className="grid gap-2 sm:grid-cols-3 font-mono text-[11px]">
                  <div>
                    <span className="text-ink font-semibold">1. Product ID:</span> <code className="text-primary">barcode</code> OR <code className="text-primary">sku</code> (Exclusive)
                  </div>
                  <div>
                    <span className="text-ink font-semibold">2. Assortment:</span> <code className="text-primary">price</code> & <code className="text-primary">active</code> (Always required)
                  </div>
                  <div>
                    <span className="text-ink font-semibold">3. Promo Reason:</span> <code className="text-primary">'competitiveness'</code>
                  </div>
                  <div>
                    <span className="text-ink font-semibold">4. Promo Dates:</span> <code className="text-primary">YYYY-MM-DD HH:MM:SS</code>
                  </div>
                  <div>
                    <span className="text-ink font-semibold">5. Promo Fields:</span> All filled together or all left blank
                  </div>
                  <div>
                    <span className="text-ink font-semibold">6. File Name:</span> <code className="text-primary">assortment_&lt;vendor_id&gt;.csv</code>
                  </div>
                </div>
              </div>

              {/* Live CSV In-Memory Preview Display */}
              {csvPreview && (
                <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                    <div>
                      <h4 className="text-xs font-bold text-ink flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> Generated Single File Payload Preview ({csvPreview.fileName})
                      </h4>
                      <p className="text-[11px] text-muted-foreground">
                        Target Path: <code className="font-mono text-primary">{csvPreview.remotePath}</code> | {csvPreview.recordCount} Items | {csvPreview.fileSizeBytes} Bytes
                      </p>
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto rounded-lg bg-surface-2 p-3 font-mono text-xs text-ink leading-relaxed">
                    <pre>{csvPreview.csvContent}</pre>
                  </div>
                </div>
              )}

              {/* Audit Log Table for Selected Connection */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-ink flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" /> SFTP Sync Audit Trail & Execution History
                </h4>

                {sftpLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic bg-surface-2 p-4 rounded-xl text-center">
                    No sync logs recorded yet for this connection.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-border">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-surface-2 text-muted-foreground">
                        <tr>
                          <th className="p-3 font-semibold">Timestamp</th>
                          <th className="p-3 font-semibold">Sync Type</th>
                          <th className="p-3 font-semibold">Status</th>
                          <th className="p-3 font-semibold">File Name</th>
                          <th className="p-3 font-semibold">Records</th>
                          <th className="p-3 font-semibold">Details / Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {sftpLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-surface-2/50">
                            <td className="p-3 font-mono text-[11px] text-muted-foreground">
                              {new Date(log.createdAt).toLocaleString()}
                            </td>
                            <td className="p-3 capitalize font-semibold">{log.syncType}</td>
                            <td className="p-3">
                              <Badge
                                variant="outline"
                                className={
                                  log.status === "success"
                                    ? "border-success/30 bg-success/10 text-success font-semibold"
                                    : log.status === "preview_only"
                                    ? "border-blue-500/30 bg-blue-500/10 text-blue-600 font-semibold"
                                    : "border-destructive/30 bg-destructive/10 text-destructive font-semibold"
                                }
                              >
                                {log.status}
                              </Badge>
                            </td>
                            <td className="p-3 font-mono text-[11px]">{log.fileName}</td>
                            <td className="p-3 font-mono">{log.rowCount}</td>
                            <td className="p-3 text-muted-foreground max-w-xs truncate">
                              {log.errorMessage || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
        <DialogContent className="sm:max-w-[550px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-ink">
              <Server className="h-5 w-5 text-primary" /> Add / Edit SFTP Connection
            </DialogTitle>
            <DialogDescription>
              Configure aggregator connection settings. Passwords are encrypted at rest with AES-256.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveConnection} className="space-y-4 py-2">
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
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.emirate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="vendorId" className="text-xs font-semibold">Username / Vendor ID</Label>
                <Input
                  id="vendorId"
                  value={formConn.vendorId}
                  onChange={(e) => setFormConn({ ...formConn, vendorId: e.target.value, sftpUsername: e.target.value })}
                  placeholder="e.g. test_vendor"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="sftpHost" className="text-xs font-semibold">SFTP Host</Label>
                <Input
                  id="sftpHost"
                  value={formConn.sftpHost}
                  onChange={(e) => setFormConn({ ...formConn, sftpHost: e.target.value })}
                  placeholder="e.g. test.local"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sftpPort" className="text-xs font-semibold">SFTP Port</Label>
                <Input
                  id="sftpPort"
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
                  value={formConn.remoteDirectory}
                  onChange={(e) => setFormConn({ ...formConn, remoteDirectory: e.target.value })}
                  placeholder="/Assortment"
                  required
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
    </DemoShell>
  );
}
