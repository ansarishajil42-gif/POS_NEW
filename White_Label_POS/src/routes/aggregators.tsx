import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { getSessionServerFn, roleRoutes, type Role } from "@/lib/auth";
import {
  Eye,
  EyeOff,
  KeyRound,
  Link2,
  RefreshCw,
  Rocket,
  Server,
  FileText,
  UploadCloud,
  CheckCircle2,
  Settings,
  ShieldCheck,
  Download,
  Copy,
  Plus,
  AlertTriangle,
  Lock,
  Trash2,
  Info,
} from "lucide-react";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { aed, aggOrders, aggregators, outlets, type Aggregator } from "@/lib/demo-data";
import { toast } from "sonner";
import {
  getAggregatorConnectionsServerFn,
  saveAggregatorConnectionServerFn,
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
          "Phase 1 Aggregator SFTP Sync Engine for Talabat Single File CSV format.",
      },
      { property: "og:title", content: "cloudynationpos Aggregator & SFTP Sync Engine" },
      { property: "og:description", content: "Unified delivery orders, aggregator SFTP engine and API vault." },
    ],
  }),
  component: Aggregators,
});

const statusTone: Record<string, string> = {
  New: "bg-primary/10 text-primary border-primary/20",
  Picking: "bg-warning/15 text-warning-foreground border-warning/30",
  Ready: "bg-success/12 text-success border-success/20",
  Dispatched: "bg-surface-2 text-muted-foreground border-border",
};

