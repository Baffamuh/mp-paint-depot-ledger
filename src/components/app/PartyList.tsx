import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Stat, TableWrap, th, td } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRefresh } from "@/lib/db";
import { downloadCSV, naira } from "@/lib/format";

type Row = { id: string; name: string; phone: string | null; address: string | null; balance: number };

export function PartyList({ kind, rows, title, balanceLabel }: { kind: "customers" | "suppliers"; rows: Row[]; title: string; balanceLabel: string }) {
  const refresh = useRefresh();
  const [f, setF] = useState({ name: "", phone: "", address: "" });
  const [search, setSearch] = useState("");
  const list = rows.filter((r) => `${r.name} ${r.phone ?? ""}`.toLowerCase().includes(search.toLowerCase()));
  const totalBal = rows.reduce((s, r) => s + Number(r.balance), 0);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return;
    const { error } = await supabase.from(kind).insert({ name: f.name.trim(), phone: f.phone || null, address: f.address || null });
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    setF({ name: "", phone: "", address: "" });
    refresh();
  }

  return (
    <div>
      <PageHeader title={title}>
        <Button variant="outline" onClick={() => downloadCSV(`${kind}.csv`, rows.map((r) => ({ name: r.name, phone: r.phone, address: r.address, balance: r.balance })))}>Export CSV</Button>
      </PageHeader>
      <div className="grid grid-cols-2 gap-3 mb-4 max-w-xl">
        <Stat label={`Total ${balanceLabel}`} value={naira(totalBal)} tone={totalBal > 0 ? "warn" : undefined} />
        <Stat label="Records" value={String(rows.length)} />
      </div>
      <form onSubmit={add} className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-4">
        <Input placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required />
        <Input placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        <Input placeholder="Address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        <Button>Add</Button>
      </form>
      <Input className="mb-3 max-w-sm" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <TableWrap>
        <table className="w-full">
          <thead><tr><th className={th}>Name</th><th className={th}>Phone</th><th className={th}>{balanceLabel}</th><th className={th}></th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td className={td}>{r.name}</td><td className={td}>{r.phone}</td>
                <td className={td + " num " + (Number(r.balance) > 0 ? "text-destructive font-semibold" : "")}>{naira(r.balance)}</td>
                <td className={td}><Link className="text-primary text-sm" to="/statement/$kind/$id" params={{ kind, id: r.id }}>Statement</Link></td>
              </tr>
            ))}
            {!list.length && <tr><td className={td} colSpan={4}>None yet.</td></tr>}
          </tbody>
        </table>
      </TableWrap>
    </div>
  );
}
