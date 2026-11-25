import { describe, expect, it } from "vitest";
import { summarize } from "@/lib/profit";

describe("profit rules", () => {
  it("credit sale counts as revenue but not cash received", () => {
    const s = summarize([{ tx_type: "sale", total: 10000, paid: 4000, cost_total: 7000 }]);
    expect(s.revenue).toBe(10000);
    expect(s.cashIn).toBe(4000);
    expect(s.creditSales).toBe(6000);
  });
  it("customer repayment is cash but not a new sale", () => {
    const s = summarize([{ tx_type: "customer_payment", total: 6000, paid: 6000, cost_total: 0 }]);
    expect(s.revenue).toBe(0);
    expect(s.cashIn).toBe(6000);
  });
  it("transfers and deposits create no income or expense", () => {
    const s = summarize([
      { tx_type: "transfer", total: 5000, paid: 5000, cost_total: 0 },
      { tx_type: "deposit", total: 5000, paid: 5000, cost_total: 0 },
    ]);
    expect(s.net).toBe(0);
  });
  it("net profit = sales - cost of paint sold - expenses", () => {
    const s = summarize([
      { tx_type: "sale", total: 20000, paid: 20000, cost_total: 15000 },
      { tx_type: "expense", total: 2000, paid: 2000, cost_total: 0, category: "Rent" },
      { tx_type: "purchase", total: 50000, paid: 50000, cost_total: 50000 },
    ]);
    expect(s.gross).toBe(5000);
    expect(s.net).toBe(3000);
  });
  it("refund reverses the sale's profit", () => {
    const s = summarize([
      { tx_type: "sale", total: 10000, paid: 10000, cost_total: 7000 },
      { tx_type: "refund", total: 10000, paid: 10000, cost_total: 7000 },
    ]);
    expect(s.net).toBe(0);
  });
});
