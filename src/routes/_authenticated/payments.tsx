import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader, selectCls } from "@/components/app/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rpc, useAccounts, useCustomers, useRefresh, useSuppliers } from "@/lib/db";
import { METHODS, naira, newKey } from "@/lib/format";
import { useMe } from "@/lib/me";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({ meta: [{ title: "Payments — MP Paints" }, { name: "description", content: "Customer debt repayments and supplier payments." }] }),
  component: Payments,
});

function Payments() {
  const { data: me } = useMe();
  return (
    <div>
      <PageHeader title="Payments" sub="Repayments reduce debts — they are not new sales." />
      <div className="grid gap-4 lg:grid-cols-2">
        <PayForm kind="customer" />
        {me?.can("purchases") && <PayForm kind="supplier" />}
      </div>
    </div>
  );
}

function PayForm({ kind }: { kind: "customer" | "supplier" }) {
  const customers = useCustomers();
  const suppliers = useSuppliers();
  const accounts = useAccounts();
  const refresh = useRefresh();
  const nav = useNavigate();
  const parties = (kind === "customer" ? customers.data : suppliers.data)?.filter((p) => Number(p.balance) > 0) ?? [];
  const [party, setParty] = useState("");
  const [amount, setAmount] = useState("");
  const [account, setAccount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [note, setNote] = useState("");
  const [key, setKey] = useState(newKey);
  const [busy, setBusy] = useState(false);
  const sel = parties.find((p) => p.id === party);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const id = await rpc(kind === "customer" ? "post_customer_payment" : "post_supplier_payment", {
        _key: key, [kind === "customer" ? "_customer_id" : "_supplier_id"]: party, _amount: Number(amount), _account_id: account, _method: method, _note: note || null,
      });
      toast.success("Payment recorded");
      setAmount(""); setNote(""); setParty(""); setKey(newKey()); refresh();
      nav({ to: "/receipt/$id", params: { id } });
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <Card className="p-4">
      <form onSubmit={submit} className="space-y-3">
        <h2 className="font-semibold">{kind === "customer" ? "Receive customer debt payment" : "Pay supplier"}</h2>
        <select className={selectCls} value={party} onChange={(e) => setParty(e.target.value)} required>
          <option value="">{kind === "customer" ? "Select debtor…" : "Select supplier…"}</option>
          {parties.map((p) => <option key={p.id} value={p.id}>{p.name} — owes {naira(p.balance)}</option>)}
        </select>
        {sel && <p className="text-sm">Outstanding: <b>{naira(sel.balance)}</b></p>}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1"><Label>Amount ₦</Label><Input type="number" min={1} max={sel ? Number(sel.balance) : undefined} value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
          <div className="space-y-1"><Label>Method</Label><select className={selectCls} value={method} onChange={(e) => setMethod(e.target.value)}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></div>
        </div>
        <div className="space-y-1"><Label>{kind === "customer" ? "Received into" : "Paid from"}</Label>
          <select className={selectCls} value={account} onChange={(e) => setAccount(e.target.value)} required><option value="">Select account…</option>{accounts.data?.map((a) => <option key={a.id} value={a.id}>{a.name} ({naira(a.balance)})</option>)}</select></div>
        <Input placeholder="Note" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button disabled={busy} className="w-full">Record & print receipt</Button>
      </form>
    </Card>
  );
}
