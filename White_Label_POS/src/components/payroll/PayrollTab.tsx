import { useState, useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Pencil,
  Wallet,
  Building2,
  Users,
  CheckCircle2,
  CreditCard,
  Banknote,
  Calendar,
  AlertCircle,
  RefreshCw,
  Landmark,
  CalendarCheck,
  CalendarRange,
  Coins,
} from "lucide-react";
import {
  getStaffSalaryProfilesFn,
  upsertSalaryProfileFn,
} from "@/lib/payroll-server";
import { AttendanceTab } from "./AttendanceTab";
import { LeaveRequestsTab } from "./LeaveRequestsTab";
import { PayrollRunsTab } from "./PayrollRunsTab";

interface StaffProfileItem {
  staffId: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  isActive: boolean | null;
  createdAt: string | null;
  branchId: string | null;
  branchName: string;
  profileId: string | null;
  hasProfile: boolean;
  basicSalary: number;
  housingAllowance: number;
  transportAllowance: number;
  otherAllowances: number;
  standardDeductions: number;
  totalAllowances: number;
  grossSalary: number;
  netEstimated: number;
  paymentFrequency: string;
  currency: string;
  bankName: string;
  iban: string;
  joinDate: string | null;
  updatedAt: string | null;
}

const roleLabelMap: Record<string, string> = {
  super_admin: "Super Admin",
  head_office_admin: "Head Office Admin",
  branch_manager: "Branch Manager",
  inventory_manager: "Inventory Manager",
  purchasing_officer: "Purchasing Officer",
  cashier: "Cashier",
  vendor: "Vendor",
};

