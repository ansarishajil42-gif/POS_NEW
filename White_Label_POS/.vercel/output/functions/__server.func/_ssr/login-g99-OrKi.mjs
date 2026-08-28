import { o as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { n as Logo, t as Button } from "./button-BlBeOJmP.mjs";
import { c as resetCashierPinSelfFn, i as getTenantsAndBranchesFn, n as getBranchCashiersAndTillsFn } from "./auth-server-CSle8uu9.mjs";
import { n as useAuth } from "./auth-CdZlvpyO.mjs";
import { B as Mail, K as KeyRound, V as Lock, X as Eye, Z as EyeOff, ht as Building2 } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-BTVuOq31.mjs";
import { a as SelectValue, i as SelectTrigger, n as SelectContent, r as SelectItem, t as Select } from "./select-DUEF7P_7.mjs";
import { t as Input } from "./input-Cexa0DG2.mjs";
import { t as Label } from "./label-CZhEvsKN.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-g99-OrKi.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const { login, pinLogin } = useAuth();
	const [loginMethod, setLoginMethod] = (0, import_react.useState)("credentials");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [selectedTenant, setSelectedTenant] = (0, import_react.useState)("");
	const [selectedBranch, setSelectedBranch] = (0, import_react.useState)("");
	const [selectedCashierId, setSelectedCashierId] = (0, import_react.useState)("");
	const [selectedTillId, setSelectedTillId] = (0, import_react.useState)("");
	const [pin, setPin] = (0, import_react.useState)("");
	const [cashiersList, setCashiersList] = (0, import_react.useState)([]);
	const [tillsList, setTillsList] = (0, import_react.useState)([]);
	const [forgotModalOpen, setForgotModalOpen] = (0, import_react.useState)(false);
	const [resetEmail, setResetEmail] = (0, import_react.useState)("");
	const [resetPassword, setResetPassword] = (0, import_react.useState)("");
	const [resetPin, setResetPin] = (0, import_react.useState)("");
	const [resetConfirmPin, setResetConfirmPin] = (0, import_react.useState)("");
	const [isResetting, setIsResetting] = (0, import_react.useState)(false);
	const [tenantsList, setTenantsList] = (0, import_react.useState)([]);
	const [branchesList, setBranchesList] = (0, import_react.useState)([]);
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		async function loadBranches() {
			try {
				const res = await getTenantsAndBranchesFn();
				if (res.success && res.tenants && res.branches) {
					setTenantsList(res.tenants);
					setBranchesList(res.branches);
				}
			} catch (err) {
				console.error("Failed to load tenants and branches:", err);
			}
		}
		loadBranches();
	}, []);
	(0, import_react.useEffect)(() => {
		async function loadBranchDetails() {
			if (!selectedTenant || !selectedBranch) {
				setCashiersList([]);
				setTillsList([]);
				setSelectedCashierId("");
				setSelectedTillId("");
				return;
			}
			try {
				const res = await getBranchCashiersAndTillsFn({ data: {
					tenantId: selectedTenant,
					branchId: selectedBranch
				} });
				if (res.success && res.cashiers && res.tills) {
					setCashiersList(res.cashiers);
					setTillsList(res.tills);
				} else toast.error(res.error || "Failed to load branch details");
			} catch (err) {
				toast.error(err.message || "Failed to load branch details");
			}
		}
		loadBranchDetails();
	}, [selectedTenant, selectedBranch]);
	const handleCredentialsSubmit = async (e) => {
		e.preventDefault();
		if (!email || !password) {
			toast.error("Please enter email and password");
			return;
		}
		setIsLoading(true);
		const res = await login(email, password);
		setIsLoading(false);
		if (res.success) toast.success("Welcome back!");
		else toast.error(res.error || "Invalid email or password");
	};
	const handlePinSubmit = async (e) => {
		e.preventDefault();
		if (!selectedTenant || !selectedBranch || !selectedCashierId || !selectedTillId || !pin) {
			toast.error("Please select tenant, branch, cashier, till and enter PIN");
			return;
		}
		setIsLoading(true);
		const res = await pinLogin(selectedTenant, selectedBranch, selectedCashierId, selectedTillId, pin);
		setIsLoading(false);
		if (res.success) toast.success("Cashier signed in successfully!");
		else toast.error(res.error || "Authentication failed");
	};
	const handleResetSubmit = async (e) => {
		e.preventDefault();
		if (!resetEmail || !resetPassword || !resetPin || !resetConfirmPin) {
			toast.error("Please fill in all reset fields");
			return;
		}
		if (resetPin !== resetConfirmPin) {
			toast.error("New PIN and confirm PIN do not match");
			return;
		}
		if (!/^\d{4}$/.test(resetPin)) {
			toast.error("PIN must be exactly 4 digits");
			return;
		}
		setIsResetting(true);
		try {
			const res = await resetCashierPinSelfFn({ data: {
				email: resetEmail,
				currentPass: resetPassword,
				newPin: resetPin,
				confirmPin: resetConfirmPin
			} });
			if (res.success) {
				toast.success("PIN reset successfully!");
				setForgotModalOpen(false);
				setResetEmail("");
				setResetPassword("");
				setResetPin("");
				setResetConfirmPin("");
			} else toast.error(res.error || "Failed to reset PIN");
		} catch (err) {
			toast.error(err.message || "Failed to reset PIN");
		} finally {
			setIsResetting(false);
		}
	};
	const activeBranches = branchesList.filter((b) => b.tenantId === selectedTenant);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen flex items-center justify-center bg-surface-2 p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-full max-w-md",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mb-8 flex justify-center",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Logo, {})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "overflow-hidden rounded-3xl border border-border/50 bg-surface/50 p-8 backdrop-blur-xl shadow-xl",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 text-center",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-2xl font-extrabold tracking-tight text-ink",
							children: "Sign in to your account"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-muted-foreground",
							children: "Select login method below"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mb-6 grid grid-cols-2 gap-1 rounded-xl bg-surface-3 p-1 text-sm font-medium",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setLoginMethod("credentials"),
							className: `rounded-lg py-2.5 transition-colors ${loginMethod === "credentials" ? "bg-surface text-ink shadow" : "text-muted-foreground hover:text-ink"}`,
							children: "Email & Password"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setLoginMethod("pin"),
							className: `rounded-lg py-2.5 transition-colors ${loginMethod === "pin" ? "bg-surface text-ink shadow" : "text-muted-foreground hover:text-ink"}`,
							children: "Cashier PIN Login"
						})]
					}),
					loginMethod === "credentials" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleCredentialsSubmit,
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "email",
									children: "Email address"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "email",
										type: "email",
										placeholder: "name@company.com",
										value: email,
										onChange: (e) => setEmail(e.target.value),
										className: "pl-11 rounded-xl py-6"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "password",
									children: "Password"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "password",
											type: showPassword ? "text" : "password",
											placeholder: "••••••••",
											value: password,
											onChange: (e) => setPassword(e.target.value),
											className: "pl-11 pr-11 rounded-xl py-6"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setShowPassword(!showPassword),
											className: "absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-ink transition-colors",
											children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-5 w-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-5 w-5" })
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "submit",
								disabled: isLoading,
								className: "mt-4 w-full rounded-xl py-6 font-bold text-base shadow-md transition-transform hover:-translate-y-0.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "mr-2 h-5 w-5" }),
									" ",
									isLoading ? "Signing in..." : "Sign in"
								]
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handlePinSubmit,
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "tenant",
									children: "Tenant"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: selectedTenant,
									onValueChange: (v) => {
										setSelectedTenant(v);
										setSelectedBranch("");
										setSelectedCashierId("");
										setSelectedTillId("");
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "rounded-xl py-6",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Tenant" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: tenantsList.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: t.id,
										children: t.name
									}, t.id)) })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "branch",
									children: "Branch / Outlet"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: selectedBranch,
									onValueChange: (v) => {
										setSelectedBranch(v);
										setSelectedCashierId("");
										setSelectedTillId("");
									},
									disabled: !selectedTenant,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "rounded-xl py-6",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Branch" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: activeBranches.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectItem, {
										value: b.id,
										children: b.name
									}, b.id)) })]
								})]
							}),
							selectedBranch && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "cashier-select",
									children: "Cashier / Staff"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: selectedCashierId,
									onValueChange: setSelectedCashierId,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "rounded-xl py-6",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Cashier" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: cashiersList.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
										value: c.id,
										children: [
											c.name,
											" (",
											c.email,
											")"
										]
									}, c.id)) })]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "till-select",
									children: "Till Terminal"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Select, {
									value: selectedTillId,
									onValueChange: setSelectedTillId,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectTrigger, {
										className: "rounded-xl py-6",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectValue, { placeholder: "Select Till Terminal" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SelectContent, { children: tillsList.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SelectItem, {
										value: t.id,
										children: [
											t.name,
											" (",
											t.status,
											")"
										]
									}, t.id)) })]
								})]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
									htmlFor: "pin",
									children: "Cashier PIN"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, { className: "absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
										id: "pin",
										type: "password",
										maxLength: 4,
										placeholder: "••••",
										value: pin,
										onChange: (e) => setPin(e.target.value.replace(/\D/g, "")),
										className: "pl-11 rounded-xl py-6 text-center text-xl font-bold tracking-widest"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex justify-end",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setForgotModalOpen(true),
									className: "text-xs font-semibold text-primary hover:underline transition-all",
									children: "Forgot / Reset PIN?"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "submit",
								disabled: isLoading,
								className: "mt-4 w-full rounded-xl py-6 font-bold text-base shadow-md transition-transform hover:-translate-y-0.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "mr-2 h-5 w-5" }),
									" ",
									isLoading ? "Authenticating PIN..." : "Access Till"
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
						open: forgotModalOpen,
						onOpenChange: (open) => {
							if (!isResetting) {
								setForgotModalOpen(open);
								if (!open) {
									setResetEmail("");
									setResetPassword("");
									setResetPin("");
									setResetConfirmPin("");
								}
							}
						},
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
							className: "sm:max-w-md w-[95vw] sm:w-full",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Reset Cashier PIN" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Re-authenticate with your email and password to securely change your 4-digit PIN." })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								onSubmit: handleResetSubmit,
								className: "space-y-4 py-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "reset-email",
											children: "Email Address"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "reset-email",
											type: "email",
											placeholder: "cashier@supermarket.com",
											value: resetEmail,
											onChange: (e) => setResetEmail(e.target.value)
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "space-y-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
											htmlFor: "reset-pass",
											children: "Current Password"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
											id: "reset-pass",
											type: "password",
											placeholder: "••••••••",
											value: resetPassword,
											onChange: (e) => setResetPassword(e.target.value)
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "grid grid-cols-2 gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "reset-pin",
												children: "New 4-digit PIN"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "reset-pin",
												type: "password",
												maxLength: 4,
												placeholder: "••••",
												value: resetPin,
												onChange: (e) => setResetPin(e.target.value.replace(/\D/g, ""))
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
												htmlFor: "reset-cpin",
												children: "Confirm PIN"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
												id: "reset-cpin",
												type: "password",
												maxLength: 4,
												placeholder: "••••",
												value: resetConfirmPin,
												onChange: (e) => setResetConfirmPin(e.target.value.replace(/\D/g, ""))
											})]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
										className: "flex justify-end gap-2 mt-6",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "button",
											variant: "outline",
											onClick: () => {
												setForgotModalOpen(false);
												setResetEmail("");
												setResetPassword("");
												setResetPin("");
												setResetConfirmPin("");
											},
											disabled: isResetting,
											children: "Cancel"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											type: "submit",
											disabled: isResetting,
											children: isResetting ? "Resetting..." : "Reset PIN"
										})]
									})
								]
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "h-4 w-4" }), " White-Label POS Platform Secure Login"]
					})
				]
			})]
		})
	});
}
//#endregion
export { Login as component };
