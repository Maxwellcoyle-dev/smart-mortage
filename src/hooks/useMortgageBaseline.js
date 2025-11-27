// src/hooks/useMortgageBaseline.js
import { useMemo } from "react";
import { computeBaselineMortgage } from "../math/mortgageMath";

/**
 * React hook to compute baseline mortgage stats without velocity banking.
 *
 * @param {Object} params
 * @param {number} params.mortgageBalance
 * @param {number} params.mortgageTermMonths
 * @param {number} params.mortgageRateAnnual  // decimal, e.g. 0.063
 * @returns {{
 *   baselineMonthlyPayment: number,
 *   baselineMonths: number,
 *   totalInterestBaseline: number
 * }}
 */
export function useMortgageBaseline(params) {
  const { mortgageBalance, mortgageTermMonths, mortgageRateAnnual } = params;

  const result = useMemo(() => {
    if (!mortgageBalance || !mortgageTermMonths || mortgageRateAnnual == null) {
      return {
        baselineMonthlyPayment: 0,
        baselineMonths: 0,
        totalInterestBaseline: 0,
      };
    }

    return computeBaselineMortgage({
      mortgageBalance: Number(mortgageBalance),
      mortgageTermMonths: Number(mortgageTermMonths),
      mortgageRateAnnual: Number(mortgageRateAnnual),
    });
  }, [mortgageBalance, mortgageTermMonths, mortgageRateAnnual]);

  return result;
}
