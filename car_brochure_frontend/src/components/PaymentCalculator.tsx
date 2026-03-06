"use client";

import React from "react";
import { Badge, Button, Card, Input, Select, cn } from "@/components/ui";
import { computeFinance, formatPercent, safeParseInt, safeParseMoney } from "@/lib/finance";
import { formatMoney } from "@/lib/api";

type PaymentCalculatorProps = {
  price: number | null | undefined;
  currency: string | null | undefined;
  carLabel: string;
  /**
   * Optional hook for external widgets (e.g., trade-in estimator) to push values
   * into this calculator in a controlled, reusable way.
   */
  onReady?: (api: PaymentCalculatorApi) => void;
};

export type PaymentCalculatorApi = {
  /**
   * Apply trade-in-related values to the calculator.
   *
   * Contract:
   * - tradeInCredit is treated as a non-negative credit (mapped to "Trade-in").
   * - negativeEquity is NOT automatically rolled into loan to avoid surprising users.
   *   (If product decides to support it later, add an explicit field + flow.)
   */
  applyTradeIn: (params: { tradeInCredit: number; negativeEquity?: number }) => void;

  /** Reset to defaults (same as pressing "Reset assumptions"). */
  resetAssumptions: () => void;
};

const TERM_OPTIONS = [24, 36, 48, 60, 72, 84] as const;
const DEFAULT_TERM = 72;
const DEFAULT_APR_PCT = 6.99;
const DEFAULT_TAX_PCT = 8.25;
const DEFAULT_FEES = 750;
const DEFAULT_DOWN = 2500;

function moneyInputValue(n: number): string {
  // Keep input stable and friendly (no currency symbol, but allow commas in entry).
  if (!Number.isFinite(n) || n <= 0) return "";
  return String(Math.round(n));
}

