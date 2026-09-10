export interface MamoCreatePaymentLinkParams {
  title: string;
  description?: string;
  amount: number;
  currency?: string; // default "AED" -> mapped to amount_currency
  externalId?: string; // mapped to external_id
  returnUrl?: string; // mapped to return_url
  failureUrl?: string; // mapped to failure_return_url
  customData?: Record<string, any>; // mapped to custom_data
  customer?: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  sendEmailNotification?: boolean;
}

export interface MamoPaymentLinkResponse {
  id: string;
  paymentUrl: string;
  amount: number;
  currency: string;
  status: string;
  externalId?: string;
  createdAt?: string;
}

export interface MamoWebhookPayload {
  event: string;
  data: {
    id: string;
    amount: number;
    amount_currency?: string;
    currency?: string;
    status: string;
    external_id?: string;
    externalId?: string;
    custom_data?: Record<string, any>;
    customData?: Record<string, any>;
    transactionId?: string;
    payment_link_id?: string;
    payment_link_url?: string;
    customer?: {
      first_name?: string;
      last_name?: string;
      name?: string;
      email?: string;
      phone?: string;
    };
    payment_method?: any;
    paid_at?: string;
    created_at?: string;
  };
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

