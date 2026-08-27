import { i as getCookie, r as createServerFn, s as setCookie$1 } from "./server-ClsFrK2I.mjs";
import { a as eq, i as and, r as desc } from "../_libs/drizzle-orm+postgres.mjs";
import { E as staffUsers, I as vendors, L as createServerRpc, M as tills, T as shifts, d as loginAttempts, i as branches, j as tenants, t as db } from "./db-CvXguwya.mjs";
import { n as jwtVerify, t as SignJWT } from "../_libs/jose.mjs";
import * as argon2 from "argon2";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-server-nuxXgz6q.js
var JWT_SECRET = new TextEncoder().encode(process.env["JWT_SECRET"] || "pos-secret-key-at-least-32-characters-long-key-string-for-jwt");
var dbRoleToFrontendRole = {
	super_admin: "Super Admin",
	head_office_admin: "Head Office Admin",
	branch_manager: "Branch Manager",
	inventory_manager: "Inventory Manager",
	purchasing_officer: "Purchasing Officer",
	cashier: "Cashier",
	vendor: "Vendor"
};
var loginServerFn_createServerFn_handler = createServerRpc({
	id: "8e8d08ebeb3fb5a0a13e6b3bfd5f964189086654977eb387990b9479b750858e",
	name: "loginServerFn",
	filename: "src/lib/auth-server.ts"
}, (opts) => loginServerFn.__executeServer(opts));
var loginServerFn = createServerFn().validator((d) => d).handler(loginServerFn_createServerFn_handler, async ({ data }) => {
	const { email, password } = data;
	try {
		const user = await db.query.staffUsers.findFirst({ where: eq(staffUsers.email, email) });
		let id;
		let tenantId;
		let branchId = null;
		let frontendRole;
		let passwordHashStr;
		if (user) {
			if (!user.isActive) throw new Error("User account is suspended");
			if (!user.passwordHash) throw new Error("This account uses a PIN for login. Please switch to 'Cashier PIN Login' tab.");
			id = user.id;
			tenantId = user.tenantId;
			branchId = user.branchId;
			frontendRole = dbRoleToFrontendRole[user.role] || "Vendor";
			passwordHashStr = user.passwordHash;
		} else {
			const vendorUser = await db.query.vendors.findFirst({ where: eq(vendors.email, email) });
			if (!vendorUser || !vendorUser.passwordHash) throw new Error("Invalid email or password");
			id = vendorUser.id;
			tenantId = vendorUser.tenantId;
			frontendRole = "Vendor";
			passwordHashStr = vendorUser.passwordHash;
		}
		if (!await argon2.verify(passwordHashStr, password)) throw new Error("Invalid email or password");
		const token = await new SignJWT({
			id,
			email,
			role: frontendRole,
			tenantId,
			branchId
		}).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("24h").sign(JWT_SECRET);
		setCookie$1("pos_session", token, {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/",
			maxAge: 86400
		});
		let tenantName = "";
		if (tenantId) {
			const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, tenantId) });
			if (!tenant) throw new Error("Tenant not found");
			if (tenant.status === "Archived") throw new Error("Tenant is archived and cannot be accessed");
			tenantName = tenant.name;
		}
		return {
			success: true,
			user: {
				id,
				email,
				role: frontendRole,
				tenantId,
				tenantName,
				branchId
			}
		};
	} catch (err) {
		console.error("Login failed on server:", err);
		return {
			success: false,
			error: err.message || "Authentication failed"
		};
	}
});
async function checkRateLimit(identifier) {
	const record = await db.query.loginAttempts.findFirst({ where: eq(loginAttempts.identifier, identifier) });
	if (record && record.lockedUntil && new Date(record.lockedUntil) > /* @__PURE__ */ new Date()) {
		const remainingMin = Math.ceil((new Date(record.lockedUntil).getTime() - (/* @__PURE__ */ new Date()).getTime()) / 6e4);
		throw new Error(`Too many failed attempts. Try again in ${remainingMin} minutes.`);
	}
}
async function recordFailedAttempt(identifier) {
	const lockoutDuration = 9e5;
	const maxAttempts = 5;
	const record = await db.query.loginAttempts.findFirst({ where: eq(loginAttempts.identifier, identifier) });
	if (!record) await db.insert(loginAttempts).values({
		identifier,
		attempts: 1
	});
	else {
		const nextAttempts = record.attempts + 1;
		if (nextAttempts >= maxAttempts) {
			const lockedUntil = new Date((/* @__PURE__ */ new Date()).getTime() + lockoutDuration);
			await db.update(loginAttempts).set({
				attempts: nextAttempts,
				lockedUntil
			}).where(eq(loginAttempts.id, record.id));
			console.warn(`SECURITY AUDIT: Account locked for identifier ${identifier} until ${lockedUntil}`);
		} else await db.update(loginAttempts).set({ attempts: nextAttempts }).where(eq(loginAttempts.id, record.id));
	}
}
async function resetFailedAttempts(identifier) {
	const record = await db.query.loginAttempts.findFirst({ where: eq(loginAttempts.identifier, identifier) });
	if (record) await db.update(loginAttempts).set({
		attempts: 0,
		lockedUntil: null
	}).where(eq(loginAttempts.id, record.id));
}
var pinLoginServerFn_createServerFn_handler = createServerRpc({
	id: "f01a4a6bd7ad4a41a1a466a26156ed9ff41a0ac25cc8daefa577f4328ba72aba",
	name: "pinLoginServerFn",
	filename: "src/lib/auth-server.ts"
}, (opts) => pinLoginServerFn.__executeServer(opts));
var pinLoginServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(pinLoginServerFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, branchId, cashierId, tillId, pin } = data;
	if (!cashierId || !tillId || !pin) throw new Error("Invalid cashier, till, or PIN code.");
	await checkRateLimit(cashierId);
	try {
		const cashier = await db.query.staffUsers.findFirst({ where: and(eq(staffUsers.id, cashierId), eq(staffUsers.tenantId, tenantId), eq(staffUsers.branchId, branchId), eq(staffUsers.role, "cashier"), eq(staffUsers.isActive, true)) });
		if (!cashier) {
			await recordFailedAttempt(cashierId);
			throw new Error("Invalid cashier, till, or PIN code.");
		}
		if (!(cashier.pinHash ? await argon2.verify(cashier.pinHash, pin) : false)) {
			await recordFailedAttempt(cashierId);
			throw new Error("Invalid cashier, till, or PIN code.");
		}
		const till = await db.query.tills.findFirst({ where: and(eq(tills.id, tillId), eq(tills.tenantId, tenantId), eq(tills.branchId, branchId)) });
		if (!till) {
			await recordFailedAttempt(cashierId);
			throw new Error("Invalid cashier, till, or PIN code.");
		}
		const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
		const scheduledShift = await db.query.shifts.findFirst({ where: and(eq(shifts.cashierId, cashierId), eq(shifts.shiftDate, today), eq(shifts.status, "Scheduled")) });
		if (scheduledShift && scheduledShift.tillId !== tillId && scheduledShift.tillId !== till.name) {
			await recordFailedAttempt(cashierId);
			throw new Error("The selected till terminal does not match your scheduled shift assignment.");
		}
		const activeTillShift = await db.query.shifts.findFirst({ where: and(eq(shifts.tillId, tillId), eq(shifts.status, "Open")) });
		if (activeTillShift && activeTillShift.cashierId !== cashierId) {
			await recordFailedAttempt(cashierId);
			throw new Error("This till terminal is currently in use by another cashier.");
		}
		await resetFailedAttempts(cashierId);
		const frontendRole = "Cashier";
		const token = await new SignJWT({
			id: cashier.id,
			email: cashier.email,
			role: frontendRole,
			tenantId: cashier.tenantId,
			branchId: cashier.branchId,
			tillId: till.id,
			tillName: till.name
		}).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("24h").sign(JWT_SECRET);
		setCookie$1("pos_session", token, {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/",
			maxAge: 86400
		});
		let tenantName = "";
		if (cashier.tenantId) {
			const tenant = await db.query.tenants.findFirst({ where: eq(tenants.id, cashier.tenantId) });
			if (!tenant) throw new Error("Tenant not found");
			if (tenant.status === "Archived") throw new Error("Tenant is archived and cannot be accessed");
			tenantName = tenant.name;
		}
		return {
			success: true,
			user: {
				id: cashier.id,
				email: cashier.email,
				role: frontendRole,
				tenantId: cashier.tenantId,
				tenantName,
				branchId: cashier.branchId
			}
		};
	} catch (err) {
		console.error("PIN login failed on server:", err);
		return {
			success: false,
			error: err.message || "Authentication failed"
		};
	}
});
var resetCashierPinSelfFn_createServerFn_handler = createServerRpc({
	id: "db2b01e5a7cc022d51b0b932ff42f5d70e0de3315b3f831c2c3af6261c7bf2dd",
	name: "resetCashierPinSelfFn",
	filename: "src/lib/auth-server.ts"
}, (opts) => resetCashierPinSelfFn.__executeServer(opts));
var resetCashierPinSelfFn = createServerFn({ method: "POST" }).validator((d) => d).handler(resetCashierPinSelfFn_createServerFn_handler, async ({ data }) => {
	const { email, currentPass, newPin, confirmPin } = data;
	if (!email || !currentPass || !newPin || !confirmPin) throw new Error("All fields are required.");
	if (newPin !== confirmPin) throw new Error("PIN and confirmation PIN do not match.");
	if (!/^\d{4}$/.test(newPin)) throw new Error("PIN must be exactly 4 digits.");
	await checkRateLimit(email);
	try {
		const cashier = await db.query.staffUsers.findFirst({ where: and(eq(staffUsers.email, email), eq(staffUsers.role, "cashier"), eq(staffUsers.isActive, true)) });
		if (!cashier || !cashier.passwordHash) {
			await recordFailedAttempt(email);
			throw new Error("Invalid credentials.");
		}
		if (!await argon2.verify(cashier.passwordHash, currentPass)) {
			await recordFailedAttempt(email);
			throw new Error("Invalid credentials.");
		}
		const hashed = await argon2.hash(newPin);
		await db.update(staffUsers).set({ pinHash: hashed }).where(eq(staffUsers.id, cashier.id));
		await resetFailedAttempts(email);
		return { success: true };
	} catch (err) {
		return {
			success: false,
			error: err.message || "Failed to reset PIN"
		};
	}
});
var getBranchCashiersAndTillsFn_createServerFn_handler = createServerRpc({
	id: "85473fdc187de9e9e151bcd65f4e32d533aa881e732c56ed3a924402e1b471d4",
	name: "getBranchCashiersAndTillsFn",
	filename: "src/lib/auth-server.ts"
}, (opts) => getBranchCashiersAndTillsFn.__executeServer(opts));
var getBranchCashiersAndTillsFn = createServerFn({ method: "POST" }).validator((d) => d).handler(getBranchCashiersAndTillsFn_createServerFn_handler, async ({ data }) => {
	const { tenantId, branchId } = data;
	try {
		return {
			success: true,
			cashiers: await db.query.staffUsers.findMany({
				where: and(eq(staffUsers.tenantId, tenantId), eq(staffUsers.branchId, branchId), eq(staffUsers.role, "cashier"), eq(staffUsers.isActive, true)),
				columns: {
					id: true,
					name: true,
					email: true
				}
			}),
			tills: await db.query.tills.findMany({
				where: and(eq(tills.tenantId, tenantId), eq(tills.branchId, branchId)),
				orderBy: [desc(tills.createdAt)]
			})
		};
	} catch (err) {
		return {
			success: false,
			error: err.message || "Failed to load branch details"
		};
	}
});
var getSessionServerFn_createServerFn_handler = createServerRpc({
	id: "e97d0fe6ffb093beb6c00dc5887ee644c0332cb4f8cf94f02b0535bf24579ad0",
	name: "getSessionServerFn",
	filename: "src/lib/auth-server.ts"
}, (opts) => getSessionServerFn.__executeServer(opts));
var getSessionServerFn = createServerFn().handler(getSessionServerFn_createServerFn_handler, async () => {
	const token = getCookie("pos_session");
	if (!token) return {
		success: false,
		error: "No session found"
	};
	try {
		const { payload } = await jwtVerify(token, JWT_SECRET);
		return {
			success: true,
			session: {
				id: payload["id"],
				email: payload["email"],
				role: payload["role"],
				tenantId: payload["tenantId"],
				branchId: payload["branchId"],
				tillId: payload["tillId"]
			}
		};
	} catch (err) {
		return {
			success: false,
			error: "Session invalid or expired"
		};
	}
});
var logoutServerFn_createServerFn_handler = createServerRpc({
	id: "068b3caffa68c22de8c29b81b02fb27b071ad2f77cc1a2cc6a9a88e69a42f42f",
	name: "logoutServerFn",
	filename: "src/lib/auth-server.ts"
}, (opts) => logoutServerFn.__executeServer(opts));
var logoutServerFn = createServerFn().handler(logoutServerFn_createServerFn_handler, async () => {
	setCookie$1("pos_session", "", {
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		path: "/",
		maxAge: 0
	});
	return { success: true };
});
var getTenantsAndBranchesFn_createServerFn_handler = createServerRpc({
	id: "364df443a5c6270c83dfe0809ecf976019e413f5145778c1f582d07678257ed7",
	name: "getTenantsAndBranchesFn",
	filename: "src/lib/auth-server.ts"
}, (opts) => getTenantsAndBranchesFn.__executeServer(opts));
var getTenantsAndBranchesFn = createServerFn().handler(getTenantsAndBranchesFn_createServerFn_handler, async () => {
	try {
		return {
			success: true,
			tenants: await db.select().from(tenants).where(eq(tenants.status, "Active")),
			branches: await db.select().from(branches).where(eq(branches.status, "Active"))
		};
	} catch (err) {
		return {
			success: false,
			error: err.message || "Failed to load branches"
		};
	}
});
//#endregion
export { getBranchCashiersAndTillsFn_createServerFn_handler, getSessionServerFn_createServerFn_handler, getTenantsAndBranchesFn_createServerFn_handler, loginServerFn_createServerFn_handler, logoutServerFn_createServerFn_handler, pinLoginServerFn_createServerFn_handler, resetCashierPinSelfFn_createServerFn_handler };
