import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  Coffee,
  Sun,
  Sparkles,
  HelpCircle,
  Search,
  RefreshCw,
  Building2,
  Users,
  CheckCheck,
  Save,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  getAttendanceForDateFn,
  markAttendanceFn,
  bulkMarkPresentFn,
} from "@/lib/payroll-server";

export interface AttendanceRosterItem {
  staffId: string;
  name: string;
  email: string | null;
  phone: string;
  role: string;
  branchId: string | null;
  branchName: string;
  attendanceId: string | null;
  status: string; // 'present' | 'absent' | 'half_day' | 'on_leave' | 'rest_day' | 'public_holiday' | 'unmarked'
  hoursWorked: number;
  notes: string;
  markedBy: string | null;
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

const statusOptions = [
  { value: "present", label: "Present", color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100", dot: "bg-emerald-500", defaultHours: 8 },
  { value: "absent", label: "Absent", color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100", dot: "bg-rose-500", defaultHours: 0 },
  { value: "half_day", label: "Half Day", color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100", dot: "bg-amber-500", defaultHours: 4 },
  { value: "on_leave", label: "On Leave", color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100", dot: "bg-purple-500", defaultHours: 0 },
  { value: "rest_day", label: "Rest Day", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100", dot: "bg-blue-500", defaultHours: 0 },
  { value: "public_holiday", label: "Public Holiday", color: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100", dot: "bg-teal-500", defaultHours: 0 },
  { value: "unmarked", label: "Unmarked", color: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200", dot: "bg-gray-400", defaultHours: 0 },
];

export function AttendanceTab() {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedBranch, setSelectedBranch] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [roster, setRoster] = useState<AttendanceRosterItem[]>([]);
  const [summary, setSummary] = useState({
    totalStaff: 0,
    present: 0,
    absent: 0,
    halfDay: 0,
    onLeave: 0,
    restDay: 0,
    publicHoliday: 0,
    unmarked: 0,
  });

  // Bulk mark present modal
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);

  // Per-row editing state
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [rowEdits, setRowEdits] = useState<Record<string, { hoursWorked: number; notes: string; dirty: boolean }>>({});

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await getAttendanceForDateFn({
        data: { date: selectedDate, branchId: selectedBranch },
      });
      if (res.success) {
        setRoster(res.roster as AttendanceRosterItem[]);
        setSummary(res.summary);
        // Clear local edits
        setRowEdits({});
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load attendance roster");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, selectedBranch]);

  // Unique branches for filter
  const branchOptions = useMemo(() => {
    const map = new Map<string, string>();
    roster.forEach((p) => {
      if (p.branchId && p.branchName && p.branchName !== "Unassigned") {
        map.set(p.branchId, p.branchName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [roster]);

  // Filtered roster by search term
  const filteredRoster = useMemo(() => {
    if (!search.trim()) return roster;
    const q = search.toLowerCase().trim();
    return roster.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.branchName && r.branchName.toLowerCase().includes(q)) ||
        (r.role && r.role.toLowerCase().includes(q))
    );
  }, [roster, search]);

  // Quick day navigation
  const shiftDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  // Immediate status change save
  const handleStatusChange = async (staffId: string, newStatus: string) => {
    const targetStatusObj = statusOptions.find((s) => s.value === newStatus);
    const localEdit = rowEdits[staffId];
    let hours = localEdit ? localEdit.hoursWorked : (targetStatusObj?.defaultHours ?? 8);
    const notes = localEdit ? localEdit.notes : (roster.find((r) => r.staffId === staffId)?.notes || "");

    // Optimistically update roster state
    setRoster((prev) =>
      prev.map((r) => (r.staffId === staffId ? { ...r, status: newStatus, hoursWorked: hours } : r))
    );

    // Update summary counts optimistically
    setSummary((prev) => {
      const oldItem = roster.find((r) => r.staffId === staffId);
      const oldStatus = oldItem?.status || "unmarked";
      if (oldStatus === newStatus) return prev;

      const next = { ...prev };
      if (oldStatus === "present") next.present = Math.max(0, next.present - 1);
      else if (oldStatus === "absent") next.absent = Math.max(0, next.absent - 1);
      else if (oldStatus === "half_day") next.halfDay = Math.max(0, next.halfDay - 1);
      else if (oldStatus === "on_leave") next.onLeave = Math.max(0, next.onLeave - 1);
      else if (oldStatus === "rest_day") next.restDay = Math.max(0, next.restDay - 1);
      else if (oldStatus === "public_holiday") next.publicHoliday = Math.max(0, next.publicHoliday - 1);
      else next.unmarked = Math.max(0, next.unmarked - 1);

      if (newStatus === "present") next.present++;
      else if (newStatus === "absent") next.absent++;
      else if (newStatus === "half_day") next.halfDay++;
      else if (newStatus === "on_leave") next.onLeave++;
      else if (newStatus === "rest_day") next.restDay++;
      else if (newStatus === "public_holiday") next.publicHoliday++;
      else next.unmarked++;

      return next;
    });

    try {
      setSavingRowId(staffId);
      const res = await markAttendanceFn({
        data: {
          staffUserId: staffId,
          date: selectedDate,
          status: newStatus,
          hoursWorked: hours,
          notes,
        },
      });
      if (res.success) {
        toast.success(`Updated attendance to ${targetStatusObj?.label || newStatus}`);
        setRowEdits((prev) => {
          const next = { ...prev };
          delete next[staffId];
          return next;
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update attendance");
      // Re-fetch to sync
      fetchAttendance();
    } finally {
      setSavingRowId(null);
    }
  };

  // Local change for hours
  const handleHoursChange = (staffId: string, value: string) => {
    const num = parseFloat(value) || 0;
    setRowEdits((prev) => ({
      ...prev,
      [staffId]: {
        hoursWorked: num,
        notes: prev[staffId]?.notes ?? (roster.find((r) => r.staffId === staffId)?.notes || ""),
        dirty: true,
      },
    }));
  };

  // Local change for notes
  const handleNotesChange = (staffId: string, value: string) => {
    setRowEdits((prev) => ({
      ...prev,
      [staffId]: {
        hoursWorked: prev[staffId]?.hoursWorked ?? (roster.find((r) => r.staffId === staffId)?.hoursWorked || 8),
        notes: value,
        dirty: true,
      },
    }));
  };

  // Save row details (hours / notes)
  const handleSaveRow = async (staffId: string) => {
    const item = roster.find((r) => r.staffId === staffId);
    if (!item) return;

    const edit = rowEdits[staffId];
    const hours = edit ? edit.hoursWorked : item.hoursWorked;
    const notes = edit ? edit.notes : item.notes;
    const status = item.status === "unmarked" ? "present" : item.status;

    try {
      setSavingRowId(staffId);
      const res = await markAttendanceFn({
        data: {
          staffUserId: staffId,
          date: selectedDate,
          status,
          hoursWorked: hours,
          notes,
        },
      });
      if (res.success) {
        toast.success(`Saved details for ${item.name}`);
        setRoster((prev) =>
          prev.map((r) => (r.staffId === staffId ? { ...r, status, hoursWorked: hours, notes } : r))
        );
        setRowEdits((prev) => {
          const next = { ...prev };
          delete next[staffId];
          return next;
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save attendance details");
    } finally {
      setSavingRowId(null);
    }
  };

  // Bulk mark present execution
  const handleBulkMarkPresent = async () => {
    try {
      setBulkSubmitting(true);
      const res = await bulkMarkPresentFn({
        data: {
          date: selectedDate,
          branchId: selectedBranch,
        },
      });
      if (res.success) {
        toast.success(`Marked all ${res.markedCount} active staff members as Present`);
        setBulkConfirmOpen(false);
        fetchAttendance();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to mark all staff present");
    } finally {
      setBulkSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Action Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        {/* Date Selector with quick previous/next */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => shiftDate(-1)}
            title="Previous Day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="relative flex items-center">
            <CalendarIcon className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-9 h-9 font-medium text-ink w-44"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={() => shiftDate(1)}
            title="Next Day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {selectedDate !== todayStr && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedDate(todayStr)}
              className="h-9 text-xs text-primary font-semibold"
            >
              Today
            </Button>
          )}
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Filter */}
          <div className="w-48">
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All Branches" />
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

          {/* Mark All Present Shortcut */}
          <Button
            onClick={() => setBulkConfirmOpen(true)}
            className="h-9 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
          >
            <CheckCheck className="h-4 w-4" />
            Mark All Present
          </Button>

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAttendance}
            disabled={loading}
            className="h-9 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards for the selected date */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Staff
            </span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-ink">{summary.totalStaff}</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Present
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-emerald-600">{summary.present}</span>
            <span className="text-[10px] text-emerald-600 font-medium">
              {summary.totalStaff > 0 ? `${Math.round((summary.present / summary.totalStaff) * 100)}%` : ""}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Absent
            </span>
            <XCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-rose-600">{summary.absent}</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Half Day
            </span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-amber-600">{summary.halfDay}</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              On Leave
            </span>
            <Coffee className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl font-bold text-purple-700">{summary.onLeave}</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Unmarked
            </span>
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className={`text-xl font-bold ${summary.unmarked > 0 ? "text-amber-600" : "text-gray-500"}`}>
              {summary.unmarked}
            </span>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employee by name, email, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <div className="text-xs text-muted-foreground font-medium">
          Showing {filteredRoster.length} of {roster.length} staff
        </div>
      </div>

      {/* Daily Roster Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/75 hover:bg-gray-50/75 border-b border-gray-200">
              <TableHead className="sticky left-0 bg-gray-50/95 backdrop-blur-sm z-20 shadow-[4px_0_8px_rgba(0,0,0,0.06)] border-r border-gray-200/80 text-xs font-semibold text-muted-foreground min-w-[210px] pl-4">
                Employee
              </TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground min-w-[130px] whitespace-nowrap">Role</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground min-w-[120px] whitespace-nowrap">Branch</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground min-w-[160px] whitespace-nowrap">Status</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground min-w-[110px] whitespace-nowrap">Hours Worked</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground min-w-[180px] whitespace-nowrap">Notes</TableHead>
              <TableHead className="text-xs font-semibold text-muted-foreground text-right min-w-[90px] whitespace-nowrap pr-4">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-44 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                    <span className="text-sm">Loading attendance records...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredRoster.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-36 text-center">
                  <div className="flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
                    <Users className="h-6 w-6 text-gray-400" />
                    <span className="text-sm font-medium">No staff members found</span>
                    <span className="text-xs">Adjust search filters or date to view records</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredRoster.map((item) => {
                const edit = rowEdits[item.staffId];
                const currentHours = edit ? edit.hoursWorked : item.hoursWorked;
                const currentNotes = edit ? edit.notes : item.notes;
                const isDirty = !!edit?.dirty;
                const isSavingThis = savingRowId === item.staffId;
                const isPresentOrHalf = item.status === "present" || item.status === "half_day";

                const currentStatusConfig = statusOptions.find((s) => s.value === item.status) || statusOptions[6];

                return (
                  <TableRow
                    key={item.staffId}
                    className="hover:bg-gray-50/50 transition-colors group"
                  >
                    {/* Employee Info - Sticky Left Column (Matching Image 1) */}
                    <TableCell className="sticky left-0 bg-white group-hover:bg-gray-50/95 backdrop-blur-sm z-10 shadow-[4px_0_8px_rgba(0,0,0,0.06)] border-r border-gray-200/80 min-w-[210px] pl-4 transition-colors">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-ink">{item.name}</span>
                        <span className="text-xs text-muted-foreground">{item.email || item.phone || "No contact"}</span>
                      </div>
                    </TableCell>

                    {/* Role Badge */}
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className="text-[11px] font-medium capitalize">
                        {roleLabelMap[item.role] || item.role}
                      </Badge>
                    </TableCell>

                    {/* Branch */}
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span>{item.branchName}</span>
                      </div>
                    </TableCell>

                    {/* Status Dropdown */}
                    <TableCell className="whitespace-nowrap">
                      <Select
                        value={item.status}
                        onValueChange={(val) => handleStatusChange(item.staffId, val)}
                        disabled={isSavingThis}
                      >
                        <SelectTrigger
                          className={`h-8 text-xs font-semibold rounded-lg border transition-all ${currentStatusConfig.color}`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className={`h-2 w-2 rounded-full shrink-0 ${currentStatusConfig.dot}`} />
                            <span className="truncate">{currentStatusConfig.label}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value} className="text-xs">
                              <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${opt.dot}`} />
                                <span>{opt.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Hours Worked */}
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="24"
                          disabled={!isPresentOrHalf || isSavingThis}
                          value={currentHours}
                          onChange={(e) => handleHoursChange(item.staffId, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveRow(item.staffId);
                          }}
                          className={`h-8 w-20 text-xs font-semibold ${
                            !isPresentOrHalf ? "bg-gray-100 text-gray-400 border-dashed" : "bg-white"
                          }`}
                        />
                        <span className="text-[11px] text-muted-foreground">hrs</span>
                      </div>
                    </TableCell>

                    {/* Notes Input */}
                    <TableCell className="min-w-[180px]">
                      <Input
                        placeholder="Optional notes..."
                        value={currentNotes}
                        disabled={isSavingThis}
                        onChange={(e) => handleNotesChange(item.staffId, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRow(item.staffId);
                        }}
                        className="h-8 text-xs bg-white"
                      />
                    </TableCell>

                    {/* Save Action */}
                    <TableCell className="text-right whitespace-nowrap pr-4">
                      {isSavingThis ? (
                        <div className="flex justify-end pr-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        </div>
                      ) : isDirty ? (
                        <Button
                          size="sm"
                          onClick={() => handleSaveRow(item.staffId)}
                          className="h-8 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm"
                        >
                          <Save className="h-3.5 w-3.5 mr-1" />
                          Save
                        </Button>
                      ) : (
                        <div className="flex justify-end pr-2 text-emerald-600" title="Saved">
                          <CheckCircle2 className="h-4 w-4 opacity-70" />
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirmation Dialog for Bulk Mark Present */}
      <Dialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-emerald-600 mb-1">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200">
                <CheckCheck className="h-5 w-5" />
              </div>
              <DialogTitle className="text-lg font-bold text-ink">
                Mark All Staff Present?
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm text-muted-foreground pt-1 leading-relaxed">
              This action will mark all active staff members{" "}
              {selectedBranch !== "all"
                ? `in branch "${branchOptions.find((b) => b.id === selectedBranch)?.name || selectedBranch}"`
                : "across all branches"}{" "}
              as <strong className="text-emerald-700 font-semibold">Present (8.00 hours)</strong> for date{" "}
              <strong className="text-ink font-semibold">{selectedDate}</strong>. Any previously recorded entries for today will be updated.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkConfirmOpen(false)}
              disabled={bulkSubmitting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleBulkMarkPresent}
              disabled={bulkSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              {bulkSubmitting ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Marking Present...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Confirm & Mark All Present
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
