"use client";

import React from "react";
import { Badge, Button, Card, Input } from "@/components/ui";
import { formatMoney } from "@/lib/api";
import { computeTradeIn, safeParseNumberLikeMoney } from "@/lib/tradeIn";

export type TradeInEstimatorApplied = {
  /** Non-negative credit to apply to the purchase estimate. */
  tradeInCredit: number;
  /** Non-negative negative equity that may be rolled into a new loan. */
  negativeEquity: number;
};

type TradeInEstimatorProps = {
  currency: string | null | undefined;
  /**
   * Called when the user chooses to apply the computed trade-in credit
   * (and optional negative equity) to the payment calculator.
   *
   * Side effects:
   * - The parent is expected to update its own state (e.g., trade-in field).
   */
  onApply: (applied: TradeInEstimatorApplied) => void;
  /**
   * Optional initial values (strings to preserve typing behavior).
   * Useful if caller wants to keep UI state elsewhere.
   */
  defaultTradeInValue?: string;
  defaultLoanPayoff?: string;
};

// PUBLIC_INTERFACE
export function TradeInEstimator(props: TradeInEstimatorProps) {
  /** Trade-in equity estimator widget; compute-as-you-type with explicit apply action. */
  const [tradeInValue, setTradeInValue] = React.useState(props.defaultTradeInValue ?? "");
  const [loanPayoff, setLoanPayoff] = React.useState(props.defaultLoanPayoff ?? "");
  const [appliedMsg, setAppliedMsg] = React.useState<string | null>(null);

  const parsed = React.useMemo(() => {
    return {
      tradeInValue: safeParseNumberLikeMoney(tradeInValue),
      loanPayoff: safeParseNumberLikeMoney(loanPayoff),
    };
  }, [loanPayoff, tradeInValue]);

  const out = React.useMemo(() => computeTradeIn(parsed), [parsed]);

  const hasAnyInput = tradeInValue.trim().length > 0 || loanPayoff.trim().length > 0;

  const equityTone: "green" | "red" | "slate" =
    !hasAnyInput ? "slate" : out.equity >= 0 ? "green" : "red";

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-base font-semibold">Trade-in estimator</div>
          <div className="mt-1 text-sm text-slate-600">
            Estimate trade-in equity (value minus payoff). Apply credit to the payment estimate below.
          </div>
        </div>

        <div className="mt-2 md:mt-0 flex flex-wrap items-center gap-2">
          <Badge tone="cyan">Trade-in</Badge>
          <Badge tone={equityTone}>
            {hasAnyInput ? (out.equity >= 0 ? "Positive equity" : "Negative equity") : "Optional"}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input
          label="Estimated trade-in value"
          value={tradeInValue}
          onChange={(e) => {
            setTradeInValue(e.target.value);
            setAppliedMsg(null);
          }}
          placeholder="e.g. 12000"
          inputMode="numeric"
        />
        <Input
          label="Loan payoff (optional)"
          value={loanPayoff}
          onChange={(e) => {
            setLoanPayoff(e.target.value);
            setAppliedMsg(null);
          }}
          placeholder="e.g. 8000"
          inputMode="numeric"
        />
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-500">Estimated equity</div>
            <div className="mt-0.5 font-semibold text-slate-900">
              {formatMoney(out.equity, props.currency || "USD")}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-500">Applied credit</div>
            <div className="mt-0.5 font-semibold text-slate-900">
              {formatMoney(out.appliedCredit, props.currency || "USD")}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-xs text-slate-500">Negative equity</div>
            <div className="mt-0.5 font-semibold text-slate-900">
              {formatMoney(out.negativeEquity, props.currency || "USD")}
            </div>
          </div>
        </div>

        <div className="mt-2 text-[11px] text-slate-500">
          Estimates only. Dealers/lenders may treat negative equity differently.
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            props.onApply({
              tradeInCredit: out.appliedCredit,
              negativeEquity: out.negativeEquity,
            });
            setAppliedMsg(
              out.appliedCredit > 0
                ? "Applied trade-in credit to payment estimate."
                : out.negativeEquity > 0
                  ? "Applied $0 credit (negative equity not added automatically)."
                  : "Applied $0 trade-in credit."
            );
          }}
          disabled={!hasAnyInput}
        >
          Apply to payment estimate
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setTradeInValue("");
            setLoanPayoff("");
            setAppliedMsg(null);
            props.onApply({ tradeInCredit: 0, negativeEquity: 0 });
          }}
          disabled={!hasAnyInput}
        >
          Clear
        </Button>

        {appliedMsg ? <div className="text-sm text-emerald-700">{appliedMsg}</div> : null}
      </div>
    </Card>
  );
}
