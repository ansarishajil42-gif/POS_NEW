import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { getSessionServerFn, roleRoutes, type Role } from "@/lib/auth";
import { Eye, EyeOff, KeyRound, Link2, RefreshCw, Rocket, Timer } from "lucide-react";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { aed, aggOrders, aggregators, outlets, type Aggregator } from "@/lib/demo-data";
import { toast } from "sonner";

export const Route = createFileRoute("/aggregators")({
  beforeLoad: async () => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session) throw redirect({ to: "/login" });
    const role = res.session.role as Role;
    if (!["Head Office Admin", "Store Manager", "Inventory Manager", "Purchasing Officer"].includes(role)) {
      throw redirect({ to: roleRoutes[role] });
    }
  },
  head: () => ({
    meta: [
      { title: "Aggregator Sync Engine Demo — cloudynationpos" },
      {
        name: "description",
        content:
          "Interactive demo of the cloudynationpos aggregator sync engine: unified Talabat, Careem, InstaShop and Deliveroo order queue, stock auto-sync and one-click menu publishing.",
      },
      { property: "og:title", content: "cloudynationpos Aggregator Sync Engine Demo" },
      { property: "og:description", content: "Unified delivery orders, live stock sync and a per-branch API vault." },
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

  const visible = tab === "All" ? aggOrders : aggOrders.filter((o) => o.channel === tab);

  return (
    <DemoShell
      title="Aggregator Sync Engine"
      subtitle="Unified ingestion and live stock sync across Talabat, Careem, InstaShop and Deliveroo."
      actions={
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
          {publishing ? "Publishing…" : "Publish to all aggregators"}
        </Button>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Live orders in queue" value={String(aggOrders.length)} delta="+18% vs last hour" icon={RefreshCw} />
        <StatCard label="Channels connected" value="4 / 4" delta="All healthy" icon={Link2} tone="success" />
        <StatCard label="Avg ingestion latency" value="820 ms" icon={Timer} />
        <StatCard label="Stock sync events today" value="12,486" icon={RefreshCw} tone="accent" />
      </div>

      <Tabs defaultValue="queue" className="mt-8">
        <TabsList className="rounded-xl">
          <TabsTrigger value="queue">Order queue</TabsTrigger>
          <TabsTrigger value="stock">Stock sync</TabsTrigger>
          <TabsTrigger value="vault">API credentials</TabsTrigger>
        </TabsList>

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

        <TabsContent value="stock" className="mt-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="panel p-6">
              <h2 className="text-sm font-bold text-ink">Stock auto-sync per branch</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                When enabled, every till sale instantly deducts availability across all connected
                aggregator menus.
              </p>
              <div className="mt-5 space-y-3">
                {outlets.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">{o.name}</p>
                      <p className="text-xs text-muted-foreground">{o.emirate} · 4 channels linked</p>
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
                onClick={() => toast.success("Catalog, promos and stock status published to 4 channels")}
              >
                <Rocket className="mr-1.5 h-4 w-4" /> Publish now
              </Button>
            </div>
          </div>
        </TabsContent>

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
            OAuth tokens and API keys are stored per branch, encrypted at rest with AES-256 and never
            exposed to the till.
          </p>
        </TabsContent>
      </Tabs>
    </DemoShell>
  );
}
