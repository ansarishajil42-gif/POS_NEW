import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Building2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Logo } from "@/components/site/Logo";
import { useAuth, type Role } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  const { login } = useAuth();
  const [role, setRole] = useState<Role>("Head Office Admin");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-2 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        
        <div className="overflow-hidden rounded-3xl border border-border/50 bg-surface/50 p-8 backdrop-blur-xl shadow-xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-ink">Sign in to your account</h1>
            <p className="mt-2 text-sm text-muted-foreground">Demo environment — select your role below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5 pt-2">
              <Label htmlFor="role">Select Role</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Super Admin">Super Admin (Platform Owner)</SelectItem>
                  <SelectItem value="Head Office Admin">Head Office Admin (Tenant Admin)</SelectItem>
                  <SelectItem value="Store Manager">Store Manager</SelectItem>
                  <SelectItem value="Inventory Manager">Inventory Manager</SelectItem>
                  <SelectItem value="Purchasing Officer">Purchasing Officer</SelectItem>
                  <SelectItem value="Cashier">Cashier</SelectItem>
                  <SelectItem value="Vendor">Vendor (External)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="mt-2 w-full rounded-xl py-6 font-bold text-base shadow-md transition-transform hover:-translate-y-0.5">
              <KeyRound className="mr-2 h-5 w-5" /> Sign in
            </Button>
          </form>
          
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Building2 className="h-4 w-4" /> White-Label POS Platform Demo
          </div>
        </div>
      </div>
    </div>
  );
}
