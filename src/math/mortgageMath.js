// src/lib/mortgageMath.js

/**
 * Compute baseline mortgage payment and total interest if no velocity banking is used.
 *
 * @param {Object} params
 * @param {number} params.mortgageBalance       Current balance (principal)
 * @param {number} params.mortgageTermMonths    Remaining term in months
 * @param {number} params.mortgageRateAnnual    Annual interest rate (e.g. 0.063 for 6.3%)
 * @param {number} [params.maxMonthsSimulated]  Safety cap for loop, default 1200
 * @returns {{
 *   baselineMonthlyPayment: number,
 *   baselineMonths: number,
 *   totalInterestBaseline: number
 * }}
 */
export function computeBaselineMortgage(params) {
  const {
    mortgageBalance,
    mortgageTermMonths,
    mortgageRateAnnual,
    maxMonthsSimulated = 1200,
  } = params;

  const P0 = mortgageBalance;
  const nM = mortgageTermMonths;
  const rM = mortgageRateAnnual / 12;

  if (P0 <= 0 || nM <= 0) {
    return {
      baselineMonthlyPayment: 0,
      baselineMonths: 0,
      totalInterestBaseline: 0,
    };
  }

  let baselineMonthlyPayment;
  if (rM > 0) {
    baselineMonthlyPayment = (P0 * rM) / (1 - Math.pow(1 + rM, -nM));
  } else {
    baselineMonthlyPayment = P0 / nM;
  }

  let balance = P0;
  let totalInterestBaseline = 0;
  let baselineMonths = 0;

  while (balance > 0 && baselineMonths < maxMonthsSimulated) {
    baselineMonths++;

    const interest = balance * rM;
    const payment = Math.min(baselineMonthlyPayment, balance + interest);
    const principal = payment - interest;

    totalInterestBaseline += interest;
    balance -= principal;
    if (balance < 0) balance = 0;
  }

  return {
    baselineMonthlyPayment,
    baselineMonths,
    totalInterestBaseline,
  };
}

/**
 * Simulate velocity banking using a HELOC.
 *
 * @param {Object} params
 * @param {number} params.mortgageBalance
 * @param {number} params.mortgageTermMonths
 * @param {number} params.mortgageRateAnnual     Annual mortgage rate (decimal)
 * @param {number} params.helocRateAnnual        Annual HELOC rate (decimal)
 * @param {number} params.helocChunkAmount       Amount borrowed from HELOC and applied to mortgage
 * @param {number} params.helocPaymentPerMonth   Fixed payment toward HELOC each month
 * @param {boolean} [params.repeatChunks]        Whether to repeat HELOC chunks when HELOC is paid off
 * @param {number} [params.maxMonthsSimulated]   Safety cap for loop
 * @returns {{
 *   baselineMonthlyPayment: number,
 *   baselineMonths: number,
 *   totalInterestBaseline: number,
 *   monthsVB: number,
 *   totalInterestMortgageVB: number,
 *   totalInterestHelocVB: number,
 *   totalInterestVBCombined: number,
 *   interestSaved: number,
 *   timeSavedMonths: number,
 *   yearsSaved: number
 * }}
 */
