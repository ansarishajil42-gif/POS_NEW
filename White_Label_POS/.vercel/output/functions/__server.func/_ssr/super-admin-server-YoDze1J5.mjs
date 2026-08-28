import { r as createServerFn } from "./server-DrMPL4gN.mjs";
import { r as getSessionServerFn } from "./auth-server-Cm_FskrZ.mjs";
import { a as eq, d as lte, i as and, r as desc, s as gte, w as sql } from "../_libs/drizzle-orm+postgres.mjs";
import { A as tenantSettings, E as staffUsers, L as createServerRpc, h as platformSettings, i as branches, j as tenants, m as orders, n as auditLogs, t as db } from "./db-DPJpDhh1.mjs";
import { t as logAuditAction } from "./audit-logger-C-IaIwVw.mjs";
import { t as createBranchInternal } from "./branch-server-helpers-BZyPfTgf.mjs";
import { hash } from "@node-rs/argon2";
//#region node_modules/.nitro/vite/services/ssr/assets/super-admin-server-YoDze1J5.js
function redactSecrets(obj) {
	if (obj === null || obj === void 0) return obj;
	if (typeof obj !== "object") return obj;
	if (Array.isArray(obj)) return obj.map(redactSecrets);
	const redacted = { ...obj };
	const secretKeys = [
		"password",
		"token",
		"secret",
		"key",
		"pin",
		"card"
	];
	for (const key of Object.keys(redacted)) {
		const lowerKey = key.toLowerCase();
		if (secretKeys.some((sk) => lowerKey.includes(sk))) redacted[key] = "[REDACTED]";
		else if (typeof redacted[key] === "object") redacted[key] = redactSecrets(redacted[key]);
	}
	return redacted;
}
async function ensureSuperAdmin() {
	const res = await getSessionServerFn();
	if (!res.success || !res.session || res.session.role !== "Super Admin") throw new Error("Unauthorized");
	return res.session;
}
var getTenantsServerFn_createServerFn_handler = createServerRpc({
	id: "9522f7bccab5fa9333fef4e1199cd6c73a5c45c013bd6ba2154f9f7a3478acd4",
	name: "getTenantsServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => getTenantsServerFn.__executeServer(opts));
var getTenantsServerFn = createServerFn({ method: "GET" }).handler(getTenantsServerFn_createServerFn_handler, async () => {
	await ensureSuperAdmin();
	return {
		success: true,
		tenants: await db.select({
			id: tenants.id,
			name: tenants.name,
			subdomain: tenants.subdomain,
			plan: tenants.plan,
			status: tenants.status,
			createdAt: tenants.createdAt,
			outlets: sql`count(distinct ${branches.id})::int`,
			tills: sql`coalesce(sum(distinct ${branches.tillCount}), 0)::int`,
			monthlyOrders: sql`count(distinct ${orders.id})::int`
		}).from(tenants).leftJoin(branches, eq(tenants.id, branches.tenantId)).leftJoin(orders, eq(tenants.id, orders.tenantId)).groupBy(tenants.id).orderBy(sql`${tenants.createdAt} DESC`)
	};
});
var getBranchesServerFn_createServerFn_handler = createServerRpc({
	id: "54139ac1bb2be9b228b95564a8fe70cad5ac0c0cfc8ea8db0acf996bb7fd7dfd",
	name: "getBranchesServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => getBranchesServerFn.__executeServer(opts));
var getBranchesServerFn = createServerFn({ method: "GET" }).handler(getBranchesServerFn_createServerFn_handler, async () => {
	await ensureSuperAdmin();
	return {
		success: true,
		branches: await db.select().from(branches).orderBy(sql`${branches.createdAt} DESC`)
	};
});
var createTenantServerFn_createServerFn_handler = createServerRpc({
	id: "c754b5b78a97d70604ce3dd3e384708f53a1861ab9072f068510848d7ebdd984",
	name: "createTenantServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => createTenantServerFn.__executeServer(opts));
var createTenantServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createTenantServerFn_createServerFn_handler, async ({ data }) => {
	await ensureSuperAdmin();
	try {
		return {
			success: true,
			tenant: await db.transaction(async (tx) => {
				const [newTenant] = await tx.insert(tenants).values({
					name: data.name,
					subdomain: data.subdomain,
					plan: data.plan,
					status: "Active"
				}).returning();
				await tx.insert(tenantSettings).values({
					tenantId: newTenant.id,
					taxRegistrationNumber: data.trn
				});
				const passwordHash = await hash(data.adminPassword);
				await tx.insert(staffUsers).values({
					tenantId: newTenant.id,
					branchId: null,
					name: data.adminName,
					email: data.adminEmail,
					phone: data.adminPhone,
					address: data.adminAddress,
					passwordHash,
					role: "head_office_admin",
					isActive: true
				});
				await logAuditAction({
					action: "Create Tenant",
					entityType: "tenant",
					entityId: newTenant.id,
					tenantId: newTenant.id,
					afterValue: {
						name: data.name,
						subdomain: data.subdomain,
						plan: data.plan,
						trn: data.trn,
						adminName: data.adminName,
						adminEmail: data.adminEmail,
						status: "Active"
					}
				}, tx);
				return newTenant;
			})
		};
	} catch (error) {
		console.error("Tenant creation error:", error);
		if (error.code === "23505") return {
			success: false,
			error: "Email or Subdomain already exists"
		};
		if (error.code === "23502") return {
			success: false,
			error: "Missing required field: " + (error.column || "Unknown")
		};
		return {
			success: false,
			error: "Failed to create tenant and admin: " + (error.message || "Unknown database error")
		};
	}
});
var updateTenantServerFn_createServerFn_handler = createServerRpc({
	id: "d7afc7da950abdf61e5c0c6fdadde9072f2043bc8f7ce87b33315226ac43e04d",
	name: "updateTenantServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => updateTenantServerFn.__executeServer(opts));
var updateTenantServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updateTenantServerFn_createServerFn_handler, async ({ data }) => {
	await ensureSuperAdmin();
	try {
		return await db.transaction(async (tx) => {
			const [current] = await tx.select().from(tenants).where(eq(tenants.id, data.id));
			if (!current) throw new Error("Tenant not found");
			if ((await tx.select().from(tenants).where(and(eq(tenants.subdomain, data.subdomain), sql`${tenants.id} != ${data.id}`))).length > 0) throw new Error("Subdomain already exists");
			await tx.update(tenants).set({
				name: data.name,
				subdomain: data.subdomain
			}).where(eq(tenants.id, data.id));
			await logAuditAction({
				action: "Update Tenant Profile",
				entityType: "tenant",
				entityId: data.id,
				tenantId: data.id,
				beforeValue: {
					name: current.name,
					subdomain: current.subdomain
				},
				afterValue: {
					name: data.name,
					subdomain: data.subdomain
				}
			}, tx);
			return { success: true };
		});
	} catch (error) {
		return {
			success: false,
			error: error.message || "Failed to update tenant"
		};
	}
});
var updateTenantLimitsServerFn_createServerFn_handler = createServerRpc({
	id: "e5f02fee1cef37e4a76e87fc45a66c7e37bee5281bf8de9824a513099154490f",
	name: "updateTenantLimitsServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => updateTenantLimitsServerFn.__executeServer(opts));
var updateTenantLimitsServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updateTenantLimitsServerFn_createServerFn_handler, async ({ data }) => {
	await ensureSuperAdmin();
	if (data.outletLimit < 0 || data.tillLimit < 0 || data.monthlyOrderLimit < 0) return {
		success: false,
		error: "Limits cannot be negative"
	};
	try {
		return await db.transaction(async (tx) => {
			const [current] = await tx.select().from(tenants).where(eq(tenants.id, data.id)).for("update");
			if (!current) throw new Error("Tenant not found");
			const activeBranches = await tx.select({ count: sql`count(*)::int` }).from(branches).where(eq(branches.tenantId, data.id));
			if (activeBranches[0].count > data.outletLimit) throw new Error(`Outlet limit cannot be less than current usage (${activeBranches[0].count})`);
			const { tills } = await import("./db-DPJpDhh1.mjs").then((n) => n.w);
			const activeTills = await tx.select({ count: sql`count(*)::int` }).from(tills).where(eq(tills.tenantId, data.id));
			if (activeTills[0].count > data.tillLimit) throw new Error(`Till limit cannot be less than current usage (${activeTills[0].count})`);
			const uaeDateStr = (/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Asia/Dubai" });
			const uaeDate = new Date(uaeDateStr);
			const startOfMonthUae = new Date(uaeDate.getFullYear(), uaeDate.getMonth(), 1);
			const startOfMonthUtc = /* @__PURE__ */ new Date(startOfMonthUae.getTime() - 144e5);
			const currentMonthOrders = await tx.select({ count: sql`count(*)::int` }).from(orders).where(and(eq(orders.tenantId, data.id), sql`${orders.createdAt} >= ${startOfMonthUtc.toISOString()}`));
			if (currentMonthOrders[0].count > data.monthlyOrderLimit) throw new Error(`Monthly order limit cannot be less than current month usage (${currentMonthOrders[0].count})`);
			await tx.update(tenants).set({
				outletLimit: data.outletLimit,
				tillLimit: data.tillLimit,
				monthlyOrderLimit: data.monthlyOrderLimit
			}).where(eq(tenants.id, data.id));
			await logAuditAction({
				action: "Update Tenant Limits",
				entityType: "tenant",
				entityId: data.id,
				tenantId: data.id,
				beforeValue: {
					outletLimit: current.outletLimit,
					tillLimit: current.tillLimit,
					monthlyOrderLimit: current.monthlyOrderLimit
				},
				afterValue: {
					outletLimit: data.outletLimit,
					tillLimit: data.tillLimit,
					monthlyOrderLimit: data.monthlyOrderLimit
				}
			}, tx);
			return { success: true };
		});
	} catch (error) {
		return {
			success: false,
			error: error.message || "Failed to update tenant limits"
		};
	}
});
var getTenantAdminServerFn_createServerFn_handler = createServerRpc({
	id: "b815b0324041683fbb31d3b5ab80a567ca6ed5fb722cff3f0411bc30b10a8132",
	name: "getTenantAdminServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => getTenantAdminServerFn.__executeServer(opts));
var getTenantAdminServerFn = createServerFn({ method: "GET" }).validator((d) => d).handler(getTenantAdminServerFn_createServerFn_handler, async ({ data }) => {
	await ensureSuperAdmin();
	const [admin] = await db.select({
		id: staffUsers.id,
		name: staffUsers.name,
		email: staffUsers.email,
		phone: staffUsers.phone,
		address: staffUsers.address,
		role: staffUsers.role,
		isActive: staffUsers.isActive,
		createdAt: staffUsers.createdAt
	}).from(staffUsers).where(sql`${staffUsers.tenantId} = ${data.tenantId} AND ${staffUsers.role} = 'head_office_admin'`).limit(1);
	if (!admin) return {
		success: true,
		admin: null
	};
	return {
		success: true,
		admin
	};
});
var createExistingTenantAdminServerFn_createServerFn_handler = createServerRpc({
	id: "2390f131557d4921280070ebd95745204ef4ccae4cc961145d686dd07e4ebf64",
	name: "createExistingTenantAdminServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => createExistingTenantAdminServerFn.__executeServer(opts));
var createExistingTenantAdminServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createExistingTenantAdminServerFn_createServerFn_handler, async ({ data }) => {
	await ensureSuperAdmin();
	try {
		const passwordHash = await hash(data.password);
		await db.transaction(async (tx) => {
			const [newUser] = await tx.insert(staffUsers).values({
				tenantId: data.tenantId,
				branchId: null,
				name: data.name,
				email: data.email,
				phone: data.phone,
				address: data.address,
				passwordHash,
				role: "head_office_admin",
				isActive: true
			}).returning();
			await logAuditAction({
				action: "Create Tenant Admin",
				entityType: "user",
				entityId: newUser.id,
				tenantId: data.tenantId,
				afterValue: {
					email: data.email,
					name: data.name
				}
			}, tx);
		});
		return { success: true };
	} catch (error) {
		console.error("Existing tenant admin creation error:", error);
		if (error.code === "23505") return {
			success: false,
			error: "Email already exists"
		};
		return {
			success: false,
			error: "Failed to create admin"
		};
	}
});
var updateTenantAdminServerFn_createServerFn_handler = createServerRpc({
	id: "5601be9ec7ee6a4cd5e7b6361afb73f53148b7e2b171ebb06e16fce50f56ad26",
	name: "updateTenantAdminServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => updateTenantAdminServerFn.__executeServer(opts));
var updateTenantAdminServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updateTenantAdminServerFn_createServerFn_handler, async ({ data }) => {
	await ensureSuperAdmin();
	try {
		await db.transaction(async (tx) => {
			const [current] = await tx.select().from(staffUsers).where(eq(staffUsers.id, data.id));
			if (!current) throw new Error("Admin not found");
			const updates = {
				name: data.name,
				email: data.email,
				phone: data.phone,
				address: data.address
			};
			if (data.password) updates.passwordHash = await hash(data.password);
			await tx.update(staffUsers).set(updates).where(eq(staffUsers.id, data.id));
			await logAuditAction({
				action: "Update Tenant Admin",
				entityType: "user",
				entityId: data.id,
				tenantId: current.tenantId,
				beforeValue: {
					name: current.name,
					email: current.email
				},
				afterValue: {
					name: data.name,
					email: data.email
				}
			}, tx);
		});
		return { success: true };
	} catch (error) {
		console.error("Existing tenant admin update error:", error);
		if (error.code === "23505") return {
			success: false,
			error: "Email already exists"
		};
		return {
			success: false,
			error: "Failed to update admin"
		};
	}
});
var deleteTenantAdminServerFn_createServerFn_handler = createServerRpc({
	id: "8fc1a068d55fb34d6b611598c59b7ecb11549de4b89cd9ed3d0c0681a6946961",
	name: "deleteTenantAdminServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => deleteTenantAdminServerFn.__executeServer(opts));
var deleteTenantAdminServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(deleteTenantAdminServerFn_createServerFn_handler, async ({ data }) => {
	await ensureSuperAdmin();
	await db.transaction(async (tx) => {
		const [current] = await tx.select().from(staffUsers).where(eq(staffUsers.id, data.id));
		if (current) {
			await tx.delete(staffUsers).where(eq(staffUsers.id, data.id));
			await logAuditAction({
				action: "Delete Tenant Admin",
				entityType: "user",
				entityId: data.id,
				tenantId: current.tenantId,
				beforeValue: { email: current.email }
			}, tx);
		}
	});
	return { success: true };
});
var updateTenantStatusServerFn_createServerFn_handler = createServerRpc({
	id: "48ab3e1eacef1d7c325b51d845c1c2ca0b74a37613084918c9a1e30b1e333bc1",
	name: "updateTenantStatusServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => updateTenantStatusServerFn.__executeServer(opts));
var updateTenantStatusServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updateTenantStatusServerFn_createServerFn_handler, async ({ data }) => {
	await ensureSuperAdmin();
	await db.transaction(async (tx) => {
		const [current] = await tx.select().from(tenants).where(eq(tenants.id, data.id));
		await tx.update(tenants).set({ status: data.status }).where(eq(tenants.id, data.id));
		await logAuditAction({
			action: "Update Tenant Status",
			entityType: "tenant",
			entityId: data.id,
			tenantId: data.id,
			beforeValue: { status: current?.status },
			afterValue: { status: data.status }
		}, tx);
	});
	return { success: true };
});
var upgradeTenantPlanServerFn_createServerFn_handler = createServerRpc({
	id: "6e5734d7bb5f58fb3295e9adfdb0ed6bb672035cdc11178a0f8ae15e2c90ab45",
	name: "upgradeTenantPlanServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => upgradeTenantPlanServerFn.__executeServer(opts));
var upgradeTenantPlanServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(upgradeTenantPlanServerFn_createServerFn_handler, async ({ data }) => {
	await ensureSuperAdmin();
	let newPlan = "";
	await db.transaction(async (tx) => {
		const [tenant] = await tx.select({ plan: tenants.plan }).from(tenants).where(eq(tenants.id, data.id));
		if (!tenant) throw new Error("Not found");
		newPlan = tenant.plan === "Starter" ? "Growth" : "Enterprise";
		await tx.update(tenants).set({ plan: newPlan }).where(eq(tenants.id, data.id));
		await logAuditAction({
			action: "Upgrade Tenant Plan",
			entityType: "tenant",
			entityId: data.id,
			tenantId: data.id,
			beforeValue: { plan: tenant.plan },
			afterValue: { plan: newPlan }
		}, tx);
	});
	return {
		success: true,
		newPlan
	};
});
var downgradeTenantPlanServerFn_createServerFn_handler = createServerRpc({
	id: "57e30a304a2c4af19ecabff8caaea4b078ac3674254750d0ec609dc9673e133e",
	name: "downgradeTenantPlanServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => downgradeTenantPlanServerFn.__executeServer(opts));
var downgradeTenantPlanServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(downgradeTenantPlanServerFn_createServerFn_handler, async ({ data }) => {
	await ensureSuperAdmin();
	let newPlan = "";
	await db.transaction(async (tx) => {
		const [tenant] = await tx.select({ plan: tenants.plan }).from(tenants).where(eq(tenants.id, data.id));
		if (!tenant) throw new Error("Not found");
		newPlan = tenant.plan === "Enterprise" ? "Growth" : "Starter";
		await tx.update(tenants).set({ plan: newPlan }).where(eq(tenants.id, data.id));
		await logAuditAction({
			action: "Downgrade Tenant Plan",
			entityType: "tenant",
			entityId: data.id,
			tenantId: data.id,
			beforeValue: { plan: tenant.plan },
			afterValue: { plan: newPlan }
		}, tx);
	});
	return {
		success: true,
		newPlan
	};
});
var createBranchServerFn_createServerFn_handler = createServerRpc({
	id: "3295c6d9291d9c91de7070c4871c4a237f2fceded930b0651e084b402209bd52",
	name: "createBranchServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => createBranchServerFn.__executeServer(opts));
var createBranchServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(createBranchServerFn_createServerFn_handler, async ({ data }) => {
	const session = await ensureSuperAdmin();
	try {
		return {
			success: true,
			branchId: (await createBranchInternal({
				tenantId: data.tenantId,
				name: data.name,
				address: data.address,
				userId: session.userId
			})).id
		};
	} catch (e) {
		return {
			success: false,
			error: e.message
		};
	}
});
var deleteBranchServerFn_createServerFn_handler = createServerRpc({
	id: "0317e46065ca576da3e89673627b6ed6af87b47645574e7ab1fd30e7b19ab2bd",
	name: "deleteBranchServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => deleteBranchServerFn.__executeServer(opts));
var deleteBranchServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(deleteBranchServerFn_createServerFn_handler, async ({ data }) => {
	await ensureSuperAdmin();
	await db.transaction(async (tx) => {
		const [current] = await tx.select().from(branches).where(eq(branches.id, data.id));
		if (current) {
			await tx.delete(branches).where(eq(branches.id, data.id));
			await logAuditAction({
				action: "Delete Branch",
				entityType: "branch",
				entityId: data.id,
				tenantId: current.tenantId,
				beforeValue: { name: current.name }
			}, tx);
		}
	});
	return { success: true };
});
var getGlobalTaxSettingsServerFn_createServerFn_handler = createServerRpc({
	id: "a19d852e56e44a38c612b7e76d9353821b8e43054e3abc983ca146a79039d9d0",
	name: "getGlobalTaxSettingsServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => getGlobalTaxSettingsServerFn.__executeServer(opts));
var getGlobalTaxSettingsServerFn = createServerFn({ method: "GET" }).handler(getGlobalTaxSettingsServerFn_createServerFn_handler, async () => {
	await ensureSuperAdmin();
	const [settings] = await db.select().from(platformSettings).limit(1);
	if (settings) return {
		success: true,
		vatRate: settings.vatRate,
		inclusive: settings.vatInclusive
	};
	return {
		success: true,
		vatRate: "5.00",
		inclusive: true
	};
});
var updateGlobalTaxSettingsServerFn_createServerFn_handler = createServerRpc({
	id: "b58ba46594c47cbd25becf29e195ac98c5000012b53edc2de959154e4dfb6085",
	name: "updateGlobalTaxSettingsServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => updateGlobalTaxSettingsServerFn.__executeServer(opts));
var updateGlobalTaxSettingsServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updateGlobalTaxSettingsServerFn_createServerFn_handler, async ({ data }) => {
	await ensureSuperAdmin();
	try {
		await db.transaction(async (tx) => {
			const settings = await tx.select().from(platformSettings).limit(1);
			if (settings.length > 0) await tx.update(platformSettings).set({
				vatRate: data.vatRate,
				vatInclusive: data.inclusive
			}).where(eq(platformSettings.id, settings[0].id));
			else await tx.insert(platformSettings).values({
				vatRate: data.vatRate,
				vatInclusive: data.inclusive
			});
			await logAuditAction({
				action: "Update Global Tax Settings",
				entityType: "platformSettings",
				entityId: "global",
				afterValue: {
					vatRate: data.vatRate,
					vatInclusive: data.inclusive
				}
			}, tx);
		});
		return { success: true };
	} catch (error) {
		console.error("Failed to update global tax settings:", error);
		return {
			success: false,
			error: "Failed to update tax settings"
		};
	}
});
var getPlatformSettingsServerFn_createServerFn_handler = createServerRpc({
	id: "6f097eb36cb32ac740228776bdaf5aab121acce485a3ff1cfd58c1d5c18a2a87",
	name: "getPlatformSettingsServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => getPlatformSettingsServerFn.__executeServer(opts));
var getPlatformSettingsServerFn = createServerFn({ method: "GET" }).handler(getPlatformSettingsServerFn_createServerFn_handler, async () => {
	try {
		await ensureSuperAdmin();
		const settings = await db.select().from(platformSettings).limit(1);
		if (settings.length > 0) return {
			success: true,
			data: settings[0]
		};
	} catch (error) {
		console.error("Failed to fetch platform settings:", error);
	}
	return {
		success: true,
		data: {
			currency: "AED",
			timezone: "Asia/Dubai",
			dateFormat: "DD/MM/YYYY"
		}
	};
});
var updatePlatformSettingsServerFn_createServerFn_handler = createServerRpc({
	id: "36e6298a0e61ca583dd1093f42a22721cf0043221c303325c906017c5eac745f",
	name: "updatePlatformSettingsServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => updatePlatformSettingsServerFn.__executeServer(opts));
var updatePlatformSettingsServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(updatePlatformSettingsServerFn_createServerFn_handler, async ({ data }) => {
	try {
		await ensureSuperAdmin();
		await db.transaction(async (tx) => {
			const settings = await tx.select().from(platformSettings).limit(1);
			if (settings.length > 0) await tx.update(platformSettings).set(data).where(eq(platformSettings.id, settings[0].id));
			else await tx.insert(platformSettings).values(data);
			await logAuditAction({
				action: "Update Platform Settings",
				entityType: "platformSettings",
				entityId: "global",
				afterValue: data
			}, tx);
		});
		return { success: true };
	} catch (error) {
		console.error("Failed to update platform settings:", error);
		return { success: false };
	}
});
var getAuditLogsServerFn_createServerFn_handler = createServerRpc({
	id: "ead49babc576b141758d2e40557fb6db75f7b8edf00ed7568ae9f8b397db97da",
	name: "getAuditLogsServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => getAuditLogsServerFn.__executeServer(opts));
var getAuditLogsServerFn = createServerFn({ method: "GET" }).validator((d) => d).handler(getAuditLogsServerFn_createServerFn_handler, async ({ data }) => {
	const sessionRes = await getSessionServerFn();
	if (!sessionRes.success || !sessionRes.session) throw new Error("Unauthorized");
	let forcedTenantId = data.tenantId;
	if (sessionRes.session.role !== "Super Admin") {
		if (sessionRes.session.role !== "Head Office Admin") throw new Error("Unauthorized");
		forcedTenantId = sessionRes.session.tenantId;
	}
	const page = data.page || 1;
	const pageSize = data.limit ? Math.min(data.limit, 100) : 50;
	const offset = (page - 1) * pageSize;
	let query = db.select().from(auditLogs);
	const conditions = [];
	if (forcedTenantId) conditions.push(eq(auditLogs.tenantId, forcedTenantId));
	if (data.actorId) conditions.push(eq(auditLogs.userId, data.actorId));
	if (data.action) conditions.push(eq(auditLogs.action, data.action));
	if (data.entityType) conditions.push(eq(auditLogs.entityType, data.entityType));
	if (data.startDate) conditions.push(gte(auditLogs.createdAt, new Date(data.startDate)));
	if (data.endDate) conditions.push(lte(auditLogs.createdAt, new Date(data.endDate)));
	if (conditions.length > 0) query = query.where(and(...conditions));
	return {
		success: true,
		logs: (await query.orderBy(desc(auditLogs.createdAt)).limit(pageSize).offset(offset)).map((r) => ({
			...r,
			details: redactSecrets(r.details)
		}))
	};
});
var getAnalyticsServerFn_createServerFn_handler = createServerRpc({
	id: "51694eb31157e15791cd2586b60b1b883cc605060a823f885689fc75e56b2ed1",
	name: "getAnalyticsServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => getAnalyticsServerFn.__executeServer(opts));
var getAnalyticsServerFn = createServerFn({ method: "GET" }).validator((d) => d).handler(getAnalyticsServerFn_createServerFn_handler, async ({ data }) => {
	await ensureSuperAdmin();
	let orderQuery = db.select({
		id: orders.id,
		total: orders.total,
		createdAt: orders.createdAt,
		status: orders.status
	}).from(orders);
	const conditions = [];
	if (data?.tenantId) conditions.push(eq(orders.tenantId, data.tenantId));
	if (data?.startDate) conditions.push(gte(orders.createdAt, new Date(data.startDate)));
	if (data?.endDate) conditions.push(lte(orders.createdAt, new Date(data.endDate)));
	if (conditions.length > 0) orderQuery = orderQuery.where(and(...conditions));
	const allOrders = await orderQuery;
	let totalGmv = 0;
	const salesByDate = {};
	allOrders.forEach((o) => {
		totalGmv += Number(o.total);
		const dateStr = new Date(o.createdAt).toLocaleDateString("en-US", {
			day: "numeric",
			month: "short"
		});
		salesByDate[dateStr] = (salesByDate[dateStr] || 0) + Number(o.total);
	});
	const platformSeries = Object.keys(salesByDate).length > 0 ? Object.entries(salesByDate).map(([date, sales]) => ({
		t: date,
		sales,
		tills: 0,
		api: 0
	})) : [{
		t: "Today",
		sales: 0,
		tills: 0,
		api: 0
	}];
	const allTenants = await db.select({ status: tenants.status }).from(tenants);
	let activeTenantsCount = 0;
	let suspendedTenantsCount = 0;
	let trialTenantsCount = 0;
	let totalTenantsCount = allTenants.length;
	for (const t of allTenants) if (t.status === "Active") activeTenantsCount++;
	else if (t.status === "Suspended") suspendedTenantsCount++;
	else if (t.status === "Trial") trialTenantsCount++;
	let auditQuery = db.select({
		createdAt: auditLogs.createdAt,
		action: auditLogs.action,
		entityType: auditLogs.entityType,
		details: auditLogs.details
	}).from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(10);
	if (data?.tenantId) auditQuery = auditQuery.where(eq(auditLogs.tenantId, data.tenantId));
	const systemLogs = (await auditQuery).map((a) => {
		return [
			new Date(a.createdAt).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit"
			}),
			"INFO",
			`${a.action} on ${a.entityType}`
		];
	});
	return {
		success: true,
		totalGmv,
		systemLogs,
		platformSeries,
		tenantStats: {
			total: totalTenantsCount,
			active: activeTenantsCount,
			suspended: suspendedTenantsCount,
			trial: trialTenantsCount
		}
	};
});
var archiveTenantServerFn_createServerFn_handler = createServerRpc({
	id: "191598a72a4c54ff48c315e9f096024a984ca4948d781b131ab5d6b4e6478378",
	name: "archiveTenantServerFn",
	filename: "src/lib/super-admin-server.ts"
}, (opts) => archiveTenantServerFn.__executeServer(opts));
var archiveTenantServerFn = createServerFn({ method: "POST" }).validator((d) => d).handler(archiveTenantServerFn_createServerFn_handler, async ({ data }) => {
	await ensureSuperAdmin();
	await getSessionServerFn();
	let result = null;
	await db.transaction(async (tx) => {
		const [tenant] = await tx.select().from(tenants).where(eq(tenants.id, data.tenantId)).for("update");
		if (!tenant) throw new Error("Tenant not found.");
		if (tenant.name !== data.confirmationValue && tenant.subdomain !== data.confirmationValue) throw new Error("Confirmation value does not match tenant name or subdomain.");
		if (tenant.status === "Archived") {
			result = {
				success: true,
				message: "Tenant is already archived."
			};
			return;
		}
		await tx.update(tenants).set({ status: "Archived" }).where(eq(tenants.id, data.tenantId));
		await logAuditAction({
			action: "Archive Tenant",
			entityType: "tenant",
			entityId: data.tenantId,
			tenantId: data.tenantId,
			beforeValue: { status: tenant.status },
			afterValue: { status: "Archived" }
		}, tx);
		result = {
			success: true,
			message: "Tenant successfully archived."
		};
	});
	return result;
});
//#endregion
export { archiveTenantServerFn_createServerFn_handler, createBranchServerFn_createServerFn_handler, createExistingTenantAdminServerFn_createServerFn_handler, createTenantServerFn_createServerFn_handler, deleteBranchServerFn_createServerFn_handler, deleteTenantAdminServerFn_createServerFn_handler, downgradeTenantPlanServerFn_createServerFn_handler, getAnalyticsServerFn_createServerFn_handler, getAuditLogsServerFn_createServerFn_handler, getBranchesServerFn_createServerFn_handler, getGlobalTaxSettingsServerFn_createServerFn_handler, getPlatformSettingsServerFn_createServerFn_handler, getTenantAdminServerFn_createServerFn_handler, getTenantsServerFn_createServerFn_handler, updateGlobalTaxSettingsServerFn_createServerFn_handler, updatePlatformSettingsServerFn_createServerFn_handler, updateTenantAdminServerFn_createServerFn_handler, updateTenantLimitsServerFn_createServerFn_handler, updateTenantServerFn_createServerFn_handler, updateTenantStatusServerFn_createServerFn_handler, upgradeTenantPlanServerFn_createServerFn_handler };
