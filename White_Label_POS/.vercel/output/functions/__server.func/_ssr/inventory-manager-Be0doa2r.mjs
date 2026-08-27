import "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { s as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
var SplitErrorComponent = ({ error }) => {
	if (error.message.includes("No branch is assigned to this user.")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-[80vh] items-center justify-center p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel max-w-md w-full p-8 text-center space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl font-bold text-ink",
				children: "No Branch Assigned"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: "No branch is assigned to this user."
			})]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex h-[80vh] items-center justify-center p-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "panel max-w-md w-full p-8 text-center space-y-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl font-bold text-destructive",
				children: "Access Denied"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground",
				children: error.message || "You do not have permission to access this page."
			})]
		})
	});
};
//#endregion
export { SplitErrorComponent as errorComponent };
