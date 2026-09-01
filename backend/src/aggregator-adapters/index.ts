import { AggregatorAdapter } from "./types.js";
import { talabatAdapter } from "./talabat-adapter.js";

const adapters: Record<string, AggregatorAdapter> = {
  talabat: talabatAdapter,
};

export function getAdapter(aggregatorName: string): AggregatorAdapter {
  const cleanName = (aggregatorName || "").toLowerCase().trim();
  const adapter = adapters[cleanName];
  if (!adapter) {
    throw new Error(
      `Aggregator integration for '${aggregatorName}' is not yet implemented — format specification pending from provider.`
    );
  }
  return adapter;
}

export * from "./types.js";
export * from "./talabat-adapter.js";
