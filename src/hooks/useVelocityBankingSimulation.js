// src/hooks/useVelocityBankingSimulation.js
import { useMemo, useState } from "react";
import { simulateAllStrategies } from "../math/mortgageMath";

/**
 * React hook to run comprehensive simulation comparing Baseline, Extra Payment, and Velocity Banking strategies.
 *
 * @param {Object} params
 * @param {number} params.mortgageBalance
 * @param {number} params.mortgageTermMonths
 * @param {number} params.mortgageRateAnnual   // decimal (0.063)
 * @param {number} params.helocRateAnnual      // decimal (0.07)
 * @param {number} params.helocChunkAmount
 * @param {number} params.helocPaymentPerMonth
 * @param {boolean} params.repeatChunks
 * @param {number} params.investmentReturnAnnual Annual investment return rate (decimal)
 * @returns {{
 *   result: any | null,
 *   error: string | null
 * }}
 */
export function useVelocityBankingSimulation(params) {
  const [error, setError] = useState(null);

  const result = useMemo(() => {
    setError(null);

    try {
      if (
        !params.mortgageBalance ||
        !params.mortgageTermMonths ||
        params.mortgageRateAnnual == null ||
        params.helocRateAnnual == null
      ) {
        return null;
      }

      return simulateAllStrategies({
        mortgageBalance: Number(params.mortgageBalance),
        mortgageTermMonths: Number(params.mortgageTermMonths),
        mortgageRateAnnual: Number(params.mortgageRateAnnual),
        helocRateAnnual: Number(params.helocRateAnnual),
        helocChunkAmount: Number(params.helocChunkAmount || 0),
        helocPaymentPerMonth: Number(params.helocPaymentPerMonth || 0),
        repeatChunks: !!params.repeatChunks,
        investmentReturnAnnual:
          Number(params.investmentReturnAnnual || 0) / 100,
      });
    } catch (e) {
      setError(e.message || "Simulation error");
      return null;
    }
  }, [
    params.mortgageBalance,
    params.mortgageTermMonths,
    params.mortgageRateAnnual,
    params.helocRateAnnual,
    params.helocChunkAmount,
    params.helocPaymentPerMonth,
    params.repeatChunks,
    params.investmentReturnAnnual,
  ]);

  return { result, error };
}
