export type TxLite = { tx_type: string; total: number | string; paid: number | string; cost_total: number | string; category?: string | null };

// Profit rules: credit sales count as revenue but not cash; repayments are cash, not revenue;
// transfers/deposits/withdrawals never affect profit; refunds reverse revenue and cost.
export function summarize(txs: TxLite[]) {
  const n = (v: number | string) => Number(v) || 0;
  let revenue = 0, cogs = 0, expenses = 0, cashIn = 0, cashOut = 0, creditSales = 0, purchases = 0;
  const byCategory: Record<string, number> = {};
  for (const t of txs) {
    switch (t.tx_type) {
      case "sale": revenue += n(t.total); cogs += n(t.cost_total); cashIn += n(t.paid); creditSales += n(t.total) - n(t.paid); break;
      case "refund": revenue -= n(t.total); cogs -= n(t.cost_total); cashOut += n(t.paid); break;
      case "customer_payment": cashIn += n(t.total); break;
      case "expense": expenses += n(t.total); cashOut += n(t.total); byCategory[t.category ?? "General"] = (byCategory[t.category ?? "General"] ?? 0) + n(t.total); break;
      case "purchase": purchases += n(t.total); cashOut += n(t.paid); break;
      case "supplier_payment": cashOut += n(t.total); break;
    }
  }
  const gross = revenue - cogs;
  return { revenue, cogs, gross, expenses, net: gross - expenses, cashIn, cashOut, creditSales, purchases, byCategory };
}
