import { r as __exportAll$1 } from "../_runtime.mjs";
import { i as toResponse, n as parseCookies, r as setCookie, t as H3Event } from "../_libs/h3-v2+rou3+srvx.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as createCsrfMiddleware } from "./createCsrfMiddleware-B2To0gPJ.mjs";
import { A as invariant, D as resolveManifestCssLink, E as resolveManifestAssetLink, F as isResolvedRedirect, I as parseRedirect, O as _getRenderedMatches, P as isRedirect, R as rootRouteId, T as getStylesheetHref, a as isSsrResponse, c as stripSsrResponseBody, d as RouterProvider, i as disposeSsrResponseDetached, k as executeRewriteInput, n as bindSsrResponseToRequest, o as normalizeSsrResponse, r as defineHandlerCallback, s as replaceSsrResponse, t as renderRouterToStream, w as getScriptPreloadAttrs, z as isNotFound } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as createMemoryHistory } from "../_libs/tanstack__history.mjs";
import { a as getOrigin, c as createSerializationAdapter, d as toCrossJSONAsync, f as toCrossJSONStream, i as getNormalizedURL, l as makeSerovalPlugin, n as mergeHeaders, o as defaultSerovalPlugins, r as attachRouterServerSsrUtils, s as createRawStreamRPCPlugin, t as waitForRequest, u as fromJSON } from "../_libs/@tanstack/router-core+[...].mjs";
import { AsyncLocalStorage } from "node:async_hooks";
//#region node_modules/.nitro/vite/services/ssr/assets/server-BlyqvE9x.js
var server_BlyqvE9x_exports = /* @__PURE__ */ __exportAll$1({
	a: () => getCookie,
	createServerEntry: () => createServerEntry,
	default: () => server_default,
	i: () => getServerFnById,
	n: () => createServerFn,
	o: () => setCookie$1,
	r: () => TSS_SERVER_FUNCTION,
	s: () => __exportAll,
	t: () => server_exports
});
require_react();
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function StartServer(props) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RouterProvider, { router: props.router });
}
var defaultStreamHandler = defineHandlerCallback(({ request, router, responseHeaders }) => renderRouterToStream({
	request,
	router,
	responseHeaders,
	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StartServer, { router })
}));
var GLOBAL_EVENT_STORAGE_KEY = Symbol.for("tanstack-start:event-storage");
var globalObj$1 = globalThis;
if (!globalObj$1[GLOBAL_EVENT_STORAGE_KEY]) globalObj$1[GLOBAL_EVENT_STORAGE_KEY] = new AsyncLocalStorage();
var eventStorage = globalObj$1[GLOBAL_EVENT_STORAGE_KEY];
function isPromiseLike(value) {
	return typeof value.then === "function";
}
function getSetCookieValues(headers) {
	const headersWithSetCookie = headers;
	if (typeof headersWithSetCookie.getSetCookie === "function") return headersWithSetCookie.getSetCookie();
	const value = headers.get("set-cookie");
	return value ? [value] : [];
}
function mergeEventResponseHeaders(response, event) {
	if (response.ok) return;
	const eventSetCookies = getSetCookieValues(event.res.headers);
	if (eventSetCookies.length === 0) return;
	const responseSetCookies = getSetCookieValues(response.headers);
	response.headers.delete("set-cookie");
	for (const cookie of responseSetCookies) response.headers.append("set-cookie", cookie);
	for (const cookie of eventSetCookies) response.headers.append("set-cookie", cookie);
}
function attachResponseHeaders(value, event) {
	if (isPromiseLike(value)) return value.then((resolved) => {
		if (resolved instanceof Response) mergeEventResponseHeaders(resolved, event);
		return resolved;
	});
	if (value instanceof Response) mergeEventResponseHeaders(value, event);
	return value;
}
function requestHandler(handler) {
	return (request, requestOpts) => {
		let h3Event;
		try {
			h3Event = new H3Event(request);
		} catch (error) {
			if (error instanceof URIError) return new Response(null, {
				status: 400,
				statusText: "Bad Request"
			});
			throw error;
		}
		return toResponse(attachResponseHeaders(eventStorage.run({ h3Event }, () => handler(request, requestOpts)), h3Event), h3Event);
	};
}
function getH3Event() {
	const event = eventStorage.getStore();
	if (!event) throw new Error(`No StartEvent found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
	return event.h3Event;
}
/**
* Parse the request to get HTTP Cookie header string and return an object of all cookie name-value pairs.
* @returns Object of cookie name-value pairs
* ```ts
* const cookies = getCookies()
* ```
*/
function getCookies() {
	const cookies = parseCookies(getH3Event());
	const definedCookies = Object.create(null);
	for (const [name, value] of Object.entries(cookies)) if (value !== void 0) definedCookies[name] = value;
	return definedCookies;
}
/**
* Get a cookie value by name.
* @param name Name of the cookie to get
* @returns {*} Value of the cookie (String or undefined)
* ```ts
* const authorization = getCookie('Authorization')
* ```
*/
function getCookie(name) {
	return getCookies()[name];
}
/**
* Set a cookie value by name.
* @param name Name of the cookie to set
* @param value Value of the cookie to set
* @param options {CookieSerializeOptions} Options for serializing the cookie
* ```ts
* setCookie('Authorization', '1234567')
* ```
*/
function setCookie$1(name, value, options) {
	setCookie(getH3Event(), name, value, options);
}
function getResponse() {
	return getH3Event().res;
}
var HEADERS = { TSS_SHELL: "X-TSS_SHELL" };
/**
* @description Returns the router manifest data that should be sent to the client.
* This includes only the assets and preloads for the current route and any
* special assets that are needed for the client. It does not include relationships
* between routes or any other data that is not needed for the client.
*
* @param matchedRoutes - In dev mode, the matched routes are used to build
* the dev styles URL for route-scoped CSS collection.
*/
async function getStartManifest(matchedRoutes) {
	const { tsrStartManifest } = await import("../_tanstack-start-manifest_v-CRb7CIjM.mjs");
	const startManifest = tsrStartManifest();
	let routes = startManifest.routes;
	routes[rootRouteId];
	const manifestRoutes = {};
	for (const k in routes) {
		const v = routes[k];
		const result = {};
		if (v.preloads && v.preloads.length > 0) result.preloads = v.preloads;
		if (v.scripts && v.scripts.length > 0) result.scripts = v.scripts;
		if (v.css?.length) result.css = v.css;
		if (result.preloads || result.scripts || result.css) manifestRoutes[k] = result;
	}
	return {
		...startManifest.scriptFormat ? { scriptFormat: startManifest.scriptFormat } : {},
		...startManifest.inlineCss ? { inlineCss: startManifest.inlineCss } : {},
		routes: manifestRoutes
	};
}
var manifest = {
	"013be2b752e9ef99156ea584262b92507a5ccac64bd84d1663d10e22d3a4e238": {
		functionName: "adjustCustomerBalanceFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"0317e46065ca576da3e89673627b6ed6af87b47645574e7ab1fd30e7b19ab2bd": {
		functionName: "deleteBranchServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"05fb876ebc68d1013b55b9ff627c81ac5c1c92a9cd28e6f79a7d8dd2e2c6e08e": {
		functionName: "draftPurchaseOrderServerFn_createServerFn_handler",
		importer: () => import("./inventory-manager-server-aDYiWgzY.mjs")
	},
	"068b3caffa68c22de8c29b81b02fb27b071ad2f77cc1a2cc6a9a88e69a42f42f": {
		functionName: "logoutServerFn_createServerFn_handler",
		importer: () => import("./auth-server-D483nBal.mjs")
	},
	"0a9ed05516c2beac1016df848ec593e291a0ea14a760dfb8e35678cb8c32d353": {
		functionName: "getCashierSalesReportFn_createServerFn_handler",
		importer: () => import("./reports-server-CjhL-8vz.mjs")
	},
	"11863964c60ea47bdb8a72de230c68b71532b93c94cd24f0cdfdb8d9f9af7344": {
		functionName: "getLowStockReportFn_createServerFn_handler",
		importer: () => import("./reports-server-CjhL-8vz.mjs")
	},
	"148f04b685a0de39f475633eff2061ce8efff7d719d50f8128673688f011d1c4": {
		functionName: "adjustStockServerFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"1597975d68b12a1734ea0160162e3b540e09831d31f809625ed4e855f89445d0": {
		functionName: "getExpiryReportFn_createServerFn_handler",
		importer: () => import("./reports-server-CjhL-8vz.mjs")
	},
	"191598a72a4c54ff48c315e9f096024a984ca4948d781b131ab5d6b4e6478378": {
		functionName: "archiveTenantServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"1b9181e1a481dd46084adccac897170de72f3ffd263bfdd278c543f3e94f02c4": {
		functionName: "getGrnDetailsServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	},
	"1d286daf14004ee63e13a358a09107f060063302bf5963754a649bc5dc12fc43": {
		functionName: "getInventoryLedgerFn_createServerFn_handler",
		importer: () => import("./inventory-manager-server-aDYiWgzY.mjs")
	},
	"1de25ec56cb83f79ef219c30c82605a91f947f7086a68380583394f79851f5c5": {
		functionName: "createOverrideRequestFn_createServerFn_handler",
		importer: () => import("./store-manager-server-C1ES8hxS.mjs")
	},
	"1e07366c04d5681558e747d576297797712ae573c4a19e220e82ff629af664ef": {
		functionName: "stockTransferServerFn_createServerFn_handler",
		importer: () => import("./inventory-manager-server-aDYiWgzY.mjs")
	},
	"1f24a7f4f6dfdfb086ebe019d915c93b1d7919702ed82c24849479d9e279e4a7": {
		functionName: "deleteRosterShiftFn_createServerFn_handler",
		importer: () => import("./store-manager-server-C1ES8hxS.mjs")
	},
	"2343d3542a9aa6287410998e7c5334591d9e50a6ac5ff35a38740222cef8801b": {
		functionName: "getVatSummaryReportFn_createServerFn_handler",
		importer: () => import("./reports-server-CjhL-8vz.mjs")
	},
	"2390f131557d4921280070ebd95745204ef4ccae4cc961145d686dd07e4ebf64": {
		functionName: "createExistingTenantAdminServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"265af7d954b59d91ec996643477017319d9f2ca40061ed5e57c336858bdec13a": {
		functionName: "toggleRolePermissionFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"26d6cd683c1ea2eb4119adf59cc2b8ce4d537263453c8a14908305855d9c4539": {
		functionName: "getBranchTillsServerFn_createServerFn_handler",
		importer: () => import("./pos-server-Fmsex0pr.mjs")
	},
	"270a84e37623743570d34749e1646581ea7cc9fb9db1af5ff7742d2708a68c2a": {
		functionName: "createStockAdjustmentFn_createServerFn_handler",
		importer: () => import("./inventory-manager-server-aDYiWgzY.mjs")
	},
	"2995f8504bbd86a1c1d7ea79c1dce8d10e7c925487976ae0bfba9bfe703f26d1": {
		functionName: "deactivateBranchFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"2a58828528113bce82b47c6da6108ec4296e0e13ce79a5ee5b8ba0bb4f30549e": {
		functionName: "deletePurchaseOrderServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	},
	"2cdc8a9b47ae93821e2054381344608153473e8ba76c13147200d26e3ae0842d": {
		functionName: "createTillFn_createServerFn_handler",
		importer: () => import("./store-manager-server-C1ES8hxS.mjs")
	},
	"2dba67889cc55906e80d66373d61f5cbd1becf7ab79a1d03c8e4ca40e68f6aef": {
		functionName: "recordGRNServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	},
	"2fcc2769efee5348114caab28acbd73be38f33b93d196b6b840569bdad5528e1": {
		functionName: "recordCashDropServerFn_createServerFn_handler",
		importer: () => import("./pos-server-Fmsex0pr.mjs")
	},
	"308754141f310ba8eef9422559ccbbdc5013a4c6b1daf568e45f374b4f7250f0": {
		functionName: "handleOverrideRequestFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"3295c6d9291d9c91de7070c4871c4a237f2fceded930b0651e084b402209bd52": {
		functionName: "createBranchServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"35dd1c052f09dff6467417c24ab651efd40eb79ff4cf9de726eb5224c372c902": {
		functionName: "adjustStockFn_createServerFn_handler",
		importer: () => import("./store-manager-server-C1ES8hxS.mjs")
	},
	"364df443a5c6270c83dfe0809ecf976019e413f5145778c1f582d07678257ed7": {
		functionName: "getTenantsAndBranchesFn_createServerFn_handler",
		importer: () => import("./auth-server-D483nBal.mjs")
	},
	"36e6298a0e61ca583dd1093f42a22721cf0043221c303325c906017c5eac745f": {
		functionName: "updatePlatformSettingsServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"3c17d20decc1659eeedaa41a740fc65c00fb550755956ce54fdf3b08cf8e8dac": {
		functionName: "getInventoryValuationReportFn_createServerFn_handler",
		importer: () => import("./reports-server-CjhL-8vz.mjs")
	},
	"42914dc70ed3fcf9c5670f8173281213c1d64f2faeedabb3c81324634abefa93": {
		functionName: "applyClearanceFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"433dfcf06cb21fdc9e40beb9b59e1cad4d8ebc2dcbd442f47964ba66d7ae700f": {
		functionName: "getBranchDetailsFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"44533c085dcf480b227e06b225cdf217ded5dd92ceb09caa4f24915c18b11f40": {
		functionName: "updateVatSettingsFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"44bc291918d8c505d6c54f68f5abe95959f849582775f630a6285be0394f4acf": {
		functionName: "getStoreManagerDataFn_createServerFn_handler",
		importer: () => import("./store-manager-server-C1ES8hxS.mjs")
	},
	"48ab3e1eacef1d7c325b51d845c1c2ca0b74a37613084918c9a1e30b1e333bc1": {
		functionName: "updateTenantStatusServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"4dbf1bf9ecce1e8b154c3bba73dda2398de94948488bde31a72b51ecd9b2f5bd": {
		functionName: "activatePromotionFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"4e2433c358339345979e224ae350964943a59838f6f73822385d6c9c27e54810": {
		functionName: "recordCashDropFn_createServerFn_handler",
		importer: () => import("./store-manager-server-C1ES8hxS.mjs")
	},
	"4eb07c7716f722095f34d9359f49637e406c1b68ec4fd87a180a196e62dbd533": {
		functionName: "getProductSalesReportFn_createServerFn_handler",
		importer: () => import("./reports-server-CjhL-8vz.mjs")
	},
	"4f65a076d746579199c79d55a95938939a440421e9d6646e89b72b45dbbe17d0": {
		functionName: "getHeadOfficeDataFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"5102fdb437acc42f7e2c69a7cb419d5157a0dc1db9b82838c28da958be5be859": {
		functionName: "updateBranchFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"51694eb31157e15791cd2586b60b1b883cc605060a823f885689fc75e56b2ed1": {
		functionName: "getAnalyticsServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"520eee03467fb16a8bf28cf6f4336b5e5f6c88e860d7e5729695cac0a4c31436": {
		functionName: "getCustomerDetailsFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"52b1df60eeec8ed07c7f1aaa1906dd98ed61771650e3878a20e2a3a9c4433124": {
		functionName: "updateProductFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"5308bb7b6fb36b20456b2c65f935548518a244127fe0ea669e5b61b049e98eac": {
		functionName: "updateVendorInvoiceServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	},
	"536effb5f3e56056d5fb91bf73a954f100f33431369012f46cc89978fca39595": {
		functionName: "searchCustomersFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"54139ac1bb2be9b228b95564a8fe70cad5ac0c0cfc8ea8db0acf996bb7fd7dfd": {
		functionName: "getBranchesServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"550a22a2c30d9985a61b73a6bfac7836aa86a7bb823f13d9a1588ba2a0733b6f": {
		functionName: "createPoFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"553a08fa248132828e6e93564044a5f5175e4e1431b3178ec80cd9c2bc5dbead": {
		functionName: "getPromotionFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"5601be9ec7ee6a4cd5e7b6361afb73f53148b7e2b171ebb06e16fce50f56ad26": {
		functionName: "updateTenantAdminServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"5611f19dc71ad104e7edd3f9255cea4d3d872617279037693c17888e16544db2": {
		functionName: "requestPriceOverrideFn_createServerFn_handler",
		importer: () => import("./store-manager-server-C1ES8hxS.mjs")
	},
	"56aa1c081d06333b6d2d05cd416dece608e9bd36f56b29858b1834f66cabecbe": {
		functionName: "updatePriceOverrideFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"57e30a304a2c4af19ecabff8caaea4b078ac3674254750d0ec609dc9673e133e": {
		functionName: "downgradeTenantPlanServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"5b4d5a14987c0106e76b2bdd4f8b245acb8f304e86ea09c8f3c140a7f83c9c7b": {
		functionName: "createVendorServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	},
	"61c6c3e8ad3879451ca63b4fc74a5054a8973715d6319777b0d260c15e1c8d69": {
		functionName: "deleteProductFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"61d51b4941028cc136b336978a000bbd254c58ef4cb90845c707cc810104ac7b": {
		functionName: "accrueLoyaltyPointsFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"62ed1df55aafe4a8f518aa3b2f4e8930018985684abb3b7c439b34f1524a28e1": {
		functionName: "deleteVendorServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	},
	"6610ab817629658d9f049d6b90fc6e684fa747d3853b87397c76decc8ca65aca": {
		functionName: "getVendorPortalDataServerFn_createServerFn_handler",
		importer: () => import("./vendor-server-CvNUvpDr.mjs")
	},
	"6620324ec86f59a7b0a47c8e0b6132064767a156d30f1db39f040aab72c2e023": {
		functionName: "createPromotionFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"69e5420b0eafa3013ceff924f8b9d9095813161598aa78747f1ae02ca3b02d41": {
		functionName: "createBatchServerFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"6a39cf59f744b150d1d658cb6b77b0cc3650f886dfb79dc03183f85cc5e8fe16": {
		functionName: "getPODetailsServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	},
	"6ac19b5d163ae7ee3ddcb420776481e2657534e9030d4574bc06e7fa55dad7a8": {
		functionName: "calculateApplicablePromotionsFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"6d82ba81e88ead89227e88652a9f4b9d3dc7718fba784eed64f909e614b30568": {
		functionName: "createStaffFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"6e5734d7bb5f58fb3295e9adfdb0ed6bb672035cdc11178a0f8ae15e2c90ab45": {
		functionName: "upgradeTenantPlanServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"6f097eb36cb32ac740228776bdaf5aab121acce485a3ff1cfd58c1d5c18a2a87": {
		functionName: "getPlatformSettingsServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"6f3ba453e2be38e2b2273628f3a6ec66adf5da91e6d21a0bbfe8b4893d16d7e1": {
		functionName: "updateVendorFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"70dbd634f8a670b136d7fbdf9fad0afdf6032c34ae99ea194deef833983f2622": {
		functionName: "updatePromotionFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"768e9878293484dded9c758e9b59a11433e70d1fa2edb65fc04d359e1aa6b8ae": {
		functionName: "openShiftServerFn_createServerFn_handler",
		importer: () => import("./pos-server-Fmsex0pr.mjs")
	},
	"7ea2d3820ce8de71d78a527d59c81158efeff13df5499103dbd88da8f87c975c": {
		functionName: "resetCashierPinByManagerFn_createServerFn_handler",
		importer: () => import("./store-manager-server-C1ES8hxS.mjs")
	},
	"80e4f4986219a594e2deba3e2e3af18e64bebcf89c479af092bcc934b96ec917": {
		functionName: "createVendorFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"82753d3c0f594b1ab233184fcdb9f48939fa9c7b6a6ffdffcf1397a9449e8e82": {
		functionName: "deleteVendorFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"833152d6b48924f8871519016755abbfa8d4570adefa749ce2a06eceb3117ee2": {
		functionName: "updateLoyaltySettingsFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"85473fdc187de9e9e151bcd65f4e32d533aa881e732c56ed3a924402e1b471d4": {
		functionName: "getBranchCashiersAndTillsFn_createServerFn_handler",
		importer: () => import("./auth-server-D483nBal.mjs")
	},
	"87eeb263716e71498ac779db64b218494d0860b1aefd39511309d503aee47bb7": {
		functionName: "createRosterShiftFn_createServerFn_handler",
		importer: () => import("./store-manager-server-C1ES8hxS.mjs")
	},
	"8811d87a1c6bf8b33342d0224ea930b76d0f668bdb107c011cf05ac7be034ddd": {
		functionName: "createCampaignFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"8a9393b718da3717be67bcbd8a4b58fd88e36bb491a9d19cf8a9cab9f28a7b6b": {
		functionName: "archivePromotionFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"8b297686b7e2fe356e3c6110f7b1a3df8dd133899e2817930dae89e616f8f6af": {
		functionName: "getInventoryDataServerFn_createServerFn_handler",
		importer: () => import("./inventory-manager-server-aDYiWgzY.mjs")
	},
	"8e8d08ebeb3fb5a0a13e6b3bfd5f964189086654977eb387990b9479b750858e": {
		functionName: "loginServerFn_createServerFn_handler",
		importer: () => import("./auth-server-D483nBal.mjs")
	},
	"8ee79462c1f3e4f7807c3d919a93addecb5b4cf2b7b1c59de2e40030a86db93c": {
		functionName: "createVendorInvoiceServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	},
	"8fc1a068d55fb34d6b611598c59b7ecb11549de4b89cd9ed3d0c0681a6946961": {
		functionName: "deleteTenantAdminServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"90fafe76535d7d78a32744dcf0c33ad1d24d3aed94f58e73ebc2ba70e0986efa": {
		functionName: "redeemLoyaltyPointsFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"93cf371881cc56207bbe0c0275546ca3ef8953f6f9ae840aa42b17fd56536c01": {
		functionName: "updatePurchaseOrderServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	},
	"9522f7bccab5fa9333fef4e1199cd6c73a5c45c013bd6ba2154f9f7a3478acd4": {
		functionName: "getTenantsServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"95303c8038f5610552eea41be398535c5dc8febc260bd8a8377decf47b8d1923": {
		functionName: "createPurchaseOrderServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	},
	"9a8de0e4319294f944f96fdc3ea65a25c82fc806c6cb4f907cd6c8ee5e402eef": {
		functionName: "activateBranchFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"9d2d54b040273b21ada15e1d168a56a953f34dfd1e3a324a4a4b9e57e5e3b6d3": {
		functionName: "getCategorySalesReportFn_createServerFn_handler",
		importer: () => import("./reports-server-CjhL-8vz.mjs")
	},
	"a19d852e56e44a38c612b7e76d9353821b8e43054e3abc983ca146a79039d9d0": {
		functionName: "getGlobalTaxSettingsServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"a565152122d5f42bb3fc3e0b88144309f151ff65b9bebf2ac0ab69ba68d9c38b": {
		functionName: "searchPosCustomersFn_createServerFn_handler",
		importer: () => import("./pos-server-Fmsex0pr.mjs")
	},
	"a9267c3ddd609da201e71d51e26fe5a9745d63fb7afaad4d36d624958109392a": {
		functionName: "adjustCustomerPointsFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"b116881fb6043bfe519e458a2d633897c4dc063e4925ae6afdb22f3f931c17f6": {
		functionName: "getPosCatalogServerFn_createServerFn_handler",
		importer: () => import("./pos-server-Fmsex0pr.mjs")
	},
	"b2d816eebf0d34a3ac413eb5fa41d94f384d0a8ee482d3e9accd6b60d89c46a8": {
		functionName: "updateVendorServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	},
	"b3b7397ea45e8985ea7ffb8aa045e06ef7942bdbdbc24f2a58027c26ced8046b": {
		functionName: "createCustomerFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"b58ba46594c47cbd25becf29e195ac98c5000012b53edc2de959154e4dfb6085": {
		functionName: "updateGlobalTaxSettingsServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"b815b0324041683fbb31d3b5ab80a567ca6ed5fb722cff3f0411bc30b10a8132": {
		functionName: "getTenantAdminServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"c0f19bd559164d2f1d870de125d03268019e202b8c5fee7f1f770c47f0a7e6b5": {
		functionName: "getInvoiceDetailsServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	},
	"c100981fd3f11b2714ebfb7af80533fbed77d4cc5dae99f38a65fe6b358f3933": {
		functionName: "createBranchForTenantFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"c30e0879dc94cbb39be21780a575970f1d24d2dd2488af086813101e511a26a5": {
		functionName: "updateCustomerFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"c754b5b78a97d70604ce3dd3e384708f53a1861ab9072f068510848d7ebdd984": {
		functionName: "createTenantServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"d0164f436c2117fd47da755869698b63012c2282ef673df5f175b5c3b9c69dc1": {
		functionName: "applyClearanceFn_createServerFn_handler",
		importer: () => import("./inventory-manager-server-aDYiWgzY.mjs")
	},
	"d0272c20467dadca6bb9bf2864cd5967d07f4d7394c5a81060bc41392231a3f0": {
		functionName: "checkoutServerFn_createServerFn_handler",
		importer: () => import("./pos-server-Fmsex0pr.mjs")
	},
	"d5251edd6ea3a46509907367f81e96d6c639be63405a031114af40fc913ce61f": {
		functionName: "exportZReportFn_createServerFn_handler",
		importer: () => import("./store-manager-server-C1ES8hxS.mjs")
	},
	"d5a281885a2ebf18a8bff4e3f79303b7a0a0c35fd8a3e0c4d5fb83cc2efaa00f": {
		functionName: "getVendorReportFn_createServerFn_handler",
		importer: () => import("./reports-server-CjhL-8vz.mjs")
	},
	"d615411c3d5a9ef74666848e73d205a7cb04b91d64afb3070031881bcfc00f88": {
		functionName: "submitPurchaseOrderServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	},
	"d7afc7da950abdf61e5c0c6fdadde9072f2043bc8f7ce87b33315226ac43e04d": {
		functionName: "updateTenantServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"d81218fee0f3c248bd25cba6566a46e66937a30b43e8f5c49bf6510e1a78a754": {
		functionName: "deactivatePromotionFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"d833dce8ec6dc143159fa6b681e5d210d665817a0da0d6d9d4420d8f133208d0": {
		functionName: "getActiveShiftServerFn_createServerFn_handler",
		importer: () => import("./pos-server-Fmsex0pr.mjs")
	},
	"da5c637dfc46c3944be86943a337758583b70bccdc184bc4083472c54f9edb00": {
		functionName: "getStockAdjustmentHistoryFn_createServerFn_handler",
		importer: () => import("./store-manager-server-C1ES8hxS.mjs")
	},
	"db2b01e5a7cc022d51b0b932ff42f5d70e0de3315b3f831c2c3af6261c7bf2dd": {
		functionName: "resetCashierPinSelfFn_createServerFn_handler",
		importer: () => import("./auth-server-D483nBal.mjs")
	},
	"dbbaf1dd65b92754d21182cad8f9236fd94a75309980cd25df33f60e6774bdd3": {
		functionName: "updateStockFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"dbd77c1b566c8ceec9d348ad1b1464558158cc1da046363dea5544a727dd5aa3": {
		functionName: "updateStaffFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"dbd858d2dbf8a702dc8692a0310ce8f9be413a4c32d7cedc0b904f9d85cad51d": {
		functionName: "getCustomerPurchaseHistoryFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"dbe2826a61c72c4cf10f804dff09108b3b8ab2dc337ecccdd2983b594af1b615": {
		functionName: "createProductFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"dbf75f03c880457a38dd40db164c224a01fdf55726119654a9a3fa3aa7d5623c": {
		functionName: "getPurchaseReportFn_createServerFn_handler",
		importer: () => import("./reports-server-CjhL-8vz.mjs")
	},
	"e120523c02615bc4f341f67ba9e18dec26dd92687884ed3ae320da9ee1941f8f": {
		functionName: "getPurchasingDataServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	},
	"e1a4abab4de0b5bbb6a57acfbfb74a3bb1779d8c900c493949e5e5a76f5722fa": {
		functionName: "generateShiftReportFn_createServerFn_handler",
		importer: () => import("./pos-server-Fmsex0pr.mjs")
	},
	"e5f02fee1cef37e4a76e87fc45a66c7e37bee5281bf8de9824a513099154490f": {
		functionName: "updateTenantLimitsServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"e97d0fe6ffb093beb6c00dc5887ee644c0332cb4f8cf94f02b0535bf24579ad0": {
		functionName: "getSessionServerFn_createServerFn_handler",
		importer: () => import("./auth-server-D483nBal.mjs")
	},
	"ead49babc576b141758d2e40557fb6db75f7b8edf00ed7568ae9f8b397db97da": {
		functionName: "getAuditLogsServerFn_createServerFn_handler",
		importer: () => import("./super-admin-server-BQoNjLB3.mjs")
	},
	"ed1879e870eca2e0baff3e4940ec3378c1ca34b2523408a6f44e1b8424f9adf0": {
		functionName: "getSalesSummaryReportFn_createServerFn_handler",
		importer: () => import("./reports-server-CjhL-8vz.mjs")
	},
	"ed7791bce8fd415c1c67818bc3f51f7012ae68120fd9ef0f865bb363274b2651": {
		functionName: "closeShiftFn_createServerFn_handler",
		importer: () => import("./store-manager-server-C1ES8hxS.mjs")
	},
	"ede17655b6f97502ed1aa9c1a6e38a58c35b5bdf54d1bade37de2f17b1ff7484": {
		functionName: "recordVendorPaymentServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	},
	"f01a4a6bd7ad4a41a1a466a26156ed9ff41a0ac25cc8daefa577f4328ba72aba": {
		functionName: "pinLoginServerFn_createServerFn_handler",
		importer: () => import("./auth-server-D483nBal.mjs")
	},
	"f5addc031bb269afe1ffd8c8ee7cf1273714a75bb87760cf4f6cd5d504594252": {
		functionName: "getBranchSalesReportFn_createServerFn_handler",
		importer: () => import("./reports-server-CjhL-8vz.mjs")
	},
	"f912af60c6d6833b47b26a5e5f7262fb18a1906ca0f045ed7e7b83c445bbddb9": {
		functionName: "closeShiftServerFn_createServerFn_handler",
		importer: () => import("./pos-server-Fmsex0pr.mjs")
	},
	"fb2a91af61f992a4cc97117d4d214b127d87e7b1bb8ff330275efd200db93be2": {
		functionName: "listPromotionsFn_createServerFn_handler",
		importer: () => import("./head-office-server-DBEHQozQ.mjs")
	},
	"fc889586ff6cf0e2d6080203a6f2eaa7b45cd79150c680013a03d13307180c69": {
		functionName: "updateGrnServerFn_createServerFn_handler",
		importer: () => import("./purchasing-server-CY1vGdtu.mjs")
	}
};
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
var TSS_FORMDATA_CONTEXT = "__TSS_CONTEXT";
var TSS_SERVER_FUNCTION = Symbol.for("TSS_SERVER_FUNCTION");
var TSS_SERVER_FUNCTION_FACTORY = Symbol.for("TSS_SERVER_FUNCTION_FACTORY");
var X_TSS_SERIALIZED = "x-tss-serialized";
var X_TSS_RAW_RESPONSE = "x-tss-raw";
/** Content-Type for multiplexed framed responses (RawStream support) */
var TSS_CONTENT_TYPE_FRAMED = "application/x-tss-framed";
/**
* Frame types for binary multiplexing protocol.
*/
var FrameType = {
	/** Seroval JSON chunk (NDJSON line) */
	JSON: 0,
	/** Raw stream data chunk */
	CHUNK: 1,
	/** Raw stream end (EOF) */
	END: 2,
	/** Raw stream error */
	ERROR: 3
};
/** Full Content-Type header value with version parameter */
var TSS_CONTENT_TYPE_FRAMED_VERSIONED = `${TSS_CONTENT_TYPE_FRAMED}; v=1`;
function isSafeKey(key) {
	return key !== "__proto__" && key !== "constructor" && key !== "prototype";
}
/**
* Merge target and source into a new null-proto object, filtering dangerous keys.
*/
function safeObjectMerge(target, source) {
	const result = Object.create(null);
	if (target) {
		for (const key of Object.keys(target)) if (isSafeKey(key)) result[key] = target[key];
	}
	if (source && typeof source === "object") {
		for (const key of Object.keys(source)) if (isSafeKey(key)) result[key] = source[key];
	}
	return result;
}
/**
* Create a null-prototype object, optionally copying from source.
*/
function createNullProtoObject(source) {
	if (!source) return Object.create(null);
	const obj = Object.create(null);
	for (const key of Object.keys(source)) if (isSafeKey(key)) obj[key] = source[key];
	return obj;
}
var GLOBAL_STORAGE_KEY = Symbol.for("tanstack-start:start-storage-context");
var globalObj = globalThis;
if (!globalObj[GLOBAL_STORAGE_KEY]) globalObj[GLOBAL_STORAGE_KEY] = new AsyncLocalStorage();
var startStorage = globalObj[GLOBAL_STORAGE_KEY];
async function runWithStartContext(context, fn) {
	return startStorage.run(context, fn);
}
function getStartContext(opts) {
	const context = startStorage.getStore();
	if (!context && opts?.throwIfNotFound !== false) throw new Error(`No Start context found in AsyncLocalStorage. Make sure you are using the function within the server runtime.`);
	return context;
}
var getStartOptions = () => getStartContext().startOptions;
var getStartContextServerOnly = getStartContext;
var createServerFn = (options, __opts) => {
	const resolvedOptions = __opts || options || {};
	if (typeof resolvedOptions.method === "undefined") resolvedOptions.method = "GET";
	const setValidator = (validator) => {
		return createServerFn(void 0, {
			...resolvedOptions,
			validator,
			inputValidator: validator
		});
	};
	const res = {
		options: resolvedOptions,
		middleware: (middleware) => {
			const newMiddleware = [...resolvedOptions.middleware || []];
			middleware.map((m) => {
				if (TSS_SERVER_FUNCTION_FACTORY in m) {
					if (m.options.middleware) newMiddleware.push(...m.options.middleware);
				} else newMiddleware.push(m);
			});
			const res = createServerFn(void 0, {
				...resolvedOptions,
				middleware: newMiddleware
			});
			res[TSS_SERVER_FUNCTION_FACTORY] = true;
			return res;
		},
		validator: setValidator,
		inputValidator: setValidator,
		handler: (...args) => {
			const [extractedFn, serverFn] = args;
			const newOptions = {
				...resolvedOptions,
				extractedFn,
				serverFn
			};
			const resolvedMiddleware = [...newOptions.middleware || [], serverFnBaseToMiddleware(newOptions)];
			extractedFn.method = resolvedOptions.method;
			return Object.assign(async (opts) => {
				const result = await executeMiddleware$1(resolvedMiddleware, "client", {
					...extractedFn,
					...newOptions,
					data: opts?.data,
					headers: opts?.headers,
					signal: opts?.signal,
					fetch: opts?.fetch,
					context: createNullProtoObject()
				});
				const redirect = parseRedirect(result.error);
				if (redirect) throw redirect;
				if (result.error) throw result.error;
				return result.result;
			}, {
				...extractedFn,
				method: resolvedOptions.method,
				__executeServer: async (opts) => {
					const startContext = getStartContextServerOnly();
					const serverContextAfterGlobalMiddlewares = startContext.contextAfterGlobalMiddlewares;
					return await executeMiddleware$1(resolvedMiddleware, "server", {
						...extractedFn,
						...opts,
						serverFnMeta: extractedFn.serverFnMeta,
						context: safeObjectMerge(opts.context, serverContextAfterGlobalMiddlewares),
						request: startContext.request
					}).then((d) => ({
						result: d.result,
						error: d.error,
						context: d.sendContext
					}));
				}
			});
		}
	};
	const fun = (options) => {
		return createServerFn(void 0, {
			...resolvedOptions,
			...options
		});
	};
	return Object.assign(fun, res);
};
async function executeMiddleware$1(middlewares, env, opts) {
	let flattenedMiddlewares = flattenMiddlewares([...getStartOptions()?.functionMiddleware || [], ...middlewares]);
	if (env === "server") {
		const startContext = getStartContextServerOnly({ throwIfNotFound: false });
		if (startContext?.executedRequestMiddlewares) flattenedMiddlewares = flattenedMiddlewares.filter((m) => !startContext.executedRequestMiddlewares.has(m));
	}
	const callNextMiddleware = async (ctx) => {
		const nextMiddleware = flattenedMiddlewares.shift();
		if (!nextMiddleware) return ctx;
		try {
			let validator = "validator" in nextMiddleware.options ? nextMiddleware.options.validator : void 0;
			if (!validator && "inputValidator" in nextMiddleware.options) validator = nextMiddleware.options.inputValidator;
			if (validator && env === "server") ctx.data = await execValidator(validator, ctx.data);
			let middlewareFn = void 0;
			if (env === "client") {
				if ("client" in nextMiddleware.options) middlewareFn = nextMiddleware.options.client;
			} else if ("server" in nextMiddleware.options) middlewareFn = nextMiddleware.options.server;
			if (middlewareFn) {
				const userNext = async (userCtx = {}) => {
					const result = await callNextMiddleware({
						...ctx,
						...userCtx,
						context: safeObjectMerge(ctx.context, userCtx.context),
						sendContext: safeObjectMerge(ctx.sendContext, userCtx.sendContext),
						headers: mergeHeaders(ctx.headers, userCtx.headers),
						_callSiteFetch: ctx._callSiteFetch,
						fetch: ctx._callSiteFetch ?? userCtx.fetch ?? ctx.fetch,
						result: userCtx.result !== void 0 ? userCtx.result : userCtx instanceof Response ? userCtx : ctx.result,
						error: userCtx.error ?? ctx.error
					});
					if (result.error) throw result.error;
					return result;
				};
				const result = await middlewareFn({
					...ctx,
					next: userNext
				});
				if (isRedirect(result)) return {
					...ctx,
					error: result
				};
				if (result instanceof Response) return {
					...ctx,
					result
				};
				if (!result) throw new Error("User middleware returned undefined. You must call next() or return a result in your middlewares.");
				return result;
			}
			return callNextMiddleware(ctx);
		} catch (error) {
			return {
				...ctx,
				error
			};
		}
	};
	return callNextMiddleware({
		...opts,
		headers: opts.headers || {},
		sendContext: opts.sendContext || {},
		context: opts.context || createNullProtoObject(),
		_callSiteFetch: opts.fetch
	});
}
function flattenMiddlewares(middlewares, maxDepth = 100) {
	const seen = /* @__PURE__ */ new Set();
	const flattened = [];
	const recurse = (middleware, depth) => {
		if (depth > maxDepth) throw new Error(`Middleware nesting depth exceeded maximum of ${maxDepth}. Check for circular references.`);
		middleware.forEach((m) => {
			if (m.options.middleware) recurse(m.options.middleware, depth + 1);
			if (!seen.has(m)) {
				seen.add(m);
				flattened.push(m);
			}
		});
	};
	recurse(middlewares, 0);
	return flattened;
}
async function execValidator(validator, input) {
	if (validator == null) return {};
	if ("~standard" in validator) {
		const result = await validator["~standard"].validate(input);
		if (result.issues) throw new Error(JSON.stringify(result.issues, void 0, 2));
		return result.value;
	}
	if ("parse" in validator) return validator.parse(input);
	if (typeof validator === "function") return validator(input);
	throw new Error("Invalid validator type!");
}
function serverFnBaseToMiddleware(options) {
	return {
		"~types": void 0,
		options: {
			inputValidator: options.validator ?? options.inputValidator,
			client: async ({ next, sendContext, fetch, ...ctx }) => {
				const payload = {
					...ctx,
					context: sendContext,
					fetch
				};
				return next(await options.extractedFn?.(payload));
			},
			server: async ({ next, ...ctx }) => {
				const result = await options.serverFn?.(ctx);
				return next({
					...ctx,
					result
				});
			}
		}
	};
}
function getDefaultSerovalPlugins() {
	return [...(getStartOptions()?.serializationAdapters)?.map(makeSerovalPlugin) ?? [], ...defaultSerovalPlugins];
}
/**
* Binary frame protocol for multiplexing JSON and raw streams over HTTP.
*
* Frame format: [type:1][streamId:4][length:4][payload:length]
* - type: 1 byte - frame type (JSON, CHUNK, END, ERROR)
* - streamId: 4 bytes big-endian uint32 - stream identifier
* - length: 4 bytes big-endian uint32 - payload length
* - payload: variable length bytes
*/
/** Cached TextEncoder for frame encoding */
var textEncoder = new TextEncoder();
/** Shared empty payload for END frames - avoids allocation per call */
var EMPTY_PAYLOAD = /* @__PURE__ */ new Uint8Array(0);
/**
* Encodes a single frame with header and payload.
*/
function encodeFrame(type, streamId, payload) {
	const frame = new Uint8Array(9 + payload.length);
	frame[0] = type;
	frame[1] = streamId >>> 24 & 255;
	frame[2] = streamId >>> 16 & 255;
	frame[3] = streamId >>> 8 & 255;
	frame[4] = streamId & 255;
	frame[5] = payload.length >>> 24 & 255;
	frame[6] = payload.length >>> 16 & 255;
	frame[7] = payload.length >>> 8 & 255;
	frame[8] = payload.length & 255;
	frame.set(payload, 9);
	return frame;
}
/**
* Encodes a JSON frame (type 0, streamId 0).
*/
function encodeJSONFrame(json) {
	return encodeFrame(FrameType.JSON, 0, textEncoder.encode(json));
}
/**
* Encodes a raw stream chunk frame.
*/
function encodeChunkFrame(streamId, chunk) {
	return encodeFrame(FrameType.CHUNK, streamId, chunk);
}
/**
* Encodes a raw stream end frame.
*/
function encodeEndFrame(streamId) {
	return encodeFrame(FrameType.END, streamId, EMPTY_PAYLOAD);
}
/**
* Encodes a raw stream error frame.
*/
function encodeErrorFrame(streamId, error) {
	const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
	return encodeFrame(FrameType.ERROR, streamId, textEncoder.encode(message));
}
/**
* Creates a multiplexed ReadableStream from JSON stream and raw streams.
*
* The JSON stream emits NDJSON lines (from seroval's toCrossJSONStream).
* Raw streams are pumped concurrently, interleaved with JSON frames.
*
* Supports late stream registration for RawStreams discovered after initial
* serialization (e.g., from resolved Promises).
*
* @param jsonStream Stream of JSON strings (each string is one NDJSON line)
* @param rawStreams Map of stream IDs to raw binary streams (known at start)
* @param lateStreamSource Optional stream of late registrations for streams discovered later
*/
function createMultiplexedStream(jsonStream, rawStreams, lateStreamSource) {
	let controller;
	let cancelled = false;
	const readers = [];
	const enqueue = (frame) => {
		if (cancelled) return false;
		try {
			controller.enqueue(frame);
			return true;
		} catch {
			return false;
		}
	};
	const errorOutput = (error) => {
		if (cancelled) return;
		cancelled = true;
		try {
			controller.error(error);
		} catch {}
		for (const reader of readers) reader.cancel().catch(() => {});
	};
	async function pumpRawStream(streamId, stream) {
		const reader = stream.getReader();
		readers.push(reader);
		try {
			while (!cancelled) {
				const { done, value } = await reader.read();
				if (done) {
					enqueue(encodeEndFrame(streamId));
					return;
				}
				if (!enqueue(encodeChunkFrame(streamId, value))) return;
			}
		} catch (error) {
			enqueue(encodeErrorFrame(streamId, error));
		} finally {
			reader.releaseLock();
		}
	}
	async function pumpJSON() {
		const reader = jsonStream.getReader();
		readers.push(reader);
		try {
			while (!cancelled) {
				const { done, value } = await reader.read();
				if (done) return;
				if (!enqueue(encodeJSONFrame(value))) return;
			}
		} catch (error) {
			errorOutput(error);
			throw error;
		} finally {
			reader.releaseLock();
		}
	}
	async function pumpLateStreams() {
		if (!lateStreamSource) return [];
		const lateStreamPumps = [];
		const reader = lateStreamSource.getReader();
		readers.push(reader);
		try {
			while (!cancelled) {
				const { done, value } = await reader.read();
				if (done) break;
				lateStreamPumps.push(pumpRawStream(value.id, value.stream));
			}
		} finally {
			reader.releaseLock();
		}
		return lateStreamPumps;
	}
	return new ReadableStream({
		async start(ctrl) {
			controller = ctrl;
			const pumps = [pumpJSON()];
			for (const [streamId, stream] of rawStreams) pumps.push(pumpRawStream(streamId, stream));
			if (lateStreamSource) pumps.push(pumpLateStreams());
			try {
				const latePumps = (await Promise.all(pumps)).find(Array.isArray);
				if (latePumps && latePumps.length > 0) await Promise.all(latePumps);
				if (!cancelled) try {
					controller.close();
				} catch {}
			} catch {}
		},
		cancel() {
			cancelled = true;
			for (const reader of readers) reader.cancel().catch(() => {});
			readers.length = 0;
		}
	});
}
var serovalPlugins = void 0;
var FORM_DATA_CONTENT_TYPES = ["multipart/form-data", "application/x-www-form-urlencoded"];
var MAX_PAYLOAD_SIZE = 1e6;
var handleServerAction = async ({ request, context, serverFnId }) => {
	const methodUpper = request.method.toUpperCase();
	const url = new URL(request.url);
	const action = await getServerFnById(serverFnId, { origin: "client" });
	if (action.method && methodUpper !== action.method) return new Response(`expected ${action.method} method. Got ${methodUpper}`, {
		status: 405,
		headers: { Allow: action.method }
	});
	const isServerFn = request.headers.get("x-tsr-serverFn") === "true";
	if (!serovalPlugins) serovalPlugins = getDefaultSerovalPlugins();
	const contentType = request.headers.get("Content-Type");
	function parsePayload(payload) {
		return fromJSON(payload, { plugins: serovalPlugins });
	}
	return await (async () => {
		try {
			let res = await (async () => {
				if (FORM_DATA_CONTENT_TYPES.some((type) => contentType && contentType.includes(type))) {
					if (methodUpper === "GET") invariant();
					const formData = await request.formData();
					const serializedContext = formData.get(TSS_FORMDATA_CONTEXT);
					formData.delete(TSS_FORMDATA_CONTEXT);
					const params = {
						context,
						data: formData,
						method: methodUpper
					};
					if (typeof serializedContext === "string") try {
						const deserializedContext = fromJSON(JSON.parse(serializedContext), { plugins: serovalPlugins });
						if (typeof deserializedContext === "object" && deserializedContext) params.context = safeObjectMerge(deserializedContext, context);
					} catch (e) {}
					return await action(params);
				}
				if (methodUpper === "GET") {
					const payloadParam = url.searchParams.get("payload");
					if (payloadParam && payloadParam.length > MAX_PAYLOAD_SIZE) throw new Error("Payload too large");
					const payload = payloadParam ? parsePayload(JSON.parse(payloadParam)) : {};
					payload.context = safeObjectMerge(payload.context, context);
					payload.method = methodUpper;
					return await action(payload);
				}
				let jsonPayload;
				if (contentType?.includes("application/json")) jsonPayload = await request.json();
				const payload = jsonPayload ? parsePayload(jsonPayload) : {};
				payload.context = safeObjectMerge(payload.context, context);
				payload.method = methodUpper;
				return await action(payload);
			})();
			const unwrapped = res.result || res.error;
			if (isNotFound(res)) res = isNotFoundResponse(res);
			if (!isServerFn) return unwrapped;
			if (unwrapped instanceof Response) {
				if (isRedirect(unwrapped)) return unwrapped;
				unwrapped.headers.set(X_TSS_RAW_RESPONSE, "true");
				return unwrapped;
			}
			return serializeResult(res);
			function serializeResult(res) {
				let nonStreamingBody = void 0;
				const alsResponse = getResponse();
				if (res !== void 0) {
					const rawStreams = /* @__PURE__ */ new Map();
					let initialPhase = true;
					let lateStreamWriter;
					let lateStreamReadable = void 0;
					const pendingLateStreams = [];
					const plugins = [createRawStreamRPCPlugin((id, stream) => {
						if (initialPhase) {
							rawStreams.set(id, stream);
							return;
						}
						if (lateStreamWriter) {
							lateStreamWriter.write({
								id,
								stream
							}).catch(() => {});
							return;
						}
						pendingLateStreams.push({
							id,
							stream
						});
					}), ...serovalPlugins || []];
					let done = false;
					const callbacks = {
						onParse: (value) => {
							nonStreamingBody = value;
						},
						onDone: () => {
							done = true;
						},
						onError: (error) => {
							throw error;
						}
					};
					toCrossJSONStream(res, {
						refs: /* @__PURE__ */ new Map(),
						plugins,
						onParse(value) {
							callbacks.onParse(value);
						},
						onDone() {
							callbacks.onDone();
						},
						onError: (error) => {
							callbacks.onError(error);
						}
					});
					initialPhase = false;
					if (done && rawStreams.size === 0) return new Response(nonStreamingBody ? JSON.stringify(nonStreamingBody) : void 0, {
						status: alsResponse.status,
						statusText: alsResponse.statusText,
						headers: {
							"Content-Type": "application/json",
							[X_TSS_SERIALIZED]: "true"
						}
					});
					const { readable, writable } = new TransformStream();
					lateStreamReadable = readable;
					lateStreamWriter = writable.getWriter();
					for (const registration of pendingLateStreams) lateStreamWriter.write(registration).catch(() => {});
					pendingLateStreams.length = 0;
					const multiplexedStream = createMultiplexedStream(new ReadableStream({
						start(controller) {
							callbacks.onParse = (value) => {
								controller.enqueue(JSON.stringify(value) + "\n");
							};
							callbacks.onDone = () => {
								try {
									controller.close();
								} catch {}
								lateStreamWriter?.close().catch(() => {}).finally(() => {
									lateStreamWriter = void 0;
								});
							};
							callbacks.onError = (error) => {
								controller.error(error);
								lateStreamWriter?.abort(error).catch(() => {}).finally(() => {
									lateStreamWriter = void 0;
								});
							};
							if (nonStreamingBody !== void 0) callbacks.onParse(nonStreamingBody);
							if (done) callbacks.onDone();
						},
						cancel() {
							lateStreamWriter?.abort().catch(() => {});
							lateStreamWriter = void 0;
						}
					}), rawStreams, lateStreamReadable);
					return new Response(multiplexedStream, {
						status: alsResponse.status,
						statusText: alsResponse.statusText,
						headers: {
							"Content-Type": TSS_CONTENT_TYPE_FRAMED_VERSIONED,
							[X_TSS_SERIALIZED]: "true"
						}
					});
				}
				return new Response(void 0, {
					status: alsResponse.status,
					statusText: alsResponse.statusText
				});
			}
		} catch (error) {
			if (error instanceof Response) return error;
			if (isNotFound(error)) return isNotFoundResponse(error);
			console.info();
			console.info("Server Fn Error!");
			console.info();
			console.error(error);
			console.info();
			const serializedError = JSON.stringify(await Promise.resolve(toCrossJSONAsync(error, {
				refs: /* @__PURE__ */ new Map(),
				plugins: serovalPlugins
			})));
			const response = getResponse();
			return new Response(serializedError, {
				status: response.status ?? 500,
				statusText: response.statusText,
				headers: {
					"Content-Type": "application/json",
					[X_TSS_SERIALIZED]: "true"
				}
			});
		}
	})();
};
function isNotFoundResponse(error) {
	const { headers, ...rest } = error;
	return new Response(JSON.stringify(rest), {
		status: 404,
		headers: {
			"Content-Type": "application/json",
			...headers || {}
		}
	});
}
var LINK_PARAM_TOKEN_RE = /^[!#$%&'*+\-.^_`|~0-9A-Za-z]+$/;
var PRELOAD_AS_VALUES = /* @__PURE__ */ new Set([
	"fetch",
	"font",
	"image",
	"script",
	"style",
	"track"
]);
function buildLinkParam(name, value) {
	if (value === void 0) return name;
	if (LINK_PARAM_TOKEN_RE.test(value)) return `${name}=${value}`;
	return `${name}=${JSON.stringify(value)}`;
}
function serializeEarlyHint(hint) {
	const parts = [`<${hint.href}>`, buildLinkParam("rel", hint.rel)];
	if (hint.as) parts.push(buildLinkParam("as", hint.as));
	if (hint.crossOrigin !== void 0) parts.push(buildLinkParam("crossorigin", hint.crossOrigin || void 0));
	if (hint.type) parts.push(buildLinkParam("type", hint.type));
	if (hint.integrity) parts.push(buildLinkParam("integrity", hint.integrity));
	if (hint.referrerPolicy) parts.push(buildLinkParam("referrerpolicy", hint.referrerPolicy));
	if (hint.fetchPriority) parts.push(buildLinkParam("fetchpriority", hint.fetchPriority));
	return parts.join("; ");
}
function getStringAttr(attrs, name, fallbackName) {
	const value = attrs?.[name] ?? (fallbackName ? attrs?.[fallbackName] : void 0);
	return typeof value === "string" ? value : void 0;
}
function getPreloadAs(attrs) {
	const as = getStringAttr(attrs, "as");
	return as && PRELOAD_AS_VALUES.has(as) ? as : void 0;
}
function addEarlyHintFetchAttrs(hint, attrs) {
	const crossOrigin = getStringAttr(attrs, "crossOrigin", "crossorigin");
	const type = getStringAttr(attrs, "type");
	const integrity = getStringAttr(attrs, "integrity");
	const referrerPolicy = getStringAttr(attrs, "referrerPolicy", "referrerpolicy");
	const fetchPriority = getStringAttr(attrs, "fetchPriority", "fetchpriority");
	if (crossOrigin !== void 0) hint.crossOrigin = crossOrigin;
	if (type) hint.type = type;
	if (integrity) hint.integrity = integrity;
	if (referrerPolicy) hint.referrerPolicy = referrerPolicy;
	if (fetchPriority) hint.fetchPriority = fetchPriority;
}
function linkAttrsToEarlyHint(attrs) {
	const href = getStringAttr(attrs, "href");
	const rel = getStringAttr(attrs, "rel");
	if (!href || !rel) return void 0;
	const relTokens = rel.split(/\s+/);
	let hintRel;
	let hintAs;
	if (relTokens.includes("modulepreload")) {
		hintRel = "modulepreload";
		hintAs = "script";
	} else if (relTokens.includes("stylesheet")) {
		hintRel = "preload";
		hintAs = "style";
	} else if (relTokens.includes("preload")) {
		hintAs = getPreloadAs(attrs);
		if (!hintAs) return void 0;
		hintRel = "preload";
	} else if (relTokens.includes("preconnect")) {
		hintRel = "preconnect";
		hintAs = void 0;
	} else if (relTokens.includes("dns-prefetch")) {
		hintRel = "dns-prefetch";
		hintAs = void 0;
	}
	if (!hintRel) return void 0;
	const hint = {
		href,
		rel: hintRel
	};
	if (hintAs) hint.as = hintAs;
	addEarlyHintFetchAttrs(hint, attrs);
	return hint;
}
function collectStaticHintsFromManifest(manifest, matchedRoutes) {
	const hints = [];
	for (const route of matchedRoutes) {
		const routeManifest = manifest.routes[route.id];
		if (!routeManifest) continue;
		for (const link of routeManifest.preloads ?? []) {
			const attrs = getScriptPreloadAttrs(manifest, link);
			const hint = {
				href: attrs.href,
				rel: attrs.rel,
				as: "script"
			};
			if (attrs.crossOrigin !== void 0) hint.crossOrigin = attrs.crossOrigin;
			hints.push(hint);
		}
		for (const link of routeManifest.css ?? []) {
			const stylesheetHref = getStylesheetHref(link);
			if (manifest.inlineCss?.styles[stylesheetHref] !== void 0) continue;
			const resolvedLink = resolveManifestCssLink(link);
			const hint = {
				href: stylesheetHref,
				rel: "preload",
				as: "style"
			};
			if (resolvedLink.crossOrigin !== void 0) hint.crossOrigin = resolvedLink.crossOrigin;
			hints.push(hint);
		}
	}
	return hints;
}
function collectDynamicHintsFromMatches(matches) {
	const hints = [];
	for (const match of matches) {
		const links = match.links;
		if (!Array.isArray(links)) continue;
		for (const link of links) {
			const hint = linkAttrsToEarlyHint(link);
			if (hint) hints.push(hint);
		}
	}
	return hints;
}
function createEarlyHintsEvent(opts) {
	const nextHints = [];
	const nextLinks = [];
	for (const hint of opts.hints) {
		const link = serializeEarlyHint(hint);
		if (opts.sentLinks.has(link)) continue;
		opts.sentLinks.add(link);
		opts.sentHints.push(hint);
		nextHints.push(hint);
		nextLinks.push(link);
	}
	if (!nextHints.length && opts.phase !== "dynamic") return void 0;
	return {
		phase: opts.phase,
		hints: nextHints,
		links: nextLinks,
		allHints: opts.sentHints.slice(),
		allLinks: Array.from(opts.sentLinks)
	};
}
function createResponseLinkHeaderEntries(opts) {
	for (const hint of opts.hints) {
		const link = serializeEarlyHint(hint);
		if (opts.sentLinks.has(link)) continue;
		opts.sentLinks.add(link);
		opts.entries.push({
			phase: opts.phase,
			hint,
			link
		});
	}
}
function getResponseLinkHeaderEntries(opts) {
	if (!opts.filter) return opts.entries.map((entry) => entry.link);
	try {
		const links = [];
		for (const entry of opts.entries) if (opts.filter(entry)) links.push(entry.link);
		return links;
	} catch (err) {
		console.error("Error filtering response Link headers:", err);
		return [];
	}
}
function notifyEarlyHints(phase, event, onEarlyHints) {
	try {
		const result = onEarlyHints(event);
		if (result) Promise.resolve(result).catch((err) => {
			console.error(`Error sending ${phase} early hints:`, err);
		});
	} catch (err) {
		console.error(`Error sending ${phase} early hints:`, err);
	}
}
function getResponseLinkHeaderFilter(responseLinkHeader) {
	if (typeof responseLinkHeader !== "object") return;
	return responseLinkHeader.filter;
}
function appendResponseLinkHeaders(opts) {
	for (const link of getResponseLinkHeaderEntries(opts)) opts.responseHeaders.append("Link", link);
}
function collectResponseLinkHeaderEntries(opts) {
	for (let index = 0; index < opts.event.hints.length; index++) opts.entries.push({
		phase: opts.phase,
		hint: opts.event.hints[index],
		link: opts.event.links[index]
	});
}
function collectEarlyHintsPhase(opts) {
	const event = opts.onEarlyHints ? createEarlyHintsEvent({
		phase: opts.phase,
		hints: opts.hints,
		sentLinks: opts.sentLinks,
		sentHints: opts.sentHints
	}) : void 0;
	if (event) notifyEarlyHints(opts.phase, event, opts.onEarlyHints);
	if (!opts.responseLinkHeaderEntries) return;
	if (event) {
		collectResponseLinkHeaderEntries({
			phase: opts.phase,
			event,
			entries: opts.responseLinkHeaderEntries
		});
		return;
	}
	createResponseLinkHeaderEntries({
		phase: opts.phase,
		hints: opts.hints,
		sentLinks: opts.sentLinks,
		entries: opts.responseLinkHeaderEntries
	});
}
function createEarlyHintsCollector(opts) {
	if (!opts?.onEarlyHints && !opts?.responseLinkHeader) return;
	const sentLinks = /* @__PURE__ */ new Set();
	const sentHints = opts.onEarlyHints ? new Array() : void 0;
	const responseLinkHeaderEntries = opts.responseLinkHeader ? new Array() : void 0;
	const responseLinkHeaderFilter = getResponseLinkHeaderFilter(opts.responseLinkHeader);
	return {
		collectStatic: ({ manifest, matchedRoutes }) => {
			if (!matchedRoutes?.length) return;
			collectEarlyHintsPhase({
				phase: "static",
				hints: collectStaticHintsFromManifest(manifest, matchedRoutes),
				sentLinks,
				sentHints,
				onEarlyHints: opts.onEarlyHints,
				responseLinkHeaderEntries
			});
		},
		collectDynamic: (matches) => {
			collectEarlyHintsPhase({
				phase: "dynamic",
				hints: collectDynamicHintsFromMatches(matches),
				sentLinks,
				sentHints,
				onEarlyHints: opts.onEarlyHints,
				responseLinkHeaderEntries
			});
		},
		appendResponseHeaders: (headers) => {
			if (!responseLinkHeaderEntries?.length) return;
			appendResponseLinkHeaders({
				responseHeaders: headers,
				entries: responseLinkHeaderEntries,
				filter: responseLinkHeaderFilter
			});
		}
	};
}
function normalizeTransformAssetResult(result) {
	if (typeof result === "string") return { href: result };
	return result;
}
function escapeCssString(value) {
	return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/\n/g, "\\a ").replace(/\r/g, "\\d ").replace(/\f/g, "\\c ");
}
async function transformInlineCssTemplate(options) {
	const { strings, urls } = options.template;
	if (strings.length !== urls.length + 1) throw new Error(`TanStack Start inlineCss template for ${options.stylesheetHref} is invalid`);
	let css = strings[0];
	for (let index = 0; index < urls.length; index++) {
		const transformed = normalizeTransformAssetResult(await options.transformFn({
			kind: "css-url",
			url: urls[index],
			stylesheetHref: options.stylesheetHref
		}));
		css += escapeCssString(transformed.href) + strings[index + 1];
	}
	return css;
}
async function transformInlineCssStyles(inlineCss, transformFn) {
	const transformedStyles = {};
	const transformedEntries = await Promise.all(Object.entries(inlineCss.styles).map(async ([stylesheetHref, css]) => {
		const template = inlineCss.templates?.[stylesheetHref];
		return [stylesheetHref, template ? await transformInlineCssTemplate({
			stylesheetHref,
			template,
			transformFn
		}) : css];
	}));
	for (const [stylesheetHref, css] of transformedEntries) transformedStyles[stylesheetHref] = css;
	return {
		styles: transformedStyles,
		...inlineCss.templates ? { templates: inlineCss.templates } : {}
	};
}
function resolveTransformAssetsCrossOrigin(config, kind) {
	if (!config) return void 0;
	if (typeof config === "string") return config;
	return config[kind];
}
function isObjectShorthand(transform) {
	return "prefix" in transform;
}
function resolveTransformAssetsConfig(transform) {
	if (typeof transform === "string") {
		const prefix = transform;
		return {
			type: "transform",
			transformFn: ({ url }) => ({ href: `${prefix}${url}` }),
			cache: true
		};
	}
	if (typeof transform === "function") return {
		type: "transform",
		transformFn: transform,
		cache: true
	};
	if (isObjectShorthand(transform)) {
		const { prefix, crossOrigin } = transform;
		return {
			type: "transform",
			transformFn: ({ url, kind }) => {
				const href = `${prefix}${url}`;
				if (kind === "css-url") return { href };
				const co = resolveTransformAssetsCrossOrigin(crossOrigin, kind);
				return co ? {
					href,
					crossOrigin: co
				} : { href };
			},
			cache: true
		};
	}
	if ("createTransform" in transform && transform.createTransform) return {
		type: "createTransform",
		createTransform: transform.createTransform,
		cache: transform.cache !== false
	};
	return {
		type: "transform",
		transformFn: typeof transform.transform === "string" ? (({ url }) => ({ href: `${transform.transform}${url}` })) : transform.transform,
		cache: transform.cache !== false
	};
}
function assignManifestLink(link, next) {
	if (typeof link === "string") return next.crossOrigin ? next : next.href;
	const nextLink = {
		...link,
		href: next.href
	};
	if (next.crossOrigin) nextLink.crossOrigin = next.crossOrigin;
	else delete nextLink.crossOrigin;
	return nextLink;
}
async function transformManifestAssets(source, transformFn, _opts) {
	const manifest = structuredClone(source);
	const inlineCssEnabled = _opts?.inlineCss !== false;
	const scriptTransforms = /* @__PURE__ */ new Map();
	const transformScript = (url) => {
		const cached = scriptTransforms.get(url);
		if (cached) return cached;
		const transformed = Promise.resolve(transformFn({
			url,
			kind: "script"
		})).then(normalizeTransformAssetResult);
		scriptTransforms.set(url, transformed);
		return transformed;
	};
	if (!inlineCssEnabled) delete manifest.inlineCss;
	else if (manifest.inlineCss) manifest.inlineCss = await transformInlineCssStyles(manifest.inlineCss, transformFn);
	for (const route of Object.values(manifest.routes)) {
		if (route.preloads?.length) route.preloads = await Promise.all(route.preloads.map(async (link) => {
			const result = await transformScript(resolveManifestAssetLink(link).href);
			return assignManifestLink(link, {
				href: result.href,
				crossOrigin: result.crossOrigin
			});
		}));
		if (route.css?.length && !manifest.inlineCss) route.css = await Promise.all(route.css.map(async (link) => {
			const result = normalizeTransformAssetResult(await transformFn({
				url: resolveManifestCssLink(link).href,
				kind: "stylesheet"
			}));
			return assignManifestLink(link, {
				href: result.href,
				crossOrigin: result.crossOrigin
			});
		}));
		if (route.scripts?.length) for (const script of route.scripts) {
			const src = script.attrs?.src;
			if (typeof src !== "string") continue;
			const result = await transformScript(src);
			script.attrs = {
				...script.attrs,
				src: result.href
			};
			if (result.crossOrigin) script.attrs.crossOrigin = result.crossOrigin;
			else delete script.attrs.crossOrigin;
		}
	}
	return manifest;
}
/**
* Builds a final ServerManifest without URL transforms. Used when no
* transformAssets option is provided.
*
* Returns a new manifest object so the cached base manifest is never mutated.
*/
function buildManifest(source, opts) {
	return {
		...source.scriptFormat ? { scriptFormat: source.scriptFormat } : {},
		...opts?.inlineCss !== false && source.inlineCss ? { inlineCss: structuredClone(source.inlineCss) } : {},
		routes: { ...source.routes }
	};
}
function getStaticHandlerInlineCssDefault(handlerInlineCss) {
	if (typeof handlerInlineCss === "function") return;
	return handlerInlineCss ?? true;
}
async function resolveInlineCssForRequest(opts) {
	if (opts.requestInlineCss !== void 0) return opts.requestInlineCss;
	if (typeof opts.handlerInlineCss === "function") return await opts.handlerInlineCss({ request: opts.request });
	return opts.handlerInlineCss ?? true;
}
function createCachedBaseManifestLoader(loadBaseManifest) {
	let baseManifestPromise;
	return () => {
		if (!baseManifestPromise) baseManifestPromise = loadBaseManifest().catch((error) => {
			baseManifestPromise = void 0;
			throw error;
		});
		return baseManifestPromise;
	};
}
function createFinalManifestTransformResolver(transformAssets, opts) {
	const transformConfig = transformAssets !== void 0 ? resolveTransformAssetsConfig(transformAssets) : void 0;
	const cache = transformConfig ? transformConfig.cache : true;
	const warmup = !!transformAssets && typeof transformAssets === "object" && "warmup" in transformAssets && transformAssets.warmup === true;
	let cachedCreateTransformPromise;
	const clearCachedCreateTransform = () => {
		cachedCreateTransformPromise = void 0;
	};
	return {
		cache,
		warmup,
		clearCachedCreateTransform,
		getTransformFn: async (ctx) => {
			if (!transformConfig) return void 0;
			if (transformConfig.type !== "createTransform") return transformConfig.transformFn;
			if (!cache || !opts.cacheCreateTransform) return transformConfig.createTransform(ctx);
			if (!cachedCreateTransformPromise) cachedCreateTransformPromise = Promise.resolve(transformConfig.createTransform(ctx)).catch((error) => {
				clearCachedCreateTransform();
				throw error;
			});
			return cachedCreateTransformPromise;
		}
	};
}
function createFinalManifestResolver(opts) {
	const finalManifestCache = /* @__PURE__ */ new Map();
	const transformResolver = createFinalManifestTransformResolver(opts.transformAssets, { cacheCreateTransform: opts.cacheCreateTransform });
	const handlerDefaultInlineCss = getStaticHandlerInlineCssDefault(opts.inlineCss);
	const getRequestManifestOptions = async (requestOpts) => {
		const transformFn = await transformResolver.getTransformFn({
			warmup: false,
			request: requestOpts.request
		});
		const inlineCss = await resolveInlineCssForRequest({
			request: requestOpts.request,
			handlerInlineCss: opts.inlineCss,
			requestInlineCss: requestOpts.requestInlineCss
		});
		return {
			getBaseManifest: requestOpts.getBaseManifest,
			transformFn,
			cache: transformResolver.cache,
			inlineCss
		};
	};
	const resolveRequest = async (requestOpts, cache) => {
		return resolveFinalManifest({
			...await getRequestManifestOptions(requestOpts),
			finalManifestCache: cache
		});
	};
	return {
		warmup: ({ getBaseManifest }) => warmupFinalManifest({
			enabled: transformResolver.warmup,
			handlerDefaultInlineCss,
			cache: transformResolver.cache,
			finalManifestCache,
			getBaseManifest,
			getTransformFn: () => transformResolver.getTransformFn({ warmup: true }),
			onError: transformResolver.clearCachedCreateTransform
		}),
		resolveCached: (requestOpts) => resolveRequest(requestOpts, finalManifestCache),
		resolveUncached: (requestOpts) => resolveRequest(requestOpts, void 0)
	};
}
function getFinalManifestCacheKey(inlineCss) {
	return inlineCss ? "inline-css" : "linked-css";
}
function cacheFinalManifestPromise(cachedFinalManifestPromises, cacheKey, promise) {
	const cachedFinalManifestPromise = promise.catch((error) => {
		if (cachedFinalManifestPromises.get(cacheKey) === cachedFinalManifestPromise) cachedFinalManifestPromises.delete(cacheKey);
		throw error;
	});
	cachedFinalManifestPromises.set(cacheKey, cachedFinalManifestPromise);
	return cachedFinalManifestPromise;
}
function getOrCreateCachedFinalManifestPromise(cachedFinalManifestPromises, cacheKey, computeFinalManifest) {
	const cachedFinalManifestPromise = cachedFinalManifestPromises.get(cacheKey);
	if (cachedFinalManifestPromise) return cachedFinalManifestPromise;
	return cacheFinalManifestPromise(cachedFinalManifestPromises, cacheKey, Promise.resolve().then(computeFinalManifest));
}
async function buildFinalManifest(opts) {
	return opts.transformFn ? await transformManifestAssets(opts.base, opts.transformFn, { inlineCss: opts.inlineCss }) : buildManifest(opts.base, { inlineCss: opts.inlineCss });
}
async function resolveFinalManifest(opts) {
	const computeFinalManifest = async () => {
		return buildFinalManifest({
			base: await opts.getBaseManifest(),
			transformFn: opts.transformFn,
			inlineCss: opts.inlineCss
		});
	};
	if (opts.finalManifestCache && (!opts.transformFn || opts.cache)) return getOrCreateCachedFinalManifestPromise(opts.finalManifestCache, getFinalManifestCacheKey(opts.inlineCss), computeFinalManifest);
	return computeFinalManifest();
}
function warmupFinalManifest(opts) {
	if (!opts.enabled || opts.handlerDefaultInlineCss === void 0 || !opts.cache) return;
	const inlineCss = opts.handlerDefaultInlineCss;
	const warmupPromise = getOrCreateCachedFinalManifestPromise(opts.finalManifestCache, getFinalManifestCacheKey(inlineCss), async () => {
		const [base, transformFn] = await Promise.all([opts.getBaseManifest(), opts.getTransformFn()]);
		return buildFinalManifest({
			base,
			transformFn,
			inlineCss
		});
	});
	if (opts.onError) warmupPromise.catch(opts.onError);
	return warmupPromise;
}
var ServerFunctionSerializationAdapter = createSerializationAdapter({
	key: "$TSS/serverfn",
	test: (v) => {
		if (typeof v !== "function") return false;
		if (!(TSS_SERVER_FUNCTION in v)) return false;
		return !!v[TSS_SERVER_FUNCTION];
	},
	toSerializable: ({ serverFnMeta }) => ({ functionId: serverFnMeta.id }),
	fromSerializable: ({ functionId }) => {
		const fn = async (opts, signal) => {
			return (await (await getServerFnById(functionId, { origin: "client" }))(opts ?? {}, signal)).result;
		};
		return fn;
	}
});
function getStartResponseHeaders(opts) {
	return mergeHeaders({ "Content-Type": "text/html; charset=utf-8" }, ..._getRenderedMatches(opts.router.stores.matches.get()).map((match) => {
		return match.headers;
	}));
}
var entriesPromise;
var defaultCsrfMiddleware = createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" });
var getCachedBaseManifest = createCachedBaseManifestLoader(() => getStartManifest());
var getProdBaseManifest = () => getCachedBaseManifest();
var getBaseManifest = getProdBaseManifest;
var createEarlyHintsForRequest = createEarlyHintsCollector;
async function loadEntries() {
	const [routerEntry, startEntry, pluginAdapters] = await Promise.all([
		import("./router-DfZaL7a3.mjs").then((n) => n.t),
		import("./start-RKGGYzjZ.mjs"),
		import("./empty-plugin-adapters-D9UWiqvJ.mjs")
	]);
	return {
		routerEntry,
		startEntry,
		pluginAdapters
	};
}
function getEntries() {
	if (!entriesPromise) entriesPromise = loadEntries();
	return entriesPromise;
}
var ROUTER_BASEPATH = "/";
var SERVER_FN_BASE = "/_serverFn/";
var IS_PRERENDERING = process.env.TSS_PRERENDERING === "true";
var IS_SHELL_ENV = process.env.TSS_SHELL === "true";
var IS_DEV = false;
var ERR_NO_RESPONSE = IS_DEV ? `It looks like you forgot to return a response from your server route handler. If you want to defer to the app router, make sure to have a component set in this route.` : "Internal Server Error";
var ERR_NO_DEFER = IS_DEV ? `You cannot defer to the app router if there is no component defined on this route.` : "Internal Server Error";
function throwRouteHandlerError() {
	throw new Error(ERR_NO_RESPONSE);
}
function throwIfMayNotDefer() {
	throw new Error(ERR_NO_DEFER);
}
/**
* Check if a value is a special response (Response or Redirect)
*/
function isSpecialResponse(value) {
	return value instanceof Response || isRedirect(value);
}
/**
* Normalize middleware result to context shape
*/
function handleCtxResult(result) {
	if (isSsrResponse(result) || isSpecialResponse(result)) return { response: result };
	return result;
}
function disposeLateResponse(result, signal) {
	const response = handleCtxResult(result)?.response;
	if (isSsrResponse(response) || isSpecialResponse(response)) disposeSsrResponseDetached(response, signal.reason);
}
function isSignalAborted(signal) {
	return signal.aborted;
}
/**
* Execute a middleware chain
*/
async function executeMiddleware(middlewares, ctx, signal) {
	let index = -1;
	let streamResponse;
	let retiredStreamIdentities;
	const isResponseAlias = (candidate, response) => candidate === response || candidate instanceof Response && response.body !== null && candidate.body === response.body;
	const setResponse = (response) => {
		if (isSsrResponse(response)) {
			if (response.serverSsrCleanup === "stream") streamResponse = response;
			ctx.response = response.response;
			return;
		}
		ctx.response = response;
	};
	const disposeStreamResponse = async (reason) => {
		const response = streamResponse;
		if (!response) return;
		streamResponse = void 0;
		retiredStreamIdentities ??= /* @__PURE__ */ new WeakSet();
		retiredStreamIdentities.add(response.response);
		if (response.response.body) retiredStreamIdentities.add(response.response.body);
		const currentResponse = ctx.response;
		if (isResponseAlias(currentResponse, response.response)) ctx.response = void 0;
		await response.dispose(reason);
	};
	const disposeAbandonedResult = (result) => {
		const exposed = handleCtxResult(result)?.response;
		const response = isSsrResponse(exposed) ? exposed.response : exposed;
		if (streamResponse && isResponseAlias(response, streamResponse.response)) {
			disposeStreamResponse(signal.reason).catch(console.error);
			return;
		}
		if (response instanceof Response && retiredStreamIdentities && (retiredStreamIdentities.has(response) || response.body !== null && retiredStreamIdentities.has(response.body))) return;
		disposeLateResponse(result, signal);
	};
	const getFinalResponse = async () => {
		const response = ctx.response;
		if (!response) throwRouteHandlerError();
		if (!streamResponse) return response;
		if (response === streamResponse.response) return streamResponse;
		if (streamResponse.response.body !== null && response.body === streamResponse.response.body) return {
			...streamResponse,
			response
		};
		await disposeStreamResponse("middleware response replaced");
		return response;
	};
	let nextPromise;
	function next(nextCtx) {
		const result = runNext(nextCtx);
		nextPromise = result;
		return result;
	}
	async function runNext(nextCtx) {
		if (signal.aborted) throw signal.reason;
		if (nextCtx) {
			if (nextCtx.context) ctx.context = safeObjectMerge(ctx.context, nextCtx.context);
			for (const key of Object.keys(nextCtx)) if (key === "response") setResponse(nextCtx.response);
			else if (key !== "context") ctx[key] = nextCtx[key];
		}
		index++;
		const middleware = middlewares[index];
		if (!middleware) return ctx;
		let result;
		try {
			const pending = middleware({
				...ctx,
				next
			});
			if (pending === nextPromise) {
				nextPromise = void 0;
				result = await pending;
				if (isSignalAborted(signal)) {
					disposeAbandonedResult(result);
					throw signal.reason;
				}
			} else result = await waitForRequest(pending, signal, disposeAbandonedResult);
		} catch (err) {
			if (isSignalAborted(signal)) throw signal.reason;
			if (isSpecialResponse(err)) {
				setResponse(err);
				return ctx;
			}
			throw err;
		}
		const normalized = handleCtxResult(result);
		if (normalized) {
			if (normalized.response !== void 0) setResponse(normalized.response);
			if (normalized.context) ctx.context = safeObjectMerge(ctx.context, normalized.context);
		}
		return ctx;
	}
	try {
		await runNext();
		const response = await waitForRequest(getFinalResponse(), signal, disposeAbandonedResult);
		if (signal.aborted) {
			disposeAbandonedResult(response);
			throw signal.reason;
		}
		return {
			ctx,
			response
		};
	} catch (err) {
		const disposal = disposeStreamResponse(signal.aborted ? signal.reason : err);
		if (signal.aborted) disposal.catch(console.error);
		else await disposal;
		throw err;
	}
}
/**
* Wrap a route handler as middleware
*/
function handlerToMiddleware(handler, mayDefer = false) {
	if (mayDefer) return handler;
	return async (ctx) => {
		const response = await handler({
			...ctx,
			next: throwIfMayNotDefer
		});
		if (!response) throwRouteHandlerError();
		return response;
	};
}
/**
* Creates the TanStack Start request handler.
*
* @example Backwards-compatible usage (handler callback only):
* ```ts
* export default createStartHandler(defaultStreamHandler)
* ```
*
* @example With CDN URL rewriting:
* ```ts
* export default createStartHandler({
*   handler: defaultStreamHandler,
*   transformAssets: 'https://cdn.example.com',
* })
* ```
*
* @example With per-request URL rewriting:
* ```ts
* export default createStartHandler({
*   handler: defaultStreamHandler,
*   transformAssets: {
*     transform: ({ url }) => {
*       const cdnBase = getRequest().headers.get('x-cdn-base') || ''
*       return { href: `${cdnBase}${url}` }
*     },
*     cache: false,
*   },
* })
* ```
*/
function createStartHandler(cbOrOptions) {
	const handlerOptions = typeof cbOrOptions === "function" ? {} : cbOrOptions;
	const cb = typeof cbOrOptions === "function" ? cbOrOptions : cbOrOptions.handler;
	const finalManifestResolver = createFinalManifestResolver({
		...handlerOptions,
		cacheCreateTransform: true
	});
	const resolveManifestForRequest = finalManifestResolver.resolveCached;
	finalManifestResolver.warmup({ getBaseManifest: () => getBaseManifest(void 0) });
	const startRequestResolver = async (request, requestOpts) => {
		let router = null;
		let responseOwnsCleanup = false;
		try {
			request.signal.throwIfAborted();
			const { url, handledProtocolRelativeURL } = getNormalizedURL(request.url);
			const href = url.pathname + url.search + url.hash;
			const origin = getOrigin(request);
			if (handledProtocolRelativeURL) return Response.redirect(url, 308);
			const entries = await waitForRequest(getEntries(), request.signal);
			const hasStartInstance = !!entries.startEntry.startInstance;
			const startOptions = await waitForRequest(entries.startEntry.startInstance?.getOptions(), request.signal) || {};
			const { hasPluginAdapters, pluginSerializationAdapters } = entries.pluginAdapters;
			const serializationAdapters = [
				...startOptions.serializationAdapters || [],
				...hasPluginAdapters ? pluginSerializationAdapters : [],
				ServerFunctionSerializationAdapter
			];
			const requestStartOptions = {
				...startOptions,
				requestMiddleware: hasStartInstance ? startOptions.requestMiddleware : [defaultCsrfMiddleware],
				serializationAdapters
			};
			const flattenedRequestMiddlewares = requestStartOptions.requestMiddleware ? flattenMiddlewares(requestStartOptions.requestMiddleware) : [];
			const executedRequestMiddlewares = new Set(flattenedRequestMiddlewares);
			const getRouter = async () => {
				if (router) return router;
				router = await waitForRequest(entries.routerEntry.getRouter(), request.signal);
				let isShell = IS_SHELL_ENV;
				if (IS_PRERENDERING && !isShell) isShell = request.headers.get(HEADERS.TSS_SHELL) === "true";
				const history = createMemoryHistory({ initialEntries: [href] });
				router.update({
					history,
					isShell,
					isPrerendering: IS_PRERENDERING,
					origin: router.options.origin ?? origin,
					defaultSsr: requestStartOptions.defaultSsr,
					serializationAdapters: [...requestStartOptions.serializationAdapters, ...router.options.serializationAdapters || []],
					basepath: ROUTER_BASEPATH
				});
				return router;
			};
			if (SERVER_FN_BASE && url.pathname.startsWith(SERVER_FN_BASE)) {
				const serverFnId = url.pathname.slice(SERVER_FN_BASE.length).split("/")[0];
				if (!serverFnId) throw new Error("Invalid server action param for serverFnId");
				const serverFnHandler = async ({ context }) => {
					return runWithStartContext({
						getRouter,
						startOptions: requestStartOptions,
						contextAfterGlobalMiddlewares: context,
						request,
						executedRequestMiddlewares,
						handlerType: "serverFn"
					}, () => handleServerAction({
						request,
						context: requestOpts?.context,
						serverFnId
					}));
				};
				const { response: middlewareResponse } = await executeMiddleware([...flattenedRequestMiddlewares.map((d) => d.options.server), serverFnHandler], {
					request,
					pathname: url.pathname,
					handlerType: "serverFn",
					context: createNullProtoObject(requestOpts?.context)
				}, request.signal);
				const result = await handleRedirectResponse(middlewareResponse, request, getRouter, request.signal);
				bindSsrResponseToRequest(router ?? void 0, result, request.signal);
				request.signal.throwIfAborted();
				responseOwnsCleanup = result.serverSsrCleanup === "stream";
				return result.response;
			}
			const executeRouter = async (serverContext, matchedRoutes) => {
				const acceptParts = (request.headers.get("Accept") || "*/*").split(",");
				if (!["*/*", "text/html"].some((mimeType) => acceptParts.some((part) => part.trim().startsWith(mimeType)))) return normalizeSsrResponse(Response.json({ error: "Only HTML requests are supported here" }, { status: 500 }));
				const manifest = await waitForRequest(resolveManifestForRequest({
					request,
					requestInlineCss: requestOpts?.inlineCss,
					getBaseManifest: () => getBaseManifest(matchedRoutes)
				}), request.signal);
				const earlyHints = createEarlyHintsForRequest({
					onEarlyHints: requestOpts?.onEarlyHints,
					responseLinkHeader: requestOpts?.responseLinkHeader
				});
				earlyHints?.collectStatic({
					manifest,
					matchedRoutes
				});
				const routerInstance = await getRouter();
				attachRouterServerSsrUtils({
					router: routerInstance,
					manifest,
					getRequestAssets: () => getStartContext({ throwIfNotFound: false })?.requestAssets
				});
				routerInstance.options.additionalContext = { serverContext };
				await routerInstance.load({ _signal: request.signal });
				request.signal.throwIfAborted();
				if (routerInstance._serverResult?.type === "redirect") return normalizeSsrResponse(routerInstance._serverResult.redirect);
				earlyHints?.collectDynamic(_getRenderedMatches(routerInstance.stores.matches.get()));
				const ctx = getStartContext({ throwIfNotFound: false });
				await waitForRequest(routerInstance.serverSsr.dehydrate({ requestAssets: ctx?.requestAssets }), request.signal);
				request.signal.throwIfAborted();
				const responseHeaders = getStartResponseHeaders({ router: routerInstance });
				earlyHints?.appendResponseHeaders(responseHeaders);
				request.signal.throwIfAborted();
				return normalizeSsrResponse(await waitForRequest(cb({
					request,
					router: routerInstance,
					responseHeaders
				}), request.signal, (late) => disposeLateResponse(late, request.signal)));
			};
			const requestHandlerMiddleware = async ({ context }) => {
				return runWithStartContext({
					getRouter,
					startOptions: requestStartOptions,
					contextAfterGlobalMiddlewares: context,
					request,
					executedRequestMiddlewares,
					handlerType: "router"
				}, async () => {
					try {
						return await handleServerRoutes({
							getRouter,
							request,
							url,
							executeRouter,
							context,
							executedRequestMiddlewares
						});
					} catch (err) {
						if (err instanceof Response) return err;
						throw err;
					}
				});
			};
			const { response: middlewareResponse } = await executeMiddleware([...flattenedRequestMiddlewares.map((d) => d.options.server), requestHandlerMiddleware], {
				request,
				pathname: url.pathname,
				handlerType: "router",
				context: createNullProtoObject(requestOpts?.context)
			}, request.signal);
			const response = await handleRedirectResponse(middlewareResponse, request, getRouter, request.signal);
			bindSsrResponseToRequest(router ?? void 0, response, request.signal);
			request.signal.throwIfAborted();
			responseOwnsCleanup = response.serverSsrCleanup === "stream";
			return response.response;
		} finally {
			if (router?.serverSsr && !responseOwnsCleanup) router.serverSsr.cleanup();
			router = null;
		}
	};
	return requestHandler(startRequestResolver);
}
async function handleRedirectResponse(response, request, getRouter, signal) {
	signal.throwIfAborted();
	const ssrResponse = normalizeSsrResponse(response);
	if (!isRedirect(ssrResponse.response)) return ssrResponse;
	if (isResolvedRedirect(ssrResponse.response)) {
		if (request.headers.get("x-tsr-serverFn") === "true") return waitForRequest(replaceSsrResponse(ssrResponse, Response.json({
			...ssrResponse.response.options,
			isSerializedRedirect: true
		}, { headers: ssrResponse.response.headers }), "redirect response replaced"), signal);
		return ssrResponse;
	}
	const opts = ssrResponse.response.options;
	if (opts.to && typeof opts.to === "string" && !opts.to.startsWith("/")) throw new Error(`Server side redirects must use absolute paths via the 'href' or 'to' options. The redirect() method's "to" property accepts an internal path only. Use the "href" property to provide an external URL. Received: ${JSON.stringify(opts)}`);
	if ([
		"params",
		"search",
		"hash"
	].some((d) => typeof opts[d] === "function")) throw new Error(`Server side redirects must use static search, params, and hash values and do not support functional values. Received functional values for: ${Object.keys(opts).filter((d) => typeof opts[d] === "function").map((d) => `"${d}"`).join(", ")}`);
	signal.throwIfAborted();
	const router = await waitForRequest(getRouter(), signal);
	signal.throwIfAborted();
	const redirect = router.resolveRedirect(ssrResponse.response);
	if (request.headers.get("x-tsr-serverFn") === "true") return waitForRequest(replaceSsrResponse(ssrResponse, Response.json({
		...ssrResponse.response.options,
		isSerializedRedirect: true
	}, { headers: ssrResponse.response.headers }), "redirect response replaced"), signal);
	return waitForRequest(replaceSsrResponse(ssrResponse, redirect, "redirect response replaced"), signal);
}
async function handleServerRoutes({ getRouter, request, url, executeRouter, context, executedRequestMiddlewares }) {
	const router = await getRouter();
	const pathname = executeRewriteInput(router.rewrite, url).pathname;
	const [matchedRoutes, rawParams, foundRoute] = router.getMatchedRoutes(pathname);
	const isExactMatch = foundRoute && rawParams["**"] === void 0;
	const routeMiddlewares = [];
	for (const route of matchedRoutes) {
		const serverMiddleware = route.options.server?.middleware;
		if (serverMiddleware) {
			const flattened = flattenMiddlewares(serverMiddleware);
			for (const m of flattened) if (!executedRequestMiddlewares.has(m)) routeMiddlewares.push(m.options.server);
		}
	}
	const server = foundRoute?.options.server;
	let isHeadFallback = false;
	if (server?.handlers && isExactMatch) {
		const handlers = typeof server.handlers === "function" ? server.handlers({ createHandlers: (d) => d }) : server.handlers;
		const requestMethod = request.method.toUpperCase();
		const handler = requestMethod === "HEAD" ? handlers["HEAD"] ?? handlers["GET"] ?? handlers["ANY"] : handlers[requestMethod] ?? handlers["ANY"];
		isHeadFallback = requestMethod === "HEAD" && handler !== void 0 && !handlers["HEAD"];
		if (handler) {
			const mayDefer = !!foundRoute.options.component;
			if (typeof handler === "function") routeMiddlewares.push(handlerToMiddleware(handler, mayDefer));
			else {
				if (handler.middleware?.length) {
					const handlerMiddlewares = flattenMiddlewares(handler.middleware);
					for (const m of handlerMiddlewares) routeMiddlewares.push(m.options.server);
				}
				if (handler.handler) routeMiddlewares.push(handlerToMiddleware(handler.handler, mayDefer));
			}
		}
	}
	routeMiddlewares.push(((ctx) => executeRouter(ctx.context, matchedRoutes)));
	const { ctx, response } = await executeMiddleware(routeMiddlewares, {
		request,
		context,
		params: rawParams,
		pathname,
		handlerType: "router"
	}, request.signal);
	if (isHeadFallback) {
		if (!ctx.response) throwRouteHandlerError();
		return waitForRequest(stripSsrResponseBody(await handleRedirectResponse(response, request, getRouter, request.signal), "HEAD body stripped"), request.signal);
	}
	return normalizeSsrResponse(response);
}
var server_exports = /* @__PURE__ */ __exportAll({
	createServerEntry: () => createServerEntry,
	default: () => server_default
});
var fetch = createStartHandler(defaultStreamHandler);
function createServerEntry(entry) {
	return { async fetch(...args) {
		return await entry.fetch(...args);
	} };
}
var server_default = createServerEntry({ fetch });
//#endregion
export { getServerFnById as a, getCookie as i, __exportAll as n, server_BlyqvE9x_exports as o, createServerFn as r, setCookie$1 as s, TSS_SERVER_FUNCTION as t };
