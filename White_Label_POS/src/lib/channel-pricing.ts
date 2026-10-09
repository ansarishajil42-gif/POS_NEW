/**
 * Shared channel pricing calculation
 * Platform price = round2(base * (1 + markup/100)), half-up to 2 decimals.
 * If manual override exists and > 0, it takes precedence over markup calculation.
 */

export function round2(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

export function resolveChannelPrice(
  base: number | string | null | undefined,
  markupPercent?: number | string | null,
  override?: number | string | null
): number {
  if (override !== undefined && override !== null && override !== "") {
    const numOverride = Number(override);
    if (!isNaN(numOverride) && numOverride > 0) {
      return round2(numOverride);
    }
  }

  const baseNum = Number(base) || 0;
  if (markupPercent !== undefined && markupPercent !== null && markupPercent !== "") {
    const markupNum = Number(markupPercent);
    if (!isNaN(markupNum)) {
      return round2(baseNum * (1 + markupNum / 100));
    }
  }

  return round2(baseNum);
}
