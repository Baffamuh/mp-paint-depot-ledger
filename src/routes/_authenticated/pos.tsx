import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Minus, Plus, Trash2 } from "lucide-react";
import { PageHeader, selectCls } from "@/components/app/ui";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { rpc, useAccounts, useCustomers, useProducts, useRefresh } from "@/lib/db";
import { METHODS, naira, newKey } from "@/lib/format";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/pos")({
  head: () => ({ meta: [{ title: "Point of Sale — MP Paints" }, { name: "description", content: "Sell paint and print receipts." }] }),
  component: POS,
});

type Line = { product_id: string; name: string; qty: number; unit_price: number; stock: number };

function POS() {
  const { t } = useT();
  const products = useProducts();
  const customers = useCustomers();
  const accounts = useAccounts();
  const refresh = useRefresh();
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Line[]>([]);
  const [customer, setCustomer] = useState("");
  const [paid, setPaid] = useState<string>("");
  const [account, setAccount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState(newKey);

  const total = cart.reduce((s, l) => s + l.qty * l.unit_price, 0);
  const paidNum = paid === "" ? total : Number(paid);
  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return (products.data ?? []).filter((p) => `${p.brand} ${p.paint_type} ${p.colour} ${p.size} ${p.sku ?? ""}`.toLowerCase().includes(s)).slice(0, 40);
  }, [products.data, search]);

  function add(p: NonNullable<typeof products.data>[number]) {
    if (Number(p.stock_qty) <= 0) { toast.error("Out of stock"); return; }
    setCart((c) => {
      const ex = c.find((l) => l.product_id === p.id);
      if (ex) return c.map((l) => (l.product_id === p.id ? { ...l, qty: Math.min(l.qty + 1, l.stock) } : l));
      return [...c, { product_id: p.id, name: `${p.brand} ${p.paint_type} – ${p.colour} (${p.size})`, qty: 1, unit_price: Number(p.selling_price), stock: Number(p.stock_qty) }];
    });
  }

  async function complete() {
    if (!cart.length) { toast.error("Cart is empty"); return; }
    const acc = account || accounts.data?.find((a) => (method === "Cash" ? a.kind === "cash" : method === "POS" ? a.kind === "pos" : a.kind === "bank"))?.id || accounts.data?.[0]?.id;
    setBusy(true);
    try {
      const id = await rpc("post_sale", {
        _key: key, _customer_id: customer || null,
        _items: cart.map((l) => ({ product_id: l.product_id, qty: l.qty, unit_price: l.unit_price })),
        _paid: paidNum, _account_id: paidNum > 0 ? acc : null, _method: method, _note: note || null,
      });
      toast.success("Sale completed");
      setCart([]); setPaid(""); setNote(""); setCustomer(""); setKey(newKey());
      refresh();
      nav({ to: "/receipt/$id", params: { id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title={t("Sales / POS")} sub="Tap a paint to add it to the cart" />
      <div className="grid gap-4 lg:grid-cols-[1fr_400px]">
        <Card className="p-3">
          <Input placeholder="Search brand, colour, size…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {filtered.map((p) => (
              <button key={p.id} onClick={() => add(p)} className="text-left rounded-lg border p-3 hover:border-primary hover:bg-accent transition-colors">
                <div className="font-semibold text-sm">{p.brand} · {p.paint_type}</div>
                <div className="text-xs text-muted-foreground">{p.colour} · {p.size}</div>
                <div className="mt-1 flex justify-between text-sm"><span className="font-semibold text-primary num">{naira(p.selling_price)}</span>
                  <span className={Number(p.stock_qty) <= Number(p.reorder_level) ? "text-destructive" : "text-muted-foreground"}>Stock {Number(p.stock_qty)}</span></div>
              </button>
            ))}
            {!filtered.length && <div className="text-sm text-muted-foreground p-4">No paints found. Add products first.</div>}
          </div>
        </Card>
        <Card className="p-4 space-y-3 h-fit lg:sticky lg:top-20">
          <h2 className="font-semibold">Cart</h2>
          {cart.map((l) => (
            <div key={l.product_id} className="border rounded-md p-2 space-y-1">
              <div className="flex justify-between gap-2 text-sm"><span>{l.name}</span>
                <button onClick={() => setCart((c) => c.filter((x) => x.product_id !== l.product_id))}><Trash2 className="h-4 w-4 text-destructive" /></button></div>
              <div className="flex items-center gap-2">
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setCart((c) => c.map((x) => x.product_id === l.product_id ? { ...x, qty: Math.max(1, x.qty - 1) } : x))}><Minus className="h-3 w-3" /></Button>
                <Input className="h-7 w-16 text-center" type="number" min={1} value={l.qty} onChange={(e) => setCart((c) => c.map((x) => x.product_id === l.product_id ? { ...x, qty: Math.min(Math.max(1, Number(e.target.value)), x.stock) } : x))} />
                <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => setCart((c) => c.map((x) => x.product_id === l.product_id ? { ...x, qty: Math.min(x.qty + 1, x.stock) } : x))}><Plus className="h-3 w-3" /></Button>
                <span className="text-xs">×</span>
                <Input className="h-7 flex-1 min-w-0" type="number" min={0} value={l.unit_price} onChange={(e) => setCart((c) => c.map((x) => x.product_id === l.product_id ? { ...x, unit_price: Number(e.target.value) } : x))} />
              </div>
              <div className="text-right text-sm font-semibold num">{naira(l.qty * l.unit_price)}</div>
            </div>
          ))}
          {!cart.length && <p className="text-sm text-muted-foreground">No items yet.</p>}
          <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span className="num">{naira(total)}</span></div>
          <div className="space-y-1"><Label>Customer (required for credit)</Label>
            <select className={selectCls} value={customer} onChange={(e) => setCustomer(e.target.value)}>
              <option value="">Walk-in customer</option>
              {customers.data?.map((c) => <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ""}</option>)}
            </select></div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1"><Label>Amount paid</Label><Input type="number" min={0} placeholder={String(total)} value={paid} onChange={(e) => setPaid(e.target.value)} /></div>
            <div className="space-y-1"><Label>Method</Label>
              <select className={selectCls} value={method} onChange={(e) => setMethod(e.target.value)}>{METHODS.map((m) => <option key={m}>{m}</option>)}</select></div>
          </div>
          <div className="space-y-1"><Label>Received into account</Label>
            <select className={selectCls} value={account} onChange={(e) => setAccount(e.target.value)}>
              <option value="">Auto (by method)</option>
              {accounts.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select></div>
          <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
          {total - paidNum > 0 && <div className="text-sm text-warning font-semibold">Credit (debt): {naira(total - paidNum)}</div>}
          <Button className="w-full" size="lg" disabled={busy || !cart.length} onClick={complete}>{t("Complete Sale")} & Print</Button>
        </Card>
      </div>
    </div>
  );
}
