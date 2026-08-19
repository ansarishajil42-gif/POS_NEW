import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, KeyRound, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/site/Logo";
import { useAuth, getTenantsAndBranchesFn } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  component: Login,
});

interface Tenant {
  id: string;
  name: string;
}

interface Branch {
  id: string;
  tenantId: string;
  name: string;
}

function Login() {
  const { login, pinLogin } = useAuth();
  
  // Tab state
  const [loginMethod, setLoginMethod] = useState<"credentials" | "pin">("credentials");
  
  // Credentials state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // PIN state
  const [selectedTenant, setSelectedTenant] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [pin, setPin] = useState("");
  
  // UI helpers
  const [tenantsList, setTenantsList] = useState<Tenant[]>([]);
  const [branchesList, setBranchesList] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadBranches() {
      try {
        const res = await getTenantsAndBranchesFn();
        if (res.success && res.tenants && res.branches) {
          setTenantsList(res.tenants);
          setBranchesList(res.branches);
        }
      } catch (err) {
        console.error("Failed to load tenants and branches:", err);
      }
    }
    loadBranches();
  }, []);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }
    setIsLoading(true);
    const res = await login(email, password);
    setIsLoading(false);
    if (res.success) {
      toast.success("Welcome back!");
    } else {
      toast.error(res.error || "Invalid email or password");
    }
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant || !selectedBranch || !pin) {
      toast.error("Please select tenant, branch and enter PIN");
      return;
    }
    setIsLoading(true);
    const res = await pinLogin(selectedTenant, selectedBranch, pin);
    setIsLoading(false);
    if (res.success) {
      toast.success("Cashier signed in successfully!");
    } else {
      toast.error(res.error || "Invalid PIN");
    }
  };

  // Filter branches for selected tenant
  const activeBranches = branchesList.filter(b => b.tenantId === selectedTenant);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-2 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        
        <div className="overflow-hidden rounded-3xl border border-border/50 bg-surface/50 p-8 backdrop-blur-xl shadow-xl">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">Sign in to your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">Select login method below</p>
          </div>

          {/* Tab Selector */}
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-surface-3 p-1 text-sm font-medium">
            <button
              onClick={() => setLoginMethod("credentials")}
              className={`rounded-lg py-2.5 transition-colors ${
                loginMethod === "credentials"
                  ? "bg-surface text-ink shadow"
                  : "text-muted-foreground hover:text-ink"
              }`}
            >
              Email & Password
            </button>
            <button
              onClick={() => setLoginMethod("pin")}
              className={`rounded-lg py-2.5 transition-colors ${
                loginMethod === "pin"
                  ? "bg-surface text-ink shadow"
                  : "text-muted-foreground hover:text-ink"
              }`}
            >
              Cashier PIN Login
            </button>
          </div>

          {loginMethod === "credentials" ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 rounded-xl py-6"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 rounded-xl py-6"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="mt-4 w-full rounded-xl py-6 font-bold text-base shadow-md transition-transform hover:-translate-y-0.5"
              >
                <KeyRound className="mr-2 h-5 w-5" /> {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePinSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="tenant">Tenant</Label>
                <Select
                  value={selectedTenant}
                  onValueChange={(v) => {
                    setSelectedTenant(v);
                    setSelectedBranch(""); // Reset branch on tenant change
                  }}
                >
                  <SelectTrigger className="rounded-xl py-6">
                    <SelectValue placeholder="Select Tenant" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenantsList.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="branch">Branch / Outlet</Label>
                <Select
                  value={selectedBranch}
                  onValueChange={setSelectedBranch}
                  disabled={!selectedTenant}
                >
                  <SelectTrigger className="rounded-xl py-6">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeBranches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pin">Cashier PIN</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pin"
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className="pl-11 rounded-xl py-6 text-center text-xl font-bold tracking-widest"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="mt-4 w-full rounded-xl py-6 font-bold text-base shadow-md transition-transform hover:-translate-y-0.5"
              >
                <KeyRound className="mr-2 h-5 w-5" /> {isLoading ? "Authenticating PIN..." : "Access Till"}
              </Button>
            </form>
          )}
          
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-4 w-4" /> White-Label POS Platform Secure Login
          </div>
        </div>
      </div>
    </div>
  );
}
