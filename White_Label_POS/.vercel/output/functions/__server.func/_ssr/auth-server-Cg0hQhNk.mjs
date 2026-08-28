import { a as getServerFnById, r as createServerFn, t as TSS_SERVER_FUNCTION } from "./server-po8kJpue.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-server-Cg0hQhNk.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var loginServerFn = createServerFn().validator((d) => d).handler(createSsrRpc("8e8d08ebeb3fb5a0a13e6b3bfd5f964189086654977eb387990b9479b750858e"));
var pinLoginServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("f01a4a6bd7ad4a41a1a466a26156ed9ff41a0ac25cc8daefa577f4328ba72aba"));
var resetCashierPinSelfFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("db2b01e5a7cc022d51b0b932ff42f5d70e0de3315b3f831c2c3af6261c7bf2dd"));
var getBranchCashiersAndTillsFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createSsrRpc("85473fdc187de9e9e151bcd65f4e32d533aa881e732c56ed3a924402e1b471d4"));
var getSessionServerFn = createServerFn().handler(createSsrRpc("e97d0fe6ffb093beb6c00dc5887ee644c0332cb4f8cf94f02b0535bf24579ad0"));
var logoutServerFn = createServerFn().handler(createSsrRpc("068b3caffa68c22de8c29b81b02fb27b071ad2f77cc1a2cc6a9a88e69a42f42f"));
var getTenantsAndBranchesFn = createServerFn().handler(createSsrRpc("364df443a5c6270c83dfe0809ecf976019e413f5145778c1f582d07678257ed7"));
//#endregion
export { loginServerFn as a, resetCashierPinSelfFn as c, getTenantsAndBranchesFn as i, getBranchCashiersAndTillsFn as n, logoutServerFn as o, getSessionServerFn as r, pinLoginServerFn as s, createSsrRpc as t };