const formatAED = (amount: number) => {
  return `AED ${amount.toLocaleString("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export function PayrollTab() {
  const [subView, setSubView] = useState<"profiles" | "attendance" | "leave" | "runs">("profiles");
  const [profiles, setProfiles] = useState<StaffProfileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<string>("all");

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffProfileItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const tableWrapperRef = useRef<HTMLDivElement>(null);

  // Form State
  const [formBasicSalary, setFormBasicSalary] = useState<string>("0");
  const [formHousingAllowance, setFormHousingAllowance] = useState<string>("0");
  const [formTransportAllowance, setFormTransportAllowance] = useState<string>("0");
  const [formOtherAllowances, setFormOtherAllowances] = useState<string>("0");
  const [formStandardDeductions, setFormStandardDeductions] = useState<string>("0");
  const [formPaymentFrequency, setFormPaymentFrequency] = useState<string>("monthly");
  const [formCurrency, setFormCurrency] = useState<string>("AED");
  const [formBankName, setFormBankName] = useState<string>("");
  const [formIban, setFormIban] = useState<string>("");
  const [formJoinDate, setFormJoinDate] = useState<string>("");

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await getStaffSalaryProfilesFn({
        data: { branchId: selectedBranch },
      });
      if (res.success) {
        setProfiles(res.staffProfiles as StaffProfileItem[]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load staff salary profiles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, [selectedBranch]);

  // Ensure table scroll starts at the far left so Employee column is always visible
  useEffect(() => {
    if (tableWrapperRef.current) {
      const scrollable = tableWrapperRef.current.querySelector(".overflow-x-auto");
      if (scrollable) {
        scrollable.scrollLeft = 0;
      }
    }
  }, [profiles, search, selectedBranch]);

  // Unique branches for filter
  const branchOptions = useMemo(() => {
    const map = new Map<string, string>();
    profiles.forEach((p) => {
      if (p.branchId && p.branchName && p.branchName !== "Unassigned") {
        map.set(p.branchId, p.branchName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [profiles]);

  // Filtered profiles by search
  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const role = (roleLabelMap[p.role] || p.role).toLowerCase();
      const branch = (p.branchName || "").toLowerCase();
      const email = (p.email || "").toLowerCase();
      const bank = (p.bankName || "").toLowerCase();
      return (
        name.includes(q) ||
        role.includes(q) ||
        branch.includes(q) ||
        email.includes(q) ||
        bank.includes(q)
      );
    });
  }, [profiles, search]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalStaff = profiles.length;
    const configuredCount = profiles.filter((p) => p.hasProfile).length;
    const totalBasic = profiles.reduce((sum, p) => sum + p.basicSalary, 0);
    const totalGross = profiles.reduce((sum, p) => sum + p.grossSalary, 0);
    return {
      totalStaff,
      configuredCount,
      totalBasic,
      totalGross,
    };
  }, [profiles]);

  const handleOpenEdit = (staff: StaffProfileItem) => {
    setEditingStaff(staff);
    setFormBasicSalary(staff.basicSalary.toString());
    setFormHousingAllowance(staff.housingAllowance.toString());
    setFormTransportAllowance(staff.transportAllowance.toString());
    setFormOtherAllowances(staff.otherAllowances.toString());
    setFormStandardDeductions(staff.standardDeductions.toString());
    setFormPaymentFrequency(staff.paymentFrequency || "monthly");
    setFormCurrency(staff.currency || "AED");
    setFormBankName(staff.bankName || "");
    setFormIban(staff.iban || "");
    setFormJoinDate(staff.joinDate || "");
    setEditModalOpen(true);
  };

  const handleSaveSalary = async () => {
    if (!editingStaff) return;
    try {
      setIsSaving(true);
      const res = await upsertSalaryProfileFn({
        data: {
          staffUserId: editingStaff.staffId,
          basicSalary: parseFloat(formBasicSalary) || 0,
          housingAllowance: parseFloat(formHousingAllowance) || 0,
          transportAllowance: parseFloat(formTransportAllowance) || 0,
          otherAllowances: parseFloat(formOtherAllowances) || 0,
          standardDeductions: parseFloat(formStandardDeductions) || 0,
          paymentFrequency: formPaymentFrequency,
          currency: formCurrency,
          bankName: formBankName,
          iban: formIban,
          joinDate: formJoinDate || null,
        },
      });

      if (res.success) {
        toast.success(`Salary profile updated for ${editingStaff.name}`);
        setEditModalOpen(false);
        fetchProfiles();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update salary profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Live preview calculations for Edit Form
  const liveBasic = parseFloat(formBasicSalary) || 0;
  const liveHousing = parseFloat(formHousingAllowance) || 0;
  const liveTransport = parseFloat(formTransportAllowance) || 0;
  const liveOther = parseFloat(formOtherAllowances) || 0;
  const liveDeductions = parseFloat(formStandardDeductions) || 0;
  const liveTotalAllowances = liveHousing + liveTransport + liveOther;
  const liveGross = liveBasic + liveTotalAllowances;
  const liveNet = Math.max(0, liveGross - liveDeductions);

  return (
    <div className="space-y-6">
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              {subView === "profiles" ? (
                <Wallet className="h-5 w-5" />
              ) : subView === "attendance" ? (
                <CalendarCheck className="h-5 w-5" />
              ) : subView === "leave" ? (
                <CalendarRange className="h-5 w-5" />
              ) : (
                <Coins className="h-5 w-5" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-ink">
                {subView === "profiles"
                  ? "Payroll Management"
                  : subView === "attendance"
                  ? "Daily Attendance Tracking"
                  : subView === "leave"
                  ? "Leave Requests Management"
                  : "Payroll Runs & Calculation Engine"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {subView === "profiles"
                  ? "Employee compensation, allowances, deductions, and banking profile (Phase 1)"
                  : subView === "attendance"
                  ? "Daily roster marking, working hours, and status tracking (Phase 2)"
                  : subView === "leave"
                  ? "Employee leave requests, approvals, and balance tracking (Phase 3)"
                  : "Monthly payroll run generation, attendance & leave deduction prorating, and disbursement lifecycle (Phase 4)"}
              </p>
            </div>
          </div>
        </div>

        {subView === "profiles" && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProfiles}
              disabled={loading}
              className="h-9 gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        )}
      </div>

      {/* Sub-view Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto vip-scrollbar">
        <button
          type="button"
          onClick={() => setSubView("profiles")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            subView === "profiles"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-white text-muted-foreground hover:text-ink hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <Wallet className="h-4 w-4" />
          Salary Profiles
        </button>
        <button
          type="button"
          onClick={() => setSubView("attendance")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            subView === "attendance"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-white text-muted-foreground hover:text-ink hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <CalendarCheck className="h-4 w-4" />
          Attendance
        </button>
        <button
          type="button"
          onClick={() => setSubView("leave")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            subView === "leave"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-white text-muted-foreground hover:text-ink hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <CalendarRange className="h-4 w-4" />
          Leave Requests
        </button>
        <button
          type="button"
          onClick={() => setSubView("runs")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
            subView === "runs"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-white text-muted-foreground hover:text-ink hover:bg-gray-50 border border-gray-200"
          }`}
        >
          <Coins className="h-4 w-4" />
          Payroll Runs
        </button>
      </div>

      {subView === "attendance" ? (
        <AttendanceTab />
      ) : subView === "leave" ? (
        <LeaveRequestsTab />
      ) : subView === "runs" ? (
        <PayrollRunsTab />
      ) : (
        <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Employees
            </span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">
              {summaryMetrics.totalStaff}
            </span>
            <span className="text-xs text-muted-foreground">registered staff</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Salary Profiles Set
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">
              {summaryMetrics.configuredCount}
            </span>
            <span className="text-xs text-muted-foreground">
              of {summaryMetrics.totalStaff} configured
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Basic Payroll
            </span>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">
              {formatAED(summaryMetrics.totalBasic)}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">Monthly base salaries</span>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Gross Payroll
            </span>
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-ink">
              {formatAED(summaryMetrics.totalGross)}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground">Base + All Fixed Allowances</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by employee name, role, branch, bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={selectedBranch}
            onValueChange={(val) => setSelectedBranch(val)}
          >
            <SelectTrigger className="w-[180px] h-9 text-xs">
              <SelectValue placeholder="Filter Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>
              {branchOptions.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Staff Salary Profiles Table */}
      <div ref={tableWrapperRef} className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/75 hover:bg-gray-50/75">
              <TableHead className="sticky left-0 bg-gray-50/95 backdrop-blur-sm z-20 shadow-[4px_0_8px_rgba(0,0,0,0.06)] border-r border-gray-200/80 text-xs font-semibold text-muted-foreground min-w-[210px] pl-4">
                Employee
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground min-w-[130px] whitespace-nowrap">Role</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground min-w-[120px] whitespace-nowrap">Branch</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[110px] whitespace-nowrap">Basic Salary</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[120px] whitespace-nowrap">Total Allowances</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[110px] whitespace-nowrap">Gross Salary</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground min-w-[150px] whitespace-nowrap">Bank / IBAN</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground text-center min-w-[95px] whitespace-nowrap">Status</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[110px] whitespace-nowrap pr-4">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Loading employee salary records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredProfiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-32 text-center text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <Users className="h-8 w-8 text-gray-300 mb-1" />
                    <p className="font-semibold text-ink">No staff members found</p>
                    <p className="text-xs text-muted-foreground">
                      {search ? "Try adjusting your search criteria" : "Add staff in Staff & Roles first"}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredProfiles.map((staff) => (
                <TableRow key={staff.staffId} className="hover:bg-gray-50/50 transition-colors group">
                  {/* Name & Email - Pinned Sticky Left Column */}
                  <TableCell className="sticky left-0 bg-white group-hover:bg-gray-50/95 backdrop-blur-sm z-10 shadow-[4px_0_8px_rgba(0,0,0,0.06)] border-r border-gray-200/80 min-w-[210px] pl-4 transition-colors">
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-ink">{staff.name}</span>
                      <span className="text-xs text-muted-foreground">{staff.email || staff.phone || "No email"}</span>
                    </div>
                  </TableCell>

                  {/* Role */}
                  <TableCell className="whitespace-nowrap">
                    <Badge variant="outline" className="text-[11px] font-medium capitalize">
                      {roleLabelMap[staff.role] || staff.role}
                    </Badge>
                  </TableCell>

                  {/* Branch */}
                  <TableCell className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Building2 className="h-3.5 w-3.5 shrink-0" />
                      <span>{staff.branchName}</span>
                    </div>
                  </TableCell>

                  {/* Basic Salary */}
                  <TableCell className="text-right font-medium text-xs whitespace-nowrap">
                    {staff.basicSalary > 0 ? (
                      formatAED(staff.basicSalary)
                    ) : (
                      <span className="text-muted-foreground/60 italic">AED 0.00</span>
                    )}
                  </TableCell>

                  {/* Allowances */}
                  <TableCell className="text-right text-xs whitespace-nowrap">
                    {staff.totalAllowances > 0 ? (
                      <span className="text-emerald-600 font-medium">
                        +{formatAED(staff.totalAllowances)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60 italic">AED 0.00</span>
                    )}
                  </TableCell>

                  {/* Gross Salary */}
                  <TableCell className="text-right whitespace-nowrap">
                    <span className="font-bold text-sm text-ink">
                      {formatAED(staff.grossSalary)}
                    </span>
                  </TableCell>

                  {/* Bank Info */}
                  <TableCell className="whitespace-nowrap">
                    {staff.bankName ? (
                      <div className="flex flex-col max-w-[170px]">
                        <span className="text-xs font-medium text-ink truncate">{staff.bankName}</span>
                        <span className="text-[10px] text-muted-foreground truncate font-mono">
                          {staff.iban || "No IBAN"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground/60 italic">Not set</span>
                    )}
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="text-center whitespace-nowrap">
                    {staff.hasProfile ? (
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-200 text-[10px] font-medium">
                        Configured
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50/50 text-[10px] font-medium">
                        Pending
                      </Badge>
                    )}
                  </TableCell>

                  {/* Action */}
                  <TableCell className="text-right whitespace-nowrap pr-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(staff)}
                      className="h-8 gap-1 text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Salary
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Salary Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Wallet className="h-5 w-5 text-emerald-600" />
              Salary & Compensation Profile
            </DialogTitle>
            <DialogDescription>
              {editingStaff && (
                <span>
                  Configure compensation, allowances, and banking information for{" "}
                  <strong className="text-ink">{editingStaff.name}</strong> (
                  {roleLabelMap[editingStaff.role] || editingStaff.role} •{" "}
                  {editingStaff.branchName})
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Compensation Section */}
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40 space-y-3">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Banknote className="h-4 w-4 text-emerald-600" />
                Monthly Earnings & Allowances
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Basic Salary (AED) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formBasicSalary}
                    onChange={(e) => setFormBasicSalary(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Housing Allowance (AED)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formHousingAllowance}
                    onChange={(e) => setFormHousingAllowance(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Transport Allowance (AED)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formTransportAllowance}
                    onChange={(e) => setFormTransportAllowance(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Other Allowances (AED)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formOtherAllowances}
                    onChange={(e) => setFormOtherAllowances(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Deductions & Frequency */}
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40 space-y-3">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                Deductions & Payment Terms
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Standard Monthly Deductions (AED)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={formStandardDeductions}
                    onChange={(e) => setFormStandardDeductions(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Payment Frequency</Label>
                  <Select
                    value={formPaymentFrequency}
                    onValueChange={setFormPaymentFrequency}
                  >
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">Currency</Label>
                  <Input
                    disabled
                    value={formCurrency}
                    className="bg-gray-100 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Banking & Join Date Section */}
            <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40 space-y-3">
              <h4 className="text-xs font-bold text-ink uppercase tracking-wider flex items-center gap-1.5">
                <Landmark className="h-4 w-4 text-blue-600" />
                Bank Account & Employment Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Bank Name</Label>
                  <Input
                    placeholder="e.g. Emirates NBD, ADCB, FAB"
                    value={formBankName}
                    onChange={(e) => setFormBankName(e.target.value)}
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs">IBAN Number</Label>
                  <Input
                    placeholder="AE2803300000..."
                    value={formIban}
                    onChange={(e) => setFormIban(e.target.value)}
                    className="text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Employment Join Date
                  </Label>
                  <Input
                    type="date"
                    value={formJoinDate}
                    onChange={(e) => setFormJoinDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Real-time Compensation Calculation Summary Box */}
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">
                    Basic Salary
                  </span>
                  <span className="text-sm font-semibold text-ink">
                    {formatAED(liveBasic)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">
                    Total Allowances
                  </span>
                  <span className="text-sm font-semibold text-emerald-700">
                    +{formatAED(liveTotalAllowances)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">
                    Gross Monthly Salary
                  </span>
                  <span className="text-sm font-bold text-ink">
                    {formatAED(liveGross)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-muted-foreground block font-medium">
                    Estimated Net Pay
                  </span>
                  <span className="text-sm font-bold text-emerald-700">
                    {formatAED(liveNet)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveSalary}
              disabled={isSaving}
              className="gap-1.5"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Salary Profile"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </>
      )}
    </div>
  );
}
