import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { jsPDF } from "jspdf";
import { useMemo, useState, useEffect, useRef } from "react";
import { useAuth, getSessionServerFn, roleRoutes, type Role } from "@/lib/auth";
import {
  AlertTriangle,
  Building2,
  Download,
  FileText,
  Package,
  Receipt,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Tag,
  Plus,
  Pencil,
  Copy,
  Trash2,
  X,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Ban,
  Clock,
  Menu,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ChevronsUpDown,
  Check,
  LifeBuoy,
  UploadCloud,
  Percent,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DemoShell, StatCard } from "@/components/demo/DemoShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SearchableProductSelect } from "@/components/ui/searchable-product-select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { CRMTab } from "@/components/crm/CRMTab";
import { PromotionsTab } from "@/components/promotions/PromotionsTab";
import { ReportsTab } from "@/components/reports/ReportsTab";
import { FinancialReportsTab } from "@/components/reports/FinancialReportsTab";
import { PayrollTab } from "@/components/payroll/PayrollTab";
import { TenantSubscriptionBillingTab } from "@/components/subscription/TenantSubscriptionBillingTab";
import { TenantSupportTab } from "@/components/support/TenantSupportTab";
import { HeadOfficeExpensesTab } from "@/components/expenses/HeadOfficeExpensesTab";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { aed, aedShort } from "@/lib/demo-data";
import { toast } from "sonner";
import {
  getCatalogProductsFn,
  getHeadOfficeDataFn,
  updateStockFn,
  updatePriceOverrideFn,
  applyClearanceFn,
  updateVatSettingsFn,
  createPoFn,
  updateLoyaltySettingsFn,
  createCampaignFn,
  createProductFn,
  updateProductFn,
  deleteProductFn,
  bulkDeleteProductsFn,
  adjustStockServerFn,
  createBatchServerFn,
  createStaffFn,
  updateStaffFn,
  deleteStaffFn,
  createVendorFn,
  updateVendorFn,
  deleteVendorFn,
  toggleRolePermissionFn,
  handleOverrideRequestFn,
  createBranchForTenantFn,
  updateBranchFn,
  activateBranchFn,
  deactivateBranchFn,
  getProductRecipesServerFn,
  saveProductRecipeServerFn,
  deleteProductRecipeServerFn,
  bulkImportProductsFn,
  getExistingProductIdentifiersFn,
  listSalesChannelsFn,
  createSalesChannelFn,
  updateSalesChannelFn,
  deleteSalesChannelFn,
  getProductChannelPricesFn,
  saveProductChannelOverridesFn,
  getCatalogChannelPricesFn,
  markTenantInvoicesSeenFn,
} from "@/lib/head-office-server";
import { resolveChannelPrice } from "@/lib/channel-pricing";
import { Checkbox } from "@/components/ui/checkbox";
import { getAuditLogsServerFn } from "@/lib/super-admin-server";
import { stockTransferServerFn } from "@/lib/inventory-manager-server";
import {
  createPurchaseOrderServerFn,
  recordGRNServerFn,
  deletePurchaseOrderServerFn,
  updatePurchaseOrderServerFn,
  getGrnDetailsServerFn,
  createVendorInvoiceServerFn,
  getInvoiceDetailsServerFn,
} from "@/lib/purchasing-server";

export const Route = createFileRoute("/head-office")({
  beforeLoad: async () => {
    const res = await getSessionServerFn();
    if (!res.success || !res.session) throw redirect({ to: "/login" });
    const role = res.session.role as Role;
    if (role !== "Head Office Admin") {
      throw redirect({ to: roleRoutes[role] });
    }
  },
  loader: async () => {
    const data = await getHeadOfficeDataFn();
    return data.success ? data : null;
  },
  head: () => ({
    meta: [
      { title: "Head Office Dashboard Demo — cloudynationpos" },
      {
        name: "description",
        content:
          "Interactive head office demo: multi-outlet performance, central catalog, FIFO/FEFO expiry alerts, PO→GRN→Invoice pipeline, RBAC, VAT invoices and loyalty CRM.",
      },
      { property: "og:title", content: "cloudynationpos Head Office Dashboard Demo" },
      {
        property: "og:description",
        content: "Run every branch, catalog and purchase order from one screen.",
      },
    ],
  }),
  component: HeadOffice,
});

const tierTone: Record<string, string> = {
  Platinum: "bg-primary/10 text-primary border-primary/20",
  Gold: "bg-accent/25 text-accent-foreground border-accent/30",
  Silver: "bg-secondary text-secondary-foreground border-border",
  Bronze: "bg-surface-2 text-muted-foreground border-border",
};

function expiryTone(days: number) {
  if (days <= 3) return "bg-destructive/10 text-destructive border-destructive/20";
  if (days <= 14) return "bg-warning/15 text-warning-foreground border-warning/30";
  return "bg-success/12 text-success border-success/20";
}

