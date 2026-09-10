export interface MamoPayConfig {
  apiKey: string;
  webhookSecret: string;
  baseUrl: string;
  isConfigured: boolean;
}

export function getMamoPayConfig(): MamoPayConfig {
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

