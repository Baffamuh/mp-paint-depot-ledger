import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Printer } from "lucide-react";
import { PageHeader, Stat, TableWrap, th, td } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProducts, useTransactions } from "@/lib/db";
import { downloadCSV, naira, startOf, TX_LABELS } from "@/lib/format";
import { summarize } from "@/lib/profit";
import { banner } from "@/lib/brand";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports & Profit and Loss — MP Paints" }, { name: "description", content: "Daily, weekly, monthly and annual reports." }] }),
  component: Reports,
});

const iso = (d: Date) => d.toLocaleDateString("en-CA");

function Reports() {
  const [from, setFrom] = useState(iso(startOf("month")));
  const [to, setTo] = useState(iso(new Date()));
  const txs = useTransactions(new Date(from + "T00:00:00"), new Date(new Date(to + "T00:00:00").getTime() + 86400000));
  const products = useProducts(true);
  const s = summarize(txs.data ?? []);
  const set = (p: "day" | "week" | "month" | "year") => { setFrom(iso(startOf(p))); setTo(iso(new Date())); };
  const byProduct: Record<string, { qty: number; sales: number }> = {};
  const counts: Record<string, { n: number; total: number }> = {};
  for (const t of txs.data ?? []) {
    counts[t.tx_type] = { n: (counts[t.tx_type]?.n ?? 0) + 1, total: (counts[t.tx_type]?.total ?? 0) + Number(t.total) };
  }
  void byProduct;
  const stock = (products.data ?? []).map((p) => ({ paint: `${p.brand} ${p.paint_type} ${p.colour} ${p.size}`, qty: Number(p.stock_qty), cost: Number(p.cost_price), value: Number(p.stock_qty) * Number(p.cost_price) }));

  return (
    <div>
      <PageHeader title="Reports" sub={`${from} to ${to}`}>
        {(["day", "week", "month", "year"] as const).map((p) => <Button key={p} size="sm" variant="outline" onClick={() => set(p)}>{p === "day" ? "Today" : `This ${p}`}</Button>)}
        <Button size="sm" variant="outline" onClick={() => downloadCSV(`report-${from}-${to}.csv`, (txs.data ?? []).map((t) => ({ ref: t.ref, date: t.created_at, type: TX_LABELS[t.tx_type], total: t.total, paid: t.paid, cost: t.cost_total, category: t.category })))}>Export CSV</Button>
        <Button size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / PDF</Button>
      </PageHeader>
      <div className="no-print flex gap-2 mb-4 max-w-md"><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
      <div className="print-area space-y-4">
        <div className="hidden print:block"><img src={banner.url} alt="" className="w-full max-h-28 object-contain" /><h2 className="text-lg font-bold">Financial Report: {from} to {to}</h2></div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Sales revenue" value={naira(s.revenue)} />
          <Stat label="Cost of paint sold" value={naira(s.cogs)} />
          <Stat label="Gross profit" value={naira(s.gross)} tone={s.gross >= 0 ? "good" : "bad"} />
          <Stat label="Net profit" value={naira(s.net)} tone={s.net >= 0 ? "good" : "bad"} />
          <Stat label="Money received" value={naira(s.cashIn)} />
          <Stat label="Money paid out" value={naira(s.cashOut)} />
          <Stat label="Credit sales" value={naira(s.creditSales)} />
          <Stat label="Stock purchased" value={naira(s.purchases)} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h2 className="font-semibold mb-2">Profit & Loss</h2>
            <TableWrap><table className="w-full"><tbody>
              <tr><td className={td}>Sales revenue</td><td className={td + " text-right num"}>{naira(s.revenue)}</td></tr>
              <tr><td className={td}>Less: cost of paint sold</td><td className={td + " text-right num"}>({naira(s.cogs)})</td></tr>
              <tr className="font-semibold"><td className={td}>Gross profit</td><td className={td + " text-right num"}>{naira(s.gross)}</td></tr>
              {Object.entries(s.byCategory).map(([k, v]) => <tr key={k}><td className={td + " pl-6"}>{k}</td><td className={td + " text-right num"}>({naira(v)})</td></tr>)}
              <tr><td className={td}>Total expenses</td><td className={td + " text-right num"}>({naira(s.expenses)})</td></tr>
              <tr className="font-bold"><td className={td}>Net profit</td><td className={td + " text-right num"}>{naira(s.net)}</td></tr>
            </tbody></table></TableWrap>
          </div>
          <div>
            <h2 className="font-semibold mb-2">Transactions summary</h2>
            <TableWrap><table className="w-full"><thead><tr><th className={th}>Type</th><th className={th}>Count</th><th className={th}>Total</th></tr></thead><tbody>
              {Object.entries(counts).map(([k, v]) => <tr key={k}><td className={td}>{TX_LABELS[k]}</td><td className={td}>{v.n}</td><td className={td + " num"}>{naira(v.total)}</td></tr>)}
            </tbody></table></TableWrap>
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Inventory valuation (now)</h2>
          <TableWrap><table className="w-full"><thead><tr><th className={th}>Paint</th><th className={th}>Qty</th><th className={th}>Cost</th><th className={th}>Value</th></tr></thead><tbody>
            {stock.map((r, i) => <tr key={i}><td className={td}>{r.paint}</td><td className={td}>{r.qty}</td><td className={td + " num"}>{naira(r.cost)}</td><td className={td + " num"}>{naira(r.value)}</td></tr>)}
            <tr className="font-bold"><td className={td} colSpan={3}>Total</td><td className={td + " num"}>{naira(stock.reduce((a, b) => a + b.value, 0))}</td></tr>
          </tbody></table></TableWrap>
        </div>
      </div>
    </div>
  );
}
