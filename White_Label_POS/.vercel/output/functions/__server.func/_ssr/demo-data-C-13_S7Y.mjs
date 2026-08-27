//#region node_modules/.nitro/vite/services/ssr/assets/demo-data-C-13_S7Y.js
var outlets = [
	{
		id: "o1",
		name: "Al Barsha Hypermarket",
		emirate: "Dubai",
		sales: 92430,
		growth: 12.4,
		tills: 18,
		stockHealth: 96
	},
	{
		id: "o2",
		name: "Deira Fresh Market",
		emirate: "Dubai",
		sales: 64120,
		growth: 4.8,
		tills: 9,
		stockHealth: 91
	},
	{
		id: "o3",
		name: "Corniche Superstore",
		emirate: "Abu Dhabi",
		sales: 51880,
		growth: -2.1,
		tills: 7,
		stockHealth: 84
	},
	{
		id: "o4",
		name: "Al Nahda Express",
		emirate: "Sharjah",
		sales: 33240,
		growth: 8.9,
		tills: 5,
		stockHealth: 88
	}
];
var aggregators = [
	"Talabat",
	"Careem",
	"InstaShop",
	"Deliveroo"
];
var aggOrders = [
	{
		id: "TLB-88421",
		channel: "Talabat",
		customer: "A. Rahman",
		items: 12,
		total: 214.5,
		branch: "Al Barsha",
		minutesAgo: 1,
		status: "New"
	},
	{
		id: "TLB-88418",
		channel: "Talabat",
		customer: "M. Yusuf",
		items: 5,
		total: 88,
		branch: "Deira",
		minutesAgo: 6,
		status: "Picking"
	},
	{
		id: "CRM-40122",
		channel: "Careem",
		customer: "L. Fernandes",
		items: 8,
		total: 132.75,
		branch: "Al Barsha",
		minutesAgo: 3,
		status: "New"
	},
	{
		id: "CRM-40119",
		channel: "Careem",
		customer: "S. Ali",
		items: 3,
		total: 44.2,
		branch: "Corniche",
		minutesAgo: 11,
		status: "Ready"
	},
	{
		id: "INS-71204",
		channel: "InstaShop",
		customer: "N. Khoury",
		items: 21,
		total: 486.9,
		branch: "Al Barsha",
		minutesAgo: 2,
		status: "Picking"
	},
	{
		id: "INS-71199",
		channel: "InstaShop",
		customer: "P. Sharma",
		items: 6,
		total: 96.4,
		branch: "Al Nahda",
		minutesAgo: 14,
		status: "Dispatched"
	},
	{
		id: "DLV-55031",
		channel: "Deliveroo",
		customer: "H. Saeed",
		items: 4,
		total: 61,
		branch: "Deira",
		minutesAgo: 4,
		status: "New"
	},
	{
		id: "DLV-55028",
		channel: "Deliveroo",
		customer: "K. Thomas",
		items: 9,
		total: 174.3,
		branch: "Corniche",
		minutesAgo: 9,
		status: "Ready"
	}
];
var aed = (n) => {
	if (n == null) return "AED 0.00";
	return `AED ${n.toLocaleString("en-AE", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	})}`;
};
var aedShort = (n) => {
	if (n == null) return "AED 0";
	return `AED ${n.toLocaleString("en-AE")}`;
};
//#endregion
export { outlets as a, aggregators as i, aedShort as n, aggOrders as r, aed as t };
