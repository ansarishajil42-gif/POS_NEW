import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { jsPDF } from "jspdf";
import { useMemo, useState, useEffect } from "react";
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
import { CRMTab } from "@/components/crm/CRMTab";
import { PromotionsTab } from "@/components/promotions/PromotionsTab";
import { ReportsTab } from "@/components/reports/ReportsTab";
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
  getBlogPostsFn,
  createBlogPostFn,
  updateBlogPostFn,
  deleteBlogPostFn,
  uploadBlogCoverFn,
} from "@/lib/head-office-server";
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

  // Blog management states
  const [blogPostsList, setBlogPostsList] = useState<any[]>([]);
  const [isLoadingBlog, setIsLoadingBlog] = useState(false);
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [isSavingBlogPost, setIsSavingBlogPost] = useState(false);
  const [selectedBlogPost, setSelectedBlogPost] = useState<any | null>(null);
  const [blogForm, setBlogForm] = useState({
    title: "",
    slug: "",
    coverImageUrl: "",
    shortDescription: "",
    content: "",
    status: "Draft",
    authorName: "Admin",
  });
  const [deleteBlogContext, setDeleteBlogContext] = useState<any>(null);
  const [deleteBlogDialogOpen, setDeleteBlogDialogOpen] = useState(false);
  const [isDeletingBlogPost, setIsDeletingBlogPost] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds 5MB limit");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.");
      return;
    }

    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        try {
          const res = await uploadBlogCoverFn({
            data: {
              base64Data: base64,
              fileName: file.name,
              mimeType: file.type,
            },
          });
          if (res.success && res.url) {
            setBlogForm((prev) => ({ ...prev, coverImageUrl: res.url }));
            toast.success("Image uploaded successfully");
          } else {
            toast.error("Upload failed");
          }
        } catch (err: any) {
          toast.error(err.message || "Upload failed");
        } finally {
          setIsUploadingImage(false);
        }
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error(err.message || "Failed to process file");
      setIsUploadingImage(false);
    }
  };

  const fetchBlogPosts = () => {
    setIsLoadingBlog(true);
    getBlogPostsFn()
      .then((res: any) => {
        if (res.success) {
          setBlogPostsList(res.posts || []);
        } else {
          toast.error("Failed to load blog posts");
        }
      })
      .catch((err: any) => {
        toast.error(err.message || "Failed to load blog posts");
      })
      .finally(() => {
        setIsLoadingBlog(false);
      });
  };

  useEffect(() => {
    if (activeTab === "blog") {
      fetchBlogPosts();
    }
  }, [activeTab]);

  const handleSaveBlogPost = async () => {
    if (!blogForm.title || !blogForm.slug || !blogForm.shortDescription || !blogForm.content) {
      toast.error("Please fill in all required fields (Title, Slug, Short Description, and Content)");
      return;
    }

    setIsSavingBlogPost(true);
    try {
      if (selectedBlogPost) {
        // Edit mode
        const res = await updateBlogPostFn({
          data: {
            id: selectedBlogPost.id,
            ...blogForm,
          },
        });
        if (res.success) {
          toast.success("Blog post updated successfully");
          setIsBlogModalOpen(false);
          fetchBlogPosts();
        }
      } else {
        // Create mode
        const res = await createBlogPostFn({
          data: blogForm,
        });
        if (res.success) {
          toast.success("Blog post created successfully");
          setIsBlogModalOpen(false);
          fetchBlogPosts();
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save blog post");
    } finally {
      setIsSavingBlogPost(false);
    }
  };

  const handleDeleteBlogPost = async () => {
    if (!deleteBlogContext) return;
    setIsDeletingBlogPost(true);
    try {
      const res = await deleteBlogPostFn({
        data: { id: deleteBlogContext.id },
      });
      if (res.success) {
        toast.success("Blog post deleted successfully");
        setDeleteBlogDialogOpen(false);
        setDeleteBlogContext(null);
        fetchBlogPosts();
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to delete blog post");
    } finally {
      setIsDeletingBlogPost(false);
    }
  };

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
        <Button
          className="rounded-xl font-semibold"
          onClick={() => toast.success("Daily brief exported")}
        >
          <Download className="mr-1.5 h-4 w-4" /> Export daily brief
        </Button>
      }
    >
      <Tabs 
        value={activeTab} 
        onValueChange={(val) => {
          setActiveTab(val);
          setIsMobileMenuOpen(false);
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
              value="blog"
              className="justify-start px-4 py-2.5 text-sm font-semibold data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"
            >
              Blog
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 max-w-2xl">
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
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleFetchCatalog(1, catalogSearch)}
                  disabled={isCatalogLoading}
                  className="rounded-xl h-10 px-4 text-xs font-semibold"
                >
                  {isCatalogLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                  ) : (
                    <Search className="h-4 w-4 mr-1.5" />
                  )}
                  Search
                </Button>

                <Button
                  onClick={() => {
                    setProductForm({
                      name: "",
                      barcode: "",
                      category: "",
                      unit: "",
                      costPrice: "",
                      salePrice: "",
                      isBatchTracked: false,
                    });
                    setIsEditingProduct(false);
                    setProductFormOpen(true);
                  }}
                  className="rounded-xl h-10 px-4 font-semibold shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> Add Product
                </Button>
              </div>
            </div>

            {/* Catalog Table Container */}
            <div className="rounded-2xl border border-border/50 bg-surface/50 shadow-sm backdrop-blur-xl overflow-hidden">
              <div className="relative w-full overflow-x-auto">
                <table className="w-full caption-bottom text-sm min-w-[780px]">
                  <thead className="bg-surface-2/90 [&_tr]:border-b-0">
                    <tr className="border-b border-border/50">
                      <th className="h-11 px-3 py-3 text-left align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        SKU
                      </th>
                      <th className="h-11 px-3 py-3 text-left align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground min-w-[160px]">
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
                      <th className="h-11 px-2.5 py-3 text-right align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Stock
                      </th>
                      <th className="h-11 px-4 py-3 text-center align-middle text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap sticky right-0 bg-surface-2/95 backdrop-blur-md shadow-[-4px_0_12px_rgba(0,0,0,0.06)] min-w-[120px] z-10">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {mappedProducts.map((p: any) => (
                      <tr
                        key={p.id}
                        className="group border-b border-border/50 transition-all duration-200 hover:bg-primary/[0.03]"
                      >
                        <td className="px-3 py-3 align-middle font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {p.sku}
                        </td>
                        <td className="px-3 py-3 align-middle font-semibold text-ink">
                          {p.name}
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
                        <td className="px-2.5 py-3 align-middle text-right tabular-nums font-medium whitespace-nowrap">
                          {p.stock}
                        </td>
                        <td className="px-4 py-3 align-middle text-center whitespace-nowrap sticky right-0 bg-surface/95 backdrop-blur-md group-hover:bg-surface shadow-[-4px_0_12px_rgba(0,0,0,0.06)] z-10">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 rounded-lg"
                              onClick={() => {
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
                              }}
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
                          colSpan={9}
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

              {/* Clean Pagination Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3.5 border-t border-border/50 bg-surface-2/40 text-xs text-muted-foreground">
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
                        toast.success(isEditingProduct ? "Product updated" : "Product created");
                        setProductFormOpen(false);
                        router.invalidate();
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
                    purchases, GRNs, batches or stock, removal will be blocked.
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
                          <Select
                            onValueChange={(v) => {
                              const n = [...poItems];
                              n[idx].productId = v;
                              setPoItems(n);
                            }}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Product" />
                            </SelectTrigger>
                            <SelectContent>
                              {mappedProducts.map((p: any) => (
                                <SelectItem key={p.id} value={p.id}>
                                  {p.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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
                      const res = await createVendorInvoiceServerFn({
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

          <TabsContent value="blog" className="mt-0 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-ink">Blog Management</h3>
                <p className="text-xs text-muted-foreground">
                  Create, edit, and publish posts to the public visitor blog.
                </p>
              </div>
              <Button
                className="rounded-xl"
                onClick={() => {
                  setSelectedBlogPost(null);
                  setBlogForm({
                    title: "",
                    slug: "",
                    coverImageUrl: "",
                    shortDescription: "",
                    content: "",
                    status: "Draft",
                    authorName: "Admin",
                  });
                  setIsBlogModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" /> Create Blog Post
              </Button>
            </div>

            <div className="panel p-6 space-y-4">
              {isLoadingBlog ? (
                <div className="py-20 text-center text-muted-foreground">Loading blog posts...</div>
              ) : blogPostsList.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">No blog posts found. Click "Create Blog Post" to add one.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cover</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Slug</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blogPostsList.map((post) => (
                        <TableRow key={post.id}>
                          <TableCell>
                            {post.coverImageUrl ? (
                              <img
                                src={post.coverImageUrl}
                                alt={post.title}
                                className="h-10 w-16 object-cover rounded border border-border"
                              />
                            ) : (
                              <div className="h-10 w-16 bg-surface-2 border border-border rounded flex items-center justify-center text-xs text-muted-foreground">
                                No Image
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold text-ink max-w-xs truncate">
                            {post.title}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {post.slug}
                          </TableCell>
                          <TableCell className="text-sm">{post.authorName}</TableCell>
                          <TableCell>
                            <Badge
                              variant={post.status === "Published" ? "default" : "outline"}
                              className={post.status === "Published" ? "bg-green-100 text-green-800 border-green-200" : "bg-gray-100 text-gray-800"}
                            >
                              {post.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 rounded-lg"
                                onClick={() => {
                                  setSelectedBlogPost(post);
                                  setBlogForm({
                                    title: post.title,
                                    slug: post.slug,
                                    coverImageUrl: post.coverImageUrl || "",
                                    shortDescription: post.shortDescription,
                                    content: post.content,
                                    status: post.status,
                                    authorName: post.authorName,
                                  });
                                  setIsBlogModalOpen(true);
                                }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  setDeleteBlogContext(post);
                                  setDeleteBlogDialogOpen(true);
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            {/* Create/Edit Blog Post Dialog */}
            <Dialog open={isBlogModalOpen} onOpenChange={setIsBlogModalOpen}>
              <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{selectedBlogPost ? "Edit Blog Post" : "Create Blog Post"}</DialogTitle>
                  <DialogDescription>
                    Fill in the details below to save the blog post. Required fields are marked.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Title <span className="text-destructive">*</span></Label>
                      <Input
                        placeholder="e.g. 5 POS Features to Grow Sales"
                        value={blogForm.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setBlogForm((prev) => ({
                            ...prev,
                            title: val,
                            slug: selectedBlogPost
                              ? prev.slug
                              : val
                                  .toLowerCase()
                                  .replace(/[^a-z0-9]+/g, "-")
                                  .replace(/(^-|-$)+/g, ""),
                          }));
                        }}
                        className="rounded-xl border-border/50 bg-surface-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Slug <span className="text-destructive">*</span></Label>
                      <Input
                        placeholder="e.g. 5-pos-features-to-grow-sales"
                        value={blogForm.slug}
                        onChange={(e) =>
                          setBlogForm({
                            ...blogForm,
                            slug: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]+/g, ""),
                          })
                        }
                        className="rounded-xl border-border/50 bg-surface-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Author Name</Label>
                      <Input
                        placeholder="Admin"
                        value={blogForm.authorName}
                        onChange={(e) => setBlogForm({ ...blogForm, authorName: e.target.value })}
                        className="rounded-xl border-border/50 bg-surface-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Publish Status</Label>
                      <Select
                        value={blogForm.status}
                        onValueChange={(val) => setBlogForm({ ...blogForm, status: val })}
                      >
                        <SelectTrigger className="rounded-xl border-border/50 bg-surface-2">
                          <SelectValue placeholder="Draft" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Draft">Draft</SelectItem>
                          <SelectItem value="Published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Cover Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://example.com/cover.jpg"
                        value={blogForm.coverImageUrl}
                        onChange={(e) => setBlogForm({ ...blogForm, coverImageUrl: e.target.value })}
                        className="rounded-xl border-border/50 bg-surface-2 flex-1"
                      />
                      <div className="relative shrink-0">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleUploadImage}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          disabled={isUploadingImage}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl pointer-events-none"
                          disabled={isUploadingImage}
                        >
                          {isUploadingImage ? "Uploading..." : "Upload Image"}
                        </Button>
                      </div>
                    </div>
                    {blogForm.coverImageUrl && (
                      <div className="mt-2 border border-border rounded-xl p-2 bg-surface-2 flex justify-center">
                        <img
                          src={blogForm.coverImageUrl}
                          alt="Cover Preview"
                          className="h-28 object-contain rounded"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Short Description <span className="text-destructive">*</span></Label>
                    <textarea
                      placeholder="A short teaser summary of the post..."
                      value={blogForm.shortDescription}
                      onChange={(e) => setBlogForm({ ...blogForm, shortDescription: e.target.value })}
                      className="w-full min-h-[60px] rounded-xl border border-border/50 bg-surface-2 p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Full Content (Markdown / HTML / Text) <span className="text-destructive">*</span></Label>
                    <textarea
                      placeholder="Write your main article content here..."
                      value={blogForm.content}
                      onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })}
                      className="w-full min-h-[180px] rounded-xl border border-border/50 bg-surface-2 p-3 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => setIsBlogModalOpen(false)}
                    disabled={isSavingBlogPost}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="rounded-xl"
                    onClick={handleSaveBlogPost}
                    disabled={isSavingBlogPost}
                  >
                    {isSavingBlogPost ? "Saving..." : "Save Post"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteBlogDialogOpen} onOpenChange={setDeleteBlogDialogOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Delete Blog Post</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this post?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-4 gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => {
                      setDeleteBlogDialogOpen(false);
                      setDeleteBlogContext(null);
                    }}
                    disabled={isDeletingBlogPost}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={handleDeleteBlogPost}
                    disabled={isDeletingBlogPost}
                  >
                    {isDeletingBlogPost ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

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
