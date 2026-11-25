import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Stat } from "@/components/app/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAccounts, useCustomers, useProducts, useSuppliers, useTransactions } from "@/lib/db";
import { naira, startOf } from "@/lib/format";
import { summarize } from "@/lib/profit";
import { useT } from "@/lib/i18n";
import { useMe } from "@/lib/me";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — MP Paints Finance Records" }, { name: "description", content: "Today's sales, cash, debts and profit." }] }),
  component: Dashboard,
});

function Dashboard() {
  const { t } = useT();
  const { data: me } = useMe();
  const monthStart = startOf("month");
  const weekAgo = new Date(startOf("day").getTime() - 6 * 86400000);
  const from = weekAgo < monthStart ? weekAgo : monthStart;
  const txs = useTransactions(from);
  const products = useProducts();
  const customers = useCustomers();
  const suppliers = useSuppliers();
  const accounts = useAccounts();
  const all = txs.data ?? [];
  const today = summarize(all.filter((x) => new Date(x.created_at) >= startOf("day")));
  const month = summarize(all.filter((x) => new Date(x.created_at) >= monthStart));
  const debts = (customers.data ?? []).reduce((s, c) => s + Number(c.balance), 0);
  const owed = (suppliers.data ?? []).reduce((s, c) => s + Number(c.balance), 0);
  const low = (products.data ?? []).filter((p) => Number(p.stock_qty) <= Number(p.reorder_level));
  const stockValue = (products.data ?? []).reduce((s, p) => s + Number(p.stock_qty) * Number(p.cost_price), 0);
  const chart = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekAgo.getTime() + i * 86400000);
    const e = new Date(d.getTime() + 86400000);
    const s = summarize(all.filter((x) => new Date(x.created_at) >= d && new Date(x.created_at) < e));
    return { day: d.toLocaleDateString("en-GB", { weekday: "short" }), Sales: s.revenue, Cash: s.cashIn };
  });

  return (
    <div>
      <PageHeader title={t("Dashboard")} sub={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}>
        {me?.can("pos") && <Button asChild><Link to="/pos">New sale</Link></Button>}
      </PageHeader>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label={t("Today's Sales")} value={naira(today.revenue)} hint={`Credit: ${naira(today.creditSales)}`} />
        <Stat label={t("Cash Received Today")} value={naira(today.cashIn)} tone="good" />
        <Stat label="Expenses today" value={naira(today.expenses)} tone={today.expenses ? "bad" : undefined} />
        <Stat label="Profit today" value={naira(today.net)} tone={today.net >= 0 ? "good" : "bad"} />
        <Stat label="Sales this month" value={naira(month.revenue)} />
        <Stat label="Gross profit (month)" value={naira(month.gross)} />
        <Stat label={t("Net Profit (Month)")} value={naira(month.net)} tone={month.net >= 0 ? "good" : "bad"} />
        <Stat label="Stock value" value={naira(stockValue)} />
        <Stat label={t("Customer Debts")} value={naira(debts)} tone={debts ? "warn" : undefined} />
        <Stat label="We owe suppliers" value={naira(owed)} tone={owed ? "warn" : undefined} />
        {accounts.data?.slice(0, 2).map((a) => <Stat key={a.id} label={a.name} value={naira(a.balance)} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr] mt-4">
        <Card className="p-4">
          <h2 className="font-semibold mb-2">Last 7 days</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" fontSize={12} />
                <YAxis fontSize={11} width={60} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} />
                <Tooltip formatter={(v: number) => naira(v)} />
                <Bar dataKey="Sales" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Cash" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-4">
          <h2 className="font-semibold mb-2">{t("Low Stock")} ({low.length})</h2>
          <ul className="space-y-1 text-sm max-h-64 overflow-y-auto">
            {low.map((p) => <li key={p.id} className="flex justify-between gap-2"><span>{p.brand} {p.colour} {p.size}</span><span className="text-destructive font-semibold">{Number(p.stock_qty)}</span></li>)}
            {!low.length && <li className="text-muted-foreground">All paints are well stocked.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}
