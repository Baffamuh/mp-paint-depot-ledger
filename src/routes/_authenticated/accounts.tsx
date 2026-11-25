import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Stat, selectCls } from "@/components/app/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rpc, useAccounts, useRefresh } from "@/lib/db";
import { naira, newKey } from "@/lib/format";
import { useMe } from "@/lib/me";

export const Route = createFileRoute("/_authenticated/accounts")({
  head: () => ({ meta: [{ title: "Cash, Bank & POS Accounts — MP Paints" }, { name: "description", content: "Account balances, deposits, withdrawals and transfers." }] }),
  component: Accounts,
});

function Accounts() {
  const accounts = useAccounts();
  const { data: me } = useMe();
  const refresh = useRefresh();
  const nav = useNavigate();
  const [mv, setMv] = useState({ kind: "deposit", account: "", amount: "", note: "" });
  const [tr, setTr] = useState({ from: "", to: "", amount: "", note: "" });
  const [newAcc, setNewAcc] = useState({ name: "", kind: "bank" });
  const [k1, setK1] = useState(newKey);
  const [k2, setK2] = useState(newKey);
  const total = (accounts.data ?? []).reduce((s, a) => s + Number(a.balance), 0);

  async function move(e: React.FormEvent) {
    e.preventDefault();
    try {
      const id = await rpc("post_account_movement", { _key: k1, _kind: mv.kind, _account_id: mv.account, _amount: Number(mv.amount), _note: mv.note || null });
      setK1(newKey()); setMv({ ...mv, amount: "", note: "" }); refresh(); toast.success("Recorded");
      nav({ to: "/receipt/$id", params: { id } });
    } catch (err) { toast.error((err as Error).message); }
  }
  async function transfer(e: React.FormEvent) {
    e.preventDefault();
    try {
      const id = await rpc("post_transfer", { _key: k2, _from: tr.from, _to: tr.to, _amount: Number(tr.amount), _note: tr.note || null });
      setK2(newKey()); setTr({ ...tr, amount: "", note: "" }); refresh(); toast.success("Transfer recorded");
      nav({ to: "/receipt/$id", params: { id } });
    } catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div>
      <PageHeader title="Accounts" sub="Transfers move money between accounts and never count as income or expense." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {accounts.data?.map((a) => <Stat key={a.id} label={`${a.name} (${a.kind})`} value={naira(a.balance)} />)}
        <Stat label="All accounts" value={naira(total)} tone="good" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-4"><form onSubmit={move} className="space-y-3">
          <h2 className="font-semibold">Deposit / Withdrawal</h2>
          <select className={selectCls} value={mv.kind} onChange={(e) => setMv({ ...mv, kind: e.target.value })}><option value="deposit">Deposit (owner capital / opening balance)</option><option value="withdrawal">Withdrawal (owner drawings)</option></select>
          <select className={selectCls} value={mv.account} onChange={(e) => setMv({ ...mv, account: e.target.value })} required><option value="">Account…</option>{accounts.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
          <Input type="number" min={1} placeholder="Amount ₦" value={mv.amount} onChange={(e) => setMv({ ...mv, amount: e.target.value })} required />
          <Input placeholder="Note" value={mv.note} onChange={(e) => setMv({ ...mv, note: e.target.value })} />
          <Button className="w-full">Record & print</Button>
        </form></Card>
        <Card className="p-4"><form onSubmit={transfer} className="space-y-3">
          <h2 className="font-semibold">Transfer between accounts</h2>
          <div className="space-y-1"><Label>From</Label><select className={selectCls} value={tr.from} onChange={(e) => setTr({ ...tr, from: e.target.value })} required><option value="">From…</option>{accounts.data?.map((a) => <option key={a.id} value={a.id}>{a.name} ({naira(a.balance)})</option>)}</select></div>
          <div className="space-y-1"><Label>To</Label><select className={selectCls} value={tr.to} onChange={(e) => setTr({ ...tr, to: e.target.value })} required><option value="">To…</option>{accounts.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
          <Input type="number" min={1} placeholder="Amount ₦" value={tr.amount} onChange={(e) => setTr({ ...tr, amount: e.target.value })} required />
          <Input placeholder="Note" value={tr.note} onChange={(e) => setTr({ ...tr, note: e.target.value })} />
          <Button className="w-full">Transfer & print</Button>
        </form></Card>
        {me?.isAdmin && <Card className="p-4"><form className="space-y-3" onSubmit={async (e) => {
          e.preventDefault();
          const { error } = await supabase.from("accounts").insert({ name: newAcc.name, kind: newAcc.kind });
          if (error) { toast.error(error.message); return; }
          setNewAcc({ name: "", kind: "bank" }); refresh(); toast.success("Account added");
        }}>
          <h2 className="font-semibold">Add account</h2>
          <Input placeholder="e.g. Moniepoint, GTBank" value={newAcc.name} onChange={(e) => setNewAcc({ ...newAcc, name: e.target.value })} required />
          <select className={selectCls} value={newAcc.kind} onChange={(e) => setNewAcc({ ...newAcc, kind: e.target.value })}><option value="cash">Cash</option><option value="bank">Bank</option><option value="pos">POS</option><option value="other">Other</option></select>
          <Button className="w-full" variant="outline">Add</Button>
        </form></Card>}
      </div>
    </div>
  );
}
