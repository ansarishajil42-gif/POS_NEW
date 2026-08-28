import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { v as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as loginServerFn, o as logoutServerFn, r as getSessionServerFn, s as pinLoginServerFn } from "./auth-server-Cm_FskrZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-CyKkELZ_.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var roleRoutes = {
	"Super Admin": "/super-admin",
	"Head Office Admin": "/head-office",
	"Branch Manager": "/store-manager",
	"Inventory Manager": "/inventory-manager",
	"Purchasing Officer": "/purchasing",
	"Cashier": "/pos-till",
	"Vendor": "/vendor-portal"
};
function useAuth() {
	const [role, setRole] = (0, import_react.useState)(null);
	const [isLoaded, setIsLoaded] = (0, import_react.useState)(false);
	const navigate = useNavigate();
	(0, import_react.useEffect)(() => {
		async function initAuth() {
			try {
				const res = await getSessionServerFn();
				if (res.success && res.session) {
					const userRole = res.session.role;
					setRole(userRole);
					localStorage.setItem("user_role", userRole);
				} else {
					setRole(null);
					localStorage.removeItem("user_role");
				}
			} catch (err) {
				console.error("Auth initialization failed:", err);
			} finally {
				setIsLoaded(true);
			}
		}
		initAuth();
	}, []);
	const login = async (email, password) => {
		try {
			const res = await loginServerFn({ data: {
				email,
				password
			} });
			if (res.success && res.user) {
				const userRole = res.user.role;
				setRole(userRole);
				localStorage.setItem("user_role", userRole);
				navigate({ to: roleRoutes[userRole] });
				return { success: true };
			} else return {
				success: false,
				error: res.error || "Login failed"
			};
		} catch (err) {
			return {
				success: false,
				error: err.message || "An error occurred during login"
			};
		}
	};
	const pinLogin = async (tenantId, branchId, cashierId, tillId, pin) => {
		try {
			const res = await pinLoginServerFn({ data: {
				tenantId,
				branchId,
				cashierId,
				tillId,
				pin
			} });
			if (res.success && res.user) {
				const userRole = res.user.role;
				setRole(userRole);
				localStorage.setItem("user_role", userRole);
				navigate({ to: roleRoutes[userRole] });
				return { success: true };
			} else return {
				success: false,
				error: res.error || "Login failed"
			};
		} catch (err) {
			return {
				success: false,
				error: err.message || "An error occurred during login"
			};
		}
	};
	const logout = async () => {
		try {
			await logoutServerFn();
		} catch (err) {
			console.error("Logout error on server:", err);
		}
		setRole(null);
		localStorage.removeItem("user_role");
		navigate({ to: "/login" });
	};
	return {
		role,
		isLoaded,
		login,
		pinLogin,
		logout
	};
}
//#endregion
export { useAuth as n, roleRoutes as t };