// PUBLIC_INTERFACE
export function PaymentCalculator(props: PaymentCalculatorProps) {
  /** Financing widget showing estimated monthly payment and editable financing assumptions. */
  const basePrice = props.price != null && Number.isFinite(props.price) ? Math.max(0, props.price) : 0;

  const [enabled, setEnabled] = React.useState(true);

  // Inputs as strings to preserve user typing.
  const [vehiclePrice, setVehiclePrice] = React.useState<string>(moneyInputValue(basePrice));
  const [downPayment, setDownPayment] = React.useState<string>(moneyInputValue(DEFAULT_DOWN));
  const [tradeIn, setTradeIn] = React.useState<string>("");
  const [fees, setFees] = React.useState<string>(moneyInputValue(DEFAULT_FEES));
  const [salesTaxPct, setSalesTaxPct] = React.useState<string>(String(DEFAULT_TAX_PCT));
  const [aprPct, setAprPct] = React.useState<string>(String(DEFAULT_APR_PCT));
  const [termMonths, setTermMonths] = React.useState<string>(String(DEFAULT_TERM));

  const resetAssumptions = React.useCallback(() => {
    setDownPayment(moneyInputValue(DEFAULT_DOWN));
    setTradeIn("");
    setFees(moneyInputValue(DEFAULT_FEES));
    setSalesTaxPct(String(DEFAULT_TAX_PCT));
    setAprPct(String(DEFAULT_APR_PCT));
    setTermMonths(String(DEFAULT_TERM));
  }, []);

  // Provide an integration API for other widgets (e.g. trade-in estimator).
  React.useEffect(() => {
    if (!props.onReady) return;

    const api: PaymentCalculatorApi = {
      applyTradeIn: ({ tradeInCredit }) => {
        // Only apply the credit to the existing "Trade-in" input.
        // NOTE: We explicitly do NOT roll negative equity into the estimate yet.
        // That would require an explicit UI field and clearer disclosures.
        const v = Math.max(0, Number.isFinite(tradeInCredit) ? tradeInCredit : 0);
        setTradeIn(v > 0 ? String(Math.round(v)) : "");
      },
      resetAssumptions,
    };

    props.onReady(api);
  }, [props, resetAssumptions]);

  // Keep price in sync if car changes.
  React.useEffect(() => {
    setVehiclePrice(moneyInputValue(basePrice));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePrice]);

  const inputs = React.useMemo(() => {
    const term = safeParseInt(termMonths, DEFAULT_TERM);
    return {
      vehiclePrice: safeParseMoney(vehiclePrice) || basePrice,
      downPayment: safeParseMoney(downPayment),
      tradeIn: safeParseMoney(tradeIn),
      fees: safeParseMoney(fees),
      salesTaxRatePct: Math.max(0, Number(salesTaxPct) || 0),
      aprPct: Math.max(0, Number(aprPct) || 0),
      termMonths: term,
    };
  }, [aprPct, basePrice, downPayment, fees, salesTaxPct, termMonths, tradeIn, vehiclePrice]);

  const outputs = React.useMemo(() => computeFinance(inputs), [inputs]);

  const hasPrice = basePrice > 0;

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-base font-semibold">Estimated payment</div>
          <div className="mt-1 text-sm text-slate-600">
            Adjust assumptions (APR, term, taxes, down payment). For informational estimates only.
          </div>
        </div>

        <div className="mt-2 md:mt-0 flex flex-wrap items-center gap-2">
          <Badge tone="cyan">Financing</Badge>
          <Badge tone="blue">Estimate</Badge>
          <Button
            type="button"
            variant={enabled ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setEnabled((v) => !v)}
            aria-pressed={enabled}
          >
            {enabled ? "Hide details" : "Show details"}
          </Button>
        </div>
      </div>

      {!hasPrice ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          No MSRP available for this listing. You can still enter a vehicle price below.
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium text-slate-600">Estimated monthly</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
            {formatMoney(outputs.monthlyPayment, props.currency || "USD")}
            <span className="ml-2 text-sm font-medium text-slate-600">/mo</span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-white p-3 border border-slate-200">
              <div className="text-xs text-slate-500">Amount financed</div>
              <div className="mt-0.5 font-semibold text-slate-900">
                {formatMoney(outputs.amountFinanced, props.currency || "USD")}
              </div>
            </div>
            <div className="rounded-lg bg-white p-3 border border-slate-200">
              <div className="text-xs text-slate-500">Term • APR</div>
              <div className="mt-0.5 font-semibold text-slate-900">
                {Math.max(0, inputs.termMonths)} mo • {formatPercent(inputs.aprPct)}
              </div>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-500">
            Based on: {props.carLabel}. Values exclude insurance; taxes/fees vary by location.
          </div>
        </div>

        <div className={cn(enabled ? "" : "opacity-60 pointer-events-none select-none")}>
          <div className="grid grid-cols-1 gap-3">
            <Input
              label="Vehicle price"
              value={vehiclePrice}
              onChange={(e) => setVehiclePrice(e.target.value)}
              placeholder={hasPrice ? String(Math.round(basePrice)) : "e.g. 34999"}
              inputMode="numeric"
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Down payment"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
                placeholder="e.g. 2500"
                inputMode="numeric"
              />
              <Input
                label="Trade-in"
                value={tradeIn}
                onChange={(e) => setTradeIn(e.target.value)}
                placeholder="e.g. 0"
                inputMode="numeric"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Sales tax (%)"
                value={salesTaxPct}
                onChange={(e) => setSalesTaxPct(e.target.value)}
                placeholder="e.g. 8.25"
                inputMode="decimal"
              />
              <Input
                label="Fees"
                value={fees}
                onChange={(e) => setFees(e.target.value)}
                placeholder="e.g. 750"
                inputMode="numeric"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="APR (%)"
                value={aprPct}
                onChange={(e) => setAprPct(e.target.value)}
                placeholder="e.g. 6.99"
                inputMode="decimal"
              />
              <Select
                label="Term (months)"
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
              >
                {TERM_OPTIONS.map((m) => (
                  <option key={m} value={String(m)}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
              <div className="font-medium text-slate-700">Breakdown</div>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                <div>Taxable subtotal</div>
                <div className="text-right font-medium text-slate-900">
                  {formatMoney(outputs.taxableSubtotal, props.currency || "USD")}
                </div>
                <div>Estimated taxes</div>
                <div className="text-right font-medium text-slate-900">
                  {formatMoney(outputs.taxes, props.currency || "USD")}
                </div>
                <div>Total payments</div>
                <div className="text-right font-medium text-slate-900">
                  {formatMoney(outputs.totalPayments, props.currency || "USD")}
                </div>
                <div>Est. interest</div>
                <div className="text-right font-medium text-slate-900">
                  {formatMoney(outputs.totalInterest, props.currency || "USD")}
                </div>
              </div>

              <div className="mt-2 text-[11px] text-slate-500">
                Estimates update as you type. Not a loan offer.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" onClick={resetAssumptions}>
                Reset assumptions
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  // Set vehicle price back to MSRP (if present)
                  setVehiclePrice(moneyInputValue(basePrice));
                }}
              >
                Use MSRP
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