function Aggregators() {
  const [tab, setTab] = useState<Aggregator | "All">("All");
  const [sync, setSync] = useState<Record<string, boolean>>(
    Object.fromEntries(outlets.map((o) => [o.id, true])),
  );
  const [revealed, setRevealed] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

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

  // Connection modal form state
  const [formConn, setFormConn] = useState<ConnectionConfig>({
    aggregatorName: "talabat",
    sftpHost: "test.local",
    sftpPort: 22,
    sftpUsername: "test_vendor",
    sftpPassword: "dummy123",
    remoteDirectory: "/Assortment",
    vendorId: "test_vendor",
    priceFormat: "price_discounted",
    isActive: false, // Default false in Phase 1
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
          description: `${res.recordCount} products & promotions formatted per spec. No outbound server calls made.`,
        });
        if (res.warning) {
          toast.warning(res.warning);
        }
        loadLogs(targetId);
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
        toast.error("Sync Rejected (Phase 1 Protection)", {
          description: res.error || "Sync is disabled until this connection is verified and activated.",
        });
        loadLogs(selectedConnId);
      } else {
        toast.success("Sync executed successfully");
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
        toast.success("Connection saved successfully with encrypted credentials.");
        setShowConfigModal(false);
        await loadConnections();
      }
    } catch (e: any) {
      toast.error("Failed to save connection: " + e.message);
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

  const visible = tab === "All" ? aggOrders : aggOrders.filter((o) => o.channel === tab);

  return (
    <DemoShell
      title="Aggregator & SFTP Sync Engine"
      subtitle="Phase 1 generic SFTP engine for Talabat Single File CSV format with safe dummy data testing."
      actions={
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded-xl font-semibold border-primary/30 text-primary hover:bg-primary/5"
            onClick={() => {
              setFormConn({
                aggregatorName: "talabat",
                sftpHost: "test.local",
                sftpPort: 22,
                sftpUsername: "test_vendor",
                sftpPassword: "dummy123",
                remoteDirectory: "/Assortment",
                vendorId: "test_vendor",
                priceFormat: "price_discounted",
                isActive: false, // Default false in Phase 1
              });
              setShowConfigModal(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add SFTP Connection
          </Button>
          <Button
            className="rounded-xl font-semibold"
            disabled={publishing}
            onClick={() => {
              setPublishing(true);
              setTimeout(() => {
                setPublishing(false);
                toast.success("Published to all aggregators", {
                  description: "Catalog, promo pricing and stock status updated on 4 channels.",
                });
              }, 1200);
            }}
          >
            <Rocket className="mr-1.5 h-4 w-4" />
            {publishing ? "Publishing…" : "Publish to all channels"}
          </Button>
        </div>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Live orders in queue" value={String(aggOrders.length)} delta="+18% vs last hour" icon={RefreshCw} />
        <StatCard label="Channels connected" value="4 + SFTP" delta="All healthy" icon={Link2} tone="success" />
        <StatCard label="SFTP Engine" value="Phase 1 Active" delta="Safe Mode (Dummy Data Only)" icon={Server} tone="accent" />
        <StatCard label="Stock sync events today" value="12,486" icon={RefreshCw} tone="accent" />
      </div>

      <Tabs defaultValue="sftp" className="mt-8">
        <TabsList className="rounded-xl">
          <TabsTrigger value="sftp" className="font-semibold text-primary">
            Central SFTP Server
          </TabsTrigger>
          <TabsTrigger value="queue">Order queue</TabsTrigger>
          <TabsTrigger value="stock">Stock sync</TabsTrigger>
          <TabsTrigger value="vault">API credentials</TabsTrigger>
        </TabsList>

        {/* --- CENTRAL SFTP SERVER TAB (PHASE 1) --- */}
        <TabsContent value="sftp" className="mt-5 space-y-6">
          {/* Phase 1 Protection Notice */}
          <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-blue-900 dark:text-blue-200">
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold">Phase 1 Locked — Safe Dummy Data Testing</p>
                <p className="mt-0.5 text-blue-800/90 dark:text-blue-300">
                  Connections default to <strong>`is_active = false`</strong>. "Preview CSV" runs safely <strong>in-memory</strong> without making any network or SFTP calls. Real SFTP uploads stay disabled until Phase 2 activation.
                </p>
              </div>
            </div>
          </div>

          {/* Configured Connections Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {connections.map((conn) => {
              const isSelected = conn.id === selectedConnId;

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
                        <p className="text-[11px] text-muted-foreground font-mono">
                          Vendor ID: {conn.vendorId || "test_vendor"}
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
                      {conn.isActive ? "Active" : "Configured — Inactive"}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Host:</span>
                      <span className="font-mono font-semibold text-ink truncate max-w-[170px]">
                        {conn.sftpHost || "test.local"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Target Dir:</span>
                      <span className="font-mono text-ink">{conn.remoteDirectory || "/Assortment"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Price Format:</span>
                      <span className="font-mono text-ink text-[11px] font-semibold">{conn.priceFormat || "price_discounted"}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-amber-600 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Inactive (Phase 1)
                    </span>

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

                  {/* Sync Now Button - Disabled with tooltip when is_active is false */}
                  <div title="Sync is disabled until this connection is verified and activated.">
                    <Button
                      className="rounded-xl font-semibold opacity-50 cursor-not-allowed"
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
                        Target Path: <code className="font-mono text-primary">{csvPreview.remotePath}</code> | {csvPreview.recordCount} Items | {csvPreview.fileSizeBytes} Bytes | In-Memory (No outbound network calls)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs"
                        onClick={() => {
                          navigator.clipboard.writeText(csvPreview.csvContent);
                          toast.success("CSV payload copied to clipboard!");
                        }}
                      >
                        <Copy className="mr-1 h-3.5 w-3.5" /> Copy CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs"
                        onClick={() => {
                          const blob = new Blob([csvPreview.csvContent], { type: "text/csv" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = csvPreview.fileName;
                          a.click();
                          toast.success("CSV file downloaded");
                        }}
                      >
                        <Download className="mr-1 h-3.5 w-3.5" /> Download
                      </Button>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-emerald-400 max-h-[300px]">
                    <pre className="whitespace-pre">{csvPreview.csvContent}</pre>
                  </div>
                </div>
              )}

              {/* Audit History Log */}
              <div>
                <h4 className="text-xs font-bold text-ink mb-3">Sync & Preview Audit History</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-muted-foreground uppercase tracking-wider font-semibold">
                        <th className="py-2.5 px-3">Timestamp</th>
                        <th className="py-2.5 px-3">File Name</th>
                        <th className="py-2.5 px-3">Sync Type</th>
                        <th className="py-2.5 px-3">Records</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Details / Error</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {sftpLogs.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-muted-foreground">
                            No sync or preview events logged yet.
                          </td>
                        </tr>
                      ) : (
                        sftpLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-surface-2/50 transition-colors">
                            <td className="py-3 px-3 font-mono text-muted-foreground">
                              {new Date(log.createdAt || log.timestamp).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-mono font-semibold text-ink">{log.fileName}</td>
                            <td className="py-3 px-3 capitalize text-muted-foreground">{log.syncType || log.sync_type}</td>
                            <td className="py-3 px-3 font-medium text-ink">{log.rowCount || log.row_count} items</td>
                            <td className="py-3 px-3">
                              <Badge
                                variant="outline"
                                className={
                                  log.status === "success"
                                    ? "border-success/30 bg-success/10 text-success font-semibold"
                                    : log.status === "preview_only"
                                    ? "border-primary/30 bg-primary/10 text-primary font-semibold"
                                    : "border-destructive/30 bg-destructive/10 text-destructive font-semibold"
                                }
                              >
                                {log.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground max-w-[250px] truncate">
                              {log.errorMessage || log.message || "Completed cleanly"}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* --- ORDER QUEUE TAB --- */}
        <TabsContent value="queue" className="mt-5">
          <div className="mb-4 flex flex-wrap gap-2">
            {(["All", ...aggregators] as const).map((c) => (
              <button
                key={c}
                onClick={() => setTab(c)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  tab === c
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground hover:text-ink"
                }`}
              >
                {c}
                <span className="ml-2 text-xs opacity-80">
                  {c === "All" ? aggOrders.length : aggOrders.filter((o) => o.channel === c).length}
                </span>
              </button>
            ))}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((o) => (
              <div key={o.id} className="panel p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{o.id}</p>
                    <p className="mt-1 text-sm font-bold text-ink">{o.customer}</p>
                  </div>
                  <Badge variant="outline" className="rounded-full font-semibold">
                    {o.channel}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {o.items} items · {o.branch}
                  </span>
                  <span className="font-extrabold text-ink">{aed(o.total)}</span>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusTone[o.status]}`}>
                    {o.status}
                  </span>
                  <span className="text-xs text-muted-foreground">{o.minutesAgo} min ago</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4 w-full rounded-lg"
                  onClick={() => toast.success(`${o.id} injected into ${o.branch} POS queue · picking slip printed`)}
                >
                  Send to POS & print slip
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* --- STOCK SYNC TAB --- */}
        <TabsContent value="stock" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="panel p-6">
              <h2 className="text-sm font-bold text-ink">Stock auto-sync per branch</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                When enabled, every till sale instantly deducts availability across all connected aggregator menus.
              </p>
              <div className="mt-5 space-y-3">
                {outlets.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{o.name}</p>
                      <p className="text-xs text-muted-foreground">{o.emirate} · 4 channels + SFTP linked</p>
                    </div>
                    <Switch
                      checked={sync[o.id] ?? false}
                      onCheckedChange={(v) => {
                        setSync((s) => ({ ...s, [o.id]: v }));
                        toast.success(`${o.name}: auto-sync ${v ? "enabled" : "paused"}`);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="panel p-6">
              <h2 className="text-sm font-bold text-ink">Price & menu publisher</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Last published 14 minutes ago · 1,284 SKUs · 36 promotions
              </p>
              <div className="mt-5 space-y-3">
                {aggregators.map((a) => (
                  <div key={a} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <span className="text-sm font-semibold text-ink">{a}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                      <span className="h-2 w-2 rounded-full bg-success" /> In sync
                    </span>
                  </div>
                ))}
              </div>
              <Button
                className="mt-5 w-full rounded-xl font-semibold"
                onClick={() => toast.success("Catalog, promos and stock status published to all channels")}
              >
                <Rocket className="mr-1.5 h-4 w-4" /> Publish now
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* --- API VAULT TAB --- */}
        <TabsContent value="vault" className="mt-5">
          <div className="grid gap-5 sm:grid-cols-2">
            {outlets.slice(0, 2).map((o) =>
              aggregators.map((a) => {
                const key = `${o.id}-${a}`;
                const shown = revealed === key;
                return (
                  <div key={key} className="panel p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-ink">{a}</p>
                        <p className="text-xs text-muted-foreground">{o.name}</p>
                      </div>
                      <KeyRound className="h-4 w-4 text-primary" />
                    </div>
                    <div className="mt-4 flex items-center gap-2 rounded-xl bg-surface-2 px-3 py-2.5 font-mono text-xs text-ink">
                      <span className="flex-1 truncate">
                        {shown ? `sk_live_${a.toLowerCase()}_${o.id}_9f42ab77c1` : "•••• •••• •••• ••••"}
                      </span>
                      <button
                        onClick={() => setRevealed(shown ? null : key)}
                        aria-label="Toggle key visibility"
                        className="text-muted-foreground hover:text-ink"
                      >
                        {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 rounded-lg"
                        onClick={() => toast.success(`${a} reconnected for ${o.name}`)}
                      >
                        Connect
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-lg"
                        onClick={() => toast.success("Sandbox credentials rotated")}
                      >
                        Rotate
                      </Button>
                    </div>
                  </div>
                );
              }),
            )}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            OAuth tokens and API keys are stored per branch, encrypted at rest with AES-256 and never exposed to the till.
          </p>
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
              Configure placeholder or vendor SFTP settings. Credentials are encrypted at rest with AES-256.
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
                  <option value="talabat">Talabat</option>
                </select>
              </div>

              <div className="space-y-1.5">
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

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="sftpPassword" className="text-xs font-semibold">SFTP Password (AES-256 Encrypted)</Label>
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
