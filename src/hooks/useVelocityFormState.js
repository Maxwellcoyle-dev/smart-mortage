// src/hooks/useVelocityFormState.js
import { useState } from "react";

export function useVelocityFormState() {
  const [mortgageBalance, setMortgageBalance] = useState("500000");
  const [mortgageTermMonths, setMortgageTermMonths] = useState("300");
  const [mortgageRatePercent, setMortgageRatePercent] = useState("6.3");

  const [helocRatePercent, setHelocRatePercent] = useState("7");
  const [helocChunkAmount, setHelocChunkAmount] = useState("15000");
  const [helocPaymentPerMonth, setHelocPaymentPerMonth] = useState("3000");
  const [repeatChunks, setRepeatChunks] = useState(true);
  const [investmentReturnPercent, setInvestmentReturnPercent] = useState("10");

  return {
    state: {
      mortgageBalance,
      mortgageTermMonths,
      mortgageRatePercent,
      helocRatePercent,
      helocChunkAmount,
      helocPaymentPerMonth,
      repeatChunks,
      investmentReturnPercent,
    },
    setters: {
      setMortgageBalance,
      setMortgageTermMonths,
      setMortgageRatePercent,
      setHelocRatePercent,
      setHelocChunkAmount,
      setHelocPaymentPerMonth,
      setRepeatChunks,
      setInvestmentReturnPercent,
    },
  };
}
