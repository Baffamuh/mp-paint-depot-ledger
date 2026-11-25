import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Stat, TableWrap, th, td, selectCls } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useProducts, useRefresh } from "@/lib/db";
import { downloadCSV, naira, PAINT_TYPES, SIZES } from "@/lib/format";
import { useMe } from "@/lib/me";
import { useT } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({ meta: [{ title: "Paint Products & Inventory — MP Paints" }, { name: "description", content: "Paint brands, types, sizes, colours and stock." }] }),
  component: Products,
});

type P = { id?: string; brand: string; paint_type: string; size: string; colour: string; sku: string; cost_price: number; selling_price: number; reorder_level: number; active: boolean };
const blank: P = { brand: "", paint_type: "Emulsion", size: "20L", colour: "White", sku: "", cost_price: 0, selling_price: 0, reorder_level: 5, active: true };

function Products() {
  const { t } = useT();
  const { data: me } = useMe();
  const products = useProducts(true);
  const refresh = useRefresh();
  const [edit, setEdit] = useState<P | null>(null);
  const [search, setSearch] = useState("");
  const list = (products.data ?? []).filter((p) => `${p.brand} ${p.paint_type} ${p.colour} ${p.size} ${p.sku ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const value = (products.data ?? []).reduce((s, p) => s + Number(p.stock_qty) * Number(p.cost_price), 0);
  const retail = (products.data ?? []).reduce((s, p) => s + Number(p.stock_qty) * Number(p.selling_price), 0);
  const low = (products.data ?? []).filter((p) => p.active && Number(p.stock_qty) <= Number(p.reorder_level));

  async function save() {
    if (!edit) return;
    if (!edit.brand.trim()) { toast.error("Brand is required"); return; }
    const row = { ...edit, sku: edit.sku || null };
    const { error } = edit.id
      ? await supabase.from("products").update(row).eq("id", edit.id)
      : await supabase.from("products").insert(row);
    if (error) { toast.error(error.message); return; }
    await supabase.rpc("log_action", { _action: edit.id ? "product_updated" : "product_created", _details: `${edit.brand} ${edit.colour} ${edit.size}` });
    toast.success("Product saved. Add stock through Purchases.");
    setEdit(null);
    refresh();
  }

  return (
    <div>
      <PageHeader title={t("Products")} sub="Stock increases only through Purchases and decreases through Sales">
        <Button variant="outline" onClick={() => downloadCSV("inventory.csv", list.map((p) => ({ brand: p.brand, type: p.paint_type, colour: p.colour, size: p.size, sku: p.sku, stock: p.stock_qty, cost: p.cost_price, price: p.selling_price, value: Number(p.stock_qty) * Number(p.cost_price) })))}>Export CSV</Button>
        {me?.isAdmin && <Button onClick={() => setEdit({ ...blank })}>Add paint</Button>}
      </PageHeader>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Paint items" value={String(products.data?.length ?? 0)} />
        <Stat label="Stock value (cost)" value={naira(value)} />
        <Stat label="Stock value (retail)" value={naira(retail)} />
        <Stat label={t("Low Stock")} value={String(low.length)} tone={low.length ? "bad" : undefined} />
      </div>
      <Input className="mb-3 max-w-sm" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <TableWrap>
        <table className="w-full">
          <thead><tr><th className={th}>Paint</th><th className={th}>Size</th><th className={th}>Stock</th><th className={th}>Cost</th><th className={th}>Price</th><th className={th}></th></tr></thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                <td className={td}><div className="font-medium">{p.brand} · {p.paint_type}</div><div className="text-xs text-muted-foreground">{p.colour}{p.sku ? ` · ${p.sku}` : ""}</div></td>
                <td className={td}>{p.size}</td>
                <td className={td + (Number(p.stock_qty) <= Number(p.reorder_level) ? " text-destructive font-semibold" : "")}>{Number(p.stock_qty)}</td>
                <td className={td + " num"}>{naira(p.cost_price)}</td>
                <td className={td + " num"}>{naira(p.selling_price)}</td>
                <td className={td}>{me?.isAdmin && <Button size="sm" variant="ghost" onClick={() => setEdit({ id: p.id, brand: p.brand, paint_type: p.paint_type, size: p.size, colour: p.colour, sku: p.sku ?? "", cost_price: Number(p.cost_price), selling_price: Number(p.selling_price), reorder_level: Number(p.reorder_level), active: p.active })}>Edit</Button>}</td>
              </tr>
            ))}
            {!list.length && <tr><td className={td} colSpan={6}>No paints yet.</td></tr>}
          </tbody>
        </table>
      </TableWrap>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{edit?.id ? "Edit paint" : "New paint"}</DialogTitle></DialogHeader>
          {edit && (
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1"><Label>Brand</Label><Input value={edit.brand} onChange={(e) => setEdit({ ...edit, brand: e.target.value })} placeholder="e.g. Dulux, Berger, Meyer" /></div>
              <div className="space-y-1"><Label>Type</Label><select className={selectCls} value={edit.paint_type} onChange={(e) => setEdit({ ...edit, paint_type: e.target.value })}>{PAINT_TYPES.map((x) => <option key={x}>{x}</option>)}</select></div>
              <div className="space-y-1"><Label>Size</Label><select className={selectCls} value={edit.size} onChange={(e) => setEdit({ ...edit, size: e.target.value })}>{SIZES.map((x) => <option key={x}>{x}</option>)}</select></div>
              <div className="space-y-1"><Label>Colour</Label><Input value={edit.colour} onChange={(e) => setEdit({ ...edit, colour: e.target.value })} /></div>
              <div className="space-y-1"><Label>Code / SKU</Label><Input value={edit.sku} onChange={(e) => setEdit({ ...edit, sku: e.target.value })} /></div>
              <div className="space-y-1"><Label>Cost price ₦</Label><Input type="number" min={0} value={edit.cost_price} onChange={(e) => setEdit({ ...edit, cost_price: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Selling price ₦</Label><Input type="number" min={0} value={edit.selling_price} onChange={(e) => setEdit({ ...edit, selling_price: Number(e.target.value) })} /></div>
              <div className="space-y-1"><Label>Low-stock alert at</Label><Input type="number" min={0} value={edit.reorder_level} onChange={(e) => setEdit({ ...edit, reorder_level: Number(e.target.value) })} /></div>
              <label className="flex items-center gap-2 text-sm mt-6"><input type="checkbox" checked={edit.active} onChange={(e) => setEdit({ ...edit, active: e.target.checked })} /> Active</label>
              <Button className="col-span-2" onClick={save}>Save</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