export function simulateVelocityBanking(params) {
  const {
    mortgageBalance,
    mortgageTermMonths,
    mortgageRateAnnual,
    helocRateAnnual,
    helocChunkAmount,
    helocPaymentPerMonth,
    repeatChunks = false,
    maxMonthsSimulated = 1200,
  } = params;

  if (helocChunkAmount <= 0) {
    // No velocity chunk – just baseline
    const baseline = computeBaselineMortgage({
      mortgageBalance,
      mortgageTermMonths,
      mortgageRateAnnual,
      maxMonthsSimulated,
    });

    return {
      ...baseline,
      monthsVB: baseline.baselineMonths,
      totalInterestMortgageVB: baseline.totalInterestBaseline,
      totalInterestHelocVB: 0,
      totalInterestVBCombined: baseline.totalInterestBaseline,
      interestSaved: 0,
      timeSavedMonths: 0,
      yearsSaved: 0,
    };
  }

  // 1) Baseline
  const baseline = computeBaselineMortgage({
    mortgageBalance,
    mortgageTermMonths,
    mortgageRateAnnual,
    maxMonthsSimulated,
  });

  const { baselineMonthlyPayment, baselineMonths, totalInterestBaseline } =
    baseline;

  // 2) Velocity simulation
  const P0 = mortgageBalance;
  const rM = mortgageRateAnnual / 12;
  const rH = helocRateAnnual / 12;

  let mortBal = P0;
  let helocBal = 0;

  let totalInterestMortgageVB = 0;
  let totalInterestHelocVB = 0;
  let monthsVB = 0;

  // Initial HELOC chunk
  const initialChunk = Math.min(helocChunkAmount, mortBal);
  mortBal -= initialChunk;
  helocBal += initialChunk;

  while ((mortBal > 0 || helocBal > 0) && monthsVB < maxMonthsSimulated) {
    monthsVB++;

    // Mortgage step
    if (mortBal > 0) {
      const mortInterest = mortBal * rM;
      totalInterestMortgageVB += mortInterest;

      const mortPaymentThisMonth = Math.min(
        baselineMonthlyPayment,
        mortBal + mortInterest
      );

      const mortPrincipalPaid = mortPaymentThisMonth - mortInterest;
      mortBal -= mortPrincipalPaid;
      if (mortBal < 0) mortBal = 0;
    }

    // HELOC step
    if (helocBal > 0) {
      const helocInterest = helocBal * rH;
      totalInterestHelocVB += helocInterest;

      if (helocPaymentPerMonth <= helocInterest && helocBal > 0.01) {
        // This means negative amortization – the HELOC will never pay off
        throw new Error(
          "HELOC payment is too low to pay down the balance (negative amortization). Increase HELOC payment."
        );
      }

      const helocPaymentThisMonth = Math.min(
        helocPaymentPerMonth,
        helocBal + helocInterest
      );

      const helocPrincipalPaid = helocPaymentThisMonth - helocInterest;
      helocBal -= helocPrincipalPaid;
      if (helocBal < 0) helocBal = 0;
    }

    // Repeat chunk (classic velocity banking)
    if (repeatChunks && helocBal === 0 && mortBal > 0) {
      const nextChunk = Math.min(helocChunkAmount, mortBal);
      if (nextChunk > 0) {
        mortBal -= nextChunk;
        helocBal += nextChunk;
      }
    }
  }

  const totalInterestVBCombined =
    totalInterestMortgageVB + totalInterestHelocVB;

  const interestSaved = totalInterestBaseline - totalInterestVBCombined;
  const timeSavedMonths = baselineMonths - monthsVB;
  const yearsSaved = timeSavedMonths / 12;

  return {
    baselineMonthlyPayment,
    baselineMonths,
    totalInterestBaseline,

    monthsVB,
    totalInterestMortgageVB,
    totalInterestHelocVB,
    totalInterestVBCombined,

    interestSaved,
    timeSavedMonths,
    yearsSaved,
  };
}

/**
 * Simulate extra payment strategy: same mortgage, but add a fixed extra principal payment every month.
 *
 * @param {Object} params
 * @param {number} params.mortgageBalance       Current balance (principal)
 * @param {number} params.mortgageTermMonths    Remaining term in months
 * @param {number} params.mortgageRateAnnual    Annual interest rate (e.g. 0.063 for 6.3%)
 * @param {number} params.extraPaymentPerMonth  Fixed extra principal payment per month
 * @param {number} [params.maxMonthsSimulated]  Safety cap for loop, default 1200
 * @returns {{
 *   monthlyPayment: number,
 *   totalMonths: number,
 *   totalInterest: number
 * }}
 */
export function simulateExtraPaymentStrategy(params) {
  const {
    mortgageBalance,
    mortgageTermMonths,
    mortgageRateAnnual,
    extraPaymentPerMonth,
    maxMonthsSimulated = 1200,
  } = params;

  const P0 = mortgageBalance;
  const nM = mortgageTermMonths;
  const rM = mortgageRateAnnual / 12;

  if (P0 <= 0 || nM <= 0) {
    return {
      monthlyPayment: 0,
      totalMonths: 0,
      totalInterest: 0,
    };
  }

  // Calculate baseline monthly payment
  let baselineMonthlyPayment;
  if (rM > 0) {
    baselineMonthlyPayment = (P0 * rM) / (1 - Math.pow(1 + rM, -nM));
  } else {
    baselineMonthlyPayment = P0 / nM;
  }

  let balance = P0;
  let totalInterest = 0;
  let totalMonths = 0;

  while (balance > 0 && totalMonths < maxMonthsSimulated) {
    totalMonths++;

    const interest = balance * rM;
    const regularPayment = Math.min(baselineMonthlyPayment, balance + interest);
    const principalFromRegular = regularPayment - interest;

    // Add extra principal payment
    const extraPrincipal = Math.min(
      extraPaymentPerMonth,
      balance - principalFromRegular
    );
    const totalPrincipalPaid = principalFromRegular + extraPrincipal;

    totalInterest += interest;
    balance -= totalPrincipalPaid;
    if (balance < 0) balance = 0;
  }

  return {
    monthlyPayment: baselineMonthlyPayment + extraPaymentPerMonth,
    totalMonths,
    totalInterest,
  };
}

