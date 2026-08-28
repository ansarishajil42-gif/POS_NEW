import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { L as redirect, _ as Link, f as createRouter, g as createRootRouteWithContext, h as createFileRoute, l as Scripts, m as lazyRouteComponent, p as Outlet, u as HeadContent, y as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as __exportAll, r as createServerFn } from "./server-DrMPL4gN.mjs";
import { r as getSessionServerFn, t as createSsrRpc } from "./auth-server-Cm_FskrZ.mjs";
import { t as roleRoutes } from "./auth-CyKkELZ_.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { n as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/purchasing-server-BsTFLG0S.js
var getPurchasingDataServerFn = createServerFn({ method: "GET" }).handler(createSsrRpc("e120523c02615bc4f341f67ba9e18dec26dd92687884ed3ae320da9ee1941f8f"));
var createVendorServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("5b4d5a14987c0106e76b2bdd4f8b245acb8f304e86ea09c8f3c140a7f83c9c7b"));
var updateVendorServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("b2d816eebf0d34a3ac413eb5fa41d94f384d0a8ee482d3e9accd6b60d89c46a8"));
var deleteVendorServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("62ed1df55aafe4a8f518aa3b2f4e8930018985684abb3b7c439b34f1524a28e1"));
var getPODetailsServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("6a39cf59f744b150d1d658cb6b77b0cc3650f886dfb79dc03183f85cc5e8fe16"));
var createPurchaseOrderServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("95303c8038f5610552eea41be398535c5dc8febc260bd8a8377decf47b8d1923"));
var updatePurchaseOrderServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("93cf371881cc56207bbe0c0275546ca3ef8953f6f9ae840aa42b17fd56536c01"));
var submitPurchaseOrderServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("d615411c3d5a9ef74666848e73d205a7cb04b91d64afb3070031881bcfc00f88"));
createServerFn({ method: "POST" }).validator((z) => z.object({
	id: z.string(),
	items: z.array(z.object({
		productId: z.string(),
		orderedQty: z.number(),
		receivedQty: z.number(),
		batchNumber: z.string().optional(),
		expiryDate: z.string().optional()
	}))
})).handler(createSsrRpc("fc889586ff6cf0e2d6080203a6f2eaa7b45cd79150c680013a03d13307180c69"));
createServerFn({ method: "POST" }).validator((z) => z.object({
	id: z.string(),
	invoiceNumber: z.string(),
	dueDate: z.string()
})).handler(createSsrRpc("5308bb7b6fb36b20456b2c65f935548518a244127fe0ea669e5b61b049e98eac"));
var deletePurchaseOrderServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("2a58828528113bce82b47c6da6108ec4296e0e13ce79a5ee5b8ba0bb4f30549e"));
var recordGRNServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("2dba67889cc55906e80d66373d61f5cbd1becf7ab79a1d03c8e4ca40e68f6aef"));
var getGrnDetailsServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("1b9181e1a481dd46084adccac897170de72f3ffd263bfdd278c543f3e94f02c4"));
var createVendorInvoiceServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("8ee79462c1f3e4f7807c3d919a93addecb5b4cf2b7b1c59de2e40030a86db93c"));
var getInvoiceDetailsServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("c0f19bd559164d2f1d870de125d03268019e202b8c5fee7f1f770c47f0a7e6b5"));
var recordVendorPaymentServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("ede17655b6f97502ed1aa9c1a6e38a58c35b5bdf54d1bade37de2f17b1ff7484"));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/super-admin-server-CiSlsWH-.js
var getTenantsServerFn = createServerFn({ method: "GET" }).handler(createSsrRpc("9522f7bccab5fa9333fef4e1199cd6c73a5c45c013bd6ba2154f9f7a3478acd4"));
var getBranchesServerFn = createServerFn({ method: "GET" }).handler(createSsrRpc("54139ac1bb2be9b228b95564a8fe70cad5ac0c0cfc8ea8db0acf996bb7fd7dfd"));
var createTenantServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("c754b5b78a97d70604ce3dd3e384708f53a1861ab9072f068510848d7ebdd984"));
createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("d7afc7da950abdf61e5c0c6fdadde9072f2043bc8f7ce87b33315226ac43e04d"));
createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("e5f02fee1cef37e4a76e87fc45a66c7e37bee5281bf8de9824a513099154490f"));
var getTenantAdminServerFn = createServerFn({ method: "GET" }).validator((d) => d).handler(createSsrRpc("b815b0324041683fbb31d3b5ab80a567ca6ed5fb722cff3f0411bc30b10a8132"));
var createExistingTenantAdminServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("2390f131557d4921280070ebd95745204ef4ccae4cc961145d686dd07e4ebf64"));
var updateTenantAdminServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("5601be9ec7ee6a4cd5e7b6361afb73f53148b7e2b171ebb06e16fce50f56ad26"));
var deleteTenantAdminServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("8fc1a068d55fb34d6b611598c59b7ecb11549de4b89cd9ed3d0c0681a6946961"));
var updateTenantStatusServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("48ab3e1eacef1d7c325b51d845c1c2ca0b74a37613084918c9a1e30b1e333bc1"));
var upgradeTenantPlanServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("6e5734d7bb5f58fb3295e9adfdb0ed6bb672035cdc11178a0f8ae15e2c90ab45"));
var downgradeTenantPlanServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("57e30a304a2c4af19ecabff8caaea4b078ac3674254750d0ec609dc9673e133e"));
var createBranchServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("3295c6d9291d9c91de7070c4871c4a237f2fceded930b0651e084b402209bd52"));
var deleteBranchServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("0317e46065ca576da3e89673627b6ed6af87b47645574e7ab1fd30e7b19ab2bd"));
var getGlobalTaxSettingsServerFn = createServerFn({ method: "GET" }).handler(createSsrRpc("a19d852e56e44a38c612b7e76d9353821b8e43054e3abc983ca146a79039d9d0"));
createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("b58ba46594c47cbd25becf29e195ac98c5000012b53edc2de959154e4dfb6085"));
var getPlatformSettingsServerFn = createServerFn({ method: "GET" }).handler(createSsrRpc("6f097eb36cb32ac740228776bdaf5aab121acce485a3ff1cfd58c1d5c18a2a87"));
var updatePlatformSettingsServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("36e6298a0e61ca583dd1093f42a22721cf0043221c303325c906017c5eac745f"));
var getAuditLogsServerFn = createServerFn({ method: "GET" }).validator((d) => d).handler(createSsrRpc("ead49babc576b141758d2e40557fb6db75f7b8edf00ed7568ae9f8b397db97da"));
var getAnalyticsServerFn = createServerFn({ method: "GET" }).validator((d) => d).handler(createSsrRpc("51694eb31157e15791cd2586b60b1b883cc605060a823f885689fc75e56b2ed1"));
var archiveTenantServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("191598a72a4c54ff48c315e9f096024a984ca4948d781b131ab5d6b4e6478378"));
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/router-Ba-c9wR4.js
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-BwtDhUUi.css";
var Toaster$1 = ({ ...props }) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
		className: "toaster group",
		toastOptions: { classNames: {
			toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
			description: "group-[.toast]:text-muted-foreground",
			actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
			cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
		} },
		...props
	});
};
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-7xl font-bold text-foreground",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "mt-4 text-xl font-semibold text-foreground",
					children: "Page not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "The page you're looking for doesn't exist or has been moved."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Go home"
					})
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	console.error(error);
	const router = useRouter();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-md text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight text-foreground",
					children: "This page didn't load"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Something went wrong on our end. You can try refreshing or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
						children: "Go home"
					})]
				})
			]
		})
	});
}
var Route$11 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "cloudynationpos — White-Label Multi-Tenant POS Platform" },
			{
				name: "description",
				content: "cloudynationpos is a white-label, multi-tenant POS platform for UAE supermarket chains: offline-first tills, VAT compliance and aggregator sync."
			},
			{
				name: "author",
				content: "cloudynationpos"
			},
			{
				property: "og:title",
				content: "cloudynationpos — White-Label Multi-Tenant POS Platform"
			},
			{
				property: "og:description",
				content: "One platform for every branch, till and delivery aggregator in the UAE."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		suppressHydrationWarning: true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			suppressHydrationWarning: true,
			children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})]
		})]
	});
}
function RootComponent() {
	const { queryClient } = Route$11.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(QueryClientProvider, {
		client: queryClient,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster$1, {
			position: "top-right",
			richColors: true
		})]
	});
}
var $$splitComponentImporter$10 = () => import("./routes-BeR0pCQp.mjs");
var Route$10 = createFileRoute("/")({
	head: () => ({ meta: [
		{ title: "cloudynationpos — Run Every Supermarket Branch From One Platform" },
		{
			name: "description",
			content: "White-label multi-tenant POS for UAE supermarket chains: offline-first tills, head office control, automated 5% VAT compliance and Talabat, Careem, InstaShop & Deliveroo sync."
		},
		{
			property: "og:title",
			content: "cloudynationpos — Multi-Tenant POS for UAE Retail"
		},
		{
			property: "og:description",
			content: "One platform for every branch, till and delivery aggregator. Offline-first, VAT compliant, enterprise secure."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$10, "component")
});
var $$splitComponentImporter$9 = () => import("./aggregators-BTNoR-2_.mjs");
var Route$9 = createFileRoute("/aggregators")({
	beforeLoad: async () => {
		const res = await getSessionServerFn();
		if (!res.success || !res.session) throw redirect({ to: "/login" });
		const role = res.session.role;
		if (![
			"Head Office Admin",
			"Branch Manager",
			"Inventory Manager",
			"Purchasing Officer"
		].includes(role)) throw redirect({ to: roleRoutes[role] });
	},
	head: () => ({ meta: [
		{ title: "Aggregator Sync Engine Demo — cloudynationpos" },
		{
			name: "description",
			content: "Interactive demo of the cloudynationpos aggregator sync engine: unified Talabat, Careem, InstaShop and Deliveroo order queue, stock auto-sync and one-click menu publishing."
		},
		{
			property: "og:title",
			content: "cloudynationpos Aggregator Sync Engine Demo"
		},
		{
			property: "og:description",
			content: "Unified delivery orders, live stock sync and a per-branch API vault."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
var createBranchForTenantFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("c100981fd3f11b2714ebfb7af80533fbed77d4cc5dae99f38a65fe6b358f3933"));
var updateBranchFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("5102fdb437acc42f7e2c69a7cb419d5157a0dc1db9b82838c28da958be5be859"));
var activateBranchFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("9a8de0e4319294f944f96fdc3ea65a25c82fc806c6cb4f907cd6c8ee5e402eef"));
var deactivateBranchFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("2995f8504bbd86a1c1d7ea79c1dce8d10e7c925487976ae0bfba9bfe703f26d1"));
createServerFn({ method: "GET" }).validator((d) => d).handler(createSsrRpc("433dfcf06cb21fdc9e40beb9b59e1cad4d8ebc2dcbd442f47964ba66d7ae700f"));
var getHeadOfficeDataFn = createServerFn({ method: "GET" }).handler(createSsrRpc("4f65a076d746579199c79d55a95938939a440421e9d6646e89b72b45dbbe17d0"));
var updateStockFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("dbbaf1dd65b92754d21182cad8f9236fd94a75309980cd25df33f60e6774bdd3"));
var updatePriceOverrideFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("56aa1c081d06333b6d2d05cd416dece608e9bd36f56b29858b1834f66cabecbe"));
var handleOverrideRequestFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("308754141f310ba8eef9422559ccbbdc5013a4c6b1daf568e45f374b4f7250f0"));
var applyClearanceFn$1 = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("42914dc70ed3fcf9c5670f8173281213c1d64f2faeedabb3c81324634abefa93"));
var updateVatSettingsFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("44533c085dcf480b227e06b225cdf217ded5dd92ceb09caa4f24915c18b11f40"));
createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("550a22a2c30d9985a61b73a6bfac7836aa86a7bb823f13d9a1588ba2a0733b6f"));
var updateLoyaltySettingsFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("833152d6b48924f8871519016755abbfa8d4570adefa749ce2a06eceb3117ee2"));
createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("8811d87a1c6bf8b33342d0224ea930b76d0f668bdb107c011cf05ac7be034ddd"));
var createProductFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("dbe2826a61c72c4cf10f804dff09108b3b8ab2dc337ecccdd2983b594af1b615"));
var updateProductFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("52b1df60eeec8ed07c7f1aaa1906dd98ed61771650e3878a20e2a3a9c4433124"));
var deleteProductFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("61c6c3e8ad3879451ca63b4fc74a5054a8973715d6319777b0d260c15e1c8d69"));
createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("148f04b685a0de39f475633eff2061ce8efff7d719d50f8128673688f011d1c4"));
var createBatchServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("69e5420b0eafa3013ceff924f8b9d9095813161598aa78747f1ae02ca3b02d41"));
var createStaffFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("6d82ba81e88ead89227e88652a9f4b9d3dc7718fba784eed64f909e614b30568"));
var updateStaffFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("dbd77c1b566c8ceec9d348ad1b1464558158cc1da046363dea5544a727dd5aa3"));
var createVendorFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("80e4f4986219a594e2deba3e2e3af18e64bebcf89c479af092bcc934b96ec917"));
var updateVendorFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("6f3ba453e2be38e2b2273628f3a6ec66adf5da91e6d21a0bbfe8b4893d16d7e1"));
var deleteVendorFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("82753d3c0f594b1ab233184fcdb9f48939fa9c7b6a6ffdffcf1397a9449e8e82"));
var toggleRolePermissionFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("265af7d954b59d91ec996643477017319d9f2ca40061ed5e57c336858bdec13a"));
var createCustomerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("b3b7397ea45e8985ea7ffb8aa045e06ef7942bdbdbc24f2a58027c26ced8046b"));
var updateCustomerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("c30e0879dc94cbb39be21780a575970f1d24d2dd2488af086813101e511a26a5"));
var getCustomerDetailsFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("520eee03467fb16a8bf28cf6f4336b5e5f6c88e860d7e5729695cac0a4c31436"));
var searchCustomersFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("536effb5f3e56056d5fb91bf73a954f100f33431369012f46cc89978fca39595"));
var getCustomerPurchaseHistoryFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("dbd858d2dbf8a702dc8692a0310ce8f9be413a4c32d7cedc0b904f9d85cad51d"));
createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("61d51b4941028cc136b336978a000bbd254c58ef4cb90845c707cc810104ac7b"));
createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("90fafe76535d7d78a32744dcf0c33ad1d24d3aed94f58e73ebc2ba70e0986efa"));
var adjustCustomerPointsFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("a9267c3ddd609da201e71d51e26fe5a9745d63fb7afaad4d36d624958109392a"));
var adjustCustomerBalanceFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("013be2b752e9ef99156ea584262b92507a5ccac64bd84d1663d10e22d3a4e238"));
var createPromotionFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("6620324ec86f59a7b0a47c8e0b6132064767a156d30f1db39f040aab72c2e023"));
var updatePromotionFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("70dbd634f8a670b136d7fbdf9fad0afdf6032c34ae99ea194deef833983f2622"));
createServerFn({ method: "GET" }).validator((d) => d).handler(createSsrRpc("553a08fa248132828e6e93564044a5f5175e4e1431b3178ec80cd9c2bc5dbead"));
var listPromotionsFn = createServerFn({ method: "GET" }).handler(createSsrRpc("fb2a91af61f992a4cc97117d4d214b127d87e7b1bb8ff330275efd200db93be2"));
var activatePromotionFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("4dbf1bf9ecce1e8b154c3bba73dda2398de94948488bde31a72b51ecd9b2f5bd"));
var deactivatePromotionFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("d81218fee0f3c248bd25cba6566a46e66937a30b43e8f5c49bf6510e1a78a754"));
var archivePromotionFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("8a9393b718da3717be67bcbd8a4b58fd88e36bb491a9d19cf8a9cab9f28a7b6b"));
createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("6ac19b5d163ae7ee3ddcb420776481e2657534e9030d4574bc06e7fa55dad7a8"));
var $$splitComponentImporter$8 = () => import("./head-office-CJfXMZxg.mjs");
var Route$8 = createFileRoute("/head-office")({
	beforeLoad: async () => {
		const res = await getSessionServerFn();
		if (!res.success || !res.session) throw redirect({ to: "/login" });
		const role = res.session.role;
		if (role !== "Head Office Admin") throw redirect({ to: roleRoutes[role] });
	},
	loader: async () => {
		const data = await getHeadOfficeDataFn();
		return data.success ? data : null;
	},
	head: () => ({ meta: [
		{ title: "Head Office Dashboard Demo — cloudynationpos" },
		{
			name: "description",
			content: "Interactive head office demo: multi-outlet performance, central catalog, FIFO/FEFO expiry alerts, PO→GRN→Invoice pipeline, RBAC, VAT invoices and loyalty CRM."
		},
		{
			property: "og:title",
			content: "cloudynationpos Head Office Dashboard Demo"
		},
		{
			property: "og:description",
			content: "Run every branch, catalog and purchase order from one screen."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
var getInventoryDataServerFn = createServerFn({ method: "GET" }).handler(createSsrRpc("8b297686b7e2fe356e3c6110f7b1a3df8dd133899e2817930dae89e616f8f6af"));
var stockTransferServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("1e07366c04d5681558e747d576297797712ae573c4a19e220e82ff629af664ef"));
var draftPurchaseOrderServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("05fb876ebc68d1013b55b9ff627c81ac5c1c92a9cd28e6f79a7d8dd2e2c6e08e"));
createServerFn({ method: "POST" }).validator((z) => z.object({
	productId: z.string(),
	discountPct: z.number()
})).handler(createSsrRpc("d0164f436c2117fd47da755869698b63012c2282ef673df5f175b5c3b9c69dc1"));
createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("270a84e37623743570d34749e1646581ea7cc9fb9db1af5ff7742d2708a68c2a"));
var getInventoryLedgerFn = createServerFn({ method: "GET" }).handler(createSsrRpc("1d286daf14004ee63e13a358a09107f060063302bf5963754a649bc5dc12fc43"));
var $$splitErrorComponentImporter = () => import("./inventory-manager-MNJTzNGV.mjs");
var $$splitComponentImporter$7 = () => import("./inventory-manager-D-wqEfxT.mjs");
var Route$7 = createFileRoute("/inventory-manager")({
	beforeLoad: async () => {
		const res = await getSessionServerFn();
		if (!res.success || !res.session) throw redirect({ to: "/login" });
		const role = res.session.role;
		if (role !== "Inventory Manager") throw redirect({ to: roleRoutes[role] });
	},
	loader: async () => {
		return await getInventoryDataServerFn();
	},
	component: lazyRouteComponent($$splitComponentImporter$7, "component"),
	errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent")
});
var $$splitComponentImporter$6 = () => import("./login-Vona9iGK.mjs");
var Route$6 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$6, "component") });
var getPosCatalogServerFn = createServerFn({ method: "GET" }).handler(createSsrRpc("b116881fb6043bfe519e458a2d633897c4dc063e4925ae6afdb22f3f931c17f6"));
var openShiftServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("768e9878293484dded9c758e9b59a11433e70d1fa2edb65fc04d359e1aa6b8ae"));
var getActiveShiftServerFn = createServerFn({ method: "GET" }).handler(createSsrRpc("d833dce8ec6dc143159fa6b681e5d210d665817a0da0d6d9d4420d8f133208d0"));
var recordCashDropServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("2fcc2769efee5348114caab28acbd73be38f33b93d196b6b840569bdad5528e1"));
var closeShiftServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("f912af60c6d6833b47b26a5e5f7262fb18a1906ca0f045ed7e7b83c445bbddb9"));
var searchPosCustomersFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("a565152122d5f42bb3fc3e0b88144309f151ff65b9bebf2ac0ab69ba68d9c38b"));
var checkoutServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("d0272c20467dadca6bb9bf2864cd5967d07f4d7394c5a81060bc41392231a3f0"));
var generateShiftReportFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("e1a4abab4de0b5bbb6a57acfbfb74a3bb1779d8c900c493949e5e5a76f5722fa"));
var getBranchTillsServerFn = createServerFn({ method: "GET" }).handler(createSsrRpc("26d6cd683c1ea2eb4119adf59cc2b8ce4d537263453c8a14908305855d9c4539"));
var $$splitComponentImporter$5 = () => import("./pos-till-BHtpjXYQ.mjs");
var Route$5 = createFileRoute("/pos-till")({
	beforeLoad: async () => {
		const res = await getSessionServerFn();
		if (!res.success || !res.session) throw redirect({ to: "/login" });
		const role = res.session.role;
		if (role !== "Cashier") throw redirect({ to: roleRoutes[role] });
	},
	head: () => ({ meta: [
		{ title: "POS Till Terminal Demo — cloudynationpos" },
		{
			name: "description",
			content: "Try the cloudynationpos cashier till: touch checkout, barcode search, VAT breakdown, split payments across cash, card, loyalty and store credit, plus offline mode and X/Z reports."
		},
		{
			property: "og:title",
			content: "cloudynationpos POS Till Terminal Demo"
		},
		{
			property: "og:description",
			content: "Touch-first checkout that keeps billing during outages."
		}
	] }),
	loader: async () => {
		const [sessionRes, catalogRes, shiftRes, tillsRes] = await Promise.all([
			getSessionServerFn(),
			getPosCatalogServerFn(),
			getActiveShiftServerFn(),
			getBranchTillsServerFn().catch(() => ({
				success: false,
				tills: []
			}))
		]);
		return {
			session: sessionRes.success ? sessionRes.session : null,
			catalog: catalogRes.catalog,
			promotions: catalogRes.promotions,
			shift: shiftRes.shift,
			tills: tillsRes.tills || []
		};
	},
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./pricing-B4k-13Uj.mjs");
var Route$4 = createFileRoute("/pricing")({
	head: () => ({ meta: [
		{ title: "Pricing — cloudynationpos POS for UAE Supermarket Chains" },
		{
			name: "description",
			content: "Transparent cloudynationpos pricing per outlet and till. Starter, Growth and Enterprise tiers — all include UAE VAT compliance, offline tills and aggregator sync."
		},
		{
			property: "og:title",
			content: "cloudynationpos Pricing — Per Outlet, Per Till"
		},
		{
			property: "og:description",
			content: "Starter, Growth and Enterprise plans for supermarket chains of every size."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./purchasing-D-E-ivA-.mjs");
var Route$3 = createFileRoute("/purchasing")({
	beforeLoad: async () => {
		const res = await getSessionServerFn();
		if (!res.success || !res.session) throw redirect({ to: "/login" });
		const role = res.session.role;
		if (role !== "Purchasing Officer" && role !== "Head Office Admin") throw redirect({ to: roleRoutes[role] });
	},
	loader: async () => {
		return await getPurchasingDataServerFn();
	},
	component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
var getStoreManagerDataFn = createServerFn({ method: "GET" }).handler(createSsrRpc("44bc291918d8c505d6c54f68f5abe95959f849582775f630a6285be0394f4acf"));
createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("5611f19dc71ad104e7edd3f9255cea4d3d872617279037693c17888e16544db2"));
var createOverrideRequestFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("1de25ec56cb83f79ef219c30c82605a91f947f7086a68380583394f79851f5c5"));
var createRosterShiftFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("87eeb263716e71498ac779db64b218494d0860b1aefd39511309d503aee47bb7"));
var deleteRosterShiftFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("1f24a7f4f6dfdfb086ebe019d915c93b1d7919702ed82c24849479d9e279e4a7"));
var createTillFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("2cdc8a9b47ae93821e2054381344608153473e8ba76c13147200d26e3ae0842d"));
var resetCashierPinByManagerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("7ea2d3820ce8de71d78a527d59c81158efeff13df5499103dbd88da8f87c975c"));
var adjustStockFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("35dd1c052f09dff6467417c24ab651efd40eb79ff4cf9de726eb5224c372c902"));
var getStockAdjustmentHistoryFn = createServerFn({ method: "GET" }).validator((d) => d).handler(createSsrRpc("da5c637dfc46c3944be86943a337758583b70bccdc184bc4083472c54f9edb00"));
var exportZReportFn = createServerFn({ method: "POST" }).handler(createSsrRpc("d5251edd6ea3a46509907367f81e96d6c639be63405a031114af40fc913ce61f"));
var recordCashDropFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("4e2433c358339345979e224ae350964943a59838f6f73822385d6c9c27e54810"));
var closeShiftFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("ed7791bce8fd415c1c67818bc3f51f7012ae68120fd9ef0f865bb363274b2651"));
var $$splitComponentImporter$2 = () => import("./store-manager-DkEfrPY8.mjs");
var Route$2 = createFileRoute("/store-manager")({
	beforeLoad: async () => {
		const res = await getSessionServerFn();
		if (!res.success || !res.session) throw redirect({ to: "/login" });
		const role = res.session.role;
		if (role !== "Branch Manager") throw redirect({ to: roleRoutes[role] });
	},
	loader: async () => {
		return await getStoreManagerDataFn();
	},
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./super-admin-DBwuxdWj.mjs");
var Route$1 = createFileRoute("/super-admin")({
	beforeLoad: async () => {
		const res = await getSessionServerFn();
		if (!res.success || !res.session) throw redirect({ to: "/login" });
		const role = res.session.role;
		if (role !== "Super Admin") throw redirect({ to: roleRoutes[role] });
	},
	loader: async () => {
		const [tenantsRes, branchesRes, taxRes, analyticsRes, platformRes] = await Promise.all([
			getTenantsServerFn(),
			getBranchesServerFn(),
			getGlobalTaxSettingsServerFn(),
			getAnalyticsServerFn(),
			getPlatformSettingsServerFn()
		]);
		return {
			initialTenants: tenantsRes.success ? tenantsRes.tenants : [],
			initialBranches: branchesRes.success ? branchesRes.branches : [],
			taxSettings: taxRes.success ? taxRes : {
				vatRate: "0",
				inclusive: false
			},
			analytics: analyticsRes.success ? analyticsRes : {
				totalGmv: 0,
				systemLogs: [],
				platformSeries: []
			},
			platformSettings: platformRes.success && platformRes.data ? platformRes.data : {
				currency: "AED",
				timezone: "Asia/Dubai",
				dateFormat: "DD/MM/YYYY"
			}
		};
	},
	head: () => ({ meta: [
		{ title: "Super Admin Portal Demo â€” cloudynationpos" },
		{
			name: "description",
			content: "Interactive cloudynationpos super-admin demo: provision tenants, enforce outlet and till limits, set VAT templates and monitor platform analytics."
		},
		{
			property: "og:title",
			content: "cloudynationpos Super Admin Portal Demo"
		},
		{
			property: "og:description",
			content: "Multi-tenant provisioning, limits and platform analytics."
		}
	] }),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var getVendorPortalDataServerFn = createServerFn({ method: "GET" }).handler(createSsrRpc("6610ab817629658d9f049d6b90fc6e684fa747d3853b87397c76decc8ca65aca"));
var $$splitComponentImporter = () => import("./vendor-portal-DRdV8srt.mjs");
var Route = createFileRoute("/vendor-portal")({
	beforeLoad: async () => {
		const res = await getSessionServerFn();
		if (!res.success || !res.session) throw redirect({ to: "/login" });
		const role = res.session.role;
		if (role !== "Vendor") throw redirect({ to: roleRoutes[role] });
	},
	loader: async () => {
		const data = await getVendorPortalDataServerFn();
		if (!data.vendor) throw redirect({ to: "/login" });
		return data;
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var rootRouteChildren = {
	IndexRoute: Route$10.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$11
	}),
	AggregatorsRoute: Route$9.update({
		id: "/aggregators",
		path: "/aggregators",
		getParentRoute: () => Route$11
	}),
	HeadOfficeRoute: Route$8.update({
		id: "/head-office",
		path: "/head-office",
		getParentRoute: () => Route$11
	}),
	InventoryManagerRoute: Route$7.update({
		id: "/inventory-manager",
		path: "/inventory-manager",
		getParentRoute: () => Route$11
	}),
	LoginRoute: Route$6.update({
		id: "/login",
		path: "/login",
		getParentRoute: () => Route$11
	}),
	PosTillRoute: Route$5.update({
		id: "/pos-till",
		path: "/pos-till",
		getParentRoute: () => Route$11
	}),
	PricingRoute: Route$4.update({
		id: "/pricing",
		path: "/pricing",
		getParentRoute: () => Route$11
	}),
	PurchasingRoute: Route$3.update({
		id: "/purchasing",
		path: "/purchasing",
		getParentRoute: () => Route$11
	}),
	StoreManagerRoute: Route$2.update({
		id: "/store-manager",
		path: "/store-manager",
		getParentRoute: () => Route$11
	}),
	SuperAdminRoute: Route$1.update({
		id: "/super-admin",
		path: "/super-admin",
		getParentRoute: () => Route$11
	}),
	VendorPortalRoute: Route.update({
		id: "/vendor-portal",
		path: "/vendor-portal",
		getParentRoute: () => Route$11
	})
};
var routeTree = Route$11._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
var getRouter = () => {
	const queryClient = new QueryClient();
	return createRouter({
		routeTree,
		context: { queryClient },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { updateLoyaltySettingsFn as $, adjustCustomerBalanceFn as A, recordVendorPaymentServerFn as At, createVendorFn as B, Route$7 as C, createVendorServerFn as Ct, Route$8 as D, getInvoiceDetailsServerFn as Dt, stockTransferServerFn as E, getGrnDetailsServerFn as Et, createBranchForTenantFn as F, getCustomerDetailsFn as G, deactivatePromotionFn as H, createCustomerFn as I, listPromotionsFn as J, getCustomerPurchaseHistoryFn as K, createProductFn as L, applyClearanceFn$1 as M, updatePurchaseOrderServerFn as Mt, archivePromotionFn as N, updateVendorServerFn as Nt, activateBranchFn as O, getPODetailsServerFn as Ot, createBatchServerFn as P, updateCustomerFn as Q, createPromotionFn as R, searchPosCustomersFn as S, createVendorInvoiceServerFn as St, getInventoryLedgerFn as T, deleteVendorServerFn as Tt, deleteProductFn as U, deactivateBranchFn as V, deleteVendorFn as W, toggleRolePermissionFn as X, searchCustomersFn as Y, updateBranchFn as Z, checkoutServerFn as _, updatePlatformSettingsServerFn as _t, adjustStockFn as a, updateVatSettingsFn as at, openShiftServerFn as b, upgradeTenantPlanServerFn as bt, createRosterShiftFn as c, createBranchServerFn as ct, exportZReportFn as d, deleteBranchServerFn as dt, updatePriceOverrideFn as et, getStockAdjustmentHistoryFn as f, deleteTenantAdminServerFn as ft, Route$5 as g, getTenantAdminServerFn as gt, Route$3 as h, getBranchesServerFn as ht, Route$2 as i, updateStockFn as it, adjustCustomerPointsFn as j, submitPurchaseOrderServerFn as jt, activatePromotionFn as k, recordGRNServerFn as kt, createTillFn as l, createExistingTenantAdminServerFn as lt, resetCashierPinByManagerFn as m, getAuditLogsServerFn as mt, Route as n, updatePromotionFn as nt, closeShiftFn as o, updateVendorFn as ot, recordCashDropFn as p, downgradeTenantPlanServerFn as pt, handleOverrideRequestFn as q, Route$1 as r, updateStaffFn as rt, createOverrideRequestFn as s, archiveTenantServerFn as st, router_exports as t, updateProductFn as tt, deleteRosterShiftFn as u, createTenantServerFn as ut, closeShiftServerFn as v, updateTenantAdminServerFn as vt, draftPurchaseOrderServerFn as w, deletePurchaseOrderServerFn as wt, recordCashDropServerFn as x, createPurchaseOrderServerFn as xt, generateShiftReportFn as y, updateTenantStatusServerFn as yt, createStaffFn as z };