function HeadOffice() {
  const router = useRouter();
  const data = Route.useLoaderData();
  const { role } = useAuth();

  const [inclusive, setInclusive] = useState(data?.settings?.vatInclusive ?? true);
  const [vatRate, setVatRate] = useState(data?.settings?.vatRate ?? "5.00");
  const [loyaltyRate, setLoyaltyRate] = useState(data?.settings?.loyaltyRedemptionRate ?? "0.01");
  const [loyaltyPointsPerAed, setLoyaltyPointsPerAed] = useState(
    String(data?.settings?.loyaltyPointsPerAed ?? 10),
  );
  const [loyaltyMinPointsToRedeem, setLoyaltyMinPointsToRedeem] = useState(
    String(data?.settings?.loyaltyMinPointsToRedeem ?? 5000),
  );
  const [isSavingLoyalty, setIsSavingLoyalty] = useState(false);

  // Unseen Subscription Invoices Count (Badge)
  const [unseenInvoicesCount, setUnseenInvoicesCount] = useState<number>(data?.unseenInvoicesCount || 0);

  useEffect(() => {
    if (data?.unseenInvoicesCount !== undefined) {
      setUnseenInvoicesCount(data.unseenInvoicesCount);
    }
  }, [data?.unseenInvoicesCount]);

  // Campaign States
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isSavingCampaign, setIsSavingCampaign] = useState(false);
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    type: "Percentage discount",
    target: "All products",
    value: "",
    startDate: new Date().toISOString().split("T")[0] || "",
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] || "",
    status: "Draft",
  });
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [bundleItems, setBundleItems] = useState<{ productId: string; qty: number }[]>([
    { productId: "", qty: 1 },
    { productId: "", qty: 1 },
  ]);
  const [pricingBasis, setPricingBasis] = useState("Percentage adjustment");
  const [minQty, setMinQty] = useState("");
  const [maxQty, setMaxQty] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  // Mapped Data from DB
  const mappedOutlets = useMemo(() => {
    return (data?.branches || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      emirate: b.address || "Dubai",
      tills: b.tillCount || 1,
      sales: 0, // Need historical orders for this
      growth: 0,
      stockHealth: 100,
    }));
  }, [data?.branches]);

  // Catalog pagination and search states
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCatalogBranch, setSelectedCatalogBranch] = useState<string>("all");
  const [catalogPage, setCatalogPage] = useState(data?.page || 1);
  const catalogPageSize = data?.pageSize || 50;
  const [catalogTotal, setCatalogTotal] = useState(data?.totalProducts || data?.products?.length || 0);
  const [catalogProductsList, setCatalogProductsList] = useState<any[]>(data?.products || []);
  const [catalogStockList, setCatalogStockList] = useState<any[]>(data?.stock || []);
  const [isCatalogLoading, setIsCatalogLoading] = useState(false);

  // Catalog Bulk Selection & Delete States
  const [catalogSelectedProductIds, setCatalogSelectedProductIds] = useState<Set<string>>(new Set());
  const [isAllMatchingSelected, setIsAllMatchingSelected] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteConfirmText, setBulkDeleteConfirmText] = useState("");
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  useEffect(() => {
    if (data?.products) {
      setCatalogProductsList(data.products);
      setCatalogStockList(data.stock || []);
      setCatalogTotal(data.totalProducts || data.products.length);
      setCatalogPage(data.page || 1);
    }
  }, [data?.products, data?.stock, data?.totalProducts, data?.page]);

  const handleFetchCatalog = async (targetPage: number, searchStr: string, branchId?: string) => {
    setIsCatalogLoading(true);
    try {
      const bId = branchId !== undefined ? branchId : selectedCatalogBranch;
      const res = await getCatalogProductsFn({
        data: {
          page: targetPage,
          pageSize: catalogPageSize,
          search: searchStr,
          branchId: bId !== "all" ? bId : undefined,
        },
      });
      if (res && res.success) {
        setCatalogProductsList(res.products || []);
        setCatalogStockList(res.stock || []);
        setCatalogTotal(res.totalProducts || 0);
        setCatalogPage(res.page || targetPage);
      } else {
        toast.error(res?.error || "Failed to load catalog");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load catalog");
    } finally {
      setIsCatalogLoading(false);
    }
  };

  const mappedProducts = useMemo(() => {
    return (catalogProductsList || []).map((p: any) => {
      let displayStock = 0;
      let displayPrice = Number(p.salePrice) || 0;

      if (selectedCatalogBranch === "all") {
        // calculate total stock across all branches from data.stock
        displayStock = (catalogStockList || [])
          .filter((s: any) => s.productId === p.id)
          .reduce((acc: number, s: any) => acc + (Number(s.stock) || 0), 0);
        displayPrice = Number(p.salePrice) || 0;
      } else {
        // show ONLY that branch's stock and price override
        const branchStock = (catalogStockList || []).find(
          (s: any) => s.productId === p.id && s.branchId === selectedCatalogBranch
        );
        displayStock = branchStock ? Number(branchStock.stock) || 0 : 0;
        displayPrice = branchStock?.priceOverride
          ? Number(branchStock.priceOverride)
          : Number(p.salePrice) || 0;
      }

      return {
        id: p.id,
        sku: p.sku || p.id.slice(0, 8),
        name: p.name,
        barcode: p.barcode,
        unit: p.unit ?? "pcs",
        category: p.category || "General",
        cost: Number(p.costPrice) || 0,
        price: displayPrice,
        vat: p.vatIncluded ? "Inc" : "Exc",
        stock: displayStock,
        isBatchTracked: p.isBatchTracked === false ? false : true,
        costPriceRaw: p.costPrice,
        salePriceRaw: p.salePrice,
      };
    });
  }, [catalogProductsList, catalogStockList, selectedCatalogBranch]);

  const currentPageProductIds = useMemo(
    () => mappedProducts.map((p: any) => p.id),
    [mappedProducts],
  );

  const isAllOnPageSelected = useMemo(() => {
    if (currentPageProductIds.length === 0) return false;
    if (isAllMatchingSelected) return true;
    return currentPageProductIds.every((id: string) => catalogSelectedProductIds.has(id));
  }, [currentPageProductIds, catalogSelectedProductIds, isAllMatchingSelected]);

  const isSomeOnPageSelected = useMemo(() => {
    if (isAllMatchingSelected) return true;
    return currentPageProductIds.some((id: string) => catalogSelectedProductIds.has(id));
  }, [currentPageProductIds, catalogSelectedProductIds, isAllMatchingSelected]);

  const handleToggleSelectAllOnPage = () => {
    if (isAllOnPageSelected) {
      setIsAllMatchingSelected(false);
      setCatalogSelectedProductIds((prev) => {
        const next = new Set(prev);
        currentPageProductIds.forEach((id: string) => next.delete(id));
        return next;
      });
    } else {
      setCatalogSelectedProductIds((prev) => {
        const next = new Set(prev);
        currentPageProductIds.forEach((id: string) => next.add(id));
        return next;
      });
    }
  };

  const handleToggleSelectProduct = (id: string) => {
    if (isAllMatchingSelected) {
      setIsAllMatchingSelected(false);
      setCatalogSelectedProductIds((prev) => {
        const next = new Set(prev);
        currentPageProductIds.forEach((pid) => next.add(pid));
        next.delete(id);
        return next;
      });
    } else {
      setCatalogSelectedProductIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }
  };

  const hasCatalogSelection = catalogSelectedProductIds.size > 0 || isAllMatchingSelected;
  const totalCatalogSelectedCount = isAllMatchingSelected ? catalogTotal : catalogSelectedProductIds.size;

  const handleBulkDeleteConfirm = async () => {
    setIsBulkDeleting(true);
    try {
      const payload = isAllMatchingSelected
        ? {
            allMatching: {
              search: catalogSearch || undefined,
              branchId: selectedCatalogBranch !== "all" ? selectedCatalogBranch : undefined,
            },
          }
        : {
            productIds: Array.from(catalogSelectedProductIds),
          };

      const res = await bulkDeleteProductsFn({ data: payload });

      if (res) {
        const { deleted, skipped, skippedRows } = res;
        if (skipped > 0) {
          const uniqueReasons = Array.from(new Set((skippedRows || []).map((r) => r.reason)));
          const reasonText = uniqueReasons.length > 0 ? uniqueReasons.join(", ") : "referenced in history";
          if (deleted > 0) {
            toast.info(`${deleted} deleted, ${skipped} skipped (${reasonText})`);
          } else {
            toast.error(`${deleted} deleted, ${skipped} skipped (${reasonText})`);
          }
        } else {
          toast.success(`${deleted} deleted, 0 skipped`);
        }

        setBulkDeleteDialogOpen(false);
        setBulkDeleteConfirmText("");
        setCatalogSelectedProductIds(new Set());
        setIsAllMatchingSelected(false);

        await handleFetchCatalog(catalogPage, catalogSearch);
        router.invalidate();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete products");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const mappedBatches = useMemo(() => {
    return (data?.batches || []).map((b: any) => {
      const product = (data?.products || []).find((p: any) => p.id === b.productId);
      const branch = (data?.branches || []).find((br: any) => br.id === b.branchId);
      const expiry = new Date(b.expiryDate);
      const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 3600 * 24));

      return {
        id: b.id,
        product: product ? product.name : "Unknown",
        productId: b.productId,
        batch: b.batchNumber,
        outlet: branch ? branch.name : "HQ",
        rule: "FEFO",
        qty: b.stockQuantity || b.stock,
        expiry: expiry.toISOString().split("T")[0],
        daysLeft,
      };
    });
  }, [data?.batches, data?.products, data?.branches]);

  const mappedPurchases = useMemo(() => {
    return (data?.purchases || []).map((p: any) => {
      let stage = "PO";
      if (p.status === "GRN" || p.status === "Received") stage = "GRN";
      if (p.status === "Invoiced" || p.status === "Paid") stage = "Invoice";

      return {
        rawId: p.id,
        id: p.id.split("-")[0].toUpperCase(), // Just show a short ID for demo
        stage: stage,
        vendor: p.vendor?.name || "Unknown Vendor",
        vendorId: p.vendorId,
        branchId: p.branchId,
        value: Number(p.total) || 0,
        items: p.items || [],
      };
    });
  }, [data?.purchases]);

  const mappedVendors = useMemo(() => (data?.vendors || []).map((v: any) => ({ id: v.id, name: v.name })), [data?.vendors]);

  const mappedRoles = useMemo(() => {
    return [
      {
        role: "Super Admin",
        users: (data?.staff || []).filter((u: any) => u.role === "super_admin").length,
        perms: ["Full platform access"],
      },
      {
        role: "Head Office Admin",
        users: (data?.staff || []).filter((u: any) => u.role === "head_office_admin").length,
        perms: ["View all branches", "Global settings", "Purchasing", "Roles"],
      },
      {
        role: "Branch Manager",
        users: (data?.staff || []).filter((u: any) => u.role === "branch_manager").length,
        perms: [
          "Branch override",
          "Local stock",
          "Pricing adjustments",
          "Till management",
          "Shift & staff",
        ],
      },
      {
        role: "Inventory Manager",
        users: (data?.staff || []).filter((u: any) => u.role === "inventory_manager").length,
        perms: ["Stock adjust", "Receive goods"],
      },
      {
        role: "Purchasing Officer",
        users: (data?.staff || []).filter((u: any) => u.role === "purchasing_officer").length,
        perms: ["Create PO", "Receive invoices"],
      },
      {
        role: "Cashier",
        users: (data?.staff || []).filter((u: any) => u.role === "cashier").length,
        perms: ["Process sales", "Refunds", "End of shift"],
      },
    ].filter((r) => r.users > 0 || r.role === "Head Office Admin");
  }, [data?.staff]);

  const totalSales = useMemo(
    () => mappedOutlets.reduce((s: any, o: any) => s + o.sales, 0),
    [mappedOutlets],
  );
  const nearExpiry = useMemo(() => mappedBatches.filter((b: any) => b.daysLeft <= 14).length, [mappedBatches]);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [addBatchOpen, setAddBatchOpen] = useState(false);
  const [addBatchForm, setAddBatchForm] = useState<any>({
    productId: "",
    branchId: "",
    batchNumber: "",
    expiryDate: "",
    initialStock: 0,
  });
  const [isAddingBatch, setIsAddingBatch] = useState(false);
  const [invForm, setInvForm] = useState<any>({
    branchId: "",
    productId: "",
    qty: "",
    type: "add",
    targetBranchId: "",
    batchNumber: "",
    expiryDate: "",
  });

  const [poModalOpen, setPoModalOpen] = useState(false);
  const [poForm, setPoForm] = useState({ vendorId: "", branchId: "" });
  const [poItems, setPoItems] = useState<any[]>([]);

  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState<any>({
    id: "",
    name: "",
    email: "",
    role: "cashier",
    branchId: "",
    password: "",
    pin: "",
    isActive: true,
  });

  const [grnModalOpen, setGrnModalOpen] = useState(false);
  const [grnForm, setGrnForm] = useState<any>({
    purchaseOrderId: "",
    vendorId: "",
    branchId: "",
    items: [],
  });

  const [productFormOpen, setProductFormOpen] = useState(false);
  const [isEditingProduct, setIsEditingProduct] = useState(false);
  const [productForm, setProductForm] = useState<any>({
    id: "",
    name: "",
    barcode: "",
    category: "",
    unit: "",
    costPrice: "",
    salePrice: "",
    isBatchTracked: false,
  });

  const [deleteProductContext, setDeleteProductContext] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Product Import States
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFileName, setImportFileName] = useState("");
  const [importBranches, setImportBranches] = useState<string[]>([]);
  const [importAllBranches, setImportAllBranches] = useState(false);
  const [updateExistingProducts, setUpdateExistingProducts] = useState(true);
  const [rowUpdateChoices, setRowUpdateChoices] = useState<Record<number, boolean>>({});
  const [rowStocks, setRowStocks] = useState<Record<number, string>>({});
  const [bulkStockInput, setBulkStockInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [rawFileRows, setRawFileRows] = useState<any[]>([]);
  const [cachedExistingProds, setCachedExistingProds] = useState<any[]>([]);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [sheetStats, setSheetStats] = useState<
    { name: string; total: number; valid: number; invalid: number }[]
  >([]);
  const [importPreviewPage, setImportPreviewPage] = useState(1);
  const importPreviewPageSize = 50;
  const [previewFilter, setPreviewFilter] = useState<
    "all" | "new" | "add_to_branch" | "exists_update" | "exists_skip" | "invalid"
  >("all");

  // Conflict Resolution Modal States
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [conflictItems, setConflictItems] = useState<any[]>([]);
  const [conflictChoices, setConflictChoices] = useState<Record<number, "update" | "remove">>({});
  const [conflictPage, setConflictPage] = useState(1);

  // Platform Pricing States
  const [platformPricingOpen, setPlatformPricingOpen] = useState(false);
  const [salesChannelsList, setSalesChannelsList] = useState<any[]>([]);
  const [isSalesChannelsLoading, setIsSalesChannelsLoading] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState("");
  const [newPlatformMarkup, setNewPlatformMarkup] = useState("");
  const [isAddingPlatform, setIsAddingPlatform] = useState(false);
  const [deletePlatformContext, setDeletePlatformContext] = useState<any>(null);
  const [deletePlatformDialogOpen, setDeletePlatformDialogOpen] = useState(false);
  const [isDeletingPlatform, setIsDeletingPlatform] = useState(false);

  // Product Platform Pricing Overrides States
  const [activeChannelsForProduct, setActiveChannelsForProduct] = useState<any[]>([]);
  const [productChannelOverrides, setProductChannelOverrides] = useState<Record<string, string>>({});
  const [isLoadingProductChannels, setIsLoadingProductChannels] = useState(false);

  // Catalog Table Platform Pricing States
  const [catalogChannels, setCatalogChannels] = useState<{ key: string; name: string; markupPercent: number }[]>([]);
  const [catalogChannelOverrides, setCatalogChannelOverrides] = useState<Record<string, Record<string, number>>>({});

  // Catalog Table Drag-to-Scroll
  const catalogTableRef = useRef<HTMLDivElement>(null);
  const [isCatalogDragging, setIsCatalogDragging] = useState(false);
  const catalogDragState = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    hasDragged: false,
  });

  const handleCatalogMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return; // Left button only
    const target = e.target as HTMLElement | null;
    if (target?.closest("button, input, a, select, textarea, [role='button']")) {
      return;
    }
    const container = catalogTableRef.current;
    if (!container) return;

    catalogDragState.current = {
      isDown: true,
      startX: e.clientX,
      scrollLeft: container.scrollLeft,
      hasDragged: false,
    };
    setIsCatalogDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!catalogDragState.current.isDown) return;
      const container = catalogTableRef.current;
      if (!container) return;

      const dx = e.clientX - catalogDragState.current.startX;
      if (Math.abs(dx) > 5) {
        catalogDragState.current.hasDragged = true;
      }
      container.scrollLeft = catalogDragState.current.scrollLeft - dx;
    };

    const handleMouseUp = () => {
      if (catalogDragState.current.isDown) {
        catalogDragState.current.isDown = false;
        setIsCatalogDragging(false);
        setTimeout(() => {
          catalogDragState.current.hasDragged = false;
        }, 0);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleCatalogClickCapture = (e: React.MouseEvent) => {
    if (catalogDragState.current.hasDragged) {
      e.stopPropagation();
      e.preventDefault();
      catalogDragState.current.hasDragged = false;
    }
  };

  const fetchCatalogChannelPrices = async (productIds: string[]) => {
    if (!productIds || productIds.length === 0) {
      setCatalogChannels([]);
      setCatalogChannelOverrides({});
      return;
    }
    try {
      const res = await getCatalogChannelPricesFn({ data: { productIds } });
      if (res && res.success) {
        setCatalogChannels(res.channels || []);
        setCatalogChannelOverrides(res.overrides || {});
      }
    } catch (err) {
      console.error("Failed to fetch catalog channel prices:", err);
    }
  };

  useEffect(() => {
    const ids = (catalogProductsList || []).map((p: any) => p.id).filter(Boolean);
    if (ids.length > 0) {
      fetchCatalogChannelPrices(ids);
    } else {
      setCatalogChannels([]);
      setCatalogChannelOverrides({});
    }
  }, [catalogProductsList]);

  const fetchSalesChannels = async () => {
    try {
      setIsSalesChannelsLoading(true);
      const res = await listSalesChannelsFn();
      if (res?.channels) {
        setSalesChannelsList(res.channels);
      }
    } catch (err: any) {
      toast.error("Failed to load platform pricing channels");
    } finally {
      setIsSalesChannelsLoading(false);
    }
  };

  const handleOpenAddProduct = async () => {
    setProductForm({
      name: "",
      barcode: "",
      category: "",
      unit: "",
      costPrice: "",
      salePrice: "",
      isBatchTracked: false,
    });
    setProductChannelOverrides({});
    setIsEditingProduct(false);
    setProductFormOpen(true);

    try {
      setIsLoadingProductChannels(true);
      const res = await listSalesChannelsFn();
      if (res?.channels) {
        const active = res.channels.filter((c: any) => c.isActive);
        setActiveChannelsForProduct(active);
      }
    } catch (e) {
    } finally {
      setIsLoadingProductChannels(false);
    }
  };

  const handleOpenEditProduct = async (p: any) => {
    setProductForm({
      id: p.id,
      name: p.name,
      barcode: p.barcode ?? "",
      category: p.category,
      unit: p.unit,
      costPrice: p.costPriceRaw,
      salePrice: p.salePriceRaw,
      isBatchTracked: p.isBatchTracked,
    });
    setIsEditingProduct(true);
    setProductFormOpen(true);
    setProductChannelOverrides({});

    try {
      setIsLoadingProductChannels(true);
      const res = await getProductChannelPricesFn({ data: { productId: p.id } });
      if (res?.channels) {
        setActiveChannelsForProduct(res.channels);
        const initialOverrides: Record<string, string> = {};
        res.channels.forEach((c: any) => {
          initialOverrides[c.channelKey] = c.overridePrice != null ? String(c.overridePrice) : "";
        });
        setProductChannelOverrides(initialOverrides);
      }
    } catch (e) {
    } finally {
      setIsLoadingProductChannels(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const XLSX = await import("xlsx");
      const headers = [
        "sku",
        "name",
        "price",
        "active",
        "maximumSalesQuantity",
        "isWeighted",
        "baseWeight",
        "baseWeightUnit",
        "pricePerBaseUnit",
        "barcode 1",
        "barcode 2",
        "barcode 3",
        "barcode 4",
        "barcode 5",
        "barcode 6",
        "barcode 7",
        "category 1",
        "category 2",
        "category 3",
        "category 4",
        "category 5",
      ];
      const sampleRows = [
        {
          sku: "SKU-MILK-01",
          name: "Fresh Milk 1L",
          price: "6.000",
          active: "TRUE",
          maximumSalesQuantity: "10",
          isWeighted: "FALSE",
          baseWeight: "1",
          baseWeightUnit: "L",
          pricePerBaseUnit: "6.000",
          "barcode 1": "629104820101",
          "barcode 2": "629104820102",
          "barcode 3": "",
          "barcode 4": "",
          "barcode 5": "",
          "barcode 6": "",
          "barcode 7": "",
          "category 1": "Dairy",
          "category 2": "Milk",
          "category 3": "",
          "category 4": "",
          "category 5": "",
        },
        {
          sku: "SKU-APPLES-01",
          name: "Royal Gala Apples",
          price: "8.500",
          active: "TRUE",
          maximumSalesQuantity: "50",
          isWeighted: "TRUE",
          baseWeight: "1",
          baseWeightUnit: "KG",
          pricePerBaseUnit: "8.500",
          "barcode 1": "8901058014723",
          "barcode 2": "",
          "barcode 3": "",
          "barcode 4": "",
          "barcode 5": "",
          "barcode 6": "",
          "barcode 7": "",
          "category 1": "Produce",
          "category 2": "Fruits",
          "category 3": "",
          "category 4": "",
          "category 5": "",
        },
      ];

      const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
      ws["!cols"] = headers.map((h) => ({ wch: Math.max(h.length + 4, 14) }));

      // Format Barcode & SKU columns as text
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1:U3");
      for (let R = 1; R <= range.e.r; ++R) {
        for (let C = 0; C <= range.e.c; ++C) {
          const headerName = (headers[C] || "").toLowerCase();
          if (headerName === "sku" || headerName.startsWith("barcode")) {
            const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
            if (cell) {
              cell.t = "s";
              cell.z = "@";
            }
          }
        }
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "In Stock");
      XLSX.writeFile(wb, "product_import_template.xlsx");
      toast.success("Excel template downloaded successfully.");
    } catch (err: any) {
      toast.error("Failed to generate template: " + err.message);
    }
  };

  const isRowUpdating = (rowNum: number) => {
    if (rowUpdateChoices[rowNum] !== undefined) {
      return rowUpdateChoices[rowNum];
    }
    return updateExistingProducts;
  };

  const importExistsCount = parsedRows.filter(
    (r) => r.isValid && (r.classification === "exists" || r.classification === "exists_update" || r.classification === "exists_skip" || r.isExisting),
  ).length;
  const showExistingProductsCard = parsedRows.length > 0 && importExistsCount > 0;

  const reclassifyRows = (
    rawRows: any[],
    existingProds: any[] = [],
    selectedBranchIds: string[] = [],
    branchList: any[] = [],
    globalUpdateChoice: boolean = true,
    rowChoices: Record<number, boolean> = {},
  ) => {
    const branchNameMap = new Map<string, string>();
    for (const b of branchList || []) {
      if (b && b.id) branchNameMap.set(b.id, b.name || "Branch");
    }

    const primaryBarcodeMap = new Map<string, any>();
    const primarySkuMap = new Map<string, any>();
    for (const p of existingProds || []) {
      if (p && p.barcode) {
        const bStr = String(p.barcode).trim().toLowerCase();
        if (bStr) primaryBarcodeMap.set(bStr, p);
      }
      if (p && p.sku) {
        const sStr = String(p.sku).trim().toLowerCase();
        if (sStr) primarySkuMap.set(sStr, p);
      }
    }

    const safeBranchIds = Array.isArray(selectedBranchIds) ? selectedBranchIds : [];
    const safeBranchIdsSet = new Set(safeBranchIds);
    const selectedBranchNamesStr = safeBranchIds
      .map((bId) => branchNameMap.get(bId) || "Selected branch")
      .join(", ");

    return (rawRows || []).map((r) => {
      if (!r.isValid) {
        return {
          ...r,
          classification: "invalid" as const,
          isExisting: false,
          existingProductId: null,
          note: Array.isArray(r.errors) ? r.errors.join(", ") : "Invalid row",
        };
      }

      const cleanBarcode = r.barcode ? String(r.barcode).trim().toLowerCase() : "";
      const cleanSku = r.sku ? String(r.sku).trim().toLowerCase() : "";
      const matched = (cleanBarcode ? primaryBarcodeMap.get(cleanBarcode) : null) ||
                      (cleanSku ? primarySkuMap.get(cleanSku) : null);

      if (matched) {
        const existingInSelectedBranches = (matched.existingBranchIds || []).filter((bId: string) =>
          safeBranchIdsSet.has(bId),
        );

        const updating = rowChoices[r.rowNumber] !== undefined ? rowChoices[r.rowNumber] : globalUpdateChoice;
        const classification = updating ? ("exists_update" as const) : ("exists_skip" as const);
        const matchLabel = matched.barcode === r.barcode ? `Barcode ${r.barcode}` : `SKU ${r.sku}`;

        if (existingInSelectedBranches.length > 0) {
          const branchNames = existingInSelectedBranches
            .map((bId: string) => branchNameMap.get(bId) || "branch")
            .join(", ");
          return {
            ...r,
            classification,
            isExisting: true,
            existingProductId: matched.id,
            matchedExistingName: matched.name,
            note: updating
              ? `${matchLabel} already exists in ${branchNames} — will update`
              : `${matchLabel} already exists in ${branchNames} — will skip`,
          };
        } else {
          // Exists in tenant but in NONE of the selected branches
          return {
            ...r,
            classification,
            isExisting: true,
            existingProductId: matched.id,
            matchedExistingName: matched.name,
            note: updating
              ? `${matchLabel} exists in other branch — will be added to ${selectedBranchNamesStr || "selected branches"} — will update`
              : `${matchLabel} exists on website — will skip`,
          };
        }
      } else {
        // Not in tenant
        return {
          ...r,
          classification: "new" as const,
          isExisting: false,
          existingProductId: null,
          matchedExistingName: null,
          note: "Ready to create",
        };
      }
    });
  };

  const fetchExistingProductsByBarcodesAndSkus = async (
    branchIds: string[],
    barcodes: string[],
    skus: string[] = []
  ) => {
    const CHUNK_SIZE = 5000;
    const maxLen = Math.max(barcodes.length, skus.length);
    if (maxLen === 0) return [];

    const barcodeChunks: string[][] = [];
    const skuChunks: string[][] = [];
    for (let i = 0; i < barcodes.length; i += CHUNK_SIZE) {
      barcodeChunks.push(barcodes.slice(i, i + CHUNK_SIZE));
    }
    for (let i = 0; i < skus.length; i += CHUNK_SIZE) {
      skuChunks.push(skus.slice(i, i + CHUNK_SIZE));
    }

    const chunkCount = Math.max(barcodeChunks.length, skuChunks.length);
    const promises = [];
    for (let i = 0; i < chunkCount; i++) {
      const bChunk = barcodeChunks[i] || [];
      const sChunk = skuChunks[i] || [];
      promises.push(
        getExistingProductIdentifiersFn({
          data: { branchIds, barcodes: bChunk, skus: sChunk },
        }).catch(() => null)
      );
    }

    const results = await Promise.all(promises);
    const combined: {
      id: string;
      name: string;
      barcode: string | null;
      sku: string | null;
      existingBranchIds: string[];
    }[] = [];
    const seenIds = new Set<string>();
    for (const res of results) {
      if (res?.existingProducts) {
        for (const p of res.existingProducts) {
          if (!seenIds.has(p.id)) {
            seenIds.add(p.id);
            combined.push(p);
          }
        }
      }
    }
    return combined;
  };

  const handleBulkUpdateChoice = (enable: boolean) => {
    setUpdateExistingProducts(enable);
    const next: Record<number, boolean> = {};
    let existingCount = 0;
    parsedRows.forEach((r) => {
      if (
        r.isExisting ||
        r.classification === "exists" ||
        r.classification === "exists_update" ||
        r.classification === "exists_skip"
      ) {
        existingCount++;
        next[r.rowNumber] = enable;
      }
    });
    setRowUpdateChoices(next);
    if (rawFileRows.length > 0) {
      setParsedRows(
        reclassifyRows(
          rawFileRows,
          cachedExistingProds,
          importBranches,
          data?.branches || [],
          enable,
          next,
        ),
      );
    } else {
      setParsedRows((prev) =>
        prev.map((r) => {
          if (
            r.isExisting ||
            r.classification === "exists" ||
            r.classification === "exists_update" ||
            r.classification === "exists_skip"
          ) {
            return {
              ...r,
              classification: enable ? ("exists_update" as const) : ("exists_skip" as const),
              note: enable
                ? (r.note || "").replace(" — will skip", " — will update")
                : (r.note || "").replace(" — will update", " — will skip"),
            };
          }
          return r;
        })
      );
    }

    if (existingCount === 0) {
      toast("No existing products in this file");
    } else if (enable) {
      toast(`Existing products will be updated (${existingCount} products)`);
    } else {
      toast(`Existing products will be skipped (${existingCount} products)`);
    }
  };

  const handleApplyBulkStock = () => {
    const val = bulkStockInput.trim();
    if (val !== "" && (isNaN(Number(val)) || Number(val) < 0)) {
      toast.error("Stock must be an integer >= 0");
      return;
    }
    const next: Record<number, string> = {};
    parsedRows.forEach((r) => {
      next[r.rowNumber] = val;
    });
    setRowStocks(next);
    toast.success(val === "" ? "Cleared stock for all rows" : `Set stock to ${val} for all rows`);
  };

  const handleFileSelect = async (file: File) => {
    if (!file) return;
    if (importBranches.length === 0) {
      toast.error("Please select at least one branch first");
      return;
    }

    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".xlsx") && !lowerName.endsWith(".xls") && !lowerName.endsWith(".csv")) {
      toast.error("Unsupported file type. Please select an .xlsx, .xls, or .csv file.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      toast.error("File exceeds maximum allowed size of 25 MB.");
      return;
    }

    setImportFile(file);
    setImportFileName(file.name);
    setIsParsing(true);

    try {
      const tParseStart = performance.now();
      const buffer = await file.arrayBuffer();

      const XLSX = await import("xlsx");
      const workbook = XLSX.read(buffer, {
        type: "array",
        raw: true,
      });

      if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
        toast.error("Spreadsheet has no sheets.");
        setIsParsing(false);
        return;
      }

      const cleanKeyName = (key: string) => String(key || "").toLowerCase().replace(/[^a-z0-9]/g, "");

      const findRawValue = (row: any, candidates: string[]) => {
        const cleanedCandidates = candidates.map(cleanKeyName);
        for (const k of Object.keys(row)) {
          const cleanK = cleanKeyName(k);
          if (cleanedCandidates.includes(cleanK)) {
            if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
              return row[k];
            }
          }
        }
        for (const k of Object.keys(row)) {
          const cleanK = cleanKeyName(k);
          for (const c of cleanedCandidates) {
            if (cleanK === c || cleanK.startsWith(c) || cleanK.includes(c)) {
              if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "") {
                return row[k];
              }
            }
          }
        }
        return undefined;
      };

      const formatRawCell = (val: any): string => {
        if (val === undefined || val === null) return "";
        if (typeof val === "number") {
          if (Number.isFinite(val)) {
            if (Number.isInteger(val)) {
              return BigInt(Math.round(val)).toString();
            }
            return String(val);
          }
          return String(val);
        }
        return String(val).replace(/^'+/, "").trim();
      };

      const cleanPrice = (val: any): number => {
        if (val === undefined || val === null || val === "") return NaN;
        if (typeof val === "number") return val;
        const str = String(val).trim();
        const cleaned = str.replace(/AED/gi, "").replace(/,/g, "").replace(/\s/g, "").trim();
        const num = Number(cleaned);
        if (!isNaN(num)) return num;
        const numericOnly = str.replace(/[^\d\.]/g, "").trim();
        return Number(numericOnly);
      };

      const allRawRows: any[] = [];
      const statsList: { name: string; total: number; valid: number; invalid: number }[] = [];
      const seenFileBarcodes = new Map<string, { row: number; sheet: string }>();
      const seenFileSkus = new Map<string, { row: number; sheet: string }>();
      const initialRowStocks: Record<number, string> = {};
      let globalRowIndex = 0;

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet) continue;

        const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
          raw: true,
        });

        if (!rawRows || rawRows.length === 0) continue;

        let sheetValid = 0;
        let sheetInvalid = 0;

        const isSheetOutOfStock = sheetName.toLowerCase().includes("out of stock");

        rawRows.forEach((row, idx) => {
          globalRowIndex++;
          const rowNum = idx + 1;

          const rawNameVal = findRawValue(row, ["name", "productname", "itemname", "product", "item"]);
          const name = formatRawCell(rawNameVal);

          // ONLY "barcode 1" is used. Completely ignore barcode 2-7.
          const rawBarcode1Val = findRawValue(row, ["barcode 1", "barcode1", "barcode", "bar_code", "upc", "ean"]);
          const cleanBarcode1 = formatRawCell(rawBarcode1Val);

          // SKU
          const rawSkuVal = findRawValue(row, ["sku", "itemcode", "code", "item_code"]);
          const cleanSku = formatRawCell(rawSkuVal);

          // Category: use "category 1" EXACTLY as written in the file. Only if empty -> "Uncategorized"
          const rawCatVal = findRawValue(row, ["category 1", "category1", "category"]);
          const category = formatRawCell(rawCatVal) || "Uncategorized";

          // Weighted / Unit: "PCS" / "KG" (uppercase)
          const rawWeightedVal = findRawValue(row, ["isweighted", "is_weighted", "weighted"]);
          const isWeighted =
            rawWeightedVal === true ||
            String(rawWeightedVal).toLowerCase() === "true" ||
            String(rawWeightedVal) === "1" ||
            String(rawWeightedVal).toLowerCase() === "yes";

          const rawUnitVal = findRawValue(row, ["unit", "uom", "unitofmeasure", "baseWeightUnit", "baseweightunit"]);
          const rawUnitStr = formatRawCell(rawUnitVal).toUpperCase();
          const unit = isWeighted || rawUnitStr === "KG" ? "KG" : "PCS";

          // Active status: Sheet "In Stock" -> TRUE, "Out of Stock" -> FALSE, or explicit "active" column
          const rawActiveVal = findRawValue(row, ["active", "isactive", "is_active"]);
          let isActive = !isSheetOutOfStock;
          if (rawActiveVal !== undefined && rawActiveVal !== "") {
            if (
              rawActiveVal === true ||
              String(rawActiveVal).toLowerCase() === "true" ||
              String(rawActiveVal) === "1" ||
              String(rawActiveVal).toLowerCase() === "yes"
            ) {
              isActive = true;
            } else if (
              rawActiveVal === false ||
              String(rawActiveVal).toLowerCase() === "false" ||
              String(rawActiveVal) === "0" ||
              String(rawActiveVal).toLowerCase() === "no"
            ) {
              isActive = false;
            }
          }

          // Stock prefill from file if provided
          const rawStockVal = findRawValue(row, ["stock", "quantity", "qty", "stockqty", "inventory", "balance", "initialstock"]);
          if (rawStockVal !== undefined && rawStockVal !== "" && !isNaN(Number(rawStockVal)) && Number(rawStockVal) >= 0) {
            initialRowStocks[globalRowIndex] = String(Math.floor(Number(rawStockVal)));
          }

          // Price & Cost
          const rawPriceVal = findRawValue(row, ["price", "saleprice", "retailprice", "retail", "rsp", "sale_price", "retail_price", "priceperbaseunit", "sellingprice", "unitprice", "itemprice"]);
          const rawCostVal = findRawValue(row, ["costprice", "cost", "unitcost", "buyprice", "cost_price", "priceperbaseunit"]);

          const retailPriceNum = cleanPrice(rawPriceVal);
          let costPriceNum = 0;
          if (rawCostVal !== undefined && rawCostVal !== "") {
            costPriceNum = cleanPrice(rawCostVal);
          }

          const errors: string[] = [];

          if (!name) errors.push("Missing Name");

          if (isNaN(retailPriceNum) || retailPriceNum <= 0) {
            errors.push("Price must be > 0");
          }

          // File-level duplicate tracking for barcode & SKU (handled during conflict detection)
          if (cleanBarcode1) {
            const lowerBar = cleanBarcode1.toLowerCase();
            if (!seenFileBarcodes.has(lowerBar)) {
              seenFileBarcodes.set(lowerBar, { row: globalRowIndex, sheet: sheetName });
            }
          }

          if (cleanSku) {
            const lowerSku = cleanSku.toLowerCase();
            if (!seenFileSkus.has(lowerSku)) {
              seenFileSkus.set(lowerSku, { row: globalRowIndex, sheet: sheetName });
            }
          }

          const isValid = errors.length === 0;

          if (isValid) {
            sheetValid++;
          } else {
            sheetInvalid++;
          }

          // Exact sale price with up to 3 decimals
          let salePriceExact = "0.000";
          if (!isNaN(retailPriceNum) && retailPriceNum > 0) {
            const parts = String(rawPriceVal).trim().split(".");
            if (parts.length === 2 && parts[1].length <= 3) {
              salePriceExact = String(retailPriceNum);
            } else {
              salePriceExact = Number(retailPriceNum.toFixed(3)).toString();
            }
          }

          allRawRows.push({
            rowNumber: globalRowIndex,
            sheetRowNumber: rowNum,
            sheetName,
            name,
            barcode: cleanBarcode1 || null,
            sku: cleanSku || null,
            category,
            unit,
            costPrice: isNaN(costPriceNum) ? "0.000" : Number(costPriceNum.toFixed(3)).toString(),
            salePrice: salePriceExact,
            active: isActive,
            isBatchTracked: false,
            isValid,
            errors,
          });
        });

        statsList.push({
          name: sheetName,
          total: rawRows.length,
          valid: sheetValid,
          invalid: sheetInvalid,
        });
      }

      const tParseEnd = performance.now();
      const parseTime = tParseEnd - tParseStart;

      if (allRawRows.length === 0) {
        toast.error("No data rows found in spreadsheet.");
        setRawFileRows([]);
        setParsedRows([]);
        setSheetStats([]);
        setRowStocks({});
        setRowUpdateChoices({});
        setIsParsing(false);
        return;
      }

      const fileBarcodes = Array.from(
        new Set(
          allRawRows
            .map((r) => (r.barcode ? String(r.barcode).trim() : ""))
            .filter(Boolean)
        )
      );
      const fileSkus = Array.from(
        new Set(
          allRawRows
            .map((r) => (r.sku ? String(r.sku).trim() : ""))
            .filter(Boolean)
        )
      );

      const tExistsStart = performance.now();
      const existingProds = await fetchExistingProductsByBarcodesAndSkus(importBranches, fileBarcodes, fileSkus);
      const tExistsEnd = performance.now();
      const existsCheckTime = tExistsEnd - tExistsStart;

      setCachedExistingProds(existingProds);

      const tClassifyStart = performance.now();
      setRawFileRows(allRawRows);
      const classified = reclassifyRows(
        allRawRows,
        existingProds,
        importBranches,
        data?.branches || [],
        updateExistingProducts,
        {},
      );
      setParsedRows(classified);
      const tClassifyEnd = performance.now();
      const classifyTime = tClassifyEnd - tClassifyStart;

      console.log(
        `[perf] parse ${Math.round(parseTime)}ms, exists-check ${Math.round(existsCheckTime)}ms, classify ${Math.round(classifyTime)}ms`
      );

      setSheetStats(statsList);
      setRowStocks(initialRowStocks);
      setRowUpdateChoices({});
      setImportPreviewPage(1);

      const totalValid = allRawRows.filter((r) => r.isValid).length;
      const totalInvalid = allRawRows.length - totalValid;

      toast.info(
        `Parsed ${allRawRows.length} rows across ${statsList.length} sheet(s) (${totalValid} valid, ${totalInvalid} invalid)`
      );
    } catch (err: any) {
      toast.error("Failed to parse spreadsheet: " + err.message);
    } finally {
      setIsParsing(false);
    }
  };

  const cleanErrorMessage = (msg: string): string => {
    if (!msg) return "Import failed";
    const stripped = msg.replace(/^Database transaction failed:\s*/i, "").trim();
    if (stripped.includes("Failed query:") || stripped.includes("insert into") || stripped.includes("UPDATE ")) {
      const skuMatch = stripped.match(/sku\)=\([^,]+,\s*([^)]+)\)/i) || stripped.match(/sku\)=\(([^)]+)\)/i);
      if (skuMatch) return `Duplicate SKU ${skuMatch[1].trim()}`;
      const barcodeMatch = stripped.match(/barcode\)=\([^,]+,\s*([^)]+)\)/i) || stripped.match(/barcode\)=\(([^)]+)\)/i);
      if (barcodeMatch) return `Duplicate barcode ${barcodeMatch[1].trim()}`;
      return "Database query failed";
    }
    return stripped.length > 80 ? stripped.slice(0, 80) + "..." : stripped;
  };

  const detectConflicts = (
    rows: any[],
    existingProds: any[] = []
  ): {
    rowNumber: number;
    name: string;
    barcode: string;
    sku: string;
    conflictType: string;
    existingProductName: string;
    existingProductId?: string | null;
    isLastInFile?: boolean;
  }[] => {
    const valid = rows.filter((r) => r.isValid);
    const existingByBarcode = new Map<string, any>();
    const existingBySku = new Map<string, any>();

    for (const p of existingProds) {
      if (p.barcode) {
        existingByBarcode.set(String(p.barcode).trim().toLowerCase(), p);
      }
      if (p.sku) {
        existingBySku.set(String(p.sku).trim().toLowerCase(), p);
      }
    }

    // 1. Detect duplicates inside file (last occurrence wins on update)
    const barcodeOccurrences = new Map<string, number[]>();
    const skuOccurrences = new Map<string, number[]>();

    for (const r of valid) {
      if (r.barcode) {
        const bc = String(r.barcode).trim().toLowerCase();
        if (bc) {
          const list = barcodeOccurrences.get(bc) || [];
          list.push(r.rowNumber);
          barcodeOccurrences.set(bc, list);
        }
      }
      if (r.sku) {
        const sk = String(r.sku).trim().toLowerCase();
        if (sk) {
          const list = skuOccurrences.get(sk) || [];
          list.push(r.rowNumber);
          skuOccurrences.set(sk, list);
        }
      }
    }

    const conflicts: {
      rowNumber: number;
      name: string;
      barcode: string;
      sku: string;
      conflictType: string;
      existingProductName: string;
      existingProductId?: string | null;
      isLastInFile?: boolean;
    }[] = [];

    const recordedRowConflict = new Set<number>();

    for (const r of valid) {
      const bc = r.barcode ? String(r.barcode).trim().toLowerCase() : "";
      const sk = r.sku ? String(r.sku).trim().toLowerCase() : "";

      // Check c) Same barcode appears more than once inside file
      const bcRows = bc ? barcodeOccurrences.get(bc) || [] : [];
      if (bcRows.length > 1) {
        const isLast = bcRows[bcRows.length - 1] === r.rowNumber;
        conflicts.push({
          rowNumber: r.rowNumber,
          name: r.name,
          barcode: r.barcode || "—",
          sku: r.sku || "—",
          conflictType: isLast
            ? `Duplicate barcode in file (appears ${bcRows.length}x, last row)`
            : `Duplicate barcode in file (appears in rows ${bcRows.join(", ")})`,
          existingProductName: isLast ? "File (winning row)" : "File (earlier row)",
          existingProductId: null,
          isLastInFile: isLast,
        });
        recordedRowConflict.add(r.rowNumber);
        continue;
      }

      // Check c) Same SKU appears more than once inside file
      const skRows = sk ? skuOccurrences.get(sk) || [] : [];
      if (skRows.length > 1) {
        const isLast = skRows[skRows.length - 1] === r.rowNumber;
        conflicts.push({
          rowNumber: r.rowNumber,
          name: r.name,
          barcode: r.barcode || "—",
          sku: r.sku || "—",
          conflictType: isLast
            ? `Duplicate SKU in file (appears ${skRows.length}x, last row)`
            : `Duplicate SKU in file (appears in rows ${skRows.join(", ")})`,
          existingProductName: isLast ? "File (winning row)" : "File (earlier row)",
          existingProductId: null,
          isLastInFile: isLast,
        });
        recordedRowConflict.add(r.rowNumber);
        continue;
      }

      // Check a) Same barcode already on website
      const matchedByBc = bc ? existingByBarcode.get(bc) : null;
      if (matchedByBc) {
        conflicts.push({
          rowNumber: r.rowNumber,
          name: r.name,
          barcode: r.barcode || "—",
          sku: r.sku || "—",
          conflictType: "Barcode exists on website",
          existingProductName: matchedByBc.name || "Existing Product",
          existingProductId: matchedByBc.id,
        });
        recordedRowConflict.add(r.rowNumber);
        continue;
      }

      // Check b) Same SKU already on website on a product with a DIFFERENT barcode
      const matchedBySku = sk ? existingBySku.get(sk) : null;
      if (matchedBySku) {
        const matchedBc = matchedBySku.barcode ? String(matchedBySku.barcode).trim().toLowerCase() : "";
        if (matchedBc !== bc) {
          conflicts.push({
            rowNumber: r.rowNumber,
            name: r.name,
            barcode: r.barcode || "—",
            sku: r.sku || "—",
            conflictType: "SKU exists on website with different barcode",
            existingProductName: matchedBySku.name || "Existing Product",
            existingProductId: matchedBySku.id,
          });
          recordedRowConflict.add(r.rowNumber);
          continue;
        }
      }
    }

    return conflicts;
  };

  const handleImportButtonClick = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("No valid product rows to import.");
      return;
    }

    if (importBranches.length === 0) {
      toast.error("Please select at least one branch for stock allocation.");
      return;
    }

    const detected = detectConflicts(validRows, cachedExistingProds);
    if (detected.length > 0) {
      setConflictItems(detected);
      // Pre-fill choices if user already had row choices, otherwise empty
      const initialChoices: Record<number, "update" | "remove"> = {};
      for (const item of detected) {
        if (conflictChoices[item.rowNumber]) {
          initialChoices[item.rowNumber] = conflictChoices[item.rowNumber];
        }
      }
      setConflictChoices(initialChoices);
      setConflictPage(1);
      setConflictModalOpen(true);
      return;
    }

    // No conflicts -> proceed directly
    executeImportWithChoices({});
  };

  const handleApplyConflictChoicesAndImport = () => {
    // Check that every conflict has a choice
    const unchosen = conflictItems.find((c) => !conflictChoices[c.rowNumber]);
    if (unchosen) {
      toast.error(`Please select Update or Remove for row #${unchosen.rowNumber} (${unchosen.name})`);
      return;
    }

    setConflictModalOpen(false);
    executeImportWithChoices(conflictChoices);
  };

  const executeImportWithChoices = async (choices: Record<number, "update" | "remove">) => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast.error("No valid product rows to import.");
      return;
    }

    if (importBranches.length === 0) {
      toast.error("Please select at least one branch for stock allocation.");
      return;
    }

    // Build quick lookup for conflict items
    const conflictByRow = new Map<number, typeof conflictItems[0]>();
    for (const item of conflictItems) {
      conflictByRow.set(item.rowNumber, item);
    }

    // Lookup for website products by barcode and SKU
    const websiteProductByBarcode = new Map<string, any>();
    const websiteProductBySku = new Map<string, any>();
    for (const p of cachedExistingProds) {
      if (p.barcode) {
        websiteProductByBarcode.set(String(p.barcode).trim().toLowerCase(), p);
      }
      if (p.sku) {
        websiteProductBySku.set(String(p.sku).trim().toLowerCase(), p);
      }
    }

    // Filter out rows marked as 'remove'
    let totalRemoved = 0;
    const rowsToImport = validRows.filter((r) => {
      const choice = choices[r.rowNumber];
      if (choice === "remove") {
        totalRemoved++;
        return false;
      }
      return true;
    });

    if (rowsToImport.length === 0) {
      toast.info(`All ${totalRemoved} conflicting rows were removed. Nothing to import.`);
      setConflictModalOpen(false);
      return;
    }

    setIsImporting(true);
    const importStartTime = performance.now();
    const CHUNK_SIZE = 1000;
    const totalChunks = Math.ceil(rowsToImport.length / CHUNK_SIZE);
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalFailed = 0;
    const failedChunks: { chunk: number; error: string }[] = [];
    const allFailedRowDetails: { barcode?: string; name?: string; reason: string }[] = [];

    const loadToast = toast.loading(
      `Importing ${rowsToImport.length} products in ${totalChunks} batch${totalChunks > 1 ? "es" : ""}...`
    );

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, rowsToImport.length);
        const chunkRows = rowsToImport.slice(start, end);

        toast.loading(
          `Importing products... Batch ${i + 1}/${totalChunks} (${start + 1} - ${end} of ${rowsToImport.length}) | Created: ${totalCreated}, Updated: ${totalUpdated}`,
          { id: loadToast }
        );

        const chunkProducts = chunkRows.map((r) => {
          const conflict = conflictByRow.get(r.rowNumber);
          const choice = choices[r.rowNumber];

          let action: "create" | "update" | "skip" = "create";
          let existingProductId: string | null = null;

          if (choice === "update") {
            const cleanBc = r.barcode ? String(r.barcode).trim().toLowerCase() : "";
            const cleanSk = r.sku ? String(r.sku).trim().toLowerCase() : "";
            const matchedOnWebsite =
              (conflict && conflict.existingProductId
                ? { id: conflict.existingProductId }
                : null) ||
              (r.existingProductId ? { id: r.existingProductId } : null) ||
              (cleanBc ? websiteProductByBarcode.get(cleanBc) : null) ||
              (cleanSk ? websiteProductBySku.get(cleanSk) : null);

            if (matchedOnWebsite && matchedOnWebsite.id) {
              action = "update";
              existingProductId = matchedOnWebsite.id;
            } else {
              action = "create";
              existingProductId = null;
            }
          } else {
            const willUpdate = isRowUpdating(r.rowNumber);
            existingProductId = r.existingProductId || null;
            if (
              r.classification === "exists" ||
              r.classification === "exists_update" ||
              r.classification === "exists_skip" ||
              r.classification === "add_to_branch" ||
              r.isExisting
            ) {
              action = willUpdate ? "update" : "skip";
            } else {
              action = "create";
            }
          }

          const rawStock = rowStocks[r.rowNumber];
          const parsedStock =
            rawStock !== undefined && rawStock !== "" && !isNaN(Number(rawStock))
              ? Math.max(0, Math.floor(Number(rawStock)))
              : null;

          return {
            action,
            existingProductId,
            name: r.name,
            barcode: r.barcode,
            sku: r.sku,
            category: r.category,
            unit: r.unit,
            costPrice: r.costPrice,
            salePrice: r.salePrice,
            stock: parsedStock,
            isBatchTracked: r.isBatchTracked,
          };
        });

        try {
          const requestPromise = (bulkImportProductsFn as any)({
            data: {
              products: chunkProducts,
              branchIds: importBranches,
              batchNumber: i + 1,
            },
          });
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Batch request timed out after 300 seconds")), 300000)
          );

          const res: any = await Promise.race([requestPromise, timeoutPromise]);

          if (res && res.success) {
            totalCreated += res.created || 0;
            totalUpdated += res.updated || 0;
            totalSkipped += res.skipped || 0;
            totalFailed += res.failed || 0;
            if (Array.isArray(res.failedRows) && res.failedRows.length > 0) {
              allFailedRowDetails.push(...res.failedRows);
            }
          } else {
            totalFailed += chunkRows.length;
            const errMsg = cleanErrorMessage(res?.error || `Batch ${i + 1} failed`);
            failedChunks.push({
              chunk: i + 1,
              error: errMsg,
            });
            // Stop import loop on batch failure to preserve counts done so far
            break;
          }
        } catch (chunkErr: any) {
          totalFailed += chunkRows.length;
          const errMsg = cleanErrorMessage(chunkErr.message || `Batch ${i + 1} encountered an error`);
          failedChunks.push({
            chunk: i + 1,
            error: errMsg,
          });
          // Stop import loop on batch error to preserve counts done so far
          break;
        }
      }

      toast.dismiss(loadToast);

      const elapsedSec = ((performance.now() - importStartTime) / 1000).toFixed(1);
      const summaryMsg = `Created ${totalCreated}, Updated ${totalUpdated}, Removed ${totalRemoved}`;

      if (totalFailed === 0 && failedChunks.length === 0) {
        toast.success(`Import complete in ${elapsedSec}s: ${summaryMsg}`);
        setImportModalOpen(false);
        setConflictModalOpen(false);
        setRawFileRows([]);
        setParsedRows([]);
        setSheetStats([]);
        setRowStocks({});
        setRowUpdateChoices({});
        setConflictItems([]);
        setConflictChoices({});
        setImportFile(null);
        setImportFileName("");
        await handleFetchCatalog(1, catalogSearch);
        router.invalidate();
      } else if (totalCreated > 0 || totalUpdated > 0) {
        const failureNote =
          allFailedRowDetails.length > 0
            ? allFailedRowDetails.slice(0, 3).map((f) => `${f.name || f.barcode || "Product"}: ${cleanErrorMessage(f.reason)}`).join("; ")
            : failedChunks.map((f) => `Batch ${f.chunk}: ${cleanErrorMessage(f.error)}`).join("; ");
        toast.warning(
          `Import partially completed in ${elapsedSec}s: ${summaryMsg}. (${failureNote})`
        );
        await handleFetchCatalog(1, catalogSearch);
        router.invalidate();
      } else {
        const failureNote =
          allFailedRowDetails.length > 0
            ? allFailedRowDetails.slice(0, 3).map((f) => `${f.name || f.barcode || "Product"}: ${cleanErrorMessage(f.reason)}`).join("; ")
            : failedChunks.map((f) => `Batch ${f.chunk}: ${cleanErrorMessage(f.error)}`).join("; ");
        toast.error(`Import failed after ${elapsedSec}s: ${summaryMsg}. (${failureNote})`);
      }
    } catch (err: any) {
      toast.dismiss(loadToast);
      toast.error(cleanErrorMessage(err.message || "Bulk import failed"));
    } finally {
      setIsImporting(false);
    }
  };

  const [branchAddOpen, setBranchAddOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [newBranchAddress, setNewBranchAddress] = useState("");
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);

  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [editBranchName, setEditBranchName] = useState("");
  const [editBranchAddress, setEditBranchAddress] = useState("");

  const [auditLogsData, setAuditLogsData] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const auditLogsPerPage = 10;

  useEffect(() => {
    if (activeTab === "audit_logs") {
      setIsLoadingLogs(true);
      getAuditLogsServerFn({ data: { limit: 100 } })
        .then((res) => {
          if (res.success) {
            setAuditLogsData(res.logs || []);
          } else {
            toast.error("Failed to load audit logs");
          }
        })
        .catch((err) => {
          toast.error(err.message || "Failed to load audit logs");
        })
        .finally(() => {
          setIsLoadingLogs(false);
        });
    }
  }, [activeTab]);

  const [vendorFormOpen, setVendorFormOpen] = useState(false);
  const [isEditingVendor, setIsEditingVendor] = useState(false);
  const [vendorForm, setVendorForm] = useState<any>({
    id: "",
    name: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    status: "Active",
    trn: "",
  });
  const [deleteVendorContext, setDeleteVendorContext] = useState<any>(null);
  const [deleteVendorDialogOpen, setDeleteVendorDialogOpen] = useState(false);
  const [isDeletingVendor, setIsDeletingVendor] = useState(false);

  // Delete PO State
  const [deletePoContext, setDeletePoContext] = useState<any>(null);
  const [deletePoDialogOpen, setDeletePoDialogOpen] = useState(false);
  const [isDeletingPo, setIsDeletingPo] = useState(false);

  // Edit PO State
  const [editPoOpen, setEditPoOpen] = useState(false);
  const [editPoForm, setEditPoForm] = useState<any>({
    id: "",
    vendorId: "",
    branchId: "",
    items: [],
  });
  const [isSavingPo, setIsSavingPo] = useState(false);

  // GRN submission state
  const [isSubmittingGRN, setIsSubmittingGRN] = useState(false);

  // Convert to Invoice State
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState<any>({
    purchaseOrderId: "",
    poNumber: "",
    grnNumber: "",
    vendorName: "",
    branchName: "",
    invoiceNumber: "",
    dueDate: "",
    items: [],
    subtotal: 0,
    vat: 0,
    total: 0,
    vatRate: 5,
    vatInclusive: true,
  });
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);

  // Invoice Detail view & PDF State
  const [invoiceDetailModalOpen, setInvoiceDetailModalOpen] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingFtaReport, setIsGeneratingFtaReport] = useState(false);

  const downloadVatSummaryCsv = () => {
    if (!data?.csv) {
      toast.error("VAT Summary CSV data is not available");
      return;
    }
    const blob = new Blob([data.csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const sanitizedTenant = (data?.tenantName || "tenant")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");
    link.setAttribute("download", `vat-summary-report-${sanitizedTenant}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("VAT Summary CSV report downloaded successfully!");
  };

  const downloadFtaSummary = async () => {
    setIsGeneratingFtaReport(true);
    const loadToast = toast.loading("Generating FTA Tax Summary Report...");

    try {
      const doc = new jsPDF();

      // Theme colors: Navy & Cool Grey
      const primaryColor: [number, number, number] = [27, 38, 59];
      const accentColor: [number, number, number] = [65, 90, 119];
      const textColor: [number, number, number] = [33, 37, 41];
      const mutedTextColor: [number, number, number] = [108, 117, 125];

      // Header Banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(0, 0, 210, 40, "F");

      // Header Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text("FTA VAT SUMMARY REPORT", 14, 25);

      // Business & Date Details
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFontSize(10);

      let currentY = 55;

      // Metadata Grid
      doc.setFont("helvetica", "bold");
      doc.text("Taxable Person Details", 14, currentY);
      doc.text("Report Parameters", 110, currentY);

      doc.setFont("helvetica", "normal");
      currentY += 6;
      doc.text(`Business Name: ${data?.tenantName || "Tenant"}`, 14, currentY);
      doc.text(`Reporting Period: ${data?.reportingPeriod || "All Time"}`, 110, currentY);

      currentY += 5;
      doc.text(`TRN: ${data?.settings?.taxRegistrationNumber || "Not Registered"}`, 14, currentY);
      doc.text(`Date Generated: ${new Date().toLocaleDateString("en-GB")}`, 110, currentY);

      currentY += 5;
      doc.text(`Standard Tax Rate: ${data?.settings?.vatRate || "5.00"}%`, 14, currentY);
      doc.text("Currency: AED", 110, currentY);

      // Divider Line
      currentY += 10;
      doc.setDrawColor(222, 226, 230);
      doc.line(14, currentY, 200, currentY);

      // Section: VAT Declaration Details
      currentY += 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("VAT Return Summary Table", 14, currentY);

      // Table Header
      currentY += 8;
      doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
      doc.rect(14, currentY, 186, 8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("Description (FTA Return Box Reference)", 16, currentY + 5.5);
      doc.text("Gross Amount (AED)", 115, currentY + 5.5);
      doc.text("VAT Amount (AED)", 160, currentY + 5.5);

      const drawRow = (desc: string, gross: number, vat: number, isTotal = false) => {
        currentY += 8;
        if (isTotal) {
          doc.setFillColor(241, 243, 245);
          doc.rect(14, currentY, 186, 8, "F");
          doc.setFont("helvetica", "bold");
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        } else {
          doc.setFont("helvetica", "normal");
          doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        }

        doc.text(desc, 16, currentY + 5.5);
        doc.text(
          gross.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          115,
          currentY + 5.5,
        );
        doc.text(
          vat.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          160,
          currentY + 5.5,
        );

        doc.setDrawColor(233, 236, 239);
        doc.line(14, currentY + 8, 200, currentY + 8);
      };

      const outVat = Number(data?.outputVat || 0);
      const inVat = Number(data?.inputVat || 0);
      const netVat = outVat - inVat;
      const salesTotal = Number(data?.salesTotal || 0);
      const purchasesTotal = Number(data?.purchasesTotal || 0);

      drawRow("Standard Rated Supplies (Box 1a - Sales)", salesTotal, outVat);
      drawRow("Standard Rated Expenses (Box 9 - Purchases)", purchasesTotal, inVat);

      const vatDueText =
        netVat >= 0
          ? "Net VAT Due to FTA (Box 10 - Payable)"
          : "Net VAT Refundable (Box 10 - Refundable)";
      drawRow(vatDueText, 0, netVat, true);

      // Sign-off / Disclaimer Note
      currentY += 25;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8.5);
      doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
      doc.text(
        "Declaration: Hereby certified that the above values are retrieved directly from standard sales data",
        14,
        currentY,
      );
      doc.text(
        "and vendor purchase invoices recorded within the CloudynationPOS platform.",
        14,
        currentY + 4,
      );

      const sanitizedTenant = (data?.tenantName || "tenant")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "-");
      doc.save(`fta-vat-summary-${sanitizedTenant}.pdf`);

      toast.dismiss(loadToast);
      toast.success("FTA VAT Summary report downloaded successfully!");
    } catch (err: any) {
      toast.dismiss(loadToast);
      toast.error(err.message || "Failed to generate FTA tax summary.");
    } finally {
      setIsGeneratingFtaReport(false);
    }
  };

  const downloadInvoicePdf = async (invoice: any) => {
    if (!invoice) return;
    setIsGeneratingPdf(true);
    const loadToast = toast.loading("Generating PDF...");
    try {
      const doc = new jsPDF();

      // Style constants
      doc.setTextColor(33, 37, 41); // dark charcoal

      // Title / Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text(invoice.tenantName || "Tenant", 14, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(108, 117, 125);
      if (invoice.tenantTrn) {
        doc.text(`TRN: ${invoice.tenantTrn}`, 14, 26);
      }
      doc.text(`Branch: ${invoice.branchName}`, 14, 31);

      // Invoice Meta (right aligned)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(33, 37, 41);
      doc.text("VENDOR INVOICE", 200, 20, { align: "right" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(73, 80, 87);
      doc.text(`Invoice Ref: ${invoice.invoiceNumber}`, 200, 26, { align: "right" });
      doc.text(`Date: ${invoice.createdAt ? invoice.createdAt.split("T")[0] : ""}`, 200, 31, {
        align: "right",
      });
      doc.text(`Due Date: ${invoice.dueDate ? invoice.dueDate.split("T")[0] : ""}`, 200, 36, {
        align: "right",
      });

      // Divider Line
      doc.setDrawColor(222, 226, 230);
      doc.line(14, 42, 200, 42);

      // Vendor & Reference Info
      doc.setFont("helvetica", "bold");
      doc.text("Supplier / Vendor:", 14, 50);
      doc.setFont("helvetica", "normal");
      doc.text(invoice.vendorName || "", 14, 55);
      if (invoice.vendorTrn) doc.text(`TRN: ${invoice.vendorTrn}`, 14, 60);
      if (invoice.vendorContact) doc.text(`Contact: ${invoice.vendorContact}`, 14, 65);
      if (invoice.vendorPhone) doc.text(`Phone: ${invoice.vendorPhone}`, 14, 70);
      if (invoice.vendorEmail) doc.text(`Email: ${invoice.vendorEmail}`, 14, 75);
      if (invoice.vendorAddress) doc.text(`Address: ${invoice.vendorAddress}`, 14, 80);

      // PO & GRN refs
      doc.setFont("helvetica", "bold");
      doc.text("References:", 120, 50);
      doc.setFont("helvetica", "normal");
      doc.text(`PO Number: ${invoice.poNumber}`, 120, 55);
      doc.text(`GRN Number: ${invoice.grnNumber}`, 120, 60);

      // Divider
      doc.line(14, 90, 200, 90);

      // Table Headers
      doc.setFont("helvetica", "bold");
      doc.text("Product Details", 14, 98);
      doc.text("Received Qty", 110, 98, { align: "right" });
      doc.text("Unit Price", 150, 98, { align: "right" });
      doc.text("Subtotal", 200, 98, { align: "right" });

      doc.line(14, 102, 200, 102);

      // Table Body
      doc.setFont("helvetica", "normal");
      let y = 110;
      (invoice.items || []).forEach((item: any) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
          doc.setFont("helvetica", "bold");
          doc.text("Product Details", 14, y);
          doc.text("Received Qty", 110, y, { align: "right" });
          doc.text("Unit Price", 150, y, { align: "right" });
          doc.text("Subtotal", 200, y, { align: "right" });
          doc.line(14, y + 4, 200, y + 4);
          doc.setFont("helvetica", "normal");
          y += 12;
        }

        doc.text(item.name || "", 14, y);
        doc.text(`${item.receivedQty} pcs`, 110, y, { align: "right" });
        doc.text(`${Number(item.unitPrice).toFixed(2)} AED`, 150, y, { align: "right" });
        doc.text(`${Number(item.subtotal).toFixed(2)} AED`, 200, y, { align: "right" });
        y += 8;
      });

      // Divider
      doc.line(14, y, 200, y);
      y += 10;

      // Totals
      doc.setFont("helvetica", "normal");
      doc.text(`Subtotal:`, 150, y, { align: "right" });
      doc.text(`${Number(invoice.subtotal).toFixed(2)} AED`, 200, y, { align: "right" });
      y += 6;

      doc.text(
        `VAT (${invoice.vatRate}% ${invoice.vatInclusive ? "Included" : "Excluded"}):`,
        150,
        y,
        { align: "right" },
      );
      doc.text(`${Number(invoice.vat).toFixed(2)} AED`, 200, y, { align: "right" });
      y += 8;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Total:`, 150, y, { align: "right" });
      doc.text(`${Number(invoice.total).toFixed(2)} AED`, 200, y, { align: "right" });

      doc.save(`invoice-${invoice.invoiceNumber}.pdf`);
      toast.dismiss(loadToast);
      toast.success("PDF Downloaded successfully!");
    } catch (err: any) {
      toast.dismiss(loadToast);
      toast.error(err.message || "Failed to generate PDF");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const printInvoice = () => {
    window.print();
  };

  const [togglingPerms, setTogglingPerms] = useState<Record<string, boolean>>({});

  const roleToDbMap: Record<string, string> = {
    "Super Admin": "super_admin",
    "Head Office Admin": "head_office_admin",
    "Branch Manager": "branch_manager",
    "Inventory Manager": "inventory_manager",
    "Purchasing Officer": "purchasing_officer",
    Cashier: "cashier",
  };

  const permToKeyMap: Record<string, string> = {
    "Branch override": "branch_override",
    "Local stock": "local_stock",
    "Pricing adjustments": "pricing_adjustments",
    "Till management": "till_management",
    "Shift & staff": "shift_staff",
    "Stock adjust": "stock_adjust",
    "Receive goods": "receive_goods",
    "Create PO": "create_po",
    "Receive invoices": "receive_invoices",
    "Process sales": "process_sales",
    Refunds: "refunds",
    "End of shift": "end_of_shift",
  };

  const isPermissionEnabled = (roleName: string, permissionName: string) => {
    const dbRole = roleToDbMap[roleName] || roleName.toLowerCase().replace(" ", "_");
    if (dbRole === "super_admin" || dbRole === "head_office_admin") return true;

    const dbPerm = permToKeyMap[permissionName] || permissionName;
    const record = (data?.permissions || []).find(
      (p: any) => p.role === dbRole && p.permission === dbPerm,
    );
    return record ? record.enabled : true;
  };

  const handleTogglePermission = async (
    roleName: string,
    permissionName: string,
    currentEnabled: boolean,
  ) => {
    const dbRole = roleToDbMap[roleName];
    if (!dbRole) return;

    if (dbRole === "super_admin" || dbRole === "head_office_admin") {
      toast.error("Permissions for administrative roles are locked and cannot be disabled.");
      return;
    }

    const dbPerm = permToKeyMap[permissionName] || permissionName;
    const key = `${dbRole}:${dbPerm}`;
    if (togglingPerms[key]) return;

    setTogglingPerms((prev) => ({ ...prev, [key]: true }));
    const targetEnabled = !currentEnabled;
    const loadToast = toast.loading(`Updating ${permissionName}...`);

    try {
      const res = await toggleRolePermissionFn({
        data: {
          role: dbRole as
            | "super_admin"
            | "head_office_admin"
            | "branch_manager"
            | "inventory_manager"
            | "purchasing_officer"
            | "cashier",
          permission: dbPerm,
          enabled: targetEnabled,
        },
      });

      toast.dismiss(loadToast);
      if (res && res.success) {
        toast.success(`${permissionName} updated successfully!`);
        router.invalidate();
      } else {
        toast.error("Failed to update permission");
      }
    } catch (err: any) {
      toast.dismiss(loadToast);
      toast.error(err.message || "An error occurred");
    } finally {
      setTogglingPerms((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDeleteStaff = async (id: string) => {
    try {
      const res = await deleteStaffFn({ data: { id } });
      if (res.success) {
        toast.success(res.message || "Staff member deleted successfully.");
        router.invalidate();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete staff member");
    }
  };

  const handleCreateBranch = async () => {
    if (!newBranchName) {
      toast.error("Branch name is required");
      return;
    }
    setIsCreatingBranch(true);
    try {
      const res = await createBranchForTenantFn({
        data: { name: newBranchName, address: newBranchAddress },
      });
      if (res.success) {
        toast.success("Branch created successfully!");
        setBranchAddOpen(false);
        setNewBranchName("");
        setNewBranchAddress("");
        router.invalidate();
      } else {
        toast.error(res.error || "Failed to create branch");
      }
    } catch (e: any) {
      toast.error(e.message || "An error occurred");
    } finally {
      setIsCreatingBranch(false);
    }
  };

  const categoriesList = Array.from(
    new Set((data?.products || []).map((p: any) => p.category).filter(Boolean)),
  ) as string[];

  return (
    <DemoShell
      title="Head Office Dashboard"
      subtitle={`${data?.tenantName || "Tenant"} · ${mappedOutlets.length} outlets · ${mappedOutlets.reduce((s: any, o: any) => s + o.tills, 0)} tills`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl font-semibold border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 shadow-sm"
            onClick={() => {
              setActiveTab("support");
              setIsNewTicketModalOpen(true);
            }}
          >
            <LifeBuoy className="mr-1.5 h-4 w-4" /> Raise Support Ticket
          </Button>
          <Button
            className="rounded-xl font-semibold"
            onClick={() => toast.success("Daily brief exported")}
          >
            <Download className="mr-1.5 h-4 w-4" /> Export daily brief
          </Button>
        </div>
      }
    >
      <Tabs 
        value={activeTab} 
        onValueChange={(val) => {
          setActiveTab(val);
          setIsMobileMenuOpen(false);
          if (val === "subscription_billing") {
            setUnseenInvoicesCount(0);
            markTenantInvoicesSeenFn().catch(() => {});
          }
        }} 
        className="mt-6 flex flex-col md:flex-row gap-8"
      >
        <div className="md:hidden flex items-center justify-between bg-white p-3 rounded-xl border border-gray-200">
          <span className="font-semibold text-sm">Navigation Menu</span>
          <Button variant="outline" size="sm" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        <aside className={`w-full md:w-56 shrink-0 ${isMobileMenuOpen ? "block" : "hidden md:block"}`}>
          <TabsList className="flex h-auto w-full flex-col items-stretch justify-start gap-1 rounded-xl bg-transparent p-0">
            <TabsTrigger
              value="dashboard"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="branches"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Branches
            </TabsTrigger>
            <TabsTrigger
              value="catalog"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Catalog
            </TabsTrigger>
            <TabsTrigger
              value="recipes"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Product Recipes (BOM)
            </TabsTrigger>
            <TabsTrigger
              value="batches"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Inventory & Batches
            </TabsTrigger>
            <TabsTrigger
              value="crm"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              CRM & Customers
            </TabsTrigger>
            <TabsTrigger
              value="purchasing"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Purchasing
            </TabsTrigger>
            <TabsTrigger
              value="roles"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Staff & Roles
            </TabsTrigger>
            <TabsTrigger
              value="payroll"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Payroll
            </TabsTrigger>
            <TabsTrigger
              value="vat"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              VAT & Reports
            </TabsTrigger>
            <TabsTrigger
              value="loyalty"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Customers
            </TabsTrigger>
            <TabsTrigger
              value="promotions"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Promotions
            </TabsTrigger>
            <TabsTrigger
              value="price_requests"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Price Requests
            </TabsTrigger>
            <TabsTrigger
              value="vendors"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Vendors
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Reports & VAT
            </TabsTrigger>
            <TabsTrigger
              value="financial_reports"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Financial Reports
            </TabsTrigger>
            <TabsTrigger
              value="subscription_billing"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
              onClick={() => {
                setUnseenInvoicesCount(0);
                markTenantInvoicesSeenFn().catch(() => {});
              }}
            >
              <div className="flex items-center justify-between w-full">
                <span>Subscription & Billing</span>
                {unseenInvoicesCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-lime-500 text-[10px] font-black text-slate-950 shadow-sm">
                    {unseenInvoicesCount}
                  </span>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="expenses"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Expenses
            </TabsTrigger>
            <TabsTrigger
              value="support"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Support & Help Desk
            </TabsTrigger>
            <TabsTrigger
              value="audit_logs"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Audit Logs
            </TabsTrigger>

          </TabsList>
        </aside>

        <main className="min-w-0 flex-1">
          <TabsContent value="dashboard" className="mt-0 space-y-5">
            {data?.reminderInvoices && data.reminderInvoices.length > 0 && data.reminderInvoices[0] && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent p-4 shadow-sm text-ink mb-2">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-slate-950 font-bold shadow-sm">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="text-sm font-extrabold text-amber-900 dark:text-amber-300">
                      Payment due: AED {Number(data.reminderInvoices[0].totalAmount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}, due {new Date(data.reminderInvoices[0].periodEnd).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })} — Pay Now
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      Invoice ref: <span className="font-mono font-semibold">{data.reminderInvoices[0].invoiceNumber}</span> ({data.reminderInvoices[0].planName} plan)
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {data.reminderInvoices[0].mamoPaymentUrl ? (
                    <Button
                      size="sm"
                      className="rounded-xl font-bold bg-lime-500 hover:bg-lime-600 text-slate-950 shadow-sm transition-all hover:-translate-y-0.5"
                      asChild
                    >
                      <a href={data.reminderInvoices[0].mamoPaymentUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Pay Now
                      </a>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl font-bold border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/10"
                      onClick={() => toast.info("Please contact Cloudynation support at support@cloudynationpos.com or raise a ticket in Support tab.")}
                    >
                      Contact support
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                label="Network sales today"
                value={aedShort(totalSales)}
                delta={undefined}
                icon={TrendingUp}
              />
              <StatCard
                label="Outlets reporting"
                value={`${mappedOutlets.length} / ${mappedOutlets.length}`}
                delta="All online"
                icon={Building2}
                tone="success"
              />
              <StatCard
                label="Near-expiry batches"
                value={String(nearExpiry)}
                icon={AlertTriangle}
                tone="accent"
              />
              <StatCard
                label="Open purchase value"
                value={aedShort(
                  mappedPurchases.reduce(
                    (sum: any, p: any) => (p.stage === "PO" ? sum + p.value : sum),
                    0,
                  ),
                )}
                icon={Package}
              />
            </div>
            <div className="panel p-6">
              <h2 className="text-sm font-bold text-ink">Branch performance · AED 000s</h2>
              <div className="mt-4 h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.branchTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="d" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis tickLine={false} axisLine={false} fontSize={12} width={36} />
                    <Tooltip />
                    <Legend />
                    {mappedOutlets.map((o: any) => (
                      <Bar key={o.id} dataKey={o.name} fill="#39ff14" radius={[6, 6, 0, 0]} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="branches" className="mt-0 space-y-5">
            <div className="flex justify-end mb-4">
              <Dialog open={branchAddOpen} onOpenChange={setBranchAddOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-xl">
                    <Plus className="h-4 w-4 mr-2" /> Add Outlet / Branch
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add New Branch</DialogTitle>
                    <DialogDescription>Create a new retail outlet or branch location.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-1.5">
                      <Label>Branch Name</Label>
                      <Input
                        value={newBranchName}
                        onChange={(e) => setNewBranchName(e.target.value)}
                        placeholder="e.g. Al Barsha Branch"
                        className="rounded-xl border-border/50 bg-surface-2"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Address / Location</Label>
                      <Input
                        value={newBranchAddress}
                        onChange={(e) => setNewBranchAddress(e.target.value)}
                        placeholder="e.g. Dubai, UAE"
                        className="rounded-xl border-border/50 bg-surface-2"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" className="rounded-xl" onClick={() => setBranchAddOpen(false)}>
                      Cancel
                    </Button>
                    <Button className="rounded-xl" onClick={handleCreateBranch} disabled={isCreatingBranch}>
                      {isCreatingBranch ? "Adding..." : "Add Branch"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mappedOutlets.map((o: any) => (
                <Dialog key={o.id}>
                  <DialogTrigger asChild>
                    <div className="panel p-5 cursor-pointer hover:border-primary/30 transition-colors">
                      <p className="text-sm font-bold text-ink">{o.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {o.emirate} · {o.tills} tills
                      </p>
                      <p className="mt-4 text-xl font-extrabold text-ink">{aedShort(o.sales)}</p>
                      <p
                        className={`text-xs font-semibold ${o.growth >= 0 ? "text-success" : "text-destructive"}`}
                      >
                        {o.growth >= 0 ? "+" : ""}
                        {o.growth}% week on week
                      </p>
                      <div className="mt-4">
                        <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
                          <span>Stock health</span>
                          <span>{o.stockHealth}%</span>
                        </div>
                        <Progress value={o.stockHealth} className="h-2" />
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Manage Branch: {o.name}</DialogTitle>
                      <DialogDescription>
                        Adjust local stock and pricing overrides for this branch.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 space-y-6">
                      {/* Branch Details and Settings */}
                      <div className="rounded-xl border border-border p-5 bg-surface-2/50 space-y-4">
                        <h4 className="text-sm font-bold text-ink">Branch Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <Label>Branch Name</Label>
                            <Input
                              value={editingBranchId === o.id ? editBranchName : o.name}
                              onFocus={() => {
                                if (editingBranchId !== o.id) {
                                  setEditingBranchId(o.id);
                                  setEditBranchName(o.name);
                                  setEditBranchAddress(o.address || "");
                                }
                              }}
                              onChange={(e) => setEditBranchName(e.target.value)}
                              className="rounded-xl border-border/50 bg-surface"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label>Address / Location</Label>
                            <Input
                              value={editingBranchId === o.id ? editBranchAddress : (o.address || "")}
                              onFocus={() => {
                                if (editingBranchId !== o.id) {
                                  setEditingBranchId(o.id);
                                  setEditBranchName(o.name);
                                  setEditBranchAddress(o.address || "");
                                }
                              }}
                              onChange={(e) => setEditBranchAddress(e.target.value)}
                              className="rounded-xl border-border/50 bg-surface"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            className="rounded-lg"
                            disabled={editingBranchId !== o.id || !editBranchName}
                            onClick={async () => {
                              try {
                                const res = await updateBranchFn({
                                  data: { branchId: o.id, name: editBranchName, address: editBranchAddress }
                                });
                                if (res.success) {
                                  toast.success("Branch details updated!");
                                  setEditingBranchId(null);
                                  router.invalidate();
                                }
                              } catch (e: any) {
                                toast.error(e.message);
                              }
                            }}
                          >
                            Save Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg"
                            onClick={async () => {
                              try {
                                const res = o.status === "Active"
                                  ? await deactivateBranchFn({ data: { branchId: o.id } })
                                  : await activateBranchFn({ data: { branchId: o.id } });
                                if (res.success) {
                                  toast.success(`Branch ${o.status === "Active" ? "deactivated" : "activated"}!`);
                                  router.invalidate();
                                }
                              } catch (e: any) {
                                toast.error(e.message);
                              }
                            }}
                          >
                            {o.status === "Active" ? "Deactivate Branch" : "Activate Branch"}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-bold text-ink mb-3">Local Inventory</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>SKU</TableHead>
                              <TableHead>Product</TableHead>
                              <TableHead>Current Stock</TableHead>
                              <TableHead>Adjust (+/-)</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mappedProducts.map((p: any) => {
                              const localStockItem = (data?.stock || []).find(
                                (s: any) => s.productId === p.id && s.branchId === o.id,
                              );
                              const localStock = localStockItem ? localStockItem.stock : 0;
                              return (
                                <TableRow key={p.sku}>
                                  <TableCell className="text-xs font-mono">{p.sku}</TableCell>
                                  <TableCell className="font-semibold text-ink">{p.name}</TableCell>
                                  <TableCell>
                                    {localStock} {p.unit}
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      className="w-24 h-8 text-sm"
                                      id={`adj-${p.id}`}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        const el = document.getElementById(
                                          `adj-${p.id}`,
                                        ) as HTMLInputElement;
                                        const qty = Number(el.value);
                                        if (isNaN(qty)) return;
                                        const res = await updateStockFn({
                                          data: {
                                            productId: p.id,
                                            branchId: o.id,
                                            qty: localStock + qty,
                                          },
                                        });
                                        if (res.success) {
                                          router.invalidate();
                                          toast.success("Stock adjusted");
                                          el.value = "";
                                        }
                                      }}
                                    >
                                      Update
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                      <div>
                        <h3 className="font-bold text-ink mb-3">Pricing Overrides</h3>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Product</TableHead>
                              <TableHead>Standard Price</TableHead>
                              <TableHead>Local Price</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {mappedProducts.map((p: any) => {
                              const localStockItem = (data?.stock || []).find(
                                (s: any) => s.productId === p.id && s.branchId === o.id,
                              );
                              const priceOverride = localStockItem?.priceOverride;
                              return (
                                <TableRow key={p.sku}>
                                  <TableCell className="font-semibold text-ink">{p.name}</TableCell>
                                  <TableCell>{aed(p.price)}</TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      defaultValue={priceOverride || p.price}
                                      className="w-24 h-8 text-sm"
                                      id={`prc-${p.id}`}
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        const el = document.getElementById(
                                          `prc-${p.id}`,
                                        ) as HTMLInputElement;
                                        const val = el.value;
                                        const res = await updatePriceOverrideFn({
                                          data: {
                                            productId: p.id,
                                            branchId: o.id,
                                            priceOverride: val,
                                          },
                                        });
                                        if (res.success) {
                                          router.invalidate();
                                          toast.success("Price overridden");
                                        }
                                      }}
                                    >
                                      Save
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="catalog" className="mt-0 space-y-4">
            {/* Catalog Toolbar */}
            <div className="flex flex-col gap-3">
              {/* Row 1: Search & Branch Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full">
                <div className="relative flex-1">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, barcode, or SKU..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleFetchCatalog(1, catalogSearch);
                      }
                    }}
                    className="pl-9 h-10 rounded-xl bg-surface-2/50 border-border/50 text-sm w-full"
                  />
                </div>

                <Select
                  value={selectedCatalogBranch}
                  onValueChange={(val) => {
                    setSelectedCatalogBranch(val);
                    setCatalogPage(1);
                    handleFetchCatalog(1, catalogSearch, val);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[190px] h-10 rounded-xl bg-surface-2/50 border-border/50 text-xs font-medium shrink-0">
                    <Building2 className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {(data?.branches || []).map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => handleFetchCatalog(1, catalogSearch)}
                  disabled={isCatalogLoading}
                  className="rounded-xl h-10 px-4 text-xs font-semibold shrink-0 justify-center"
                >
                  {isCatalogLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Search className="h-4 w-4 mr-1.5" />
                  )}
                  Search
                </Button>
              </div>

              {/* Row 2: Actions & Selection */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 w-full">
                <div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (isAllMatchingSelected) {
                        setIsAllMatchingSelected(false);
                        setCatalogSelectedProductIds(new Set());
                      } else {
                        setIsAllMatchingSelected(true);
                      }
                    }}
                    className={`group rounded-xl h-10 px-3 sm:px-4 font-semibold text-xs sm:text-sm w-full sm:w-auto transition-all duration-200 shadow-sm cursor-pointer ${
                      isAllMatchingSelected
                        ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white hover:border-destructive hover:shadow-md hover:shadow-destructive/20"
                        : "border-border/80 bg-surface/90 text-ink hover:bg-primary hover:border-primary hover:text-black hover:shadow-md hover:shadow-primary/20"
                    }`}
                  >
                    {isAllMatchingSelected ? (
                      <>
                        <X className="h-4 w-4 mr-1.5 transition-transform duration-200 group-hover:rotate-90 group-hover:scale-110" /> Clear Selection
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1.5 text-emerald-600 dark:text-primary transition-all duration-200 group-hover:text-black group-hover:scale-110" /> Select All Products ({catalogTotal.toLocaleString()})
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setImportBranches([]);
                      setImportAllBranches(false);
                      setImportModalOpen(true);
                    }}
                    className="rounded-xl h-10 px-3 sm:px-4 font-semibold justify-center text-xs sm:text-sm"
                  >
                    <UploadCloud className="h-4 w-4 mr-1.5" /> Import Excel/CSV
                  </Button>

                  <Button
                    variant="outline"
                    onClick={async () => {
                      setPlatformPricingOpen(true);
                      await fetchSalesChannels();
                    }}
                    className="rounded-xl h-10 px-3 sm:px-4 font-semibold justify-center text-xs sm:text-sm"
                  >
                    <Percent className="h-4 w-4 mr-1.5" /> Platform Pricing
                  </Button>

                  <Button
                    onClick={handleOpenAddProduct}
                    className="rounded-xl h-10 px-3 sm:px-4 font-semibold justify-center text-xs sm:text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1.5" /> Add Product
                  </Button>
                </div>
              </div>
            </div>

            {/* Catalog Table & Mobile Cards Container */}
            <div className="rounded-2xl border border-border/50 bg-surface/50 shadow-sm backdrop-blur-xl overflow-hidden">
              {/* Bulk Selection Bar */}
              {hasCatalogSelection && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-primary/10 border-b border-primary/20 text-xs sm:text-sm text-ink animate-in fade-in slide-in-from-top-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-primary">
                      {isAllMatchingSelected
                        ? `All ${catalogTotal.toLocaleString()} matching products selected`
                        : `${catalogSelectedProductIds.size.toLocaleString()} selected`}
                    </span>
                    {!isAllMatchingSelected && catalogTotal > catalogSelectedProductIds.size && (
                      <>
                        <span className="text-muted-foreground">•</span>
                        <button
                          type="button"
                          onClick={() => setIsAllMatchingSelected(true)}
                          className="text-primary hover:underline font-semibold cursor-pointer"
                        >
                          Select all {catalogTotal.toLocaleString()} matching products
                        </button>
                      </>
                    )}
                    <span className="text-muted-foreground">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setCatalogSelectedProductIds(new Set());
                        setIsAllMatchingSelected(false);
                      }}
                      className="text-muted-foreground hover:text-ink hover:underline font-medium cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setBulkDeleteConfirmText("");
                      setBulkDeleteDialogOpen(true);
                    }}
                    className="rounded-xl h-8 px-3 text-xs font-semibold shadow-sm w-full sm:w-auto"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete Selected
                  </Button>
                </div>
              )}

              {/* Desktop Table View (md and up) */}
              <div
                ref={catalogTableRef}
                onMouseDown={handleCatalogMouseDown}
                onClickCapture={handleCatalogClickCapture}
                className={`hidden md:block w-full overflow-x-auto ${isCatalogDragging ? "cursor-grabbing select-none" : "cursor-grab"}`}
              >
                <table className="w-full caption-bottom text-sm min-w-max">
                  <thead className="bg-surface-2 [&_tr]:border-b-0">
                    <tr className="border-b border-border/50">
                      <th className="h-11 w-10 px-3 py-3 text-center align-middle whitespace-nowrap">
                        <Checkbox
                          checked={isAllOnPageSelected ? true : isSomeOnPageSelected ? "indeterminate" : false}
                          onCheckedChange={handleToggleSelectAllOnPage}
                          aria-label="Select all on this page"
                        />
                      </th>
                      <th className="h-11 px-3 py-3 text-left align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        SKU
                      </th>
                      <th className="h-11 px-3 py-3 text-left align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[200px] max-w-[260px] sticky left-0 bg-surface-2 z-20 shadow-[4px_0_12px_rgba(0,0,0,0.06)]">
                        Product
                      </th>
                      <th className="h-11 px-3 py-3 text-left align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Barcode
                      </th>
                      <th className="h-11 px-2.5 py-3 text-left align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Unit
                      </th>
                      <th className="h-11 px-2.5 py-3 text-left align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Category
                      </th>
                      <th className="h-11 px-2.5 py-3 text-right align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Cost
                      </th>
                      <th className="h-11 px-2.5 py-3 text-right align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Retail
                      </th>
                      {catalogChannels.map((ch) => {
                        const markupDisplay = ch.markupPercent > 0 ? `(+${ch.markupPercent}%)` : `(${ch.markupPercent}%)`;
                        return (
                          <th
                            key={ch.key}
                            className="h-11 px-2.5 py-3 text-right align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap"
                          >
                            {ch.name} {markupDisplay}
                          </th>
                        );
                      })}
                      <th className="h-11 px-2.5 py-3 text-right align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Stock
                      </th>
                      <th className="h-11 px-4 py-3 text-center align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap sticky right-0 bg-surface-2 z-20 shadow-[-4px_0_12px_rgba(0,0,0,0.06)] min-w-[120px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {mappedProducts.map((p: any) => (
                      <tr
                        key={p.id}
                        className={cn(
                          "group border-b border-border/50 transition-all duration-200 hover:bg-primary/[0.03]",
                          (isAllMatchingSelected || catalogSelectedProductIds.has(p.id)) && "bg-primary/[0.04]"
                        )}
                      >
                        <td className="w-10 px-3 py-3 align-middle text-center whitespace-nowrap">
                          <Checkbox
                            checked={isAllMatchingSelected || catalogSelectedProductIds.has(p.id)}
                            onCheckedChange={() => handleToggleSelectProduct(p.id)}
                            aria-label={`Select ${p.name}`}
                          />
                        </td>
                        <td className="px-3 py-3 align-middle font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {p.sku}
                        </td>
                        <td className="px-3 py-3 align-middle font-semibold text-ink sticky left-0 bg-surface group-hover:bg-surface shadow-[4px_0_12px_rgba(0,0,0,0.06)] z-10">
                          <div className="max-w-[220px] line-clamp-2 break-words" title={p.name}>
                            {p.name}
                          </div>
                        </td>
                        <td className="px-3 py-3 align-middle font-mono text-xs whitespace-nowrap">
                          {p.barcode || "—"}
                        </td>
                        <td className="px-2.5 py-3 align-middle text-sm whitespace-nowrap">{p.unit}</td>
                        <td className="px-2.5 py-3 align-middle text-sm whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {p.category}
                          </span>
                        </td>
                        <td className="px-2.5 py-3 align-middle text-right tabular-nums whitespace-nowrap">
                          {p.cost.toFixed(2)}
                        </td>
                        <td className="px-2.5 py-3 align-middle text-right font-semibold tabular-nums text-ink whitespace-nowrap">
                          {p.price.toFixed(2)}
                        </td>
                        {catalogChannels.map((ch) => {
                          const overrideVal = catalogChannelOverrides[p.id]?.[ch.key] ?? null;
                          const channelPrice = resolveChannelPrice(p.price, ch.markupPercent, overrideVal);
                          const hasOverride = overrideVal !== null && overrideVal !== undefined;

                          return (
                            <td
                              key={ch.key}
                              className="px-2.5 py-3 align-middle text-right tabular-nums whitespace-nowrap"
                            >
                              <div className="inline-flex items-center justify-end gap-1 font-medium">
                                <span>{channelPrice.toFixed(2)}</span>
                                {hasOverride && (
                                  <span
                                    title="Manual price"
                                    className="inline-flex items-center text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold cursor-help"
                                  >
                                    <Pencil className="h-2.5 w-2.5 mr-0.5" />
                                    manual
                                  </span>
                                )}
                              </div>
                            </td>
                          );
                        })}
                        <td className="px-2.5 py-3 align-middle text-right tabular-nums font-medium whitespace-nowrap">
                          {p.stock}
                        </td>
                        <td className="px-4 py-3 align-middle text-center whitespace-nowrap sticky right-0 bg-surface group-hover:bg-surface shadow-[-4px_0_12px_rgba(0,0,0,0.06)] z-10">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => handleOpenEditProduct(p)}
                              title="Edit product"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 rounded-lg text-primary hover:bg-primary/10"
                              onClick={() => {
                                setProductForm({
                                  id: "",
                                  name: `${p.name} (Copy)`,
                                  barcode: "",
                                  category: p.category,
                                  unit: p.unit,
                                  costPrice: p.costPriceRaw,
                                  salePrice: p.salePriceRaw,
                                  isBatchTracked: p.isBatchTracked,
                                  barcodes: [],
                                  variants: [],
                                  conversions: [],
                                });
                                setIsEditingProduct(false);
                                setProductFormOpen(true);
                              }}
                              title="Duplicate product"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 rounded-lg text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setDeleteProductContext(p);
                                setDeleteDialogOpen(true);
                              }}
                              title="Remove product"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {mappedProducts.length === 0 && (
                      <tr>
                        <td
                          colSpan={10 + catalogChannels.length}
                          className="p-8 text-center text-sm text-muted-foreground"
                        >
                          {isCatalogLoading ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              <span>Loading catalog items...</span>
                            </div>
                          ) : (
                            <span>No products found matching your search.</span>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View (below md) */}
              <div className="md:hidden divide-y divide-border/50">
                {mappedProducts.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5 bg-surface-2/60 border-b border-border/50 text-xs text-muted-foreground">
                    <label className="flex items-center gap-2 cursor-pointer font-medium text-ink">
                      <Checkbox
                        checked={isAllOnPageSelected ? true : isSomeOnPageSelected ? "indeterminate" : false}
                        onCheckedChange={handleToggleSelectAllOnPage}
                      />
                      <span>Select all on page ({currentPageProductIds.length})</span>
                    </label>
                  </div>
                )}
                {mappedProducts.map((p: any) => (
                  <div
                    key={p.id}
                    className={cn(
                      "p-4 space-y-3 bg-surface/30 transition-colors",
                      (isAllMatchingSelected || catalogSelectedProductIds.has(p.id)) && "bg-primary/[0.06]"
                    )}
                  >
                    {/* Top row: Checkbox + Name + Category & Unit */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="pt-0.5 shrink-0">
                        <Checkbox
                          checked={isAllMatchingSelected || catalogSelectedProductIds.has(p.id)}
                          onCheckedChange={() => handleToggleSelectProduct(p.id)}
                          aria-label={`Select ${p.name}`}
                        />
                      </div>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <div className="font-bold text-sm text-ink break-words">{p.name}</div>
                        <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                          {p.sku && <span className="font-mono text-[11px]">{p.sku}</span>}
                          {p.sku && p.barcode && <span>•</span>}
                          {p.barcode && <span className="font-mono text-[11px]">{p.barcode}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
                          {p.category}
                        </span>
                        <span className="text-xs text-muted-foreground font-medium px-1.5 py-0.5 rounded bg-surface-2 border border-border/50">
                          {p.unit}
                        </span>
                      </div>
                    </div>

                    {/* Pricing & Stock Details Card */}
                    <div className="p-2.5 rounded-xl bg-surface-2/60 border border-border/40 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Store:</span>
                        <span className="font-semibold text-ink tabular-nums">{p.price.toFixed(2)}</span>
                      </div>
                      {catalogChannels.map((ch) => {
                        const overrideVal = catalogChannelOverrides[p.id]?.[ch.key] ?? null;
                        const channelPrice = resolveChannelPrice(p.price, ch.markupPercent, overrideVal);
                        const hasOverride = overrideVal !== null && overrideVal !== undefined;
                        const markupDisplay = ch.markupPercent > 0 ? `(+${ch.markupPercent}%)` : `(${ch.markupPercent}%)`;

                        return (
                          <div key={ch.key} className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {ch.name} {markupDisplay}:
                            </span>
                            <div className="inline-flex items-center gap-1 font-medium tabular-nums">
                              <span className="text-ink font-semibold">{channelPrice.toFixed(2)}</span>
                              {hasOverride && (
                                <span
                                  title="Manual price"
                                  className="inline-flex items-center text-[10px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold"
                                >
                                  <Pencil className="h-2 w-2 mr-0.5" />
                                  manual
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      <div className="flex items-center justify-between pt-1 border-t border-border/40">
                        <span className="text-muted-foreground">Stock:</span>
                        <span className="font-medium tabular-nums text-ink">{p.stock}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 rounded-lg text-xs"
                        onClick={() => handleOpenEditProduct(p)}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 rounded-lg text-xs text-primary hover:bg-primary/10"
                        onClick={() => {
                          setProductForm({
                            id: "",
                            name: `${p.name} (Copy)`,
                            barcode: "",
                            category: p.category,
                            unit: p.unit,
                            costPrice: p.costPriceRaw,
                            salePrice: p.salePriceRaw,
                            isBatchTracked: p.isBatchTracked,
                            barcodes: [],
                            variants: [],
                            conversions: [],
                          });
                          setIsEditingProduct(false);
                          setProductFormOpen(true);
                        }}
                      >
                        <Copy className="h-3.5 w-3.5 mr-1" /> Duplicate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 rounded-lg text-xs text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setDeleteProductContext(p);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {mappedProducts.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    {isCatalogLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Loading catalog items...</span>
                      </div>
                    ) : (
                      <span>No products found matching your search.</span>
                    )}
                  </div>
                )}
              </div>

              {/* Clean Pagination Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-border/50 bg-surface-2/40 text-xs text-muted-foreground rounded-b-2xl">
                <div>
                  Showing{" "}
                  <span className="font-semibold text-ink">
                    {catalogTotal > 0 ? (catalogPage - 1) * catalogPageSize + 1 : 0}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-ink">
                    {Math.min(catalogPage * catalogPageSize, catalogTotal)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-ink">
                    {catalogTotal.toLocaleString()}
                  </span>{" "}
                  products
                </div>

                <div className="flex items-center gap-2">
                  <span className="mr-2">
                    Page <span className="font-semibold text-ink">{catalogPage}</span> of{" "}
                    <span className="font-semibold text-ink">
                      {Math.max(1, Math.ceil(catalogTotal / catalogPageSize))}
                    </span>
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={catalogPage <= 1 || isCatalogLoading}
                    onClick={() => handleFetchCatalog(catalogPage - 1, catalogSearch)}
                    className="h-8 px-2.5 rounded-lg text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={
                      catalogPage >= Math.ceil(catalogTotal / catalogPageSize) ||
                      isCatalogLoading
                    }
                    onClick={() => handleFetchCatalog(catalogPage + 1, catalogSearch)}
                    className="h-8 px-2.5 rounded-lg text-xs"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            <Dialog open={productFormOpen} onOpenChange={setProductFormOpen}>
              <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>{isEditingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
                  <DialogDescription>Create or modify product details.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label>Product Name</Label>
                    <Input
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      className="rounded-xl border-border/50 bg-surface-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Barcode / SKU</Label>
                      <Input
                        value={productForm.barcode}
                        onChange={(e) =>
                          setProductForm({ ...productForm, barcode: e.target.value })
                        }
                        className="rounded-xl border-border/50 bg-surface-2"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Category</Label>
                      <Input
                        value={productForm.category}
                        onChange={(e) =>
                          setProductForm({ ...productForm, category: e.target.value })
                        }
                        className="rounded-xl border-border/50 bg-surface-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label>Unit</Label>
                      <Input
                        value={productForm.unit}
                        placeholder="e.g. kg"
                        onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                        className="rounded-xl border-border/50 bg-surface-2"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Cost Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={productForm.costPrice}
                        onChange={(e) =>
                          setProductForm({ ...productForm, costPrice: e.target.value })
                        }
                        className="rounded-xl border-border/50 bg-surface-2"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Retail Price</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={productForm.salePrice}
                        onChange={(e) =>
                          setProductForm({ ...productForm, salePrice: e.target.value })
                        }
                        className="rounded-xl border-border/50 bg-surface-2"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2 p-3 border rounded-xl bg-surface-2/50">
                    <div className="space-y-0.5">
                      <Label className="text-base text-ink">Batch Tracked</Label>
                      <p className="text-xs text-muted-foreground">
                        Track expiry dates and batches
                      </p>
                    </div>
                    <Switch
                      checked={productForm.isBatchTracked}
                      onCheckedChange={(c) => setProductForm({ ...productForm, isBatchTracked: c })}
                    />
                  </div>

                  {/* Platform Prices Section */}
                  <div className="space-y-2 border-t pt-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold text-ink">Platform Prices</Label>
                      <span className="text-[11px] text-muted-foreground">
                        Auto-calculated from Retail Price or manual override
                      </span>
                    </div>
                    {isLoadingProductChannels ? (
                      <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        <span>Loading platform prices...</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {activeChannelsForProduct.map((ch: any) => {
                          const retailNum = Number(productForm.salePrice) || 0;
                          const key = ch.channelKey || ch.key;
                          const autoPrice = resolveChannelPrice(retailNum, ch.markupPercent, null);
                          const overrideVal = productChannelOverrides[key] || "";
                          const markupDisplay =
                            Number(ch.markupPercent) > 0 ? `+${ch.markupPercent}%` : `${ch.markupPercent}%`;

                          return (
                            <div
                              key={key}
                              className="flex items-center justify-between p-2.5 rounded-xl border border-border/50 bg-surface-2/40 gap-3"
                            >
                              <div className="space-y-0.5">
                                <div className="text-xs font-semibold text-ink">
                                  {ch.name}{" "}
                                  <span className="text-[11px] text-muted-foreground font-normal">
                                    ({markupDisplay})
                                  </span>
                                </div>
                                <div className="text-[11px] text-muted-foreground">
                                  {autoPrice.toFixed(2)} auto
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-[11px] text-muted-foreground shrink-0">Override:</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="Auto"
                                  value={overrideVal}
                                  onChange={(e) => {
                                    setProductChannelOverrides({
                                      ...productChannelOverrides,
                                      [key]: e.target.value,
                                    });
                                  }}
                                  className="w-24 h-8 text-xs rounded-lg border-border/50 bg-surface text-right"
                                />
                              </div>
                            </div>
                          );
                        })}
                        {activeChannelsForProduct.length === 0 && (
                          <p className="text-xs text-muted-foreground italic py-1">
                            No active platforms configured.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Alternate Barcodes Section */}
                  <div className="space-y-2 border-t pt-3">
                    <Label className="text-sm font-bold text-ink">Alternate Barcodes</Label>
                    <div className="space-y-2">
                      {(productForm.barcodes || []).map((bar: string, idx: number) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <Input
                            value={bar}
                            onChange={(e) => {
                              const copy = [...productForm.barcodes];
                              copy[idx] = e.target.value;
                              setProductForm({ ...productForm, barcodes: copy });
                            }}
                            placeholder="Scan or type barcode"
                            className="rounded-xl border-border/50 bg-surface-2 flex-1"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const copy = productForm.barcodes.filter((_: any, i: number) => i !== idx);
                              setProductForm({ ...productForm, barcodes: copy });
                            }}
                            className="text-destructive hover:bg-destructive/10 h-9 w-9 rounded-xl"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProductForm({
                            ...productForm,
                            barcodes: [...(productForm.barcodes || []), ""],
                          });
                        }}
                        className="rounded-xl mt-1 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Alternate Barcode
                      </Button>
                    </div>
                  </div>

                  {/* Variants Section */}
                  <div className="space-y-2 border-t pt-3">
                    <Label className="text-sm font-bold text-ink">Product Variants</Label>
                    <div className="space-y-3">
                      {(productForm.variants || []).map((v: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-4 gap-2 items-end border border-dashed p-3 rounded-xl bg-surface-2/20">
                          <div className="space-y-1.5 col-span-1">
                            <Label className="text-xs">Attribute</Label>
                            <Input
                              value={v.variantName}
                              onChange={(e) => {
                                const copy = [...productForm.variants];
                                copy[idx] = { ...v, variantName: e.target.value };
                                setProductForm({ ...productForm, variants: copy });
                              }}
                              placeholder="e.g. Size"
                              className="rounded-xl border-border/50 bg-surface-2 h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1.5 col-span-1">
                            <Label className="text-xs">Value</Label>
                            <Input
                              value={v.variantValue}
                              onChange={(e) => {
                                const copy = [...productForm.variants];
                                copy[idx] = { ...v, variantValue: e.target.value };
                                setProductForm({ ...productForm, variants: copy });
                              }}
                              placeholder="e.g. Large"
                              className="rounded-xl border-border/50 bg-surface-2 h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1.5 col-span-1">
                            <Label className="text-xs">Price Adj (+/-)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={v.priceAdjustment}
                              onChange={(e) => {
                                const copy = [...productForm.variants];
                                copy[idx] = { ...v, priceAdjustment: e.target.value };
                                setProductForm({ ...productForm, variants: copy });
                              }}
                              className="rounded-xl border-border/50 bg-surface-2 h-9 text-xs"
                            />
                          </div>
                          <div className="flex justify-center col-span-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const copy = productForm.variants.filter((_: any, i: number) => i !== idx);
                                setProductForm({ ...productForm, variants: copy });
                              }}
                              className="text-destructive hover:bg-destructive/10 h-9 w-9 rounded-xl"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProductForm({
                            ...productForm,
                            variants: [
                              ...(productForm.variants || []),
                              { variantName: "", variantValue: "", sku: "", priceAdjustment: "0.00" },
                            ],
                          });
                        }}
                        className="rounded-xl mt-1 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Variant
                      </Button>
                    </div>
                  </div>

                  {/* Unit Conversions Section */}
                  <div className="space-y-2 border-t pt-3">
                    <Label className="text-sm font-bold text-ink">Unit Conversions</Label>
                    <div className="space-y-3">
                      {(productForm.conversions || []).map((c: any, idx: number) => (
                        <div key={idx} className="grid grid-cols-4 gap-2 items-end border border-dashed p-3 rounded-xl bg-surface-2/20">
                          <div className="space-y-1.5 col-span-1">
                            <Label className="text-xs">From (Alt Unit)</Label>
                            <Input
                              value={c.fromUnit}
                              onChange={(e) => {
                                const copy = [...productForm.conversions];
                                copy[idx] = { ...c, fromUnit: e.target.value };
                                setProductForm({ ...productForm, conversions: copy });
                              }}
                              placeholder="e.g. Box"
                              className="rounded-xl border-border/50 bg-surface-2 h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1.5 col-span-1">
                            <Label className="text-xs">To (Base Unit)</Label>
                            <Input
                              value={c.toUnit || productForm.unit}
                              onChange={(e) => {
                                const copy = [...productForm.conversions];
                                copy[idx] = { ...c, toUnit: e.target.value };
                                setProductForm({ ...productForm, conversions: copy });
                              }}
                              placeholder={productForm.unit || "Pcs"}
                              className="rounded-xl border-border/50 bg-surface-2 h-9 text-xs"
                            />
                          </div>
                          <div className="space-y-1.5 col-span-1">
                            <Label className="text-xs">Factor (Alt = base * factor)</Label>
                            <Input
                              type="number"
                              step="0.0001"
                              value={c.conversionFactor}
                              onChange={(e) => {
                                const copy = [...productForm.conversions];
                                copy[idx] = { ...c, conversionFactor: e.target.value };
                                setProductForm({ ...productForm, conversions: copy });
                              }}
                              placeholder="12"
                              className="rounded-xl border-border/50 bg-surface-2 h-9 text-xs"
                            />
                          </div>
                          <div className="flex justify-center col-span-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                const copy = productForm.conversions.filter((_: any, i: number) => i !== idx);
                                setProductForm({ ...productForm, conversions: copy });
                              }}
                              className="text-destructive hover:bg-destructive/10 h-9 w-9 rounded-xl"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setProductForm({
                            ...productForm,
                            conversions: [
                              ...(productForm.conversions || []),
                              { fromUnit: "", toUnit: productForm.unit || "", conversionFactor: "" },
                            ],
                          });
                        }}
                        className="rounded-xl mt-1 text-xs"
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add Unit Conversion
                      </Button>
                    </div>
                  </div>

                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setProductFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="rounded-xl"
                    onClick={async () => {
                      if (
                        !productForm.name ||
                        !productForm.category ||
                        !productForm.unit ||
                        productForm.costPrice === "" ||
                        productForm.salePrice === ""
                      ) {
                        toast.error("All fields except Barcode are required");
                        return;
                      }
                      const costNum = Number(productForm.costPrice);
                      const saleNum = Number(productForm.salePrice);
                      if (isNaN(costNum) || isNaN(saleNum)) {
                        toast.error("Cost and sale prices must be valid numbers");
                        return;
                      }
                      if (costNum < 0) {
                        toast.error("Cost price cannot be negative");
                        return;
                      }
                      if (saleNum <= 0) {
                        toast.error("Sale price must be greater than zero");
                        return;
                      }

                      const payload = {
                        name: productForm.name,
                        barcode: productForm.barcode || null,
                        category: productForm.category,
                        unit: productForm.unit,
                        costPrice: productForm.costPrice,
                        salePrice: productForm.salePrice,
                        isBatchTracked: productForm.isBatchTracked,
                        barcodes: productForm.barcodes || [],
                        variants: productForm.variants || [],
                        conversions: productForm.conversions || [],
                      };

                      const res = isEditingProduct
                        ? await updateProductFn({ data: { id: productForm.id, ...payload } })
                        : await createProductFn({ data: payload });

                      if (res.success) {
                        try {
                          const targetProductId = isEditingProduct ? productForm.id : (res as any)?.id;

                          if (targetProductId && Object.keys(productChannelOverrides).length > 0) {
                            const overrideList = Object.entries(productChannelOverrides).map(
                              ([channelKey, price]) => ({
                                channelKey,
                                price: price === "" ? null : price,
                              }),
                            );
                            const overrideRes = await saveProductChannelOverridesFn({
                              data: {
                                productId: targetProductId,
                                overrides: overrideList,
                              },
                            });
                            if (overrideRes && !overrideRes.success) {
                              toast.warning(
                                "Product saved, but platform prices could not be saved — please edit the product to set them",
                              );
                            }
                          }
                        } catch (overrideErr) {
                          console.error("Failed to save channel overrides:", overrideErr);
                          toast.warning(
                            "Product saved, but platform prices could not be saved — please edit the product to set them",
                          );
                        }

                        toast.success(isEditingProduct ? "Product updated" : "Product created");
                        setProductFormOpen(false);
                        router.invalidate();
                        const currentIds = (catalogProductsList || []).map((p: any) => p.id).filter(Boolean);
                        if (currentIds.length > 0) {
                          fetchCatalogChannelPrices(currentIds);
                        }
                      } else {
                        toast.error(res.error || "Operation failed");
                      }
                    }}
                  >
                    Save Product
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog
              open={deleteDialogOpen}
              onOpenChange={(open) => {
                if (!isDeleting) {
                  setDeleteDialogOpen(open);
                  if (!open) setDeleteProductContext(null);
                }
              }}
            >
              <DialogContent className="sm:max-w-md w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Remove product?</DialogTitle>
                  <DialogDescription>
                    Remove <strong>{deleteProductContext?.name}</strong>? If it is used in sales,
                    purchases, GRNs, batches or transfers, removal will be blocked.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setDeleteDialogOpen(false);
                      setDeleteProductContext(null);
                    }}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={async () => {
                      if (!deleteProductContext) return;
                      setIsDeleting(true);
                      try {
                        const res = await deleteProductFn({
                          data: { id: deleteProductContext.id },
                        });
                        if (res && res.success) {
                          toast.success("Product deleted");
                          setDeleteDialogOpen(false);
                          setDeleteProductContext(null);
                          router.invalidate();
                        } else {
                          const errMap: Record<string, string> = {
                            PRODUCT_USED_IN_STOCK:
                              "Cannot delete product because it has active stock in one or more branches.",
                            PRODUCT_USED_IN_STOCK_TRANSFER:
                              "Cannot delete product because it is part of stock transfers.",
                            PRODUCT_USED_IN_BATCH:
                              "Cannot delete product because it has batch history records.",
                            PRODUCT_USED_IN_SALES:
                              "Cannot delete product because it has associated sales records.",
                            PRODUCT_USED_IN_PURCHASE:
                              "Cannot delete product because it is part of purchase orders.",
                            PRODUCT_USED_IN_GRN:
                              "Cannot delete product because it has recorded goods received notes (GRN).",
                            PRODUCT_USED_IN_LEDGER:
                              "Cannot delete product because it has historical inventory ledger transactions.",
                          };
                          toast.error(errMap[res?.error || ""] || res?.error || "Failed to delete");
                        }
                      } catch (err: any) {
                        toast.error(err.message || "An error occurred during deletion");
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Removing..." : "Remove"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Bulk Delete Products Dialog */}
            <Dialog
              open={bulkDeleteDialogOpen}
              onOpenChange={(open) => {
                if (!isBulkDeleting) {
                  setBulkDeleteDialogOpen(open);
                  if (!open) setBulkDeleteConfirmText("");
                }
              }}
            >
              <DialogContent className="sm:max-w-md w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle className="text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Delete {totalCatalogSelectedCount.toLocaleString()} products?
                  </DialogTitle>
                  <DialogDescription className="space-y-2 pt-2 text-sm">
                    <div>
                      Delete <strong>{totalCatalogSelectedCount.toLocaleString()}</strong> products? This cannot be undone.
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Products used in sales, purchases, GRNs, batches or transfers will be skipped.
                    </div>
                    {totalCatalogSelectedCount > 100 && (
                      <div className="pt-3 space-y-1.5">
                        <Label htmlFor="bulk-delete-confirm-input" className="text-xs font-bold text-ink">
                          Type <span className="font-mono text-destructive font-black">DELETE</span> to confirm:
                        </Label>
                        <Input
                          id="bulk-delete-confirm-input"
                          value={bulkDeleteConfirmText}
                          onChange={(e) => setBulkDeleteConfirmText(e.target.value)}
                          placeholder="DELETE"
                          className="font-mono text-sm"
                          autoFocus
                        />
                      </div>
                    )}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setBulkDeleteDialogOpen(false);
                      setBulkDeleteConfirmText("");
                    }}
                    disabled={isBulkDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl font-semibold"
                    disabled={
                      isBulkDeleting ||
                      (totalCatalogSelectedCount > 100 && bulkDeleteConfirmText !== "DELETE")
                    }
                    onClick={handleBulkDeleteConfirm}
                  >
                    {isBulkDeleting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Deleting...
                      </>
                    ) : (
                      `Delete ${totalCatalogSelectedCount.toLocaleString()} products`
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Platform Pricing Dialog */}
            <Dialog open={platformPricingOpen} onOpenChange={setPlatformPricingOpen}>
              <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5 text-primary" />
                    Platform Pricing & Markups
                  </DialogTitle>
                  <DialogDescription>
                    Configure percentage markups for delivery platforms. Store price remains standard.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-3">
                  {/* Platforms List */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Platforms
                    </div>
                    {isSalesChannelsLoading ? (
                      <div className="flex items-center justify-center p-6 text-sm text-muted-foreground gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span>Loading platforms...</span>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {salesChannelsList.map((ch: any) => {
                          const isTalabat = ch.key === "talabat";
                          const liveMarkup = Number(ch.markupPercent) || 0;
                          const examplePrice = resolveChannelPrice(10, liveMarkup, null);

                          return (
                            <div
                              key={ch.id}
                              className="p-3.5 rounded-xl border border-border/50 bg-surface-2/40 space-y-2.5"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Input
                                      defaultValue={ch.name}
                                      onBlur={async (e) => {
                                        const newName = e.target.value.trim();
                                        if (newName && newName !== ch.name) {
                                          const res = await updateSalesChannelFn({
                                            data: { id: ch.id, name: newName },
                                          });
                                          if (res.success) {
                                            toast.success("Platform name updated");
                                            fetchSalesChannels();
                                            const currentIds = (catalogProductsList || []).map((p: any) => p.id).filter(Boolean);
                                            if (currentIds.length > 0) {
                                              fetchCatalogChannelPrices(currentIds);
                                            }
                                          } else {
                                            toast.error(res.error || "Failed to update");
                                          }
                                        }
                                      }}
                                      className="h-8 text-sm font-semibold rounded-lg max-w-[180px] bg-surface"
                                    />
                                    {isTalabat && (
                                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                                        Core
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground font-mono">
                                    Store 10.00 → {ch.name} {examplePrice.toFixed(2)}
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                  <div className="flex items-center gap-1.5">
                                    <Label className="text-xs text-muted-foreground">Markup %:</Label>
                                    <Input
                                      type="number"
                                      step="0.5"
                                      min="0"
                                      max="500"
                                      defaultValue={ch.markupPercent}
                                      onBlur={async (e) => {
                                        const val = Number(e.target.value);
                                        if (!isNaN(val) && val >= 0 && val <= 500 && String(val) !== String(ch.markupPercent)) {
                                          const res = await updateSalesChannelFn({
                                            data: { id: ch.id, markupPercent: val },
                                          });
                                          if (res.success) {
                                            toast.success(`${ch.name} markup updated to ${val}%`);
                                            fetchSalesChannels();
                                            const currentIds = (catalogProductsList || []).map((p: any) => p.id).filter(Boolean);
                                            if (currentIds.length > 0) {
                                              fetchCatalogChannelPrices(currentIds);
                                            }
                                          } else {
                                            toast.error(res.error || "Failed to update markup");
                                          }
                                        }
                                      }}
                                      className="w-20 h-8 text-sm rounded-lg bg-surface text-right"
                                    />
                                  </div>

                                  <div className="flex items-center gap-1.5 pl-2 border-l border-border/50">
                                    <Switch
                                      checked={Boolean(ch.isActive)}
                                      onCheckedChange={async (checked) => {
                                        const res = await updateSalesChannelFn({
                                          data: { id: ch.id, isActive: checked },
                                        });
                                        if (res.success) {
                                          toast.success(
                                            `${ch.name} ${checked ? "activated" : "deactivated"}`,
                                          );
                                          fetchSalesChannels();
                                          const currentIds = (catalogProductsList || []).map((p: any) => p.id).filter(Boolean);
                                          if (currentIds.length > 0) {
                                            fetchCatalogChannelPrices(currentIds);
                                          }
                                        } else {
                                          toast.error(res.error || "Failed to update status");
                                        }
                                      }}
                                    />
                                    {!isTalabat && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                                        onClick={() => {
                                          setDeletePlatformContext(ch);
                                          setDeletePlatformDialogOpen(true);
                                        }}
                                        title={`Delete ${ch.name}`}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Add Platform Section */}
                  <div className="border-t border-border/50 pt-3 space-y-2.5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Add Platform
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5 items-end">
                      <div className="flex-1 space-y-1 w-full sm:w-auto">
                        <Label className="text-xs">Platform Name</Label>
                        <Input
                          placeholder="e.g. Deliveroo, Noon"
                          value={newPlatformName}
                          onChange={(e) => setNewPlatformName(e.target.value)}
                          className="h-9 rounded-xl bg-surface-2/60 text-sm"
                        />
                      </div>
                      <div className="w-full sm:w-32 space-y-1">
                        <Label className="text-xs">Markup %</Label>
                        <Input
                          type="number"
                          step="0.5"
                          min="0"
                          max="500"
                          placeholder="e.g. 20"
                          value={newPlatformMarkup}
                          onChange={(e) => setNewPlatformMarkup(e.target.value)}
                          className="h-9 rounded-xl bg-surface-2/60 text-sm"
                        />
                      </div>
                      <Button
                        type="button"
                        disabled={isAddingPlatform || !newPlatformName.trim()}
                        onClick={async () => {
                          if (!newPlatformName.trim()) {
                            toast.error("Platform name is required");
                            return;
                          }
                          const markupVal = Number(newPlatformMarkup || 0);
                          if (isNaN(markupVal) || markupVal < 0 || markupVal > 500) {
                            toast.error("Markup percent must be between 0% and 500%");
                            return;
                          }

                          setIsAddingPlatform(true);
                          try {
                            const res = await createSalesChannelFn({
                              data: {
                                name: newPlatformName.trim(),
                                markupPercent: markupVal,
                              },
                            });
                            if (res.success) {
                              toast.success(`Platform "${newPlatformName.trim()}" added successfully.`);
                              setNewPlatformName("");
                              setNewPlatformMarkup("");
                              await fetchSalesChannels();
                              const currentIds = (catalogProductsList || []).map((p: any) => p.id).filter(Boolean);
                              if (currentIds.length > 0) {
                                fetchCatalogChannelPrices(currentIds);
                              }
                            } else {
                              toast.error(res.error || "Failed to add platform");
                            }
                          } catch (err: any) {
                            toast.error(err.message || "Failed to add platform");
                          } finally {
                            setIsAddingPlatform(false);
                          }
                        }}
                        className="rounded-xl h-9 px-4 shrink-0 font-semibold"
                      >
                        {isAddingPlatform ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Plus className="h-4 w-4 mr-1" />
                        )}
                        Add Platform
                      </Button>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setPlatformPricingOpen(false)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Platform Confirmation Dialog */}
            <Dialog
              open={deletePlatformDialogOpen}
              onOpenChange={(open) => {
                if (!isDeletingPlatform) {
                  setDeletePlatformDialogOpen(open);
                  if (!open) setDeletePlatformContext(null);
                }
              }}
            >
              <DialogContent className="sm:max-w-md w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Delete {deletePlatformContext?.name}?</DialogTitle>
                  <DialogDescription>
                    Delete {deletePlatformContext?.name}? All manual prices set for{" "}
                    {deletePlatformContext?.name} will also be removed. This cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setDeletePlatformDialogOpen(false);
                      setDeletePlatformContext(null);
                    }}
                    disabled={isDeletingPlatform}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    disabled={isDeletingPlatform}
                    onClick={async () => {
                      if (!deletePlatformContext) return;
                      setIsDeletingPlatform(true);
                      try {
                        const res = await deleteSalesChannelFn({
                          data: { id: deletePlatformContext.id },
                        });
                        if (res && res.success) {
                          toast.success(`${deletePlatformContext.name} deleted`);
                          setDeletePlatformDialogOpen(false);
                          setDeletePlatformContext(null);
                          await fetchSalesChannels();
                          const currentIds = (catalogProductsList || []).map((p: any) => p.id).filter(Boolean);
                          if (currentIds.length > 0) {
                            fetchCatalogChannelPrices(currentIds);
                          }
                        } else {
                          toast.error(res?.error || "Failed to delete platform");
                        }
                      } catch (err: any) {
                        toast.error(err.message || "Failed to delete platform");
                      } finally {
                        setIsDeletingPlatform(false);
                      }
                    }}
                  >
                    {isDeletingPlatform ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Bulk Product Import Dialog */}
            <Dialog
              open={importModalOpen}
              onOpenChange={(open) => {
                if (!isImporting) {
                  setImportModalOpen(open);
                  if (!open) {
                    setParsedRows([]);
                    setImportFile(null);
                    setImportFileName("");
                  }
                }
              }}
            >
              <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0">
                <DialogHeader className="p-4 sm:p-6 pb-3 shrink-0 border-b border-border/40 pr-12 text-left">
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <UploadCloud className="h-5 w-5 text-primary" /> Bulk Import Products (Excel / CSV)
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-muted-foreground whitespace-normal break-words max-w-full">
                    Upload client spreadsheet with exact headers. Reads all sheets (In Stock / Out of Stock), raw numeric barcodes with Excel rounding warnings, alternate barcodes 1..7, and allocates stock per branch.
                  </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-5 min-w-0">
                  {/* Step 1, 2, 3: Template Download, Branch Selection & Initial Stock */}
                  <div className={`grid grid-cols-1 ${showExistingProductsCard ? "md:grid-cols-3" : "md:grid-cols-2"} gap-3 min-w-0`}>
                    {/* Template Download Card */}
                    <div className="rounded-xl border border-border/70 bg-surface-2/40 p-3.5 space-y-2.5 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-bold text-ink flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-primary" /> 1. Template
                          </Label>
                          <Badge variant="outline" className="text-[10px] uppercase font-mono">.XLSX</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Client format with formatted text columns for Barcode 1..7 and SKU.
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="rounded-xl font-semibold w-full bg-surface whitespace-normal h-auto py-2 flex-wrap"
                        onClick={handleDownloadTemplate}
                      >
                        <Download className="h-4 w-4 mr-1.5 text-primary" /> Download Excel Template
                      </Button>
                    </div>

                    {/* Branch Stock Allocation Multi-Select */}
                    <div className="rounded-xl border border-border/70 bg-surface-2/40 p-3.5 space-y-2.5 min-w-0">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-bold text-ink flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-primary" /> 2. Target Branches*
                        </Label>
                        <Badge
                          variant={importBranches.length > 0 ? "default" : "destructive"}
                          className="text-[10px] font-semibold"
                        >
                          {importBranches.length} Selected
                        </Badge>
                      </div>

                      <div className="space-y-1.5 pt-1 max-h-28 overflow-y-auto border rounded-lg p-2 bg-surface">
                        <div className="flex items-center space-x-2 pb-1 border-b">
                          <Checkbox
                            id="import-all-branches"
                            checked={importAllBranches}
                            onCheckedChange={async (checked) => {
                              const isChecked = Boolean(checked);
                              setImportAllBranches(isChecked);
                              const next = isChecked && data?.branches ? (data.branches || []).map((b: any) => b.id) : [];
                              setImportBranches(next);
                              if (rawFileRows.length > 0) {
                                if (next.length > 0) {
                                  try {
                                    const fileBarcodes = Array.from(
                                      new Set(
                                        rawFileRows
                                          .map((r) => (r.barcode ? String(r.barcode).trim() : ""))
                                          .filter(Boolean)
                                      )
                                    );
                                    const fileSkus = Array.from(
                                      new Set(
                                        rawFileRows
                                          .map((r) => (r.sku ? String(r.sku).trim() : ""))
                                          .filter(Boolean)
                                      )
                                    );
                                    const prods = await fetchExistingProductsByBarcodesAndSkus(next, fileBarcodes, fileSkus);
                                    setCachedExistingProds(prods);
                                    setParsedRows(reclassifyRows(rawFileRows, prods, next, data?.branches || [], updateExistingProducts, rowUpdateChoices));
                                  } catch (e) {
                                    console.error("Reclassify error:", e);
                                  }
                                } else {
                                  setParsedRows(rawFileRows.map((r) => ({
                                    ...r,
                                    classification: r.isValid ? "new" : "invalid",
                                    note: r.isValid ? "Select at least one branch first" : r.errors.join(", "),
                                  })));
                                }
                              }
                            }}
                          />
                          <label
                            htmlFor="import-all-branches"
                            className="text-xs font-bold leading-none cursor-pointer text-ink"
                          >
                            All Branches ({data?.branches?.length || 0})
                          </label>
                        </div>

                        {(data?.branches || []).map((branch: any) => {
                          const isSelected = importBranches.includes(branch.id);
                          return (
                            <div key={branch.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`branch-check-${branch.id}`}
                                checked={isSelected}
                                onCheckedChange={async (checked) => {
                                  const isChecked = Boolean(checked);
                                  let next: string[];
                                  if (isChecked) {
                                    next = [...importBranches, branch.id];
                                  } else {
                                    next = importBranches.filter((id) => id !== branch.id);
                                  }
                                  setImportBranches(next);
                                  setImportAllBranches(next.length === (data?.branches?.length || 0));
                                  if (rawFileRows.length > 0) {
                                    if (next.length > 0) {
                                      try {
                                        const fileBarcodes = Array.from(
                                          new Set(
                                            rawFileRows
                                              .map((r) => (r.barcode ? String(r.barcode).trim() : ""))
                                              .filter(Boolean)
                                          )
                                        );
                                        const fileSkus = Array.from(
                                          new Set(
                                            rawFileRows
                                              .map((r) => (r.sku ? String(r.sku).trim() : ""))
                                              .filter(Boolean)
                                          )
                                        );
                                        const prods = await fetchExistingProductsByBarcodesAndSkus(next, fileBarcodes, fileSkus);
                                        setCachedExistingProds(prods);
                                        setParsedRows(reclassifyRows(rawFileRows, prods, next, data?.branches || [], updateExistingProducts, rowUpdateChoices));
                                      } catch (e) {
                                        console.error("Reclassify error:", e);
                                      }
                                    } else {
                                      setParsedRows(rawFileRows.map((r) => ({
                                        ...r,
                                        classification: r.isValid ? "new" : "invalid",
                                        note: r.isValid ? "Select at least one branch first" : r.errors.join(", "),
                                      })));
                                    }
                                  }
                                }}
                              />
                              <label
                                htmlFor={`branch-check-${branch.id}`}
                                className="text-xs leading-none cursor-pointer text-slate-700"
                              >
                                {branch.name}
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Existing Products Update Configuration */}
                    {showExistingProductsCard && (
                      <div className="rounded-xl border border-border/70 bg-surface-2/40 p-3.5 space-y-2 flex flex-col justify-between min-w-0">
                        <div>
                          <Label className="text-sm font-bold text-ink flex items-center gap-1.5">
                            <RefreshCw className="h-4 w-4 text-primary" /> 3. Existing Products
                          </Label>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            Update products that already exist on website (same barcode)?
                          </p>
                        </div>
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleBulkUpdateChoice(true)}
                            className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-full text-xs font-bold transition-all border text-center cursor-pointer ${
                              updateExistingProducts
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-surface text-slate-700 border-border hover:bg-surface-2"
                            }`}
                          >
                            Yes (Update)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBulkUpdateChoice(false)}
                            className={`flex-1 min-w-[90px] py-1.5 px-3 rounded-full text-xs font-bold transition-all border text-center cursor-pointer ${
                              !updateExistingProducts
                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                : "bg-surface text-slate-700 border-border hover:bg-surface-2"
                            }`}
                          >
                            No (Skip)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 4: File Upload Area */}
                  <div className="space-y-2 min-w-0">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold text-ink">4. Upload Spreadsheet (.xlsx, .xls, .csv)</Label>
                      {importBranches.length === 0 && (
                        <span className="text-xs text-destructive font-semibold">
                          Select at least one branch first
                        </span>
                      )}
                    </div>
                    <div
                      className={`border-2 border-dashed transition-colors rounded-xl p-6 text-center relative ${
                        importBranches.length === 0
                          ? "border-border/40 bg-surface-2/10 opacity-60 cursor-not-allowed"
                          : "border-border/80 hover:border-primary/60 bg-surface-2/20 cursor-pointer"
                      }`}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (importBranches.length === 0) {
                          toast.error("Select at least one branch first");
                          return;
                        }
                        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                          handleFileSelect(e.dataTransfer.files[0]);
                        }
                      }}
                    >
                      <input
                        type="file"
                        accept=".xlsx, .xls, .csv"
                        disabled={importBranches.length === 0}
                        className={`absolute inset-0 w-full h-full opacity-0 ${
                          importBranches.length === 0 ? "cursor-not-allowed" : "cursor-pointer"
                        }`}
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileSelect(e.target.files[0]);
                          }
                        }}
                      />
                      <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                        {isParsing ? (
                          <>
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-xs font-semibold text-ink">Reading all sheets and validating spreadsheet...</p>
                          </>
                        ) : importBranches.length === 0 ? (
                          <>
                            <Ban className="h-8 w-8 text-muted-foreground" />
                            <p className="text-xs font-bold text-muted-foreground">Select at least one branch first</p>
                            <p className="text-[11px] text-muted-foreground">Branch selection required before uploading spreadsheet</p>
                          </>
                        ) : importFileName ? (
                          <>
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                            <p className="text-xs font-bold text-ink">{importFileName}</p>
                            <p className="text-[11px] text-muted-foreground">Click or drag another file to replace</p>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                            <p className="text-xs font-semibold text-ink">
                              Drag and drop your spreadsheet here, or <span className="text-primary font-bold">browse</span>
                            </p>
                            <p className="text-[11px] text-muted-foreground">Supports multi-sheet workbooks up to 25 MB</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Step 5: Parsing Results, Per-Sheet Breakdown & Preview Table */}
                  {parsedRows.length > 0 && (
                    <div className="space-y-3 border-t pt-4 min-w-0">
                      {/* Per-sheet Breakdown Bar */}
                      {sheetStats.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 bg-surface-2/60 p-2.5 rounded-xl border border-border/60 min-w-0">
                          <span className="text-xs font-bold text-ink">Sheets ({sheetStats.length}):</span>
                          {sheetStats.map((s) => (
                            <Badge
                              key={s.name}
                              variant="secondary"
                              className="text-xs font-medium py-1 px-2.5 flex items-center gap-1.5 bg-surface border"
                            >
                              <span className="font-bold text-ink">{s.name}</span>: {s.total} rows
                              <span className="text-emerald-600 font-semibold">({s.valid} valid</span>
                              {s.invalid > 0 && <span className="text-destructive font-semibold">, {s.invalid} invalid</span>}
                              <span className="text-emerald-600 font-semibold">)</span>
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Stock Bulk Fill Bar */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 bg-surface-2/60 p-3 rounded-xl border border-border/60 min-w-0 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          <Label className="text-xs font-bold text-ink whitespace-nowrap">Stock:</Label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="e.g. 10"
                            value={bulkStockInput}
                            onChange={(e) => setBulkStockInput(e.target.value)}
                            className="w-24 h-8 text-xs bg-surface"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={handleApplyBulkStock}
                            className="h-8 px-3 text-xs font-bold bg-surface border hover:bg-surface-2"
                          >
                            Apply to All
                          </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground break-words min-w-0">
                          Fills the Stock box of every row across all sheets. You can also edit any single row below.
                        </p>
                      </div>

                      {/* Filter Bar */}
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 min-w-0 flex-wrap">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <Badge variant="outline" className="font-semibold text-xs px-2.5 py-1">
                            Total: {parsedRows.length}
                          </Badge>
                          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 font-bold text-xs px-2.5 py-1">
                            New: {parsedRows.filter((r) => r.isValid && r.classification === "new").length}
                          </Badge>
                          <Badge className="bg-purple-500/15 text-purple-800 border-purple-500/30 font-bold text-xs px-2.5 py-1">
                            Add to branch: {parsedRows.filter((r) => r.isValid && r.classification === "add_to_branch").length}
                          </Badge>
                          <Badge className="bg-blue-500/15 text-blue-800 border-blue-500/30 font-bold text-xs px-2.5 py-1">
                            Exists-update: {parsedRows.filter((r) => r.isValid && (r.classification === "exists" || r.classification === "exists_update" || r.classification === "exists_skip" || r.isExisting) && isRowUpdating(r.rowNumber)).length}
                          </Badge>
                          <Badge className="bg-slate-500/15 text-slate-700 border-slate-500/30 font-bold text-xs px-2.5 py-1">
                            Exists-skip: {parsedRows.filter((r) => r.isValid && (r.classification === "exists" || r.classification === "exists_update" || r.classification === "exists_skip" || r.isExisting) && !isRowUpdating(r.rowNumber)).length}
                          </Badge>
                          {parsedRows.some((r) => !r.isValid) && (
                            <Badge variant="destructive" className="font-bold text-xs px-2.5 py-1">
                              ✕ {parsedRows.filter((r) => !r.isValid).length} Invalid
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 text-xs min-w-0">
                          <span className="text-muted-foreground whitespace-nowrap">Filter:</span>
                          <button
                            type="button"
                            onClick={() => { setPreviewFilter("all"); setImportPreviewPage(1); }}
                            className={`px-2 py-1 rounded-md font-medium text-xs ${previewFilter === "all" ? "bg-primary text-primary-foreground font-bold" : "bg-surface-2 text-slate-700"}`}
                          >
                            All ({parsedRows.length})
                          </button>
                          <button
                            type="button"
                            onClick={() => { setPreviewFilter("new"); setImportPreviewPage(1); }}
                            className={`px-2 py-1 rounded-md font-medium text-xs ${previewFilter === "new" ? "bg-emerald-600 text-white font-bold" : "bg-surface-2 text-slate-700"}`}
                          >
                            New ({parsedRows.filter((r) => r.isValid && r.classification === "new").length})
                          </button>
                          <button
                            type="button"
                            onClick={() => { setPreviewFilter("add_to_branch"); setImportPreviewPage(1); }}
                            className={`px-2 py-1 rounded-md font-medium text-xs ${previewFilter === "add_to_branch" ? "bg-purple-600 text-white font-bold" : "bg-surface-2 text-slate-700"}`}
                          >
                            Add to branch ({parsedRows.filter((r) => r.isValid && r.classification === "add_to_branch").length})
                          </button>
                          <button
                            type="button"
                            onClick={() => { setPreviewFilter("exists_update"); setImportPreviewPage(1); }}
                            className={`px-2 py-1 rounded-md font-medium text-xs ${previewFilter === "exists_update" ? "bg-blue-600 text-white font-bold" : "bg-surface-2 text-slate-700"}`}
                          >
                            Exists-update ({parsedRows.filter((r) => r.isValid && (r.classification === "exists" || r.classification === "exists_update" || r.classification === "exists_skip" || r.isExisting) && isRowUpdating(r.rowNumber)).length})
                          </button>
                          <button
                            type="button"
                            onClick={() => { setPreviewFilter("exists_skip"); setImportPreviewPage(1); }}
                            className={`px-2 py-1 rounded-md font-medium text-xs ${previewFilter === "exists_skip" ? "bg-slate-700 text-white font-bold" : "bg-surface-2 text-slate-700"}`}
                          >
                            Exists-skip ({parsedRows.filter((r) => r.isValid && (r.classification === "exists" || r.classification === "exists_update" || r.classification === "exists_skip" || r.isExisting) && !isRowUpdating(r.rowNumber)).length})
                          </button>
                          <button
                            type="button"
                            onClick={() => { setPreviewFilter("invalid"); setImportPreviewPage(1); }}
                            className={`px-2 py-1 rounded-md font-medium text-xs ${previewFilter === "invalid" ? "bg-destructive text-destructive-foreground font-bold" : "bg-surface-2 text-slate-700"}`}
                          >
                            Invalid ({parsedRows.filter((r) => !r.isValid).length})
                          </button>
                        </div>
                      </div>

                      {/* Paginated Preview Table */}
                      {(() => {
                        const filtered = parsedRows.filter((r) => {
                          if (previewFilter === "new") return r.isValid && r.classification === "new";
                          if (previewFilter === "add_to_branch") return r.isValid && r.classification === "add_to_branch";
                          if (previewFilter === "exists_update") return r.isValid && (r.classification === "exists" || r.classification === "exists_update" || r.classification === "exists_skip" || r.isExisting) && isRowUpdating(r.rowNumber);
                          if (previewFilter === "exists_skip") return r.isValid && (r.classification === "exists" || r.classification === "exists_update" || r.classification === "exists_skip" || r.isExisting) && !isRowUpdating(r.rowNumber);
                          if (previewFilter === "invalid") return !r.isValid;
                          return true;
                        });

                        const totalPages = Math.max(1, Math.ceil(filtered.length / importPreviewPageSize));
                        const page = Math.min(importPreviewPage, totalPages);
                        const start = (page - 1) * importPreviewPageSize;
                        const pageRows = filtered.slice(start, start + importPreviewPageSize);

                        return (
                          <div className="space-y-2 min-w-0">
                            <div className="w-full overflow-x-auto rounded-xl border border-border/70 max-h-80 min-w-0">
                              <table className="w-full text-left text-xs min-w-[950px]">
                                <thead className="bg-surface-2 sticky top-0 border-b text-muted-foreground font-bold uppercase text-[10px]">
                                  <tr>
                                    <th className="p-2.5 w-12">#</th>
                                    <th className="p-2.5">Sheet</th>
                                    <th className="p-2.5 w-28">Status</th>
                                    <th className="p-2.5 w-20 text-center">Update?</th>
                                    <th className="p-2.5 min-w-[140px]">Product Name</th>
                                    <th className="p-2.5">Barcode 1</th>
                                    <th className="p-2.5">SKU</th>
                                    <th className="p-2.5">Category</th>
                                    <th className="p-2.5">Unit</th>
                                    <th className="p-2.5 w-16 text-center">Active</th>
                                    <th className="p-2.5 w-24 text-right">Stock</th>
                                    <th className="p-2.5 text-right">Sale Price</th>
                                    <th className="p-2.5 min-w-[180px]">Notes</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                  {pageRows.map((r) => {
                                    const updating = isRowUpdating(r.rowNumber);
                                    return (
                                      <tr
                                        key={r.rowNumber}
                                        className={
                                          !r.isValid
                                            ? "bg-destructive/5 hover:bg-destructive/10"
                                            : (r.classification === "exists" || r.classification === "exists_update" || r.classification === "exists_skip" || r.isExisting)
                                            ? updating
                                              ? "bg-blue-500/5 hover:bg-blue-500/10"
                                              : "bg-slate-500/5 hover:bg-slate-500/10"
                                            : r.classification === "add_to_branch"
                                            ? "bg-purple-500/5 hover:bg-purple-500/10"
                                            : "hover:bg-surface-2/40"
                                        }
                                      >
                                        <td className="p-2.5 font-mono text-muted-foreground font-semibold">{r.rowNumber}</td>
                                        <td className="p-2.5">
                                          <Badge variant="outline" className="text-[10px] font-medium whitespace-nowrap">
                                            {r.sheetName}
                                          </Badge>
                                        </td>
                                        <td className="p-2.5">
                                          {!r.isValid ? (
                                            <Badge variant="destructive" className="text-[10px] font-bold">Invalid</Badge>
                                          ) : r.classification === "add_to_branch" ? (
                                            <Badge className="bg-purple-500/15 text-purple-800 border-purple-500/30 text-[10px] font-bold whitespace-nowrap">
                                              Add to branch
                                            </Badge>
                                          ) : (r.classification === "exists" || r.classification === "exists_update" || r.classification === "exists_skip" || r.isExisting) ? (
                                            updating ? (
                                              <Badge className="bg-blue-500/15 text-blue-800 border-blue-500/30 text-[10px] font-bold whitespace-nowrap">
                                                Will update
                                              </Badge>
                                            ) : (
                                              <Badge className="bg-slate-500/15 text-slate-700 border-slate-500/30 text-[10px] font-bold whitespace-nowrap">
                                                Will skip
                                              </Badge>
                                            )
                                          ) : (
                                            <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px] font-bold whitespace-nowrap">
                                              New
                                            </Badge>
                                          )}
                                        </td>
                                        <td className="p-2.5 text-center">
                                          {(r.classification === "exists" || r.classification === "exists_update" || r.classification === "exists_skip" || r.isExisting) && r.isValid ? (
                                            <div className="inline-flex items-center gap-1">
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const next = { ...rowUpdateChoices, [r.rowNumber]: true };
                                                  setRowUpdateChoices(next);
                                                  if (rawFileRows.length > 0) {
                                                    setParsedRows(reclassifyRows(rawFileRows, cachedExistingProds, importBranches, data?.branches || [], updateExistingProducts, next));
                                                  } else {
                                                    setParsedRows((prev) =>
                                                      prev.map((row) =>
                                                        row.rowNumber === r.rowNumber
                                                          ? {
                                                              ...row,
                                                              classification: "exists_update" as const,
                                                              note: (row.note || "").replace(" — will skip", " — will update"),
                                                            }
                                                          : row
                                                      )
                                                    );
                                                  }
                                                }}
                                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                                  updating
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-surface text-slate-600 border-border hover:bg-surface-2"
                                                }`}
                                              >
                                                Yes
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  const next = { ...rowUpdateChoices, [r.rowNumber]: false };
                                                  setRowUpdateChoices(next);
                                                  if (rawFileRows.length > 0) {
                                                    setParsedRows(reclassifyRows(rawFileRows, cachedExistingProds, importBranches, data?.branches || [], updateExistingProducts, next));
                                                  } else {
                                                    setParsedRows((prev) =>
                                                      prev.map((row) =>
                                                        row.rowNumber === r.rowNumber
                                                          ? {
                                                              ...row,
                                                              classification: "exists_skip" as const,
                                                              note: (row.note || "").replace(" — will update", " — will skip"),
                                                            }
                                                          : row
                                                      )
                                                    );
                                                  }
                                                }}
                                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                                                  !updating
                                                    ? "bg-slate-800 text-white border-slate-800"
                                                    : "bg-surface text-slate-600 border-border hover:bg-surface-2"
                                                }`}
                                              >
                                                No
                                              </button>
                                            </div>
                                          ) : r.classification === "add_to_branch" && r.isValid ? (
                                            <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                              Add
                                            </span>
                                          ) : (
                                            <span className="text-muted-foreground">—</span>
                                          )}
                                        </td>
                                        <td className="p-2.5 font-semibold text-ink">{r.name || <span className="italic text-muted-foreground">Empty</span>}</td>
                                        <td className="p-2.5 font-mono">{r.barcode || "—"}</td>
                                        <td className="p-2.5 font-mono">{r.sku || "—"}</td>
                                        <td className="p-2.5">{r.category}</td>
                                        <td className="p-2.5">{r.unit}</td>
                                        <td className="p-2.5 text-center">
                                          <Badge
                                            variant="outline"
                                            className={`text-[10px] font-mono font-bold ${
                                              r.active ? "text-emerald-700 bg-emerald-500/10 border-emerald-500/20" : "text-muted-foreground bg-surface-2"
                                            }`}
                                          >
                                            {r.active ? "TRUE" : "FALSE"}
                                          </Badge>
                                        </td>
                                        <td className="p-2.5 text-right">
                                          <Input
                                            type="number"
                                            min="0"
                                            step="1"
                                            placeholder="—"
                                            className="w-16 h-7 text-xs text-right tabular-nums font-semibold bg-surface ml-auto"
                                            value={rowStocks[r.rowNumber] ?? ""}
                                            onChange={(e) =>
                                              setRowStocks({
                                                ...rowStocks,
                                                [r.rowNumber]: e.target.value,
                                              })
                                            }
                                          />
                                        </td>
                                        <td className="p-2.5 text-right tabular-nums font-bold">{r.salePrice}</td>
                                        <td className="p-2.5 text-[11px]">
                                          {!r.isValid ? (
                                            <span className="text-destructive font-medium">{r.errors.join(", ")}</span>
                                          ) : r.classification === "add_to_branch" ? (
                                            <span className="text-purple-700 font-medium">{r.note}</span>
                                          ) : (r.classification === "exists" || r.classification === "exists_update" || r.classification === "exists_skip" || r.isExisting) ? (
                                            <span className={updating ? "text-blue-700 font-medium" : "text-slate-600 font-medium"}>
                                              {r.note}
                                            </span>
                                          ) : (
                                            <span className="text-emerald-600 font-medium">
                                              Ready to create
                                            </span>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {pageRows.length === 0 && (
                                    <tr>
                                      <td colSpan={13} className="p-6 text-center text-muted-foreground italic">
                                        No rows match the selected filter.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>

                            {/* Preview Pagination Footer */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                              <span>
                                Showing {filtered.length > 0 ? start + 1 : 0} to {Math.min(start + importPreviewPageSize, filtered.length)} of {filtered.length} rows
                              </span>
                              {totalPages > 1 && (
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs rounded-lg"
                                    disabled={page <= 1}
                                    onClick={() => setImportPreviewPage((p) => Math.max(1, p - 1))}
                                  >
                                    <ChevronLeft className="h-3.5 w-3.5 mr-0.5" /> Prev
                                  </Button>
                                  <span className="font-mono font-semibold text-ink px-1">
                                    Page {page} of {totalPages}
                                  </span>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs rounded-lg"
                                    disabled={page >= totalPages}
                                    onClick={() => setImportPreviewPage((p) => Math.min(totalPages, p + 1))}
                                  >
                                    Next <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                <DialogFooter className="sticky bottom-0 z-10 shrink-0 border-t border-border/70 bg-surface/95 backdrop-blur-md p-4 sm:p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 min-w-0 w-full mt-0">
                  <p className="text-xs text-muted-foreground text-left break-words min-w-0 flex-1">
                    {importBranches.length === 0 ? (
                      <span className="text-destructive font-semibold">Please select at least 1 branch.</span>
                    ) : (
                      <span>
                        Target branches: <strong>{importBranches.length}</strong> selected.
                        {parsedRows.length > 0 && (
                          <span className="ml-1">
                            (New: <strong>{parsedRows.filter((r) => r.isValid && r.classification === "new").length}</strong>,
                            Add to branch: <strong>{parsedRows.filter((r) => r.isValid && r.classification === "add_to_branch").length}</strong>,
                            Exists-update: <strong>{parsedRows.filter((r) => r.isValid && (r.classification === "exists" || r.classification === "exists_update" || r.classification === "exists_skip" || r.isExisting) && isRowUpdating(r.rowNumber)).length}</strong>,
                            Exists-skip: <strong>{parsedRows.filter((r) => r.isValid && (r.classification === "exists" || r.classification === "exists_update" || r.classification === "exists_skip" || r.isExisting) && !isRowUpdating(r.rowNumber)).length}</strong>)
                          </span>
                        )}
                      </span>
                    )}
                  </p>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl w-full sm:w-auto px-4 h-10 font-semibold"
                      onClick={() => setImportModalOpen(false)}
                      disabled={isImporting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      className="rounded-xl w-full sm:w-auto px-4 h-10 font-bold"
                      onClick={handleImportButtonClick}
                      disabled={
                        isImporting ||
                        isParsing ||
                        parsedRows.filter((r) => r.isValid).length === 0 ||
                        importBranches.length === 0
                      }
                    >
                      {isImporting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Importing in 1,000-row batches...
                        </>
                      ) : (
                        `Import ${parsedRows.filter((r) => r.isValid).length} Valid Products`
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Conflict Resolution Popup */}
            <Dialog
              open={conflictModalOpen}
              onOpenChange={(open) => {
                if (!isImporting) setConflictModalOpen(open);
              }}
            >
              <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] flex flex-col overflow-hidden p-0 gap-0">
                <DialogHeader className="p-4 sm:p-5 pb-3 shrink-0 border-b border-border/40 text-left">
                  <DialogTitle className="flex items-center gap-2 text-base sm:text-lg text-ink font-bold">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    Conflict Resolution ({conflictItems.length} conflicts found)
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Duplicates or existing product conflicts detected before import. Please choose whether to update the existing product or remove each row from this import.
                  </DialogDescription>
                </DialogHeader>

                {(() => {
                  const conflictUpdateCount = conflictItems.filter((c) => conflictChoices[c.rowNumber] === "update").length;
                  const conflictRemoveCount = conflictItems.filter((c) => conflictChoices[c.rowNumber] === "remove").length;
                  const conflictResolvedCount = conflictUpdateCount + conflictRemoveCount;
                  const CONFLICT_PAGE_SIZE = 50;
                  const totalConflictPages = Math.max(1, Math.ceil(conflictItems.length / CONFLICT_PAGE_SIZE));
                  const paginatedConflictItems = conflictItems.slice(
                    (conflictPage - 1) * CONFLICT_PAGE_SIZE,
                    conflictPage * CONFLICT_PAGE_SIZE
                  );

                  return (
                    <>
                      <div className="p-3 sm:p-4 border-b border-border/30 bg-surface-2/30 flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <span className="text-xs font-semibold text-ink">
                            Resolved: {conflictResolvedCount} of {conflictItems.length}
                          </span>
                          <span className="text-muted-foreground/50 text-xs hidden sm:inline">|</span>
                          <span className="text-xs font-semibold text-ink">
                            Update: <span className="font-bold text-primary">{conflictUpdateCount}</span> · Remove: <span className="font-bold text-destructive">{conflictRemoveCount}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-semibold"
                            onClick={() => {
                              const allUpdate: Record<number, "update" | "remove"> = {};
                              for (const item of conflictItems) {
                                // For duplicate items in file, earlier duplicate rows are removed and the last row updates/wins
                                if (item.conflictType.includes("Duplicate") && item.conflictType.includes("in file") && !item.isLastInFile) {
                                  allUpdate[item.rowNumber] = "remove";
                                } else {
                                  allUpdate[item.rowNumber] = "update";
                                }
                              }
                              setConflictChoices(allUpdate);
                            }}
                          >
                            Update all
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-semibold text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              const allRemove: Record<number, "update" | "remove"> = {};
                              for (const item of conflictItems) {
                                allRemove[item.rowNumber] = "remove";
                              }
                              setConflictChoices(allRemove);
                            }}
                          >
                            Remove all
                          </Button>
                        </div>
                      </div>

                      <div className="flex-1 overflow-y-auto overflow-x-auto p-0 min-w-0">
                        <table className="w-full text-xs text-left border-collapse table-fixed">
                          <thead className="bg-surface-2/60 text-muted-foreground uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b">
                            <tr>
                              <th className="w-[50px] p-2 pl-3 font-bold">Row #</th>
                              <th className="p-2 font-bold">Name</th>
                              <th className="w-[105px] p-2 font-bold">Barcode</th>
                              <th className="w-[95px] p-2 font-bold">SKU</th>
                              <th className="w-[140px] p-2 font-bold">Conflict Type</th>
                              <th className="w-[125px] p-2 font-bold">Existing Product</th>
                              <th className="w-[160px] p-2 pr-3 text-center font-bold">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/40">
                            {paginatedConflictItems.map((c) => {
                              const choice = conflictChoices[c.rowNumber];
                              return (
                                <tr key={c.rowNumber} className="hover:bg-surface-2/30 transition-colors">
                                  <td className="p-2 pl-3 font-mono font-bold text-ink">#{c.rowNumber}</td>
                                  <td className="p-2 font-medium text-ink truncate" title={c.name}>{c.name}</td>
                                  <td className="p-2 font-mono truncate" title={c.barcode}>{c.barcode}</td>
                                  <td className="p-2 font-mono truncate" title={c.sku}>{c.sku}</td>
                                  <td className="p-2 text-amber-700 font-medium truncate" title={c.conflictType}>{c.conflictType}</td>
                                  <td className="p-2 font-medium text-slate-700 truncate" title={c.existingProductName}>
                                    {c.existingProductName}
                                  </td>
                                  <td className="p-2 pr-3 text-center whitespace-nowrap">
                                    <div className="inline-flex items-center gap-1.5 justify-center">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setConflictChoices((prev) => ({
                                            ...prev,
                                            [c.rowNumber]: "update",
                                          }))
                                        }
                                        className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-semibold transition-all border ${
                                          choice === "update"
                                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                            : "bg-surface text-muted-foreground border-border hover:bg-surface-2 hover:text-ink"
                                        }`}
                                      >
                                        {choice === "update" && <Check className="h-3 w-3 mr-1 shrink-0" />}
                                        Update
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setConflictChoices((prev) => ({
                                            ...prev,
                                            [c.rowNumber]: "remove",
                                          }))
                                        }
                                        className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-semibold transition-all border ${
                                          choice === "remove"
                                            ? "bg-destructive text-destructive-foreground border-destructive shadow-sm"
                                            : "bg-surface text-muted-foreground border-border hover:bg-destructive/10 hover:text-destructive"
                                        }`}
                                      >
                                        {choice === "remove" && <Check className="h-3 w-3 mr-1 shrink-0" />}
                                        Remove
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <DialogFooter className="sticky bottom-0 z-10 shrink-0 border-t border-border/70 bg-surface/95 backdrop-blur-md p-3 sm:p-4 flex flex-row items-center justify-between gap-3 flex-wrap">
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl px-4 h-9 font-semibold text-xs"
                          onClick={() => setConflictModalOpen(false)}
                        >
                          Cancel
                        </Button>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs font-semibold"
                            onClick={() => setConflictPage((p) => Math.max(1, p - 1))}
                            disabled={conflictPage <= 1}
                          >
                            <ChevronLeft className="h-3.5 w-3.5 mr-0.5" />
                            Prev
                          </Button>
                          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap px-1">
                            Page {conflictPage} of {totalConflictPages}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs font-semibold"
                            onClick={() => setConflictPage((p) => Math.min(totalConflictPages, p + 1))}
                            disabled={conflictPage >= totalConflictPages}
                          >
                            Next
                            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                          </Button>
                        </div>

                        <Button
                          type="button"
                          className="rounded-xl px-5 h-9 font-bold text-xs"
                          onClick={handleApplyConflictChoicesAndImport}
                          disabled={isImporting || conflictItems.some((c) => !conflictChoices[c.rowNumber])}
                        >
                          Continue import
                        </Button>
                      </DialogFooter>
                    </>
                  );
                })()}
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="batches" className="mt-0 space-y-5">
            {nearExpiry > 0 && (
              <div className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-4">
                <AlertTriangle className="h-5 w-5 text-warning-foreground" />
                <p className="text-sm font-medium text-ink">
                  {nearExpiry} batches expire within 14 days.
                </p>
                <Button
                  size="sm"
                  className="ml-auto rounded-lg"
                  onClick={async () => {
                    const nearExpiryBatches = mappedBatches.filter((b: any) => b.daysLeft <= 14);
                    const uniqueProductIds = Array.from(new Set(nearExpiryBatches.map((b: any) => b.productId)));
                    if (uniqueProductIds.length === 0) return;
                    
                    const loadToast = toast.loading("Applying clearance pricing...");
                    try {
                      for (const productId of uniqueProductIds) {
                        await applyClearanceFn({ data: { productId, discountPct: 20 } });
                      }
                      toast.dismiss(loadToast);
                      toast.success("Clearance pricing applied successfully!");
                      router.invalidate();
                    } catch (err: any) {
                      toast.dismiss(loadToast);
                      toast.error(err.message || "Failed to apply clearance pricing");
                    }
                  }}
                >
                  Apply clearance
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-ink">Inventory & Batches</h3>
                <p className="text-sm text-muted-foreground">Manage batches and track expiry dates.</p>
              </div>
              <Button onClick={() => setAddBatchOpen(true)} className="rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:-translate-y-0.5 transition-all">
                <Plus className="mr-2 h-4 w-4" /> Add Batch
              </Button>
            </div>
            <div className="panel overflow-x-auto">
              <Table className="min-w-[820px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Batch</TableHead>
                    <TableHead>Outlet</TableHead>
                    <TableHead>Rotation</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mappedBatches.map((b: any) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-semibold text-ink">{b.product}</TableCell>
                      <TableCell className="font-mono text-xs">{b.batch}</TableCell>
                      <TableCell>{b.outlet}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full">
                          {b.rule}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{b.qty}</TableCell>
                      <TableCell className="tabular-nums">{b.expiry}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${expiryTone(b.daysLeft)}`}
                        >
                          {b.daysLeft} days left
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="purchasing" className="mt-0">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-ink">Purchasing Pipeline</h3>
                <p className="text-sm text-muted-foreground">
                  Track Purchase Orders, Goods Received, and Invoices.
                </p>
              </div>
              <Dialog open={poModalOpen} onOpenChange={setPoModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setPoForm({ vendorId: "", branchId: "" });
                      setPoItems([]);
                    }}
                  >
                    Create New PO
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Purchase Order</DialogTitle>
                    <DialogDescription>Draft a new PO to send to a vendor.</DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Vendor</Label>
                      <Select onValueChange={(v) => setPoForm({ ...poForm, vendorId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {mappedVendors.map((v: any) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Branch</Label>
                      <Select onValueChange={(v) => setPoForm({ ...poForm, branchId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          {mappedOutlets.map((b: any) => (
                            <SelectItem key={b.id} value={b.id}>
                              {b.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Order Items</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPoItems([...poItems, { productId: "", qty: 1, unitPrice: 0 }])
                        }
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Item
                      </Button>
                    </div>
                    {poItems.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-end">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Product</Label>
                          <SearchableProductSelect
                            products={mappedProducts}
                            value={item.productId}
                            onSelect={(v) => {
                              const n = [...poItems];
                              n[idx].productId = v;
                              setPoItems(n);
                            }}
                            placeholder="Select product..."
                          />
                        </div>
                        <div className="w-20 space-y-1">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min="1"
                            className="h-8"
                            value={item.qty}
                            onChange={(e) => {
                              const n = [...poItems];
                              n[idx].qty = Number(e.target.value);
                              setPoItems(n);
                            }}
                          />
                        </div>
                        <div className="w-24 space-y-1">
                          <Label className="text-xs">Unit Cost</Label>
                          <Input
                            type="number"
                            min="0"
                            className="h-8"
                            value={item.unitPrice}
                            onChange={(e) => {
                              const n = [...poItems];
                              n[idx].unitPrice = Number(e.target.value);
                              setPoItems(n);
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="text-right font-bold mt-2">
                      Total: {aed(poItems.reduce((acc, i) => acc + i.qty * i.unitPrice, 0))}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setPoModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!poForm.vendorId || !poForm.branchId || poItems.length === 0) {
                          toast.error("Fill vendor, branch, and at least 1 item");
                          return;
                        }
                        if (poItems.some((i) => !i.productId || i.qty <= 0 || i.unitPrice <= 0)) {
                          toast.error("Invalid item fields or negative quantities");
                          return;
                        }
                        try {
                          const res = await createPurchaseOrderServerFn({
                            data: {
                              vendorId: poForm.vendorId,
                              branchId: poForm.branchId,
                              items: poItems,
                            },
                          });
                          if (res.success) {
                            toast.success("PO Created");
                            setPoModalOpen(false);
                            setPoItems([]);
                            router.invalidate();
                          }
                        } catch (err: any) {
                          toast.error(err.message || "Failed");
                        }
                      }}
                    >
                      Create PO
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-5 lg:grid-cols-3">
              {(["PO", "GRN", "Invoice"] as const).map((stage, idx) => (
                <div key={stage} className="panel p-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-ink">
                      {idx + 1}.{" "}
                      {stage === "PO"
                        ? "Purchase Orders"
                        : stage === "GRN"
                          ? "Goods Received"
                          : "Vendor Invoices"}
                    </h2>
                    <Badge variant="outline" className="rounded-full">
                      {mappedPurchases.filter((p: any) => p.stage === stage).length}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {mappedPurchases
                      .filter((p: any) => p.stage === stage)
                      .map((p: any, idx: number) => (
                        <div
                          key={p.id + idx}
                          className="rounded-xl border border-border bg-surface-2 p-4"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs text-muted-foreground">{p.id}</span>
                            <span className="text-sm font-bold text-ink">{aedShort(p.value)}</span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-ink">{p.vendor}</p>
                          {p.variance && (
                            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-2.5 py-1 text-[11px] font-semibold text-destructive">
                              <AlertTriangle className="h-3 w-3" /> {p.variance}
                            </span>
                          )}
                          {stage !== "Invoice" ? (
                            <div className="mt-3 flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="flex-1 rounded-lg"
                                onClick={async () => {
                                  if (stage === "PO") {
                                    setGrnForm({
                                      purchaseOrderId: p.rawId,
                                      vendorId: p.vendorId,
                                      branchId: p.branchId,
                                      items: p.items.map((i: any) => ({
                                        productId: i.productId,
                                        name: i.product?.name,
                                        orderedQty: i.qty,
                                        receivedQty: i.qty,
                                        isBatchTracked: i.product?.isBatchTracked === false ? false : true,
                                      })),
                                    });
                                    setGrnModalOpen(true);
                                  } else {
                                    const loadToast = toast.loading("Loading GRN details...");
                                    try {
                                      const res = await getGrnDetailsServerFn({
                                        data: { purchaseOrderId: p.rawId },
                                      });
                                      toast.dismiss(loadToast);

                                      const thirtyDaysFromNow = new Date();
                                      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
                                      const defaultDueDateStr = thirtyDaysFromNow
                                        .toISOString()
                                        .split("T")[0];

                                      setInvoiceForm({
                                        purchaseOrderId: res.purchaseOrderId,
                                        poNumber: res.poNumber,
                                        grnNumber: res.grnNumber,
                                        vendorName: res.vendorName,
                                        branchName: res.branchName,
                                        invoiceNumber: "",
                                        dueDate: defaultDueDateStr,
                                        items: res.items,
                                        subtotal: res.subtotal,
                                        vat: res.vat,
                                        total: res.total,
                                        vatRate: res.vatRate,
                                        vatInclusive: res.vatInclusive,
                                      });
                                      setInvoiceModalOpen(true);
                                    } catch (err: any) {
                                      toast.dismiss(loadToast);
                                      toast.error(err.message || "Failed to load GRN details");
                                    }
                                  }
                                }}
                              >
                                {stage === "PO" ? "Record GRN" : "Convert to invoice"}
                              </Button>

                              {stage === "PO" && (
                                <>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-9 w-9 rounded-lg"
                                    onClick={() => {
                                      setEditPoForm({
                                        id: p.rawId,
                                        vendorId: p.vendorId,
                                        branchId: p.branchId,
                                        items: p.items.map((i: any) => ({
                                          productId: i.productId,
                                          qty: i.qty,
                                          unitPrice: Number(i.unitPrice) || 0,
                                        })),
                                      });
                                      setEditPoOpen(true);
                                    }}
                                    title="Edit PO"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-9 w-9 rounded-lg text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      setDeletePoContext({
                                        id: p.rawId,
                                        shortId: p.id,
                                        vendor: p.vendor,
                                      });
                                      setDeletePoDialogOpen(true);
                                    }}
                                    title="Delete PO"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="mt-3">
                              <Button
                                size="sm"
                                variant="outline"
                                className="w-full rounded-lg"
                                onClick={async () => {
                                  setIsDetailLoading(true);
                                  const loadToast = toast.loading("Loading invoice details...");
                                  try {
                                    const res = await getInvoiceDetailsServerFn({
                                      data: { purchaseOrderId: p.rawId },
                                    });
                                    setInvoiceDetail(res);
                                    setInvoiceDetailModalOpen(true);
                                    toast.dismiss(loadToast);
                                  } catch (err: any) {
                                    toast.dismiss(loadToast);
                                    toast.error(err.message || "Failed to load invoice details");
                                  } finally {
                                    setIsDetailLoading(false);
                                  }
                                }}
                              >
                                View Details
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="panel mt-5 flex flex-wrap items-center justify-between gap-3 p-5">
              <div>
                <p className="text-sm font-bold text-ink">Accounts payable outstanding</p>
                <p className="text-xs text-muted-foreground">
                  {mappedPurchases.filter((p: any) => p.stage === "Invoice").length} vendor invoices
                </p>
              </div>
              <p className="text-2xl font-extrabold text-ink">
                {aedShort(
                  mappedPurchases.reduce(
                    (sum: any, p: any) => (p.stage === "Invoice" ? sum + p.value : sum),
                    0,
                  ),
                )}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="roles" className="mt-0 space-y-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-ink">Staff & Roles</h3>
                <p className="text-sm text-muted-foreground">
                  Manage user permissions and access levels.
                </p>
              </div>
              <Dialog open={staffModalOpen} onOpenChange={setStaffModalOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() =>
                      setStaffForm({
                        id: "",
                        name: "",
                        email: "",
                        role: "cashier",
                        branchId: "",
                        password: "",
                        pin: "",
                        isActive: true,
                      })
                    }
                  >
                    <Plus className="mr-1.5 h-4 w-4" /> Add Staff
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {staffForm.id ? "Edit Staff Member" : "Add Staff Member"}
                    </DialogTitle>
                    <DialogDescription>Assign role and branch access to staff.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={staffForm.name}
                        onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={staffForm.email}
                        onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select
                          value={staffForm.role}
                          onValueChange={(v) => setStaffForm({ ...staffForm, role: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="branch_manager">Branch Manager</SelectItem>
                            <SelectItem value="inventory_manager">Inventory Manager</SelectItem>
                            <SelectItem value="purchasing_officer">Purchasing Officer</SelectItem>
                            <SelectItem value="cashier">Cashier</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Branch</Label>
                        <Select
                          value={staffForm.branchId}
                          onValueChange={(v) => setStaffForm({ ...staffForm, branchId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select Branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {mappedOutlets.map((b: any) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {staffForm.role === "cashier" ? (
                      <div className="space-y-2">
                        <Label>PIN {staffForm.id ? "(Leave blank to keep existing)" : "*"}</Label>
                        <Input
                          type="password"
                          value={staffForm.pin}
                          onChange={(e) => setStaffForm({ ...staffForm, pin: e.target.value })}
                        />
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>
                          Password {staffForm.id ? "(Leave blank to keep existing)" : "*"}
                        </Label>
                        <Input
                          type="password"
                          value={staffForm.password}
                          onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                        />
                      </div>
                    )}
                    {staffForm.id && (
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-surface-2 mt-2">
                        <div className="space-y-0.5">
                          <Label>Active Status</Label>
                          <p className="text-xs text-muted-foreground">
                            Inactive staff cannot log in.
                          </p>
                        </div>
                        <Switch
                          checked={staffForm.isActive}
                          onCheckedChange={(c) => setStaffForm({ ...staffForm, isActive: c })}
                        />
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setStaffModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={async () => {
                        if (!staffForm.branchId) {
                          toast.error("Branch assignment is required");
                          return;
                        }
                        try {
                          const res = staffForm.id
                            ? await updateStaffFn({ data: staffForm })
                            : await createStaffFn({ data: staffForm });
                          if (res.success) {
                            toast.success("Staff saved successfully");
                            setStaffModalOpen(false);
                            router.invalidate();
                          }
                        } catch (err: any) {
                          toast.error(err.message || "Failed to save staff");
                        }
                      }}
                    >
                      Save Staff
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              {mappedRoles.map((role, idx) => (
                <div key={idx} className="panel p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-sm font-bold text-ink">{role.role}</h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      <Users className="h-3.5 w-3.5" /> {role.users}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {role.perms.map((p, pIdx) => {
                      const enabled = isPermissionEnabled(role.role, p);
                      const dbRole = roleToDbMap[role.role];
                      const isLocked = dbRole === "super_admin" || dbRole === "head_office_admin";
                      const key = `${dbRole}:${p}`;
                      const isToggling = !!togglingPerms[key];

                      return (
                        <div
                          key={pIdx}
                          className="flex items-center justify-between rounded-lg bg-surface-2 px-3 py-2 text-xs"
                        >
                          <span className="text-muted-foreground">{p}</span>
                          <Switch
                            checked={enabled}
                            onCheckedChange={() => handleTogglePermission(role.role, p, enabled)}
                            disabled={isLocked || isToggling}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="panel mt-8">
              <div className="border-b border-border p-5">
                <h3 className="font-bold text-ink">Directory</h3>
              </div>
              <div className="overflow-x-auto w-full">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.staff || [])
                    .filter((s: any) => s.role !== "head_office_admin" && s.role !== "super_admin")
                    .map((s: any) => {
                      const branch = mappedOutlets.find((b: any) => b.id === s.branchId);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium text-ink">{s.name}</TableCell>
                          <TableCell>{s.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {s.role.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>{branch ? branch.name : "-"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={s.isActive ? "default" : "secondary"}
                              className={s.isActive ? "bg-emerald-100 text-emerald-800" : ""}
                            >
                              {s.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setStaffForm({
                                  id: s.id,
                                  name: s.name,
                                  email: s.email,
                                  role: s.role,
                                  branchId: s.branchId || "",
                                  isActive: s.isActive,
                                  password: "",
                                  pin: "",
                                });
                                setStaffModalOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this staff member?")) {
                                  handleDeleteStaff(s.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vat" className="mt-0">
            <div className="grid gap-5 lg:grid-cols-1">
              <div className="panel p-6">
                <h2 className="text-sm font-bold text-ink">VAT configuration</h2>
                <div className="mt-5 flex items-center justify-between rounded-xl bg-surface-2 p-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {inclusive ? "Tax-inclusive" : "Tax-exclusive"} shelf pricing
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Applies to all outlets in this tenant.
                    </p>
                  </div>
                  <Switch checked={inclusive} onCheckedChange={setInclusive} />
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                    <span className="text-muted-foreground">Standard rate (%)</span>
                    <Input
                      type="number"
                      className="w-24 h-8 text-right font-semibold text-ink"
                      value={vatRate}
                      onChange={(e) => setVatRate(e.target.value)}
                    />
                  </div>
                  {[
                    ["Output VAT this period", aed(data?.outputVat || 0)],
                    ["Input VAT this period", aed(data?.inputVat || 0)],
                  ].map(([k, v]) => (
                    <div
                      key={k as string}
                      className="flex justify-between rounded-xl border border-border px-4 py-3"
                    >
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-semibold text-ink">{v as string}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 mt-5">
                  <Button
                    className="rounded-xl font-semibold"
                    onClick={async () => {
                      const res = await updateVatSettingsFn({
                        data: { vatRate: String(vatRate), vatInclusive: inclusive },
                      });
                      if (res.success) {
                        router.invalidate();
                        toast.success("VAT settings saved");
                      }
                    }}
                  >
                    Save VAT settings
                  </Button>
                  <Button
                    variant="default"
                    className="rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
                    onClick={downloadVatSummaryCsv}
                  >
                    <Download className="mr-1.5 h-4 w-4" /> Download VAT Summary (CSV)
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl font-semibold"
                    onClick={downloadFtaSummary}
                    disabled={isGeneratingFtaReport}
                  >
                    <FileText className="mr-1.5 h-4 w-4" />{" "}
                    {isGeneratingFtaReport ? "Generating..." : "Download VAT Summary (PDF)"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3 italic">
                  ℹ️ Internal tax summary report calculated from POS sales and vendor purchases formatted according to UAE VAT 201 Return boxes (5% Standard Rate).
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="loyalty" className="mt-0 space-y-5">
            <div className="panel p-6">
              <h3 className="text-sm font-bold text-ink mb-4">Point-Redemption Policies</h3>
              <div className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Points per 1 AED spent</Label>
                  <Input
                    type="number"
                    value={loyaltyPointsPerAed}
                    onChange={(e) => setLoyaltyPointsPerAed(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Minimum points to redeem</Label>
                  <Input
                    type="number"
                    value={loyaltyMinPointsToRedeem}
                    onChange={(e) => setLoyaltyMinPointsToRedeem(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Redemption Rate (e.g. 0.01 AED per point)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={loyaltyRate}
                    onChange={(e) => setLoyaltyRate(e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button
                  disabled={isSavingLoyalty}
                  onClick={async () => {
                    setIsSavingLoyalty(true);
                    const loadToast = toast.loading("Saving loyalty settings...");
                    try {
                      const res = await updateLoyaltySettingsFn({
                        data: {
                          pointsPerAed: loyaltyPointsPerAed,
                          minPointsToRedeem: loyaltyMinPointsToRedeem,
                          redemptionRate: loyaltyRate,
                        },
                      });
                      toast.dismiss(loadToast);
                      if (res.success) {
                        router.invalidate();
                        toast.success("Policies saved");
                      } else {
                        toast.error("Failed to save settings");
                      }
                    } catch (err: any) {
                      toast.dismiss(loadToast);
                      toast.error(err.message || "An error occurred");
                    } finally {
                      setIsSavingLoyalty(false);
                    }
                  }}
                >
                  {isSavingLoyalty ? "Saving..." : "Save Policies"}
                </Button>
              </div>
            </div>
            <div className="panel overflow-x-auto">
              <Table className="min-w-[760px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead className="text-right">Points</TableHead>
                    <TableHead className="text-right">Visits</TableHead>
                    <TableHead className="text-right">Lifetime spend</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.customers || []).map((c: any) => (
                    <Dialog key={c.id}>
                      <DialogTrigger asChild>
                        <TableRow className="cursor-pointer hover:bg-surface-2/50 transition-colors">
                          <TableCell className="font-semibold text-ink">{c.name}</TableCell>
                          <TableCell className="font-mono text-xs">{c.phone}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${tierTone[c.tier]}`}
                            >
                              <Star className="h-3 w-3" /> {c.tier}
                            </span>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {c.points.toLocaleString("en-AE")}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{c.visits}</TableCell>
                          <TableCell className="text-right font-semibold tabular-nums">
                            {aedShort(c.spend)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg relative z-10"
                              onClick={(e) => {
                                e.stopPropagation();
                                toast.success(`Voucher issued to ${c.name}`);
                              }}
                            >
                              Issue voucher
                            </Button>
                          </TableCell>
                        </TableRow>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>{c.name} - Transaction History</DialogTitle>
                          <DialogDescription>
                            Recent purchases and loyalty points activity.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead className="text-right">Amount</TableHead>
                                <TableHead className="text-right">Points</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {(c.history || []).map((h: any, i: number) => (
                                <TableRow key={i}>
                                  <TableCell className="text-muted-foreground">{h.date}</TableCell>
                                  <TableCell>{h.loc}</TableCell>
                                  <TableCell className="text-right font-medium">
                                    {aed(h.amt)}
                                  </TableCell>
                                  <TableCell className="text-right text-success font-semibold">
                                    {h.pts}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </DialogContent>
                    </Dialog>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="price_requests" className="mt-0">
            <div className="panel p-6">
              <h3 className="text-lg font-bold text-ink mb-2">Price Override Requests</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Review and approve/reject branch-specific pricing override requests. Approved
                overrides update POS catalog prices immediately.
              </p>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead className="text-right">Standard Price</TableHead>
                      <TableHead className="text-right">Requested Price</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!data || !data.priceRequests || data.priceRequests.length === 0) && (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="h-24 text-center text-muted-foreground font-semibold"
                        >
                          No price override requests found.
                        </TableCell>
                      </TableRow>
                    )}
                    {(data?.priceRequests || []).map((req: any) => (
                      <TableRow
                        key={req.id}
                        className="hover:bg-surface-2/40 transition-colors duration-200"
                      >
                        <TableCell className="font-semibold text-ink">
                          {req.product?.name || "Unknown Product"}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium">
                          {req.branch?.name || "Unknown Branch"}
                        </TableCell>
                        <TableCell className="text-right font-medium text-muted-foreground">
                          {aed(Number(req.standardPrice))}
                        </TableCell>
                        <TableCell className="text-right font-bold text-ink">
                          {aed(Number(req.requestedPrice))}
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium max-w-xs truncate">
                          {req.reason}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(req.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell>
                          {req.status === "Approved" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-bold text-success animate-in fade-in">
                              <CheckCircle2 className="h-3 w-3" /> Approved
                            </span>
                          ) : req.status === "Rejected" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 animate-in fade-in">
                              <Ban className="h-3 w-3" /> Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-700 animate-in fade-in">
                              <Clock className="h-3 w-3" /> Pending
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {req.status === "Pending" && (
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg text-xs font-bold border-red-200 text-red-600 hover:bg-red-50"
                                onClick={async () => {
                                  try {
                                    const res = await handleOverrideRequestFn({
                                      data: {
                                        requestId: req.id,
                                        action: "Reject",
                                      },
                                    });
                                    if (res.success) {
                                      toast.success("Request rejected successfully");
                                      router.invalidate();
                                    }
                                  } catch (err: any) {
                                    toast.error(err.message || "Failed to reject request");
                                  }
                                }}
                              >
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                className="h-8 rounded-lg text-xs font-bold bg-success hover:bg-success/90"
                                onClick={async () => {
                                  try {
                                    const res = await handleOverrideRequestFn({
                                      data: {
                                        requestId: req.id,
                                        action: "Approve",
                                      },
                                    });
                                    if (res.success) {
                                      toast.success("Request approved successfully");
                                      router.invalidate();
                                    }
                                  } catch (err: any) {
                                    toast.error(err.message || "Failed to approve request");
                                  }
                                }}
                              >
                                Approve
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="crm" className="mt-0">
            <CRMTab />
          </TabsContent>

          <TabsContent value="promotions" className="mt-0">
            <PromotionsTab />
          </TabsContent>

          <TabsContent value="vendors" className="mt-0 space-y-5">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-xl font-bold text-ink">Suppliers & Vendors</h2>
                <p className="text-sm text-muted-foreground">
                  Manage tenant-level suppliers and integration details.
                </p>
              </div>
              <Button
                className="rounded-xl font-semibold"
                onClick={() => {
                  setVendorForm({
                    id: "",
                    name: "",
                    contact: "",
                    phone: "",
                    email: "",
                    address: "",
                    status: "Active",
                    trn: "",
                  });
                  setIsEditingVendor(false);
                  setVendorFormOpen(true);
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" /> Add Vendor
              </Button>
            </div>

            {!data?.vendors || data.vendors.length === 0 ? (
              <div className="panel p-12 text-center">
                <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-bold text-ink">No vendors found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Get started by creating your first supplier profile.
                </p>
              </div>
            ) : (
              <div className="panel overflow-hidden">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>TRN</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.vendors.map((v: any) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-semibold text-ink">{v.name}</TableCell>
                        <TableCell>{v.contact || "-"}</TableCell>
                        <TableCell className="font-mono text-xs">{v.phone || "-"}</TableCell>
                        <TableCell className="text-sm">{v.email || "-"}</TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate" title={v.address}>
                          {v.address || "-"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">{v.trn || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${v.status === "Active" ? "border-success/20 bg-success/12 text-success" : "border-border bg-surface-2 text-muted-foreground"}`}
                          >
                            {v.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 rounded-lg"
                              onClick={() => {
                                setVendorForm({
                                  id: v.id,
                                  name: v.name,
                                  contact: v.contact || "",
                                  phone: v.phone || "",
                                  email: v.email || "",
                                  address: v.address || "",
                                  status: v.status || "Active",
                                  trn: v.trn || "",
                                });
                                setIsEditingVendor(true);
                                setVendorFormOpen(true);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setDeleteVendorContext(v);
                                setDeleteVendorDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Add / Edit Vendor Dialog */}
            <Dialog open={vendorFormOpen} onOpenChange={setVendorFormOpen}>
              <DialogContent className="sm:max-w-md w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>
                    {isEditingVendor ? "Edit Vendor Profile" : "Add New Vendor"}
                  </DialogTitle>
                  <DialogDescription>Setup vendor contact details and settings.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-1.5">
                    <Label>Vendor Name *</Label>
                    <Input
                      value={vendorForm.name}
                      onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
                      className="rounded-xl border-border/50 bg-surface-2"
                      placeholder="e.g. Acme Distributors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Contact Person</Label>
                      <Input
                        value={vendorForm.contact}
                        onChange={(e) => setVendorForm({ ...vendorForm, contact: e.target.value })}
                        className="rounded-xl border-border/50 bg-surface-2"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>TRN (Tax Reg No)</Label>
                      <Input
                        value={vendorForm.trn}
                        onChange={(e) => setVendorForm({ ...vendorForm, trn: e.target.value })}
                        className="rounded-xl border-border/50 bg-surface-2"
                        placeholder="e.g. 100xxxxx"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Phone</Label>
                      <Input
                        value={vendorForm.phone}
                        onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                        className="rounded-xl border-border/50 bg-surface-2"
                        placeholder="e.g. 0501234567"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <Input
                        value={vendorForm.email}
                        onChange={(e) => setVendorForm({ ...vendorForm, email: e.target.value })}
                        className="rounded-xl border-border/50 bg-surface-2"
                        placeholder="e.g. info@acme.com"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Address</Label>
                    <Input
                      value={vendorForm.address}
                      onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })}
                      className="rounded-xl border-border/50 bg-surface-2"
                      placeholder="e.g. Warehouse 4, Al Quoz, Dubai"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select
                      value={vendorForm.status}
                      onValueChange={(v) => setVendorForm({ ...vendorForm, status: v })}
                    >
                      <SelectTrigger className="rounded-xl border-border/50 bg-surface-2">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setVendorFormOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="rounded-xl"
                    onClick={async () => {
                      if (!vendorForm.name) {
                        toast.error("Vendor name is required");
                        return;
                      }
                      if (vendorForm.email) {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        if (!emailRegex.test(vendorForm.email)) {
                          toast.error("Invalid email format");
                          return;
                        }
                      }

                      const payload = {
                        name: vendorForm.name,
                        contact: vendorForm.contact || null,
                        phone: vendorForm.phone || null,
                        email: vendorForm.email || null,
                        address: vendorForm.address || null,
                        trn: vendorForm.trn || null,
                        status: vendorForm.status,
                      };

                      const res = isEditingVendor
                        ? await updateVendorFn({ data: { id: vendorForm.id, ...payload } })
                        : await createVendorFn({ data: payload });

                      if (res.success) {
                        toast.success(isEditingVendor ? "Vendor updated" : "Vendor created");
                        setVendorFormOpen(false);
                        router.invalidate();
                      } else {
                        toast.error(res.error || "Operation failed");
                      }
                    }}
                  >
                    Save Vendor
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Vendor Dialog */}
            <Dialog
              open={deleteVendorDialogOpen}
              onOpenChange={(open) => {
                if (!isDeletingVendor) {
                  setDeleteVendorDialogOpen(open);
                  if (!open) setDeleteVendorContext(null);
                }
              }}
            >
              <DialogContent className="sm:max-w-md w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Remove vendor profile?</DialogTitle>
                  <DialogDescription>
                    Remove <strong>{deleteVendorContext?.name}</strong>? If this supplier has
                    associated purchase records or invoices, deletion will be blocked.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setDeleteVendorDialogOpen(false);
                      setDeleteVendorContext(null);
                    }}
                    disabled={isDeletingVendor}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={async () => {
                      if (!deleteVendorContext) return;
                      setIsDeletingVendor(true);
                      try {
                        const res = await deleteVendorFn({ data: { id: deleteVendorContext.id } });
                        if (res && res.success) {
                          toast.success("Vendor deleted");
                          setDeleteVendorDialogOpen(false);
                          setDeleteVendorContext(null);
                          router.invalidate();
                        } else {
                          const errMap: Record<string, string> = {
                            VENDOR_USED_IN_PURCHASES:
                              "Cannot delete vendor because it is referenced in existing purchase orders.",
                            VENDOR_USED_IN_INVOICES:
                              "Cannot delete vendor because it is referenced in vendor invoices.",
                          };
                          toast.error(errMap[res?.error || ""] || res?.error || "Failed to delete");
                        }
                      } catch (err: any) {
                        toast.error(err.message || "An error occurred");
                      } finally {
                        setIsDeletingVendor(false);
                      }
                    }}
                    disabled={isDeletingVendor}
                  >
                    {isDeletingVendor ? "Removing..." : "Remove"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <ReportsTab />
          </TabsContent>

          <TabsContent value="financial_reports" className="mt-0">
            <FinancialReportsTab />
          </TabsContent>

          <TabsContent value="payroll" className="mt-0">
            <PayrollTab />
          </TabsContent>

          {/* Record GRN Dialog */}
          <Dialog
            open={grnModalOpen}
            onOpenChange={(open) => {
              if (!isSubmittingGRN) setGrnModalOpen(open);
            }}
          >
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Record Goods Received (GRN)</DialogTitle>
                <DialogDescription>
                  Record actual quantities received against PO <strong>{grnForm?.poNumber}</strong>{" "}
                  from <strong>{grnForm?.vendorName}</strong>.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Supplier GRN Number / Invoice Reference *</Label>
                    <Input
                      value={grnForm?.grnNumber || ""}
                      onChange={(e) => setGrnForm({ ...grnForm, grnNumber: e.target.value })}
                      className="rounded-xl border-border/50 bg-surface-2"
                      placeholder="e.g. GRN-9912"
                      disabled={isSubmittingGRN}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Delivery Branch</Label>
                    <Input
                      value={grnForm?.branchName || ""}
                      className="rounded-xl border-border/50 bg-surface-2 opacity-70"
                      disabled
                    />
                  </div>
                </div>

                <div className="border border-border rounded-xl overflow-hidden mt-4">
                  <Table>
                    <TableHeader className="bg-surface-2">
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Ordered Qty</TableHead>
                        <TableHead className="text-right">Received Qty</TableHead>
                        <TableHead>Batch Info (Required if batch-tracked)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(grnForm?.items || []).map((item: any, index: number) => (
                        <TableRow key={item.productId}>
                          <TableCell
                            className="font-semibold text-ink max-w-[200px] truncate"
                            title={item.name}
                          >
                            {item.name}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {item.orderedQty}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              min="0"
                              max={item.orderedQty}
                              value={item.receivedQty}
                              onChange={(e) => {
                                const updatedItems = [...grnForm.items];
                                updatedItems[index].receivedQty = Number(e.target.value) || 0;
                                setGrnForm({ ...grnForm, items: updatedItems });
                              }}
                              className="w-24 h-9 ml-auto text-right rounded-lg bg-surface-2 border-border/50 font-mono"
                              disabled={isSubmittingGRN}
                            />
                          </TableCell>
                          <TableCell>
                            {item.isBatchTracked ? (
                              <div className="space-y-1.5 min-w-[200px]">
                                <Input
                                  placeholder="Batch Number"
                                  value={item.batchNumber || ""}
                                  onChange={(e) => {
                                    const updatedItems = [...grnForm.items];
                                    updatedItems[index].batchNumber = e.target.value;
                                    setGrnForm({ ...grnForm, items: updatedItems });
                                  }}
                                  className="h-8 text-xs rounded-lg bg-surface-2 border-border/50"
                                  disabled={isSubmittingGRN || item.receivedQty === 0}
                                />
                                <Input
                                  type="date"
                                  value={item.expiryDate || ""}
                                  onChange={(e) => {
                                    const updatedItems = [...grnForm.items];
                                    updatedItems[index].expiryDate = e.target.value;
                                    setGrnForm({ ...grnForm, items: updatedItems });
                                  }}
                                  className="h-8 text-xs rounded-lg bg-surface-2 border-border/50"
                                  disabled={isSubmittingGRN || item.receivedQty === 0}
                                />
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No tracking required
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setGrnModalOpen(false)}
                  disabled={isSubmittingGRN}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-xl"
                  onClick={async () => {
                    console.log("Submitting GRN...");
                    if (!grnForm.grnNumber) {
                      toast.error("Supplier GRN Number is required");
                      return;
                    }

                    // Validation check on items
                    const totalReceived = grnForm.items.reduce(
                      (sum: number, i: any) => sum + i.receivedQty,
                      0,
                    );
                    if (totalReceived === 0) {
                      toast.error("Cannot record a GRN with zero received quantity.");
                      return;
                    }

                    for (const item of grnForm.items) {
                      if (item.receivedQty < 0) {
                        toast.error(`Received quantity for ${item.name} cannot be negative`);
                        return;
                      }
                      if (item.receivedQty > item.orderedQty) {
                        toast.error(
                          `Received quantity for ${item.name} cannot exceed ordered quantity (${item.orderedQty})`,
                        );
                        return;
                      }
                      if (item.isBatchTracked && item.receivedQty > 0) {
                        if (!item.batchNumber || !item.expiryDate) {
                          toast.error(
                            `Batch number and expiry date are required for tracked product: ${item.name}`,
                          );
                          return;
                        }
                      }
                    }

                    setIsSubmittingGRN(true);
                    try {
                      const payload = {
                        purchaseOrderId: grnForm.purchaseOrderId,
                        vendorId: grnForm.vendorId,
                        branchId: grnForm.branchId,
                        grnNumber: grnForm.grnNumber,
                        items: grnForm.items.map((i: any) => ({
                          productId: i.productId,
                          orderedQty: i.orderedQty,
                          receivedQty: i.receivedQty,
                          batchNumber: i.isBatchTracked && i.receivedQty > 0 ? i.batchNumber : null,
                          expiryDate: i.isBatchTracked && i.receivedQty > 0 ? i.expiryDate : null,
                        })),
                      };

                      await recordGRNServerFn({ data: payload });
                      toast.success("Goods received note recorded successfully!");
                      setGrnModalOpen(false);
                      router.invalidate();
                    } catch (err: any) {
                      console.error("Error recording GRN:", err);
                      toast.error(err.message || "An error occurred");
                    } finally {
                      setIsSubmittingGRN(false);
                    }
                  }}
                  disabled={isSubmittingGRN}
                >
                  {isSubmittingGRN ? "Saving Receipt..." : "Receive & Save GRN"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Convert to Invoice Dialog */}
          <Dialog
            open={invoiceModalOpen}
            onOpenChange={(open) => {
              if (!isSubmittingInvoice) setInvoiceModalOpen(open);
            }}
          >
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Convert to Invoice</DialogTitle>
                <DialogDescription>
                  Create a vendor invoice against PO/GRN reference{" "}
                  <strong>{invoiceForm?.poNumber}</strong> (GRN:{" "}
                  <strong>{invoiceForm?.grnNumber}</strong>) from{" "}
                  <strong>{invoiceForm?.vendorName}</strong>.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Invoice Number / Reference *</Label>
                    <Input
                      value={invoiceForm?.invoiceNumber || ""}
                      onChange={(e) =>
                        setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })
                      }
                      className="rounded-xl border-border/50 bg-surface-2"
                      placeholder="e.g. INV-10294"
                      disabled={isSubmittingInvoice}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Due Date *</Label>
                    <Input
                      type="date"
                      value={invoiceForm?.dueDate || ""}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                      className="rounded-xl border-border/50 bg-surface-2"
                      disabled={isSubmittingInvoice}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Vendor</Label>
                    <Input
                      value={invoiceForm?.vendorName || ""}
                      className="rounded-xl border-border/50 bg-surface-2 opacity-70"
                      disabled
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Delivery Branch</Label>
                    <Input
                      value={invoiceForm?.branchName || ""}
                      className="rounded-xl border-border/50 bg-surface-2 opacity-70"
                      disabled
                    />
                  </div>
                </div>

                <div className="border border-border rounded-xl overflow-hidden mt-4">
                  <Table>
                    <TableHeader className="bg-surface-2">
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Received Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(invoiceForm?.items || []).map((item: any) => (
                        <TableRow key={item.productId}>
                          <TableCell
                            className="font-semibold text-ink max-w-[200px] truncate"
                            title={item.name}
                          >
                            {item.name}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {item.receivedQty} pcs
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {aed(item.unitPrice)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-semibold">
                            {aed(item.subtotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="mt-4 space-y-1.5 text-right font-semibold text-sm">
                  <div>Subtotal: {aed(invoiceForm?.subtotal || 0)}</div>
                  <div>
                    VAT ({invoiceForm?.vatRate}%{" "}
                    {invoiceForm?.vatInclusive ? "Included" : "Excluded"}):{" "}
                    {aed(invoiceForm?.vat || 0)}
                  </div>
                  <div className="text-lg font-bold text-ink">
                    Total: {aed(invoiceForm?.total || 0)}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setInvoiceModalOpen(false)}
                  disabled={isSubmittingInvoice}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-xl"
                  onClick={async () => {
                    if (!invoiceForm.invoiceNumber) {
                      toast.error("Invoice number/reference is required");
                      return;
                    }
                    if (!invoiceForm.dueDate) {
                      toast.error("Due date is required");
                      return;
                    }

                    setIsSubmittingInvoice(true);
                    try {
                      const res = await (createVendorInvoiceServerFn as any)({
                        data: {
                          purchaseOrderId: invoiceForm.purchaseOrderId,
                          invoiceNumber: invoiceForm.invoiceNumber,
                          dueDate: invoiceForm.dueDate,
                          total: invoiceForm.total,
                        },
                      });

                      if (res && res.success) {
                        toast.success("Vendor invoice recorded successfully!");
                        setInvoiceModalOpen(false);
                        router.invalidate();
                      } else {
                        toast.error("Failed to create vendor invoice");
                      }
                    } catch (err: any) {
                      toast.error(err.message || "An error occurred");
                    } finally {
                      setIsSubmittingInvoice(false);
                    }
                  }}
                  disabled={isSubmittingInvoice}
                >
                  {isSubmittingInvoice ? "Converting..." : "Convert to Invoice"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete PO Dialog */}
          <Dialog
            open={deletePoDialogOpen}
            onOpenChange={(open) => {
              if (!isDeletingPo) {
                setDeletePoDialogOpen(open);
                if (!open) setDeletePoContext(null);
              }
            }}
          >
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Delete Purchase Order</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove Purchase Order{" "}
                  <strong>{deletePoContext?.shortId}</strong> from{" "}
                  <strong>{deletePoContext?.vendor}</strong>? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setDeletePoDialogOpen(false)}
                  disabled={isDeletingPo}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="rounded-xl"
                  onClick={async () => {
                    setIsDeletingPo(true);
                    try {
                      const res = await deletePurchaseOrderServerFn({
                        data: { id: deletePoContext.id },
                      });
                      if (res && res.success) {
                        toast.success("Purchase Order deleted successfully");
                        setDeletePoDialogOpen(false);
                        setDeletePoContext(null);
                        router.invalidate();
                      } else {
                        toast.error("Failed to delete Purchase Order");
                      }
                    } catch (err: any) {
                      toast.error(err.message || "An error occurred");
                    } finally {
                      setIsDeletingPo(false);
                    }
                  }}
                  disabled={isDeletingPo}
                >
                  {isDeletingPo ? "Deleting..." : "Delete PO"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Edit PO Dialog */}
          <Dialog
            open={editPoOpen}
            onOpenChange={(open) => {
              if (!isSavingPo) setEditPoOpen(open);
            }}
          >
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
              <DialogHeader>
                <DialogTitle>Edit Purchase Order</DialogTitle>
                <DialogDescription>
                  Modify details and line items for the Purchase Order.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Vendor *</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-surface-2 px-3 py-2 text-sm rounded-xl border-border/50"
                      value={editPoForm?.vendorId || ""}
                      onChange={(e) => setEditPoForm({ ...editPoForm, vendorId: e.target.value })}
                      disabled={isSavingPo}
                    >
                      <option value="">Select Vendor...</option>
                      {mappedVendors.map((v: any) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Delivery Branch *</Label>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-surface-2 px-3 py-2 text-sm rounded-xl border-border/50"
                      value={editPoForm?.branchId || ""}
                      onChange={(e) => setEditPoForm({ ...editPoForm, branchId: e.target.value })}
                      disabled={isSavingPo}
                    >
                      <option value="">Select Branch...</option>
                      {mappedOutlets.map((b: any) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-bold">Line Items</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setEditPoForm({
                          ...editPoForm,
                          items: [
                            ...(editPoForm?.items || []),
                            { productId: "", qty: 1, unitPrice: 0 },
                          ],
                        })
                      }
                      disabled={isSavingPo}
                      className="rounded-lg h-8"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Item
                    </Button>
                  </div>

                  <div className="border border-border rounded-xl overflow-hidden">
                    <Table>
                      <TableHeader className="bg-surface-2">
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="w-24">Qty</TableHead>
                          <TableHead className="w-32">Unit Price (AED)</TableHead>
                          <TableHead className="w-28 text-right">Subtotal</TableHead>
                          <TableHead className="w-12 text-center"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(editPoForm?.items || []).map((item: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell className="p-2">
                              <select
                                className="flex h-9 w-full rounded-md border border-input bg-surface-2 px-2 py-1 text-xs rounded-lg border-border/50"
                                value={item.productId}
                                onChange={(e) => {
                                  const items = [...editPoForm.items];
                                  const selectedProd = mappedProducts.find(
                                    (p: any) => p.id === e.target.value,
                                  );
                                  items[idx].productId = e.target.value;
                                  if (selectedProd && items[idx].unitPrice === 0) {
                                    items[idx].unitPrice = Number(selectedProd.cost) || 0;
                                  }
                                  setEditPoForm({ ...editPoForm, items });
                                }}
                                disabled={isSavingPo}
                              >
                                <option value="">Select Product...</option>
                                {mappedProducts.map((prod: any) => (
                                  <option key={prod.id} value={prod.id}>
                                    {prod.name}
                                  </option>
                                ))}
                              </select>
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) => {
                                  const items = [...editPoForm.items];
                                  items[idx].qty = Number(e.target.value) || 0;
                                  setEditPoForm({ ...editPoForm, items });
                                }}
                                className="h-9 rounded-lg bg-surface-2 border-border/50 text-xs font-mono text-right"
                                disabled={isSavingPo}
                              />
                            </TableCell>
                            <TableCell className="p-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => {
                                  const items = [...editPoForm.items];
                                  items[idx].unitPrice = Number(e.target.value) || 0;
                                  setEditPoForm({ ...editPoForm, items });
                                }}
                                className="h-9 rounded-lg bg-surface-2 border-border/50 text-xs font-mono text-right"
                                disabled={isSavingPo}
                              />
                            </TableCell>
                            <TableCell className="p-2 text-right font-mono text-sm">
                              {aed(item.qty * item.unitPrice)}
                            </TableCell>
                            <TableCell className="p-2 text-center">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 border-border/50"
                                onClick={() => {
                                  const items = editPoForm.items.filter(
                                    (_: any, i: number) => i !== idx,
                                  );
                                  setEditPoForm({ ...editPoForm, items });
                                }}
                                disabled={isSavingPo}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!editPoForm?.items || editPoForm.items.length === 0) && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="text-center text-muted-foreground p-4 text-xs"
                            >
                              No items added. Click "Add Item" to start.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-end mt-4 text-lg font-bold text-ink">
                    Total:{" "}
                    {aed(
                      (editPoForm?.items || []).reduce(
                        (acc: number, item: any) => acc + item.qty * item.unitPrice,
                        0,
                      ),
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setEditPoOpen(false)}
                  disabled={isSavingPo}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-xl"
                  onClick={async () => {
                    if (!editPoForm.vendorId || !editPoForm.branchId) {
                      toast.error("Vendor and Branch are required");
                      return;
                    }

                    if (!editPoForm.items || editPoForm.items.length === 0) {
                      toast.error("Please add at least one line item");
                      return;
                    }

                    for (const item of editPoForm.items) {
                      if (!item.productId) {
                        toast.error("Please select a product for all items");
                        return;
                      }
                      if (item.qty <= 0) {
                        toast.error("Quantity must be greater than zero");
                        return;
                      }
                      if (item.unitPrice <= 0) {
                        toast.error("Unit price must be positive");
                        return;
                      }
                    }

                    setIsSavingPo(true);
                    try {
                      const res = await updatePurchaseOrderServerFn({
                        data: {
                          id: editPoForm.id,
                          vendorId: editPoForm.vendorId,
                          branchId: editPoForm.branchId,
                          items: editPoForm.items,
                        },
                      });
                      if (res && res.success) {
                        toast.success("Purchase Order updated successfully!");
                        setEditPoOpen(false);
                        router.invalidate();
                      } else {
                        toast.error("Failed to update PO");
                      }
                    } catch (err: any) {
                      toast.error(err.message || "An error occurred");
                    } finally {
                      setIsSavingPo(false);
                    }
                  }}
                  disabled={isSavingPo}
                >
                  {isSavingPo ? "Saving Changes..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Invoice Details Dialog */}
          <Dialog open={invoiceDetailModalOpen} onOpenChange={setInvoiceDetailModalOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full no-print">
              <DialogHeader>
                <DialogTitle>Vendor Invoice Details</DialogTitle>
                <DialogDescription>
                  View invoice summary, line items and billing details.
                </DialogDescription>
              </DialogHeader>

              {invoiceDetail && (
                <div className="space-y-6 py-4">
                  {/* Top Header Area */}
                  <div className="flex justify-between items-start border-b border-border pb-4">
                    <div>
                      <h4 className="text-lg font-bold text-ink">{invoiceDetail.tenantName}</h4>
                      {invoiceDetail.tenantTrn && (
                        <p className="text-xs text-muted-foreground">
                          TRN: {invoiceDetail.tenantTrn}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Branch: {invoiceDetail.branchName}
                      </p>
                    </div>
                    <div className="text-right">
                      <h4 className="text-sm font-bold text-ink">INVOICE</h4>
                      <p className="text-xs text-muted-foreground">
                        Reference: {invoiceDetail.invoiceNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Date: {invoiceDetail.createdAt ? invoiceDetail.createdAt.split("T")[0] : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Due Date: {invoiceDetail.dueDate ? invoiceDetail.dueDate.split("T")[0] : ""}
                      </p>
                    </div>
                  </div>

                  {/* Vendor / Reference Grid */}
                  <div className="grid grid-cols-2 gap-6 text-sm">
                    <div>
                      <h5 className="font-bold text-ink mb-1.5">Supplier Details:</h5>
                      <p className="font-semibold text-ink">{invoiceDetail.vendorName}</p>
                      {invoiceDetail.vendorTrn && (
                        <p className="text-xs text-muted-foreground">
                          TRN: {invoiceDetail.vendorTrn}
                        </p>
                      )}
                      {invoiceDetail.vendorContact && (
                        <p className="text-xs text-muted-foreground">
                          Contact: {invoiceDetail.vendorContact}
                        </p>
                      )}
                      {invoiceDetail.vendorPhone && (
                        <p className="text-xs text-muted-foreground">
                          Phone: {invoiceDetail.vendorPhone}
                        </p>
                      )}
                      {invoiceDetail.vendorEmail && (
                        <p className="text-xs text-muted-foreground">
                          Email: {invoiceDetail.vendorEmail}
                        </p>
                      )}
                      {invoiceDetail.vendorAddress && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-[250px]">
                          {invoiceDetail.vendorAddress}
                        </p>
                      )}
                    </div>
                    <div>
                      <h5 className="font-bold text-ink mb-1.5">References:</h5>
                      <p className="text-xs text-muted-foreground">
                        Purchase Order:{" "}
                        <strong className="font-mono text-ink">{invoiceDetail.poNumber}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        GRN:{" "}
                        <strong className="font-mono text-ink">{invoiceDetail.grnNumber}</strong>
                      </p>
                      <div className="mt-4">
                        <span className="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold border-success/20 bg-success/12 text-success capitalize">
                          {invoiceDetail.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items Table */}
                  <div className="border border-border rounded-xl overflow-hidden mt-4">
                    <Table>
                      <TableHeader className="bg-surface-2">
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Received Qty</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(invoiceDetail.items || []).map((item: any) => (
                          <TableRow key={item.productId}>
                            <TableCell
                              className="font-semibold text-ink max-w-[250px] truncate"
                              title={item.name}
                            >
                              {item.name}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {item.receivedQty} pcs
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {aed(item.unitPrice)}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-semibold">
                              {aed(item.subtotal)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Totals Area */}
                  <div className="space-y-1.5 text-right font-semibold text-sm border-t border-border pt-4">
                    <div>Subtotal: {aed(invoiceDetail.subtotal)}</div>
                    <div>
                      VAT ({invoiceDetail.vatRate}%{" "}
                      {invoiceDetail.vatInclusive ? "Included" : "Excluded"}):{" "}
                      {aed(invoiceDetail.vat)}
                    </div>
                    <div className="text-lg font-bold text-ink">
                      Total: {aed(invoiceDetail.total)}
                    </div>
                  </div>
                </div>
              )}

              <DialogFooter className="flex justify-between items-center gap-2 mt-4 border-t border-border pt-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => downloadInvoicePdf(invoiceDetail)}
                    disabled={isGeneratingPdf || !invoiceDetail}
                  >
                    {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={printInvoice}
                    disabled={!invoiceDetail}
                  >
                    Print Invoice
                  </Button>
                </div>
                <Button className="rounded-xl" onClick={() => setInvoiceDetailModalOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Printable Invoice Container (rendered offscreen, visible only in print mode) */}
          {invoiceDetail && (
            <div
              id="printable-invoice"
              className="hidden print:block font-sans bg-white text-black p-8"
            >
              <style>{`
                @media print {
                  body * {
                    visibility: hidden !important;
                  }
                  #printable-invoice, #printable-invoice * {
                    visibility: visible !important;
                  }
                  #printable-invoice {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 30px !important;
                    background: white !important;
                    color: black !important;
                  }
                }
              `}</style>
              <div className="flex justify-between items-start border-b-2 border-gray-300 pb-4">
                <div>
                  <h1 className="text-2xl font-bold">{invoiceDetail.tenantName}</h1>
                  {invoiceDetail.tenantTrn && (
                    <p className="text-sm text-gray-500">TRN: {invoiceDetail.tenantTrn}</p>
                  )}
                  <p className="text-sm text-gray-500">Branch: {invoiceDetail.branchName}</p>
                </div>
                <div className="text-right">
                  <h2 className="text-xl font-bold text-gray-800">VENDOR INVOICE</h2>
                  <p className="text-sm text-gray-500">Reference: {invoiceDetail.invoiceNumber}</p>
                  <p className="text-sm text-gray-500">
                    Date: {invoiceDetail.createdAt ? invoiceDetail.createdAt.split("T")[0] : ""}
                  </p>
                  <p className="text-sm text-gray-500">
                    Due Date: {invoiceDetail.dueDate ? invoiceDetail.dueDate.split("T")[0] : ""}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 my-8 text-sm">
                <div>
                  <h3 className="font-bold text-gray-700 mb-2">Supplier / Vendor:</h3>
                  <p className="font-semibold text-gray-900">{invoiceDetail.vendorName}</p>
                  {invoiceDetail.vendorTrn && (
                    <p className="text-gray-500">TRN: {invoiceDetail.vendorTrn}</p>
                  )}
                  {invoiceDetail.vendorContact && (
                    <p className="text-gray-500">Contact: {invoiceDetail.vendorContact}</p>
                  )}
                  {invoiceDetail.vendorPhone && (
                    <p className="text-gray-500">Phone: {invoiceDetail.vendorPhone}</p>
                  )}
                  {invoiceDetail.vendorEmail && (
                    <p className="text-gray-500">Email: {invoiceDetail.vendorEmail}</p>
                  )}
                  {invoiceDetail.vendorAddress && (
                    <p className="text-gray-500 mt-1">{invoiceDetail.vendorAddress}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-gray-700 mb-2">References:</h3>
                  <p className="text-gray-600">
                    Purchase Order Reference:{" "}
                    <span className="font-mono font-semibold">{invoiceDetail.poNumber}</span>
                  </p>
                  <p className="text-gray-600">
                    GRN Reference:{" "}
                    <span className="font-mono font-semibold">{invoiceDetail.grnNumber}</span>
                  </p>
                  <p className="text-gray-600 mt-2">
                    Status: <span className="font-semibold capitalize">{invoiceDetail.status}</span>
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse my-6 text-sm">
                <thead>
                  <tr className="border-b-2 border-gray-300 bg-gray-100">
                    <th className="py-2 px-3">Product Description</th>
                    <th className="py-2 px-3 text-right">Received Qty</th>
                    <th className="py-2 px-3 text-right">Unit Price</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoiceDetail.items || []).map((item: any) => (
                    <tr key={item.productId} className="border-b border-gray-200">
                      <td className="py-2 px-3 font-medium">{item.name}</td>
                      <td className="py-2 px-3 text-right font-mono">{item.receivedQty} pcs</td>
                      <td className="py-2 px-3 text-right font-mono">{aed(item.unitPrice)}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold">
                        {aed(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>

              <div className="flex justify-end mt-8">
                <div className="w-64 space-y-2 text-right text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="font-mono font-semibold">{aed(invoiceDetail.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">
                      VAT ({invoiceDetail.vatRate}%{" "}
                      {invoiceDetail.vatInclusive ? "Included" : "Excluded"}):
                    </span>
                    <span className="font-mono font-semibold">{aed(invoiceDetail.vat)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-2 text-base font-bold">
                    <span>Total Outstanding:</span>
                    <span className="font-mono text-gray-900">{aed(invoiceDetail.total)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <TabsContent value="audit_logs" className="mt-0 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-ink">System Audit Logs</h3>
                <p className="text-xs text-muted-foreground">
                  Track user operations and database state changes.
                </p>
              </div>
            </div>
            <div className="panel p-6 space-y-4">
              {isLoadingLogs ? (
                <div className="py-20 text-center text-muted-foreground">Loading audit logs...</div>
              ) : auditLogsData.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">No audit logs found.</div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table className="min-w-[800px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>User / Actor ID</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Entity Type</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogsData.slice((auditLogsPage - 1) * auditLogsPerPage, auditLogsPage * auditLogsPerPage).map((log: any) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-mono text-xs">
                              {new Date(log.createdAt).toLocaleString()}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{log.userId || "System"}</TableCell>
                            <TableCell className="capitalize font-semibold text-xs">
                              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                                log.action === "create" ? "bg-green-50 text-green-700 ring-green-600/20" :
                                log.action === "update" ? "bg-blue-50 text-blue-700 ring-blue-600/20" :
                                "bg-red-50 text-red-700 ring-red-600/20"
                              }`}>
                                {log.action}
                              </span>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{log.entityType}</TableCell>
                            <TableCell className="text-xs max-w-xs truncate" title={typeof log.details === "string" ? log.details : (log.details ? JSON.stringify(log.details) : "N/A")}>
                              {typeof log.details === "string" ? log.details : (log.details?.summary || (log.details ? Object.entries(log.details).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(" | ") : "N/A"))}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {auditLogsData.length > auditLogsPerPage && (
                    <div className="flex items-center justify-between border-t border-border/50 pt-4 px-2">
                      <p className="text-sm text-muted-foreground">
                        Showing {((auditLogsPage - 1) * auditLogsPerPage) + 1} to {Math.min(auditLogsPage * auditLogsPerPage, auditLogsData.length)} of {auditLogsData.length} logs
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          disabled={auditLogsPage === 1}
                          onClick={() => setAuditLogsPage(p => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-lg"
                          disabled={auditLogsPage >= Math.ceil(auditLogsData.length / auditLogsPerPage)}
                          onClick={() => setAuditLogsPage(p => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recipes" className="mt-0 space-y-5">
            <RecipesTabContent products={data?.products || []} />
          </TabsContent>

          <TabsContent value="subscription_billing" className="mt-0 space-y-5">
            <TenantSubscriptionBillingTab onSeen={() => setUnseenInvoicesCount(0)} />
          </TabsContent>

          <TabsContent value="expenses" className="mt-0 space-y-5">
            <HeadOfficeExpensesTab branches={mappedOutlets} />
          </TabsContent>

          <TabsContent value="support" className="mt-0 space-y-5">
            <TenantSupportTab
              isNewTicketModalOpen={isNewTicketModalOpen}
              setIsNewTicketModalOpen={setIsNewTicketModalOpen}
            />
          </TabsContent>
        </main>


        <Dialog open={addBatchOpen} onOpenChange={setAddBatchOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Manual Batch</DialogTitle>
              <DialogDescription>
                Create a new inventory batch manually (e.g. for stock correction).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Product</Label>
                <Select
                  value={addBatchForm.productId}
                  onValueChange={(val) => setAddBatchForm({ ...addBatchForm, productId: val })}
                >
                  <SelectTrigger className="rounded-xl border-border/50 bg-surface-2">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {mappedProducts.filter((p: any) => p.isBatchTracked).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Outlet / Branch</Label>
                <Select
                  value={addBatchForm.branchId}
                  onValueChange={(val) => setAddBatchForm({ ...addBatchForm, branchId: val })}
                >
                  <SelectTrigger className="rounded-xl border-border/50 bg-surface-2">
                    <SelectValue placeholder="Select outlet" />
                  </SelectTrigger>
                  <SelectContent>
                    {data?.branches?.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Batch Number</Label>
                  <Input
                    placeholder="e.g. BATCH-001"
                    value={addBatchForm.batchNumber}
                    onChange={(e) =>
                      setAddBatchForm({ ...addBatchForm, batchNumber: e.target.value })
                    }
                    className="rounded-xl border-border/50 bg-surface-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Initial Stock</Label>
                  <Input
                    type="number"
                    min="0"
                    value={addBatchForm.initialStock}
                    onChange={(e) =>
                      setAddBatchForm({ ...addBatchForm, initialStock: parseInt(e.target.value) || 0 })
                    }
                    className="rounded-xl border-border/50 bg-surface-2"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={addBatchForm.expiryDate}
                  onChange={(e) =>
                    setAddBatchForm({ ...addBatchForm, expiryDate: e.target.value })
                  }
                  className="rounded-xl border-border/50 bg-surface-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setAddBatchOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={isAddingBatch}
                className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground"
                onClick={async () => {
                  if (!addBatchForm.productId || !addBatchForm.branchId || !addBatchForm.batchNumber || !addBatchForm.expiryDate) {
                    toast.error("Please fill all required fields");
                    return;
                  }
                  setIsAddingBatch(true);
                  try {
                    const res = await createBatchServerFn({ data: addBatchForm });
                    if (res.success) {
                      toast.success("Batch added successfully");
                      setAddBatchOpen(false);
                      setAddBatchForm({ productId: "", branchId: "", batchNumber: "", expiryDate: "", initialStock: 0 });
                      router.invalidate();
                    } else {
                      toast.error((res as any).error || "Failed to add batch");
                    }
                  } catch (e: any) {
                    toast.error(e.message || "Failed to add batch");
                  } finally {
                    setIsAddingBatch(false);
                  }
                }}
              >
                {isAddingBatch ? "Adding..." : "Add Batch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </Tabs>
    </DemoShell>
  );
}



function RecipesTabContent({ products }: { products: any[] }) {
  const fetchRecipes = useServerFn(getProductRecipesServerFn);
  const saveRecipe = useServerFn(saveProductRecipeServerFn);
  const deleteRecipe = useServerFn(deleteProductRecipeServerFn);

  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [ingredientRows, setIngredientRows] = useState<
    Array<{ ingredientProductId: string; quantity: number | ""; unit: string }>
  >([{ ingredientProductId: "", quantity: 1, unit: "kg" }]);

  const loadRecipes = async () => {
    setLoading(true);
    try {
      const res = await fetchRecipes();
      if (res.success) {
        setRecipes(res.recipes);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecipes();
  }, []);

  const groupedRecipes = useMemo(() => {
    const map: Record<
      string,
      { productId: string; productName: string; ingredients: any[]; totalCost: number }
    > = {};
    recipes.forEach((r) => {
      if (!map[r.productId]) {
        map[r.productId] = {
          productId: r.productId,
          productName: r.productName,
          ingredients: [],
          totalCost: 0,
        };
      }
      const entry = map[r.productId]!;
      entry.ingredients.push(r);
      entry.totalCost += Number(r.totalCost) || 0;
    });
    return Object.values(map);
  }, [recipes]);

  const handleOpenAdd = () => {
    setSelectedProductId("");
    setIngredientRows([{ ingredientProductId: "", quantity: 1, unit: "kg" }]);
    setModalOpen(true);
  };

  const handleOpenEdit = (recipeGroup: any) => {
    setSelectedProductId(recipeGroup.productId);
    setIngredientRows(
      recipeGroup.ingredients.map((i: any) => ({
        ingredientProductId: i.ingredientProductId,
        quantity: Number(i.quantity) || 1,
        unit: i.unit || "kg",
      }))
    );
    setModalOpen(true);
  };

  const handleAddRow = () => {
    setIngredientRows((prev) => [...prev, { ingredientProductId: "", quantity: 1, unit: "kg" }]);
  };

  const handleRemoveRow = (index: number) => {
    setIngredientRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: string, value: any) => {
    setIngredientRows((prev) => {
      const updated = [...prev];
      if (updated[index]) {
        (updated[index] as any)[field] = value;
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!selectedProductId) {
      toast.error("Please select a sellable hot food product.");
      return;
    }

    const validRows = ingredientRows.filter(
      (r) => r.ingredientProductId && Number(r.quantity) > 0
    );

    if (validRows.length === 0) {
      toast.error("Please add at least one valid recipe ingredient.");
      return;
    }

    setSaving(true);
    try {
      const res: any = await saveRecipe({
        data: {
          productId: selectedProductId,
          ingredients: validRows.map((r) => ({
            ingredientProductId: r.ingredientProductId,
            quantity: Number(r.quantity),
            unit: r.unit || "kg",
          })),
        },
      });

      if (res.success) {
        toast.success(res.message || "Recipe saved successfully");
        setModalOpen(false);
        loadRecipes();
      } else {
        toast.error(res.message || "Failed to save recipe");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save recipe");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecipe = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this recipe?")) return;
    try {
      const res: any = await deleteRecipe({ data: { productId } });
      if (res.success) {
        toast.success("Recipe deleted successfully");
        loadRecipes();
      } else {
        toast.error(res.message || "Failed to delete recipe");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete recipe");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink">Product Recipes (BOM)</h2>
          <p className="text-xs text-muted-foreground">
            Map sellable hot food menu items to raw ingredient components for automated inventory deduction.
          </p>
        </div>
        <Button onClick={handleOpenAdd} className="font-medium gap-2">
          <Plus className="h-4 w-4" /> Create Product Recipe
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border bg-card flex items-center gap-4">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Hot Food Items with Recipes
            </p>
            <p className="text-2xl font-bold text-ink">{groupedRecipes.length}</p>
          </div>
        </div>
        <div className="p-4 rounded-xl border bg-card flex items-center gap-4">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-600">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Ingredients Mapped
            </p>
            <p className="text-2xl font-bold text-ink">{recipes.length}</p>
          </div>
        </div>
      </div>

      <div className="border rounded-xl bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading recipes...</div>
        ) : groupedRecipes.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No recipes configured yet. Click "Create Product Recipe" to map hot food menu items to ingredients.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium border-b">
                <tr>
                  <th className="px-4 py-3">Sellable Product</th>
                  <th className="px-4 py-3">Raw Ingredients (Recipe Breakdown)</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {groupedRecipes.map((g) => (
                  <tr key={g.productId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-semibold text-ink align-top">
                      {g.productName}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {g.ingredients.map((ing: any) => (
                          <Badge key={ing.id} variant="secondary" className="text-[11px] font-normal">
                            {ing.ingredientName}: {ing.quantity} {ing.unit}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right align-top space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(g)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRecipe(g.productId)}
                        className="h-8 w-8 p-0 text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-xl md:max-w-2xl w-[95vw] rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="font-bold text-ink">
              {selectedProductId ? "Edit Product Recipe" : "Create Product Recipe"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Map a hot food item to its raw ingredient components and quantities.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 min-w-0">
            <div className="space-y-1.5 min-w-0">
              <label className="text-xs font-semibold text-ink">Sellable Hot Food Product</label>
              <SearchableProductSelect
                products={products}
                value={selectedProductId}
                onSelect={setSelectedProductId}
                placeholder="Type or search sellable product..."
                disabled={saving}
                displaySubtext="category"
              />
            </div>

            <div className="space-y-2 min-w-0">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink">Recipe Ingredients</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRow}
                  className="h-7 text-xs rounded-lg shrink-0"
                >
                  <Plus className="mr-1 h-3 w-3" /> Add Ingredient
                </Button>
              </div>

              {ingredientRows.map((row, idx) => (
                <div key={idx} className="flex items-center gap-2 w-full min-w-0">
                  <div className="flex-1 min-w-0">
                    <SearchableProductSelect
                      products={products}
                      value={row.ingredientProductId}
                      onSelect={(val) => handleRowChange(idx, "ingredientProductId", val)}
                      placeholder="Type or search raw ingredient..."
                      disabled={saving}
                      excludeId={selectedProductId}
                      displaySubtext="unit"
                    />
                  </div>

                  <Input
                    type="number"
                    step="any"
                    min="0.001"
                    placeholder="Qty"
                    className="w-20 shrink-0 h-9 text-xs"
                    value={row.quantity}
                    onChange={(e) =>
                      handleRowChange(idx, "quantity", e.target.value ? Number(e.target.value) : "")
                    }
                  />

                  <div className="w-20 shrink-0">
                    <Select
                      value={row.unit}
                      onValueChange={(val) => handleRowChange(idx, "unit", val)}
                    >
                      <SelectTrigger className="w-full h-9 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">kg</SelectItem>
                        <SelectItem value="g">g</SelectItem>
                        <SelectItem value="pcs">pcs</SelectItem>
                        <SelectItem value="l">l</SelectItem>
                        <SelectItem value="ml">ml</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {ingredientRows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveRow(idx)}
                      className="h-8 w-8 p-0 shrink-0 text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="font-semibold">
              {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null} Save Recipe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

