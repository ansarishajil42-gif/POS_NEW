export interface SubscriptionPlan {
  id: string;
  name: string;
  blurb: string;
  monthlyPrice: number;
  annualPricePerMonth: number;
  annualTotal: number;
  currency: string;
  entitlements: {
    outletLimit: number;
    tillLimit: number;
    monthlyOrderLimit: number;
  };
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  Starter: {
    id: "Starter",
    name: "Starter",
    blurb: "Single-site grocers and small independents getting off legacy tills.",
    monthlyPrice: 899,
    annualPricePerMonth: 764, // 15% discount (Math.round(899 * 0.85))
    annualTotal: 764 * 12,
    currency: "AED",
    entitlements: {
      outletLimit: 1,
      tillLimit: 3,
      monthlyOrderLimit: 10000,
    },
    features: [
      "POS till terminal + offline mode",
      "UAE VAT 5% automation & TRN receipts",
      "Central product catalog",
      "Shift & X/Z reports",
      "Email support",
    ],
  },
  Growth: {
    id: "Growth",
    name: "Growth",
    blurb: "Multi-branch supermarkets selling in-store and on delivery aggregators.",
    monthlyPrice: 1690,
    annualPricePerMonth: 1437, // 15% discount (Math.round(1690 * 0.85))
    annualTotal: 1437 * 12,
    currency: "AED",
    entitlements: {
      outletLimit: 10,
      tillLimit: 10,
      monthlyOrderLimit: 150000,
    },
    features: [
      "Everything in Starter",
      "Head office multi-outlet dashboard",
      "Batch & expiry with FIFO/FEFO alerts",
      "Purchasing: PO → GRN → Vendor Invoice",
      "Aggregator sync (Talabat, Careem, InstaShop, Deliveroo)",
      "Loyalty & CRM with tiers and points",
      "Priority support, 4h response",
    ],
  },
  Enterprise: {
    id: "Enterprise",
    name: "Enterprise",
    blurb: "Regional chains and platform operators running a white-label network.",
    monthlyPrice: 4999, // default placeholder for custom billing
    annualPricePerMonth: 4249, // 15% discount
    annualTotal: 4249 * 12,
    currency: "AED",
    entitlements: {
      outletLimit: 999,
      tillLimit: 999,
      monthlyOrderLimit: 1000000,
    },
    features: [
      "Everything in Growth",
      "SaaS Super-Admin portal (multi-tenant)",
      "Full white-label branding & domains",
      "Dedicated infrastructure & data residency",
      "Custom hardware & ERP integrations",
      "99.9% uptime SLA + named CSM",
    ],
  },
};

export type BillingCycle = "monthly" | "quarterly" | "6_months" | "yearly" | "custom";

export function getPlan(planName?: string): SubscriptionPlan {
  if (!planName) return SUBSCRIPTION_PLANS.Starter;
  return SUBSCRIPTION_PLANS[planName] || SUBSCRIPTION_PLANS.Starter;
}

export function calculatePlanPricing(
  planName: string,
  billingCycle: BillingCycle = "monthly",
  customDays?: number
): {
  subtotal: number;
  vatAmount: number;
  totalAmount: number;
  durationMonths: number;
} {
  const plan = getPlan(planName);
  let durationMonths = 1;
  let subtotal = plan.monthlyPrice;

  if (billingCycle === "yearly") {
    durationMonths = 12;
    subtotal = plan.annualPricePerMonth * 12;
  } else if (billingCycle === "6_months") {
    durationMonths = 6;
    subtotal = plan.monthlyPrice * 6;
  } else if (billingCycle === "quarterly") {
    durationMonths = 3;
    subtotal = plan.monthlyPrice * 3;
  } else if (billingCycle === "custom") {
    const days = customDays && customDays > 0 ? customDays : 30;
    durationMonths = Math.max(1, Math.round(days / 30));
    subtotal = (plan.monthlyPrice / 30) * days;
  } else {
    durationMonths = 1;
    subtotal = plan.monthlyPrice;
  }

  // UAE VAT standard rate is 5%
  const vatRate = 0.05;
  const vatAmount = Number((subtotal * vatRate).toFixed(2));
  const totalAmount = Number((subtotal + vatAmount).toFixed(2));

  return {
    subtotal: Number(subtotal.toFixed(2)),
    vatAmount,
    totalAmount,
    durationMonths,
  };
}
