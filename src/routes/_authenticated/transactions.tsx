import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Printer } from "lucide-react";
import { PageHeader, TableWrap, th, td, selectCls } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rpc, useAccounts, useRefresh, useTransactions } from "@/lib/db";
import { downloadCSV, fmtDate, naira, newKey, TX_LABELS } from "@/lib/format";
import { useMe } from "@/lib/me";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({ meta: [{ title: "Receipts & Transaction History — MP Paints" }, { name: "description", content: "Searchable receipt archive with reprinting." }] }),
  component: History,
});

function History() {
  const [type, setType] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const { data: me } = useMe();
  const accounts = useAccounts();
  const refresh = useRefresh();
  const toD = to ? new Date(new Date(to).getTime() + 86400000) : undefined;
  const q = useTransactions(from ? new Date(from) : undefined, toD, type || undefined);
  const s = search.toLowerCase();
  const list = (q.data ?? []).filter((t) => !s || `${t.ref} ${t.customers?.name ?? ""} ${t.suppliers?.name ?? ""} ${t.description ?? ""} ${t.staff_name ?? ""}`.toLowerCase().includes(s));

  async function refund(id: string, ref: string) {
    const reason = prompt(`Approve full refund of ${ref}? Enter reason:`);
    if (reason === null) return;
    try {
      await rpc("post_refund", { _key: newKey(), _sale_id: id, _account_id: accounts.data?.[0]?.id ?? null, _reason: reason });
      toast.success("Refund posted; stock returned"); refresh();
    } catch (e) { toast.error((e as Error).message); }
  }

  return (
    <div>
      <PageHeader title="Receipts & History" sub="Completed transactions cannot be edited or deleted. Corrections are made by refund.">
        <Button variant="outline" onClick={() => downloadCSV("transactions.csv", list.map((t) => ({ ref: t.ref, date: t.created_at, type: TX_LABELS[t.tx_type], party: t.customers?.name ?? t.suppliers?.name ?? "", total: t.total, paid: t.paid, balance: t.balance_due, method: t.payment_method, staff: t.staff_name })))}>Export CSV</Button>
      </PageHeader>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
        <Input className="col-span-2 sm:col-span-1" placeholder="Search receipt no, name…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className={selectCls} value={type} onChange={(e) => setType(e.target.value)}><option value="">All types</option>{Object.entries(TX_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <TableWrap>
        <table className="w-full">
          <thead><tr><th className={th}>Receipt</th><th className={th}>Type</th><th className={th}>Party</th><th className={th}>Total</th><th className={th}>Paid</th><th className={th}></th></tr></thead>
          <tbody>
            {list.map((t) => (
              <tr key={t.id}>
                <td className={td}><div className="font-mono text-xs">{t.ref}</div><div className="text-xs text-muted-foreground">{fmtDate(t.created_at)} · {t.staff_name}</div></td>
                <td className={td}>{TX_LABELS[t.tx_type]}{t.refunded && <span className="ml-1 text-xs text-destructive">(refunded)</span>}</td>
                <td className={td}>{t.customers?.name ?? t.suppliers?.name ?? t.category ?? "—"}</td>
                <td className={td + " num"}>{naira(t.total)}</td>
                <td className={td + " num"}>{naira(t.paid)}{Number(t.balance_due) > 0 && t.tx_type !== "customer_payment" && t.tx_type !== "supplier_payment" && <div className="text-xs text-destructive">due {naira(t.balance_due)}</div>}</td>
                <td className={td + " whitespace-nowrap"}>
                  <Button size="sm" variant="ghost" asChild><Link to="/receipt/$id" params={{ id: t.id }}><Printer className="h-4 w-4" /></Link></Button>
                  {me?.isAdmin && t.tx_type === "sale" && !t.refunded && <Button size="sm" variant="ghost" className="text-destructive" onClick={() => refund(t.id, t.ref)}>Refund</Button>}
                </td>
              </tr>
            ))}
            {!list.length && <tr><td className={td} colSpan={6}>No transactions found.</td></tr>}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}
