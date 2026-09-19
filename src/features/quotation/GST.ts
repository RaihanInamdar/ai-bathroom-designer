export const GST_RATE_PCT = 18; // 18% standard GST on bathroom renovation and fixtures

export interface GSTBreakdown {
  taxableAmount: number;
  cgstAmount: number; // 9%
  sgstAmount: number; // 9%
  totalGst: number;   // 18%
  effectiveRate: number;
}

export function calculateGST(taxableAmount: number, ratePct: number = GST_RATE_PCT): GSTBreakdown {
  const totalGst = Math.round((taxableAmount * ratePct) / 100);
  const half = Math.round(totalGst / 2);

  return {
    taxableAmount,
    cgstAmount: half,
    sgstAmount: totalGst - half,
    totalGst,
    effectiveRate: ratePct
  };
}
