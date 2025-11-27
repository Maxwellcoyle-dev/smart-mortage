// src/App.jsx
import React, { useState } from "react";
import { useVelocityFormState } from "./hooks/useVelocityFormState";
import { useVelocityBankingSimulation } from "./hooks/useVelocityBankingSimulation";
import "./App.css";

function App() {
  const [expandedSections, setExpandedSections] = useState({
    inputs: true,
    detailedResults: false,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };
  const { state, setters } = useVelocityFormState();

  const {
    mortgageBalance,
    mortgageTermMonths,
    mortgageRatePercent,
    helocRatePercent,
    helocChunkAmount,
    helocPaymentPerMonth,
    repeatChunks,
    investmentReturnPercent,
  } = state;

  // Convert % inputs to decimals for the simulation hook
  const mortgageRateAnnual = Number(mortgageRatePercent || 0) / 100;
  const helocRateAnnual = Number(helocRatePercent || 0) / 100;

  const { result, error } = useVelocityBankingSimulation({
    mortgageBalance: Number(mortgageBalance),
    mortgageTermMonths: Number(mortgageTermMonths),
    mortgageRateAnnual,
    helocRateAnnual,
    helocChunkAmount: Number(helocChunkAmount),
    helocPaymentPerMonth: Number(helocPaymentPerMonth),
    repeatChunks,
    investmentReturnAnnual: Number(investmentReturnPercent || 0),
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCurrencyPrecise = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Mortgage Payment / Investment Simulator</h1>
        <p className="app-subtitle">
          Find the fasted way to pay off your mortgage: Baseline, Extra
          Payments, and Velocity Banking
        </p>
        <p className="app-description">
          Next - determine if your better off investing the extra payment or
          paying down your mortgage faster.
        </p>
      </header>

      {error && (
        <div className="error-alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Input Section - At the Top */}
      <div className="input-section-top">
        <div className="input-section-header">
          <h2 className="input-section-title">Input Parameters</h2>
          <p className="input-section-description">
            Enter your mortgage details and strategy parameters below. The
            simulator will compare different approaches to paying down your
            mortgage and investing.
          </p>
        </div>
        <div className="input-grid-top">
          {/* Mortgage inputs */}
          <div className="input-card">
            <div className="card-header">
              <h2 className="card-title">Mortgage Details</h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Balance ($)</label>
                <input
                  type="number"
                  className="form-input"
                  value={mortgageBalance}
                  onChange={(e) => setters.setMortgageBalance(e.target.value)}
                  placeholder="500000"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Remaining Term (months)</label>
                <input
                  type="number"
                  className="form-input"
                  value={mortgageTermMonths}
                  onChange={(e) =>
                    setters.setMortgageTermMonths(e.target.value)
                  }
                  placeholder="300"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Interest Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={mortgageRatePercent}
                  onChange={(e) =>
                    setters.setMortgageRatePercent(e.target.value)
                  }
                  placeholder="6.3"
                />
              </div>
            </div>
          </div>

          {/* HELOC inputs */}
          <div className="input-card">
            <div className="card-header">
              <h2 className="card-title">Extra Payment & Velocity Strategy</h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">
                  Extra Payment per Month ($)
                </label>
                <input
                  type="number"
                  className="form-input"
                  value={helocPaymentPerMonth}
                  onChange={(e) =>
                    setters.setHelocPaymentPerMonth(e.target.value)
                  }
                  placeholder="3000"
                />
                <div className="form-help-text">
                  This amount is used for both strategies: direct extra
                  principal payments or HELOC payments
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">HELOC Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={helocRatePercent}
                  onChange={(e) => setters.setHelocRatePercent(e.target.value)}
                  placeholder="7.0"
                />
                <div className="form-help-text">
                  Only used for Velocity Banking strategy
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">HELOC Chunk Amount ($)</label>
                <input
                  type="number"
                  className="form-input"
                  value={helocChunkAmount}
                  onChange={(e) => setters.setHelocChunkAmount(e.target.value)}
                  placeholder="15000"
                />
                <div className="form-help-text">
                  Initial HELOC amount applied to mortgage (Velocity Banking
                  only)
                </div>
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    className="checkbox-input"
                    checked={repeatChunks}
                    onChange={(e) => setters.setRepeatChunks(e.target.checked)}
                  />
                  <span>Repeat chunks until mortgage is paid off</span>
                </label>
              </div>
            </div>
          </div>

          {/* Investment Strategy Input */}
          <div className="input-card">
            <div className="card-header">
              <h2 className="card-title">Investment Strategy</h2>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label">Expected Annual Return (%)</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={investmentReturnPercent}
                  onChange={(e) =>
                    setters.setInvestmentReturnPercent(e.target.value)
                  }
                  placeholder="10.0"
                />
                <div className="form-help-text">
                  Expected annual return if investing extra payment in stock
                  market instead of paying down mortgage
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section - Below Inputs */}
      {result && (
        <>
          <div className="comparisons-section">
            <h2 className="comparisons-title">Strategy Summary</h2>
            <div className="comparisons-grid-best">
              {/* Best Loan Paydown Strategy */}
              {(() => {
                const bestPaydown = result.bestPaydownStrategy;
                const mortgageBalanceValue = Number(mortgageBalance);
                const totalAmountSpent =
                  mortgageBalanceValue + bestPaydown.data.totalInterest;

                return (
                  <div
                    className={`comparison-card-best ${bestPaydown.color}-best`}
                  >
                    <div className="comparison-card-header-best">
                      <div className="best-strategy-badge">
                        🏠 Best Loan Paydown
                      </div>
                      <h3 className="comparison-card-title-best">
                        {bestPaydown.name}
                      </h3>
                      <p className="comparison-card-subtitle">
                        Best strategy for paying down your mortgage
                      </p>
                    </div>
                    <div className="comparison-card-body-best">
                      <div className="comparison-metric-best">
                        <div className="comparison-icon-best savings-icon">
                          💰
                        </div>
                        <div className="comparison-content-best">
                          <div className="comparison-label-best">
                            Interest Saved vs Baseline
                          </div>
                          <div className="comparison-value-best savings-value">
                            {formatCurrency(
                              bestPaydown.comparison.interestSaved
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="comparison-divider-best"></div>
                      <div className="comparison-metric-best">
                        <div className="comparison-icon-best time-icon">⏱️</div>
                        <div className="comparison-content-best">
                          <div className="comparison-label-best">
                            Time Saved vs Baseline
                          </div>
                          <div className="comparison-value-best time-value">
                            {bestPaydown.comparison.timeSavedMonths} months
                            <span className="comparison-subtext-best">
                              ({bestPaydown.comparison.yearsSaved.toFixed(2)}{" "}
                              years)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="comparison-card-metrics-best">
                      <div className="comparison-metric-row-best">
                        <div className="comparison-metric-item-best">
                          <div className="comparison-label-best">
                            Total Loan Term
                          </div>
                          <div className="comparison-value-best">
                            {bestPaydown.data.totalMonths} months
                            <span className="comparison-subtext-best">
                              ({(bestPaydown.data.totalMonths / 12).toFixed(1)}{" "}
                              years)
                            </span>
                          </div>
                        </div>
                        <div className="comparison-metric-item-best">
                          <div className="comparison-label-best">
                            Total Interest Spent
                          </div>
                          <div className="comparison-value-best">
                            {formatCurrency(bestPaydown.data.totalInterest)}
                          </div>
                        </div>
                        <div className="comparison-metric-item-best">
                          <div className="comparison-label-best">
                            Total Amount Spent
                          </div>
                          <div className="comparison-value-best">
                            {formatCurrency(totalAmountSpent)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Best Overall Strategy - Comparison View */}
              {(() => {
                const bestPaydown = result.bestPaydownStrategy;
                const investment = result.investment;
                const bestOverall = result.bestOverallStrategy;
                const investmentWins = bestOverall.type === "investment";
                const netBenefit = investment.netBenefit;

                return (
                  <div className="comparison-card-best comparison-card-split">
                    <div className="comparison-card-header-best">
                      <div className="best-strategy-badge">
                        ⭐ Best Overall Strategy
                      </div>
                      <h3 className="comparison-card-title-best">
                        {investmentWins
                          ? "Investment Strategy"
                          : bestPaydown.name}
                      </h3>
                      <p className="comparison-card-subtitle">
                        {investmentWins
                          ? `Investing beats paying down by ${formatCurrency(
                              Math.abs(netBenefit)
                            )}`
                          : `Paying down beats investing by ${formatCurrency(
                              Math.abs(netBenefit)
                            )}`}
                      </p>
                    </div>
                    <div className="comparison-split-body">
                      {/* Best Paydown Strategy Column */}
                      <div
                        className={`comparison-split-column ${
                          !investmentWins ? "winner-column" : ""
                        }`}
                      >
                        <div className="comparison-split-header">
                          <h4 className="comparison-split-title">
                            {bestPaydown.name}
                          </h4>
                          {!investmentWins && (
                            <span className="winner-badge">Winner</span>
                          )}
                        </div>
                        <div className="comparison-split-metrics">
                          <div className="comparison-split-metric">
                            <div className="comparison-split-label">
                              Interest Saved
                            </div>
                            <div className="comparison-split-value savings-value">
                              {formatCurrency(
                                bestPaydown.comparison.interestSaved
                              )}
                            </div>
                          </div>
                          <div className="comparison-split-metric">
                            <div className="comparison-split-label">
                              Time Saved
                            </div>
                            <div className="comparison-split-value">
                              {bestPaydown.comparison.timeSavedMonths} months
                              <span className="comparison-split-subtext">
                                ({bestPaydown.comparison.yearsSaved.toFixed(1)}{" "}
                                years)
                              </span>
                            </div>
                          </div>
                          <div className="comparison-split-metric">
                            <div className="comparison-split-label">
                              Total Interest
                            </div>
                            <div className="comparison-split-value">
                              {formatCurrency(bestPaydown.data.totalInterest)}
                            </div>
                          </div>
                          <div className="comparison-split-metric">
                            <div className="comparison-split-label">
                              Payoff Time
                            </div>
                            <div className="comparison-split-value">
                              {bestPaydown.data.totalMonths} months
                              <span className="comparison-split-subtext">
                                (
                                {(bestPaydown.data.totalMonths / 12).toFixed(1)}{" "}
                                years)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* VS Divider */}
                      <div className="comparison-split-divider">
                        <div className="vs-badge">VS</div>
                      </div>

                      {/* Investment Strategy Column */}
                      <div
                        className={`comparison-split-column ${
                          investmentWins ? "winner-column" : ""
                        }`}
                      >
                        <div className="comparison-split-header">
                          <h4 className="comparison-split-title">
                            Investment Strategy
                          </h4>
                          {investmentWins && (
                            <span className="winner-badge">Winner</span>
                          )}
                        </div>
                        <div className="comparison-split-metrics">
                          <div className="comparison-split-metric">
                            <div className="comparison-split-label">
                              Investment Gains
                            </div>
                            <div
                              className={`comparison-split-value ${
                                investmentWins ? "savings-value" : ""
                              }`}
                            >
                              {formatCurrency(investment.investmentGains)}
                            </div>
                          </div>
                          <div className="comparison-split-metric">
                            <div className="comparison-split-label">
                              Total Invested
                            </div>
                            <div className="comparison-split-value">
                              {formatCurrency(investment.totalInvested)}
                            </div>
                          </div>
                          <div className="comparison-split-metric">
                            <div className="comparison-split-label">
                              Total Value
                            </div>
                            <div className="comparison-split-value">
                              {formatCurrency(investment.totalValue)}
                            </div>
                          </div>
                          <div className="comparison-split-metric">
                            <div className="comparison-split-label">
                              Investment Term
                            </div>
                            <div className="comparison-split-value">
                              {investment.totalMonths} months
                              <span className="comparison-split-subtext">
                                ({(investment.totalMonths / 12).toFixed(1)}{" "}
                                years)
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="comparison-footer-best">
                      <div className="comparison-detail">
                        <strong>Net Benefit:</strong>{" "}
                        {investmentWins
                          ? `Investing provides ${formatCurrency(
                              Math.abs(netBenefit)
                            )} more value than paying down`
                          : `Paying down saves ${formatCurrency(
                              Math.abs(netBenefit)
                            )} more than investing`}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Detailed Results - Collapsible */}
          <div className="detailed-results-section">
            <div
              className="section-toggle-header"
              onClick={() => toggleSection("detailedResults")}
            >
              <h2 className="section-toggle-title">
                Detailed Strategy Results
              </h2>
              <span className="section-toggle-icon">
                {expandedSections.detailedResults ? "▼" : "▶"}
              </span>
            </div>
            {expandedSections.detailedResults && (
              <div className="results-section">
                <div className="results-grid">
                  {/* Baseline Results */}
                  <div className="result-card baseline-card">
                    <div className="result-card-header">
                      <h3 className="result-card-title">Baseline Strategy</h3>
                      <span className="result-card-badge">Traditional</span>
                    </div>
                    <div className="result-card-body">
                      <div className="metric">
                        <div className="metric-label">Monthly Payment</div>
                        <div className="metric-value">
                          {formatCurrencyPrecise(
                            result.baseline.monthlyPayment
                          )}
                        </div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">Payoff Time</div>
                        <div className="metric-value">
                          {result.baseline.totalMonths} months
                          <span className="metric-subtext">
                            ({(result.baseline.totalMonths / 12).toFixed(1)}{" "}
                            years)
                          </span>
                        </div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">Total Interest</div>
                        <div className="metric-value">
                          {formatCurrency(result.baseline.totalInterest)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Extra Payment Strategy Results */}
                  <div className="result-card extra-payment-card">
                    <div className="result-card-header extra-payment-header">
                      <h3 className="result-card-title">
                        Extra Payment Strategy
                      </h3>
                      <span className="result-card-badge extra-badge">
                        Direct
                      </span>
                    </div>
                    <div className="result-card-body">
                      <div className="metric">
                        <div className="metric-label">Monthly Payment</div>
                        <div className="metric-value">
                          {formatCurrencyPrecise(
                            result.extraPayment.monthlyPayment
                          )}
                        </div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">
                          Extra Payment Towards Principal
                        </div>
                        <div className="metric-value">
                          {formatCurrencyPrecise(Number(helocPaymentPerMonth))}
                        </div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">Payoff Time</div>
                        <div className="metric-value">
                          {result.extraPayment.totalMonths} months
                          <span className="metric-subtext">
                            ({(result.extraPayment.totalMonths / 12).toFixed(1)}{" "}
                            years)
                          </span>
                        </div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">Total Interest</div>
                        <div className="metric-value">
                          {formatCurrency(result.extraPayment.totalInterest)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Velocity Banking Results */}
                  <div className="result-card velocity-card">
                    <div className="result-card-header velocity-header">
                      <h3 className="result-card-title">Velocity Banking</h3>
                      <span className="result-card-badge velocity-badge">
                        Strategy
                      </span>
                    </div>
                    <div className="result-card-body">
                      <div className="metric">
                        <div className="metric-label">Payoff Time</div>
                        <div className="metric-value">
                          {result.velocity.totalMonths} months
                          <span className="metric-subtext">
                            ({(result.velocity.totalMonths / 12).toFixed(1)}{" "}
                            years)
                          </span>
                        </div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">Mortgage Interest</div>
                        <div className="metric-value">
                          {formatCurrency(result.velocity.mortgageInterest)}
                        </div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">HELOC Interest</div>
                        <div className="metric-value">
                          {formatCurrency(result.velocity.helocInterest)}
                        </div>
                      </div>
                      <div className="metric metric-total">
                        <div className="metric-label">Total Interest</div>
                        <div className="metric-value">
                          {formatCurrency(result.velocity.totalInterest)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Investment Strategy Results */}
                  <div className="result-card investment-card">
                    <div className="result-card-header investment-header">
                      <h3 className="result-card-title">Investment Strategy</h3>
                      <span className="result-card-badge investment-badge">
                        Stocks
                      </span>
                    </div>
                    <div className="result-card-body">
                      <div className="metric">
                        <div className="metric-label">Monthly Investment</div>
                        <div className="metric-value">
                          {formatCurrencyPrecise(Number(helocPaymentPerMonth))}
                        </div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">Investment Term</div>
                        <div className="metric-value">
                          {result.investment.totalMonths} months
                          <span className="metric-subtext">
                            ({(result.investment.totalMonths / 12).toFixed(1)}{" "}
                            years)
                          </span>
                        </div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">Total Invested</div>
                        <div className="metric-value">
                          {formatCurrency(result.investment.totalInvested)}
                        </div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">Investment Gains</div>
                        <div className="metric-value">
                          {formatCurrency(result.investment.investmentGains)}
                        </div>
                      </div>
                      <div className="metric">
                        <div className="metric-label">Total Value</div>
                        <div className="metric-value">
                          {formatCurrency(result.investment.totalValue)}
                        </div>
                      </div>
                      <div className="metric metric-total">
                        <div className="metric-label">
                          Net Benefit vs Paying Down
                        </div>
                        <div
                          className={`metric-value ${
                            result.investment.netBenefit >= 0
                              ? "positive-value"
                              : "negative-value"
                          }`}
                        >
                          {formatCurrency(result.investment.netBenefit)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
