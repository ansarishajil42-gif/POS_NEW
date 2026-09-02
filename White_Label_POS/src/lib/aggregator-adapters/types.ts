export interface ProductData {
  id?: string;
  barcode?: string;
  sku?: string;
  price: string;
  active?: boolean;
  promotion?: {
    startDate: Date;
    endDate: Date;
    discountedPrice: string;
    maxNoOfOrders?: string;
  } | null;
}

export interface ConnectionConfigAdapter {
  vendorId: string;
  priceFormat: "price_discounted" | "original_discounted" | "original_price";
  remoteDirectory?: string;
}

export interface GeneratedFileResult {
  fileName: string;
  fileContent: string;
  recordCount: number;
  warning?: string;
}

export interface AggregatorAdapter {
  aggregatorName: string; // e.g. "talabat"
  generateFile(products: ProductData[], connection: ConnectionConfigAdapter): GeneratedFileResult;
}
