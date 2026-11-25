import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, TableWrap, th, td, selectCls } from "@/components/app/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rpc, useAccounts, useRefresh, useTransactions } from "@/lib/db";
import { EXPENSE_CATEGORIES, fmtDate, METHODS, naira, newKey } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({ meta: [{ title: "Expenses — MP Paints" }, { name: "description", content: "Record business expenses." }] }),
  component: Expenses,
});

function Expenses() {
  const accounts = useAccounts();
  const list = useTransactions(undefined, undefined, "expense");
  const refresh = useRefresh();
  const nav = useNavigate();
  const [f, setF] = useState({ category: EXPENSE_CATEGORIES[0]!, amount: "", account: "", method: "Cash", note: "" });
  const [key, setKey] = useState(newKey);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const id = await rpc("post_expense", { _key: key, _category: f.category, _amount: Number(f.amount), _account_id: f.account, _method: f.method, _note: f.note || null });
      toast.success("Expense recorded");
      setF({ ...f, amount: "", note: "" }); setKey(newKey()); refresh();
      nav({ to: "/receipt/$id", params: { id } });
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Expenses" />
      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card className="p-4 h-fit">
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1"><Label>Category</Label><select className={selectCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div className="space-y-1"><Label>Amount ₦</Label><Input type="number" min={1} value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required /></div>
            <div className="space-y-1"><Label>Paid from</Label><select className={selectCls} value={f.account} onChange={(e) => setF({ ...f, account: e.target.value })} required><option value="">Select account…</option>{accounts.data?.map((a) => <option key={a.id} value={a.id}>{a.name} ({naira(a.balance)})</option>)}</select></div>
            <div className="space-y-1"><Label>Method</Label><select className={selectCls} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></div>
            <Input placeholder="Description" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
            <Button disabled={busy} className="w-full">Record & print</Button>
          </form>
        </Card>
        <TableWrap>
          <table className="w-full">
            <thead><tr><th className={th}>Date</th><th className={th}>Ref</th><th className={th}>Category</th><th className={th}>Amount</th></tr></thead>
            <tbody>
              {list.data?.map((t) => (
                <tr key={t.id}><td className={td}>{fmtDate(t.created_at)}</td>
                  <td className={td}><Link className="text-primary font-mono text-xs" to="/receipt/$id" params={{ id: t.id }}>{t.ref}</Link></td>
                  <td className={td}>{t.category}<div className="text-xs text-muted-foreground">{t.description}</div></td><td className={td + " num"}>{naira(t.total)}</td></tr>
              ))}
              {!list.data?.length && <tr><td className={td} colSpan={4}>No expenses yet.</td></tr>}
            </tbody>
          </table>
        </TableWrap>
      </div>
    </div>
  );
}
