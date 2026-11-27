import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { PageHeader, selectCls } from "@/components/app/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { rpc, useAccounts, useProducts, useRefresh, useSuppliers } from "@/lib/db";
import { METHODS, naira, newKey } from "@/lib/format";
import { purchaseError, selectPurchaseProduct } from "@/lib/purchase-validation";

export const Route = createFileRoute("/_authenticated/purchases")({
  head: () => ({ meta: [{ title: "Paint Purchases — MP Paints" }, { name: "description", content: "Record stock bought from suppliers." }] }),
  component: Purchases,
});

type L = { product_id: string; qty: number; unit_cost: number };

function Purchases() {
  const products = useProducts();
  const suppliers = useSuppliers();
  const accounts = useAccounts();
  const refresh = useRefresh();
  const nav = useNavigate();
  const [supplier, setSupplier] = useState("");
  const [lines, setLines] = useState<L[]>([{ product_id: "", qty: 1, unit_cost: 0 }]);
  const [paid, setPaid] = useState("");
  const [account, setAccount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [note, setNote] = useState("");
  const [key, setKey] = useState(newKey);
  const [busy, setBusy] = useState(false);
  const total = lines.reduce((s, l) => s + l.qty * l.unit_cost, 0);
  const paidNum = paid === "" ? total : Number(paid);

  async function submit() {
    if (busy) return;
    const validation = purchaseError(lines, supplier, paidNum, total, account, accounts.data?.find((a) => a.id === account)?.balance);
    if (validation) { toast.error(validation); return; }
    const items = lines;
    setBusy(true);
    try {
      const id = await rpc("post_purchase", { _key: key, _supplier_id: supplier || null, _items: items, _paid: paidNum, _account_id: paidNum > 0 ? account || null : null, _method: method, _note: note || null });
      toast.success("Purchase recorded, stock updated");
      setLines([{ product_id: "", qty: 1, unit_cost: 0 }]); setPaid(""); setNote(""); setKey(newKey()); refresh();
      nav({ to: "/receipt/$id", params: { id } });
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  }

  return (
    <div>
      <PageHeader title="Purchases" sub="Buying paint from suppliers adds to stock. Unpaid amounts become supplier balances." />
      <Card className="p-4 space-y-4 max-w-3xl">
        <div className="space-y-1"><Label>Supplier</Label>
          <select className={selectCls} value={supplier} onChange={(e) => setSupplier(e.target.value)}>
            <option value="">Select supplier…</option>{suppliers.data?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select></div>
        {lines.map((l, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_90px_130px_auto] gap-2 items-end border rounded-md p-2">
            <div className="col-span-2 sm:col-span-1 space-y-1"><Label>Paint</Label>
              <select aria-label={`Paint ${i + 1}`} className={selectCls} value={l.product_id} disabled={busy} onChange={(e) => { const productId = e.target.value; const p = products.data?.find((x) => x.id === productId); setLines((previous) => previous.map((x, j) => j === i ? selectPurchaseProduct(x, productId, Number(p?.cost_price ?? 0)) : x)); }}>
                <option value="">Select…</option>{products.data?.map((p) => <option key={p.id} value={p.id}>{p.brand} {p.paint_type} – {p.colour} ({p.size})</option>)}
              </select></div>
            <div className="space-y-1"><Label>Qty</Label><Input aria-label={`Quantity ${i + 1}`} disabled={busy} type="number" min={1} value={l.qty} onChange={(e) => { const qty = Number(e.target.value); setLines((previous) => previous.map((x, j) => j === i ? { ...x, qty } : x)); }} /></div>
            <div className="space-y-1"><Label>Unit cost ₦</Label><Input aria-label={`Unit cost ${i + 1}`} aria-invalid={Boolean(l.product_id && l.unit_cost <= 0)} disabled={busy} type="number" min={0.01} step={0.01} value={l.unit_cost} onChange={(e) => { const unit_cost = Number(e.target.value); setLines((previous) => previous.map((x, j) => j === i ? { ...x, unit_cost } : x)); }} />{l.product_id && l.unit_cost <= 0 && <p className="text-xs text-destructive">Enter the invoice cost.</p>}</div>
            <Button aria-label={`Remove line ${i + 1}`} disabled={busy} variant="ghost" size="icon" onClick={() => setLines((previous) => previous.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}
        <Button disabled={busy} variant="outline" onClick={() => setLines((previous) => [...previous, { product_id: "", qty: 1, unit_cost: 0 }])}>+ Add line</Button>
        <div className="text-lg font-bold">Total: <span className="num">{naira(total)}</span></div>
        <div className="grid sm:grid-cols-3 gap-2">
          <div className="space-y-1"><Label>Amount paid now</Label><Input type="number" min={0} placeholder={String(total)} value={paid} onChange={(e) => setPaid(e.target.value)} /></div>
          <div className="space-y-1"><Label>Paid from</Label><select className={selectCls} value={account} onChange={(e) => setAccount(e.target.value)}><option value="">Select account…</option>{accounts.data?.map((a) => <option key={a.id} value={a.id}>{a.name} ({naira(a.balance)})</option>)}</select></div>
          <div className="space-y-1"><Label>Method</Label><select className={selectCls} value={method} onChange={(e) => setMethod(e.target.value)}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></div>
        </div>
        <Input placeholder="Invoice no. / note" value={note} onChange={(e) => setNote(e.target.value)} />
        {total - paidNum > 0 && <p className="text-sm text-warning font-semibold">Owed to supplier: {naira(total - paidNum)}</p>}
        <Button disabled={busy} onClick={submit}>Record purchase & print</Button>
      </Card>
    </div>
  );
}
