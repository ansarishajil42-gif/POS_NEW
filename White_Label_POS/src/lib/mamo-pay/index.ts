import { getMamoPayConfig } from "./config.js";
import type {
  MamoCreatePaymentLinkParams,
  MamoPaymentResult,
  MamoWebhookPayload,
} from "./types.js";

export * from "./types.js";
export * from "./config.js";

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

  // Map params to Mamo's required snake_case schema
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
  };

  // Add customer details if present
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

    const responseData = await response.json().catch(() => null);

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
          (Array.isArray(responseData?.messages)
            ? responseData.messages.join(", ")
            : null) ||
          `Mamo Pay API returned status ${response.status} (${response.statusText})`;
      }

      console.error("[Mamo Pay] Link creation failed:", {
        status: response.status,
        data: responseData,
        extractedError: errorMsg,
      });

      return {
        success: false,
        status: "error",
        error: errorMsg,
        isMock: false,
      };
    }

    const paymentUrl =
      responseData?.payment_url ||
      responseData?.payment_link_url ||
      responseData?.url;
    const linkId = responseData?.id || responseData?.link_id;

    if (!paymentUrl) {
      return {
        success: false,
        status: "error",
        error: "Mamo Pay response did not contain a payment URL.",
        isMock: false,
      };
    }

    return {
      success: true,
      paymentLinkId: linkId,
      paymentUrl,
      status: responseData?.status || "active",
      message: "Mamo Pay payment link generated successfully.",
      isMock: false,
    };
  } catch (err: any) {
    console.error("[Mamo Pay] Network/Fetch error during link creation:", err);
    return {
      success: false,
      status: "network_error",
      error:
        err?.message ||
        "Failed to connect to Mamo Pay API. Please check server network connection.",
      isMock: false,
    };
  }
}

/**
 * Validates the incoming webhook request authorization header against MAMO_PAY_WEBHOOK_SECRET.
 */
export function verifyMamoWebhookAuth(authHeader: string | undefined): boolean {
  const config = getMamoPayConfig();
  if (!config.webhookSecret) {
    console.warn(
      "[Mamo Pay Webhook] MAMO_PAY_WEBHOOK_SECRET is not configured. Webhook rejected."
    );
    return false;
  }

  if (!authHeader) return false;

  const cleanHeader = authHeader.trim();
  const secret = config.webhookSecret.trim();

  return (
    cleanHeader === secret ||
    cleanHeader === `Bearer ${secret}` ||
    cleanHeader === `bearer ${secret}`
  );
}

/**
 * Parses and extracts core transaction and invoice identifiers from Mamo Pay webhook payloads.
 */
export function parseMamoWebhookEvent(payload: MamoWebhookPayload) {
  const data = payload?.data || (payload as any);
  const customData = data?.custom_data || data?.customData || {};

  const invoiceId =
    customData?.invoiceId ||
    customData?.invoice_id ||
    data?.external_id ||
    data?.externalId;

  const tenantId =
    customData?.tenantId ||
    customData?.tenant_id ||
    undefined;

  return {
    event: payload?.event || "unknown",
    invoiceId,
    tenantId,
    amount: data?.amount,
    currency: data?.amount_currency || data?.currency || "AED",
    status: data?.status,
    transactionId: data?.id || data?.transactionId,
    paymentLinkId: data?.payment_link_id,
    paidAt: data?.paid_at || new Date().toISOString(),
  };
}