/**
 * Simulate investment strategy: invest extra payment amount in stock market instead of paying down mortgage.
 *
 * @param {Object} params
 * @param {number} params.investmentTermMonths  Term in months to invest (from best paydown strategy)
 * @param {number} params.extraPaymentPerMonth  Amount invested per month
 * @param {number} params.investmentReturnAnnual Annual investment return rate (decimal, e.g. 0.10 for 10%)
 * @param {number} params.baselineInterest       Baseline mortgage interest (for comparison)
 * @param {number} params.bestPaydownInterest   Best paydown strategy interest (for comparison)
 * @returns {{
 *   totalMonths: number,
 *   totalInvested: number,
 *   totalValue: number,
 *   investmentGains: number,
 *   netBenefit: number  // investmentGains - interestSavedByBestPaydown
 * }}
 */
export function simulateInvestmentStrategy(params) {
  const {
    investmentTermMonths,
    extraPaymentPerMonth,
    investmentReturnAnnual,
    baselineInterest,
    bestPaydownInterest,
  } = params;

  if (
    !extraPaymentPerMonth ||
    extraPaymentPerMonth <= 0 ||
    !investmentTermMonths ||
    investmentTermMonths <= 0
  ) {
    return {
      totalMonths: investmentTermMonths || 0,
      totalInvested: 0,
      totalValue: 0,
      investmentGains: 0,
      netBenefit: 0,
    };
  }

  const monthlyReturn = investmentReturnAnnual / 12;

  // Calculate future value of monthly investments (annuity)
  let totalValue = 0;
  let totalInvested = 0;

  // Simulate month by month to be precise
  for (let month = 1; month <= investmentTermMonths; month++) {
    // Add this month's investment
    totalInvested += extraPaymentPerMonth;

    // Compound all existing investments
    totalValue = totalValue * (1 + monthlyReturn) + extraPaymentPerMonth;
  }

  const investmentGains = totalValue - totalInvested;

  // Net benefit: investment gains vs interest that would have been saved by best paydown strategy
  const interestSavedByBestPaydown = baselineInterest - bestPaydownInterest;
  const netBenefit = investmentGains - interestSavedByBestPaydown;

  return {
    totalMonths: investmentTermMonths,
    totalInvested,
    totalValue,
    investmentGains,
    netBenefit,
  };
}

/**
 * Comprehensive simulation comparing Baseline, Extra Payment, and Velocity Banking strategies.
 *
 * @param {Object} params
 * @param {number} params.mortgageBalance
 * @param {number} params.mortgageTermMonths
 * @param {number} params.mortgageRateAnnual     Annual mortgage rate (decimal)
 * @param {number} params.helocRateAnnual        Annual HELOC rate (decimal)
 * @param {number} params.helocChunkAmount       Amount borrowed from HELOC and applied to mortgage
 * @param {number} params.helocPaymentPerMonth   Fixed payment toward HELOC each month (also used as extra payment)
 * @param {boolean} [params.repeatChunks]        Whether to repeat HELOC chunks when HELOC is paid off
 * @param {number} [params.investmentReturnAnnual] Annual investment return rate (decimal, e.g. 0.10 for 10%)
 * @param {number} [params.maxMonthsSimulated]   Safety cap for loop
 * @returns {{
 *   baseline: { monthlyPayment: number, totalMonths: number, totalInterest: number },
 *   extraPayment: { monthlyPayment: number, totalMonths: number, totalInterest: number },
 *   velocity: { totalMonths: number, totalInterest: number, mortgageInterest: number, helocInterest: number },
 *   investment: { totalMonths: number, totalInvested: number, totalValue: number, investmentGains: number, mortgageInterest: number, netBenefit: number },
 *   comparisons: {
 *     extraVsBaseline: { interestSaved: number, timeSavedMonths: number, yearsSaved: number },
 *     velocityVsBaseline: { interestSaved: number, timeSavedMonths: number, yearsSaved: number },
 *     velocityVsExtra: { interestSaved: number, timeSavedMonths: number, yearsSaved: number },
 *     investmentVsBaseline: { netBenefit: number },
 *     investmentVsExtra: { netBenefit: number }
 *   }
 * }}
 */
