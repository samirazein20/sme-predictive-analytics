export interface ROICalcInput {
  baselineRevenue: number; // assumed per month
  growthPercent: number; // expected growth % for next period
  grossMarginPercent: number; // % of revenue that is gross profit
  investmentRatioPercent: number; // upfront investment as % of incremental revenue
}

export interface ROIScenario {
  label: 'Conservative' | 'Expected' | 'Optimistic';
  investmentRequired: number; // currency units
  incrementalRevenue: number; // currency units
  incrementalGrossProfit: number; // currency units
  grossMarginPercent: number;
  investmentRatioPercent: number;
  paybackMonths: number; // months to break even assuming monthly baseline revenue
}

/**
 * Compute three ROI scenarios with small sensitivity on margin and investment ratio.
 * Assumptions:
 * - Baseline revenue is monthly.
 * - Growth percent applies to the next month.
 * - Payback period = upfront investment / (incremental gross profit per month).
 */
export function computeROIScenarios(input: ROICalcInput): ROIScenario[] {
  const { baselineRevenue, growthPercent, grossMarginPercent, investmentRatioPercent } = input;

  const incrementalRevenue = baselineRevenue * (growthPercent / 100);

  const scenarios: Array<{ label: ROIScenario['label']; marginAdj: number; investAdj: number }> = [
    { label: 'Conservative', marginAdj: -5, investAdj: +10 },
    { label: 'Expected', marginAdj: 0, investAdj: 0 },
    { label: 'Optimistic', marginAdj: +5, investAdj: -10 },
  ];

  return scenarios.map(({ label, marginAdj, investAdj }) => {
    const margin = clampPercent(grossMarginPercent + marginAdj);
    const investRatio = clampPercent(investmentRatioPercent + investAdj);
    const incrementalGrossProfit = incrementalRevenue * (margin / 100);
    const investmentRequired = incrementalRevenue * (investRatio / 100);
    const paybackMonths = incrementalGrossProfit > 0 ? investmentRequired / incrementalGrossProfit : Infinity;

    return {
      label,
      investmentRequired,
      incrementalRevenue,
      incrementalGrossProfit,
      grossMarginPercent: margin,
      investmentRatioPercent: investRatio,
      paybackMonths,
    };
  });
}

function clampPercent(v: number): number {
  if (Number.isFinite(v)) {
    return Math.min(100, Math.max(0, v));
  }
  return 0;
}
