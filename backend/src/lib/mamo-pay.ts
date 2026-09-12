import type { Request } from "express";

export interface MamoCreatePaymentLinkParams {
  title: string;
  description?: string;
  amount: number;
  currency?: string;
  externalId?: string;
  returnUrl?: string;
  failureUrl?: string;
  customData?: Record<string, any>;
  customer?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  sendEmailNotification?: boolean;
}

export interface MamoPaymentResult {
  success: boolean;
  paymentLinkId?: string;
  paymentUrl?: string;
  status: string;
  message?: string;
  error?: string;
  isMock: boolean;
}

export function getMamoPayConfig() {
  const apiKey = process.env.MAMO_PAY_API_KEY || "";
  const webhookSecret = process.env.MAMO_PAY_WEBHOOK_SECRET || "";
  const baseUrl =
    process.env.MAMO_PAY_BASE_URL ||
    "https://business.mamopay.com/manage_api/v1";

  const isConfigured = Boolean(apiKey.trim());

  return {
    apiKey,
    webhookSecret,
    baseUrl,
    isConfigured,
  };
}

/**
 * Creates a real Mamo Pay standalone payment link for subscription billing.
 * Communicates with https://business.mamopay.com/manage_api/v1/links.
 */
export async function createMamoPaymentLink(
  params: MamoCreatePaymentLinkParams
): Promise<MamoPaymentResult> {
  const config = getMamoPayConfig();

  if (!config.isConfigured || !config.apiKey) {
    return {
      success: false,
      status: "unconfigured",
      error: "Mamo Pay API key is not configured (MAMO_PAY_API_KEY missing).",
      isMock: false,
    };
  }

  const endpoint = `${config.baseUrl.replace(/\/+$/, "")}/links`;

  const payload: Record<string, any> = {
    title: params.title.slice(0, 50),
    description: params.description || undefined,
    amount: Number(params.amount.toFixed(2)),
    amount_currency: params.currency || "AED",
    link_type: "standalone",
    capacity: 1,
    active: true,
    return_url: params.returnUrl || undefined,
    failure_return_url: params.failureUrl || undefined,
    external_id: params.externalId || undefined,
    custom_data: params.customData || undefined,
    send_customer_receipt: params.sendEmailNotification ?? true,
    enable_tabby: true,
    payment_methods: ["card", "wallet"],
  };

  if (params.customer) {
    if (params.customer.firstName || params.customer.lastName) {
      if (params.customer.firstName) payload.first_name = params.customer.firstName;
      if (params.customer.lastName) payload.last_name = params.customer.lastName;
    } else if (params.customer.name) {
      const parts = params.customer.name.trim().split(" ");
      payload.first_name = parts[0];
      if (parts.length > 1) payload.last_name = parts.slice(1).join(" ");
    }
    if (params.customer.email) payload.email = params.customer.email;
    if (params.customer.phone) payload.phone_number = params.customer.phone;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey.trim()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = (await response.json().catch(() => null)) as any;

    if (!response.ok) {
      let errorMsg: string | null = null;

      if (responseData?.errors && typeof responseData.errors === "object") {
        const errorList: string[] = [];
        for (const [field, errs] of Object.entries(responseData.errors)) {
          if (Array.isArray(errs)) {
            errorList.push(`${field}: ${errs.join(", ")}`);
          } else if (typeof errs === "string") {
            errorList.push(`${field}: ${errs}`);
          }
        }
        if (errorList.length > 0) {
          errorMsg = errorList.join("; ");
        }
      }

      if (!errorMsg) {
        errorMsg =
          (responseData?.message && responseData.message !== "See errors"
            ? responseData.message
            : null) ||
          responseData?.error ||
          "Payment gateway returned an error";
      }

      return {
        success: false,
        status: "api_error",
        error: errorMsg || `HTTP ${response.status}`,
        isMock: false,
      };
    }

    const paymentUrl = responseData?.payment_url || responseData?.url;
    const paymentLinkId = responseData?.id || responseData?.link_id;

    if (!paymentUrl) {
      return {
        success: false,
        status: "malformed_response",
        error: "Mamo Pay returned a success response without a payment URL.",
        isMock: false,
      };
    }

    return {
      success: true,
      paymentLinkId,
      paymentUrl,
      status: "active",
      isMock: false,
    };
  } catch (err: any) {
    return {
      success: false,
      status: "network_error",
      error: err.message || "Failed to reach Mamo Pay gateway",
      isMock: false,
    };
  }
}
