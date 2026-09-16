import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Building2, Layers, Monitor, Truck, Store, Boxes, ShoppingCart, Briefcase, Menu, X, BookOpen, User, KeyRound, Save, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Logo } from "@/components/site/Logo";
import { cn } from "@/lib/utils";

import { useAuth } from "@/lib/auth";
import { getMyProfileFn, updateMyProfileFn, changeMyPasswordFn, type MyProfileData } from "@/lib/my-profile-server";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const allNav = [
    { to: "/super-admin", label: "Super Admin", icon: Layers },
    { to: "/super-admin-blog", label: "Blog Posts", icon: BookOpen },
    { to: "/head-office", label: "Head Office", icon: Building2 },
    { to: "/store-manager", label: "Store Dashboard", icon: Store },
    { to: "/inventory-manager", label: "Inventory", icon: Boxes },
    { to: "/purchasing", label: "Purchasing", icon: ShoppingCart },
    { to: "/pos-till", label: "POS Till", icon: Monitor },
    { to: "/aggregators", label: "Aggregator Sync", icon: Truck },
    { to: "/vendor-portal", label: "Vendor Portal", icon: Briefcase },
] satisfies { to: string; label: string; icon: LucideIcon }[];

export function DemoShell({
    title,
    subtitle,
    actions,
    subNav,
    children,
}: {
    title: string;
    subtitle: string;
    actions?: ReactNode;
    subNav?: { id: string; label: string; icon: LucideIcon; active: boolean; onClick: () => void }[];
    children: ReactNode;
}) {
    const { role, isLoaded, logout } = useAuth();
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    // Profile & Account Settings Dialog State
    const [profileOpen, setProfileOpen] = useState(false);
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileSaving, setProfileSaving] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [profileData, setProfileData] = useState<MyProfileData | null>(null);

    const [nameInput, setNameInput] = useState("");
    const [phoneInput, setPhoneInput] = useState("");
    const [addressInput, setAddressInput] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleOpenProfile = async () => {
        setProfileOpen(true);
        setProfileLoading(true);
        try {
            const res = await getMyProfileFn();
            if (res.success && res.data) {
                setProfileData(res.data);
                setNameInput(res.data.name || "");
                setPhoneInput(res.data.phone || "");
                setAddressInput(res.data.address || "");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to load profile");
        } finally {
            setProfileLoading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setProfileSaving(true);
        try {
            const res = await updateMyProfileFn({
                data: {
                    name: nameInput,
                    phone: phoneInput,
                    address: addressInput,
                },
            });
            if (res.success) {
                toast.success(res.message || "Profile updated successfully!");
                if (profileData) {
                    setProfileData({
                        ...profileData,
                        name: nameInput,
                        phone: phoneInput,
                        address: addressInput,
                    });
                }
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to update profile");
        } finally {
            setProfileSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Please fill in all password fields");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("New password and confirmation do not match");
            return;
        }
        if (newPassword.length < 6) {
            toast.error("New password must be at least 6 characters long");
            return;
        }

        setPasswordSaving(true);
        try {
            const res = await changeMyPasswordFn({
                data: {
                    currentPassword,
                    newPassword,
                    confirmPassword,
                },
            });
            if (res.success) {
                toast.success(res.message || "Password changed successfully!");
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to change password");
        } finally {
            setPasswordSaving(false);
        }
    };

    const nav = allNav.filter((n) => {
        if (!role) return false;
        if (role === "Super Admin") return n.to === "/super-admin" || n.to === "/super-admin-blog";
        if (role === "Head Office Admin") return n.to === "/head-office" || n.to === "/aggregators";
        if (role === "Branch Manager") return n.to === "/store-manager";
        if (role === "Inventory Manager") return n.to === "/inventory-manager";
        if (role === "Purchasing Officer") return n.to === "/purchasing";
        if (role === "Cashier") return n.to === "/pos-till";
        if (role === "Vendor") return n.to === "/vendor-portal";
        return false;
    });

    return (
        <div className="min-h-screen bg-surface-2">
            <div className="mx-auto flex max-w-[1500px] flex-col lg:flex-row">
                <aside className="sticky top-0 z-40 border-b border-border bg-surface px-4 py-3 flex flex-col lg:h-screen lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0 lg:px-5 lg:py-6">
                    <div className="flex items-center justify-between w-full">
                        <Link to="/" className="inline-flex" onClick={() => setIsMobileNavOpen(false)}>
                            <Logo />
                        </Link>
                        <button
                            type="button"
                            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
                            className="grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface-2 text-ink lg:hidden"
                            aria-label="Toggle navigation menu"
                        >
                            {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </button>
                    </div>

                    <div className={cn("w-full transition-all duration-200", isMobileNavOpen ? "block mt-3" : "hidden lg:block")}>
                        <nav className="flex flex-col gap-1.5 lg:mt-8">
                            {nav.map((n) => (
                                <Link
                                    key={n.to}
                                    to={n.to}
                                    onClick={() => setIsMobileNavOpen(false)}
                                    activeProps={{ "data-active": "true" }}
                                    className={cn(
                                        "group flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-ink",
                                        "data-[active=true]:bg-primary/10 data-[active=true]:text-primary",
                                    )}
                                >
                                    <n.icon className="h-4 w-4" />
                                    {n.label}
                                </Link>
                            ))}

                            {subNav && subNav.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-border/60 flex flex-col gap-1">
                                    <p className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground/70 mb-1">
                                        Super Admin Sections
                                    </p>
                                    {subNav.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                item.onClick();
                                                setIsMobileNavOpen(false);
                                            }}
                                            className={cn(
                                                "group flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-all w-full text-left cursor-pointer",
                                                item.active
                                                    ? "bg-primary/10 text-primary font-bold shadow-none"
                                                    : "text-muted-foreground hover:bg-secondary hover:text-ink"
                                            )}
                                        >
                                            <item.icon className="h-4 w-4 shrink-0" />
                                            <span>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </nav>

                        {isLoaded && role && (
                            <div className="mt-4 rounded-2xl border border-border bg-surface-2 p-4 lg:mt-auto lg:absolute lg:bottom-6 lg:left-5 lg:right-5">
                                <div className="flex flex-col gap-2.5">
                                    <div>
                                        <p className="text-xs font-semibold text-ink">Logged in as:</p>
                                        <p className="mt-0.5 text-xs font-extrabold text-primary">{role}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleOpenProfile}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:text-primary transition-colors cursor-pointer"
                                    >
                                        <User className="h-3.5 w-3.5" /> My Profile
                                    </button>
                                    <button
                                        onClick={logout}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive hover:underline cursor-pointer"
                                    >
                                        <ArrowLeft className="h-3.5 w-3.5" /> Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </aside>

                <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{title}</h1>
                            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
                        </div>
                        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
                    </header>
                    {children}
                </main>
            </div>

            {/* User Profile & Account Settings Dialog */}
            <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-base font-bold">
                            <User className="h-4 w-4 text-primary" /> My Profile &amp; Settings
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground">
                            View and update your personal details or change your password.
                        </DialogDescription>
                    </DialogHeader>

                    {profileLoading ? (
                        <div className="flex flex-col items-center justify-center py-10 gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="text-xs text-muted-foreground">Loading profile...</p>
                        </div>
                    ) : (
                        <Tabs defaultValue="profile" className="mt-2 w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="profile" className="text-xs">Profile Information</TabsTrigger>
                                <TabsTrigger value="security" className="text-xs">Security &amp; Password</TabsTrigger>
                            </TabsList>

                            {/* Tab 1: Profile Information */}
                            <TabsContent value="profile" className="space-y-4 pt-3">
                                <div className="flex items-center justify-between rounded-lg border border-border/80 bg-surface-2 p-3">
                                    <div>
                                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Account Role</p>
                                        <div className="mt-1 flex items-center gap-2">
                                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
                                                {profileData?.role || role}
                                            </Badge>
                                            {profileData?.branchName && (
                                                <span className="text-xs text-muted-foreground">· {profileData.branchName}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSaveProfile} className="space-y-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="profile-email" className="text-xs">Email Address (Read-Only)</Label>
                                        <Input
                                            id="profile-email"
                                            value={profileData?.email || ""}
                                            disabled
                                            className="bg-muted text-muted-foreground cursor-not-allowed text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="profile-name" className="text-xs">Full Name</Label>
                                        <Input
                                            id="profile-name"
                                            value={nameInput}
                                            onChange={(e) => setNameInput(e.target.value)}
                                            placeholder="Enter your full name"
                                            className="text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="profile-phone" className="text-xs">Phone Number</Label>
                                        <Input
                                            id="profile-phone"
                                            value={phoneInput}
                                            onChange={(e) => setPhoneInput(e.target.value)}
                                            placeholder="+971 50 123 4567"
                                            className="text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="profile-address" className="text-xs">Physical Address</Label>
                                        <Input
                                            id="profile-address"
                                            value={addressInput}
                                            onChange={(e) => setAddressInput(e.target.value)}
                                            placeholder="City, Emirates, UAE"
                                            className="text-xs"
                                        />
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                        <Button type="submit" size="sm" disabled={profileSaving} className="gap-1.5 text-xs">
                                            {profileSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                            Save Profile
                                        </Button>
                                    </div>
                                </form>
                            </TabsContent>

                            {/* Tab 2: Security & Password */}
                            <TabsContent value="security" className="space-y-4 pt-3">
                                <form onSubmit={handleChangePassword} className="space-y-3">
                                    <div className="space-y-1">
                                        <Label htmlFor="current-pass" className="text-xs">Current Password</Label>
                                        <Input
                                            id="current-pass"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="new-pass" className="text-xs">New Password</Label>
                                        <Input
                                            id="new-pass"
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Min. 6 characters"
                                            className="text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label htmlFor="confirm-pass" className="text-xs">Confirm New Password</Label>
                                        <Input
                                            id="confirm-pass"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Re-enter new password"
                                            className="text-xs"
                                        />
                                    </div>

                                    <div className="pt-2 flex justify-end">
                                        <Button type="submit" size="sm" disabled={passwordSaving} className="gap-1.5 text-xs">
                                            {passwordSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                                            Update Password
                                        </Button>
                                    </div>
                                </form>
                            </TabsContent>
                        </Tabs>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

export function StatCard({
    label,
    value,
    delta,
    icon: Icon,
    tone = "primary",
}: {
    label: string;
    value: string;
    delta?: string;
    icon?: LucideIcon;
    tone?: "primary" | "success" | "accent";
}) {
    const toneMap = {
        primary: "bg-primary text-primary-foreground shadow-primary/20",
        success: "bg-success text-success-foreground shadow-success/20",
        accent: "bg-accent text-accent-foreground shadow-accent/20",
    } as const;

    const bgMap = {
        primary: "from-primary/10 to-transparent",
        success: "from-success/10 to-transparent",
        accent: "from-accent/10 to-transparent",
    };

    return (
        <div className="group relative overflow-hidden rounded-2xl border border-border/50 bg-surface/50 p-6 backdrop-blur-xl shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className={cn("absolute -right-6 -top-6 h-32 w-32 rounded-full bg-gradient-to-br blur-3xl transition-transform duration-500 group-hover:scale-150", bgMap[tone])} />
            <div className="relative z-10 flex items-start justify-between">
                <p className="text-[13px] font-bold tracking-wider text-muted-foreground uppercase">{label}</p>
                {Icon && (
                    <span className={cn("grid h-10 w-10 place-items-center rounded-xl shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:-rotate-6", toneMap[tone])}>
                        <Icon className="h-5 w-5" />
                    </span>
                )}
            </div>
            <p className="relative z-10 mt-5 text-3xl font-black tracking-tight text-ink">{value}</p>
            {delta && (
                <p className="relative z-10 mt-2 text-xs font-bold text-success flex items-center bg-success/10 w-max px-2 py-1 rounded-md">
                    {delta}
                </p>
            )}
        </div>
    );
}