export function simulateAllStrategies(params) {
  const {
    mortgageBalance,
    mortgageTermMonths,
    mortgageRateAnnual,
    helocRateAnnual,
    helocChunkAmount,
    helocPaymentPerMonth,
    repeatChunks = false,
    investmentReturnAnnual = 0,
    maxMonthsSimulated = 1200,
  } = params;

  // 1. Baseline
  const baseline = computeBaselineMortgage({
    mortgageBalance,
    mortgageTermMonths,
    mortgageRateAnnual,
    maxMonthsSimulated,
  });

  // 2. Extra Payment Strategy
  const extraPayment = simulateExtraPaymentStrategy({
    mortgageBalance,
    mortgageTermMonths,
    mortgageRateAnnual,
    extraPaymentPerMonth: helocPaymentPerMonth || 0,
    maxMonthsSimulated,
  });

  // 3. Velocity Banking
  const velocityResult = simulateVelocityBanking({
    mortgageBalance,
    mortgageTermMonths,
    mortgageRateAnnual,
    helocRateAnnual,
    helocChunkAmount: helocChunkAmount || 0,
    helocPaymentPerMonth: helocPaymentPerMonth || 0,
    repeatChunks,
    maxMonthsSimulated,
  });

  const velocity = {
    totalMonths: velocityResult.monthsVB,
    totalInterest: velocityResult.totalInterestVBCombined,
    mortgageInterest: velocityResult.totalInterestMortgageVB,
    helocInterest: velocityResult.totalInterestHelocVB,
  };

  // Determine best paydown strategy (Extra Payment vs Velocity Banking)
  const extraVsBaseline = {
    interestSaved: baseline.totalInterestBaseline - extraPayment.totalInterest,
    timeSavedMonths: baseline.baselineMonths - extraPayment.totalMonths,
    yearsSaved: (baseline.baselineMonths - extraPayment.totalMonths) / 12,
  };

  const velocityVsBaseline = {
    interestSaved: baseline.totalInterestBaseline - velocity.totalInterest,
    timeSavedMonths: baseline.baselineMonths - velocity.totalMonths,
    yearsSaved: (baseline.baselineMonths - velocity.totalMonths) / 12,
  };

  const velocityVsExtra = {
    interestSaved: extraPayment.totalInterest - velocity.totalInterest,
    timeSavedMonths: extraPayment.totalMonths - velocity.totalMonths,
    yearsSaved: (extraPayment.totalMonths - velocity.totalMonths) / 12,
  };

  // Determine best paydown strategy
  let bestPaydownData;
  if (velocityVsBaseline.interestSaved > extraVsBaseline.interestSaved) {
    bestPaydownData = {
      name: "Velocity Banking",
      data: velocity,
      comparison: velocityVsBaseline,
      color: "velocity",
    };
  } else {
    bestPaydownData = {
      name: "Extra Payment",
      data: extraPayment,
      comparison: extraVsBaseline,
      color: "extra",
    };
  }

  // 4. Investment Strategy - calculated over the best paydown strategy's term
  const investment = simulateInvestmentStrategy({
    investmentTermMonths: bestPaydownData.data.totalMonths,
    extraPaymentPerMonth: helocPaymentPerMonth || 0,
    investmentReturnAnnual: investmentReturnAnnual || 0,
    baselineInterest: baseline.totalInterestBaseline,
    bestPaydownInterest: bestPaydownData.data.totalInterest,
  });

  // Investment vs Best Paydown comparison
  const investmentVsBestPaydown = {
    netBenefit: investment.netBenefit,
  };

  // Determine best overall strategy
  let bestOverallStrategy;
  if (investment.netBenefit > 0) {
    bestOverallStrategy = {
      name: "Investment Strategy",
      data: investment,
      comparison: investmentVsBestPaydown,
      color: "investment",
      type: "investment",
    };
  } else {
    bestOverallStrategy = {
      name: bestPaydownData.name,
      data: bestPaydownData.data,
      comparison: bestPaydownData.comparison,
      color: bestPaydownData.color,
      type: "paydown",
    };
  }

  return {
    baseline: {
      monthlyPayment: baseline.baselineMonthlyPayment,
      totalMonths: baseline.baselineMonths,
      totalInterest: baseline.totalInterestBaseline,
    },
    extraPayment: {
      monthlyPayment: extraPayment.monthlyPayment,
      totalMonths: extraPayment.totalMonths,
      totalInterest: extraPayment.totalInterest,
    },
    velocity,
    investment,
    bestPaydownStrategy: bestPaydownData,
    bestOverallStrategy,
    comparisons: {
      extraVsBaseline,
      velocityVsBaseline,
      velocityVsExtra,
      investmentVsBestPaydown,
    },
  };
}
