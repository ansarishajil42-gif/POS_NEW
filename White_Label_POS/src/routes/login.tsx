import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Building2, KeyRound, Lock, Mail, Eye, EyeOff } from "lucide-react";
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
import { useAuth, getTenantsAndBranchesFn, getBranchCashiersAndTillsFn, resetCashierPinSelfFn } from "@/lib/auth";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [selectedCashierId, setSelectedCashierId] = useState("");
  const [selectedTillId, setSelectedTillId] = useState("");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [cashiersList, setCashiersList] = useState<{ id: string; name: string | null; email: string | null }[]>([]);
  const [tillsList, setTillsList] = useState<{ id: string; name: string; status: string }[]>([]);

  // Forgot PIN state
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetPin, setResetPin] = useState("");
  const [resetConfirmPin, setResetConfirmPin] = useState("");
  const [isResetting, setIsResetting] = useState(false);

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

  useEffect(() => {
    async function loadBranchDetails() {
      if (!selectedTenant || !selectedBranch) {
        setCashiersList([]);
        setTillsList([]);
        setSelectedCashierId("");
        setSelectedTillId("");
        return;
      }
      try {
        const res = await getBranchCashiersAndTillsFn({
          data: { tenantId: selectedTenant, branchId: selectedBranch }
        });
        if (res.success && res.cashiers && res.tills) {
          setCashiersList(res.cashiers);
          setTillsList(res.tills);
        } else {
          toast.error(res.error || "Failed to load branch details");
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load branch details");
      }
    }
    loadBranchDetails();
  }, [selectedTenant, selectedBranch]);

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
    if (!selectedTenant || !selectedBranch || !selectedCashierId || !selectedTillId || !pin) {
      toast.error("Please select tenant, branch, cashier, till and enter PIN");
      return;
    }
    setIsLoading(true);
    const res = await pinLogin(selectedTenant, selectedBranch, selectedCashierId, selectedTillId, pin);
    setIsLoading(false);
    if (res.success) {
      toast.success("Cashier signed in successfully!");
    } else {
      toast.error(res.error || "Authentication failed");
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail || !resetPassword || !resetPin || !resetConfirmPin) {
      toast.error("Please fill in all reset fields");
      return;
    }
    if (resetPin !== resetConfirmPin) {
      toast.error("New PIN and confirm PIN do not match");
      return;
    }
    if (!/^\d{4}$/.test(resetPin)) {
      toast.error("PIN must be exactly 4 digits");
      return;
    }
    setIsResetting(true);
    try {
      const res = await resetCashierPinSelfFn({
        data: {
          email: resetEmail,
          currentPass: resetPassword,
          newPin: resetPin,
          confirmPin: resetConfirmPin,
        }
      });
      if (res.success) {
        toast.success("PIN reset successfully!");
        setForgotModalOpen(false);
        setResetEmail("");
        setResetPassword("");
        setResetPin("");
        setResetConfirmPin("");
      } else {
        toast.error(res.error || "Failed to reset PIN");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to reset PIN");
    } finally {
      setIsResetting(false);
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
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-11 rounded-xl py-6"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
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
                    setSelectedBranch("");
                    setSelectedCashierId("");
                    setSelectedTillId("");
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
                  onValueChange={(v) => {
                    setSelectedBranch(v);
                    setSelectedCashierId("");
                    setSelectedTillId("");
                  }}
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

              {selectedBranch && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="cashier-select">Cashier / Staff</Label>
                    <Select
                      value={selectedCashierId}
                      onValueChange={setSelectedCashierId}
                    >
                      <SelectTrigger className="rounded-xl py-6">
                        <SelectValue placeholder="Select Cashier" />
                      </SelectTrigger>
                      <SelectContent>
                        {cashiersList.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="till-select">Till Terminal</Label>
                    <Select
                      value={selectedTillId}
                      onValueChange={setSelectedTillId}
                    >
                      <SelectTrigger className="rounded-xl py-6">
                        <SelectValue placeholder="Select Till Terminal" />
                      </SelectTrigger>
                      <SelectContent>
                        {tillsList.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} ({t.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="pin">Cashier PIN</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pin"
                    type={showPin ? "text" : "password"}
                    maxLength={4}
                    placeholder="••••"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                    className="pl-11 pr-11 rounded-xl py-6 text-center text-xl font-bold tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink transition-colors"
                  >
                    {showPin ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs font-semibold text-primary hover:underline transition-all"
                >
                  Forgot / Reset PIN?
                </button>
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

          {/* Forgot PIN Modal Dialog */}
          <Dialog open={forgotModalOpen} onOpenChange={(open) => {
            if (!isResetting) {
              setForgotModalOpen(open);
              if (!open) {
                setResetEmail("");
                setResetPassword("");
                setResetPin("");
                setResetConfirmPin("");
              }
            }
          }}>
            <DialogContent className="sm:max-w-md w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Reset Cashier PIN</DialogTitle>
                <DialogDescription>
                  Re-authenticate with your email and password to securely change your 4-digit PIN.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleResetSubmit} className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="cashier@supermarket.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="reset-pass">Current Password</Label>
                  <Input
                    id="reset-pass"
                    type="password"
                    placeholder="••••••••"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reset-pin">New 4-digit PIN</Label>
                    <Input
                      id="reset-pin"
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={resetPin}
                      onChange={(e) => setResetPin(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="reset-cpin">Confirm PIN</Label>
                    <Input
                      id="reset-cpin"
                      type="password"
                      maxLength={4}
                      placeholder="••••"
                      value={resetConfirmPin}
                      onChange={(e) => setResetConfirmPin(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                </div>

                <DialogFooter className="flex justify-end gap-2 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setForgotModalOpen(false);
                      setResetEmail("");
                      setResetPassword("");
                      setResetPin("");
                      setResetConfirmPin("");
                    }}
                    disabled={isResetting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isResetting}>
                    {isResetting ? "Resetting..." : "Reset PIN"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-4 w-4" /> White-Label POS Platform Secure Login
          </div>
        </div>
      </div>
    </div>
  );
}
