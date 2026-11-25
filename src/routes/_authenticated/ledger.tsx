import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableWrap, th, td, selectCls } from "@/components/app/ui";
import { fmtDate, naira } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/ledger")({
  head: () => ({ meta: [{ title: "General Ledger & Cashbook — MP Paints" }, { name: "description", content: "Double-entry journal, cashbook and trial balance." }] }),
  component: Ledger,
});

function Ledger() {
  const [ledger, setLedger] = useState("");
  const q = useQuery({
    queryKey: ["journal"],
    queryFn: async () => {
      const { data, error } = await supabase.from("journal_lines").select("*, transactions(ref, tx_type, description)").order("created_at", { ascending: true }).limit(5000);
      if (error) throw error;
      return data;
    },
  });
  const lines = q.data ?? [];
  const tb: Record<string, { dr: number; cr: number }> = {};
  for (const l of lines) { tb[l.ledger] = { dr: (tb[l.ledger]?.dr ?? 0) + Number(l.debit), cr: (tb[l.ledger]?.cr ?? 0) + Number(l.credit) }; }
  const totDr = Object.values(tb).reduce((s, v) => s + v.dr, 0);
  const totCr = Object.values(tb).reduce((s, v) => s + v.cr, 0);
  let run = 0;
  const shown = ledger ? lines.filter((l) => l.ledger === ledger) : [];

  return (
    <div>
      <PageHeader title="Ledger" sub="Every transaction posts balanced debits and credits." />
      <h2 className="font-semibold mb-2">Trial balance</h2>
      <TableWrap>
        <table className="w-full">
          <thead><tr><th className={th}>Ledger account</th><th className={th}>Debit</th><th className={th}>Credit</th><th className={th}>Balance</th></tr></thead>
          <tbody>
            {Object.entries(tb).sort().map(([k, v]) => (
              <tr key={k} className="cursor-pointer hover:bg-accent" onClick={() => setLedger(k)}><td className={td + " text-primary"}>{k}</td><td className={td + " num"}>{naira(v.dr)}</td><td className={td + " num"}>{naira(v.cr)}</td><td className={td + " num"}>{naira(v.dr - v.cr)}</td></tr>
            ))}
            <tr className="font-bold"><td className={td}>Totals {totDr.toFixed(2) === totCr.toFixed(2) ? "✓ balanced" : "⚠ not balanced"}</td><td className={td + " num"}>{naira(totDr)}</td><td className={td + " num"}>{naira(totCr)}</td><td className={td}></td></tr>
          </tbody>
        </table>
      </TableWrap>
      <div className="mt-6 flex items-center gap-2 mb-2"><h2 className="font-semibold">Ledger detail / Cashbook</h2>
        <select className={selectCls + " max-w-xs"} value={ledger} onChange={(e) => setLedger(e.target.value)}><option value="">Choose ledger…</option>{Object.keys(tb).sort().map((k) => <option key={k}>{k}</option>)}</select></div>
      {ledger && <TableWrap>
        <table className="w-full">
          <thead><tr><th className={th}>Date</th><th className={th}>Ref</th><th className={th}>Debit</th><th className={th}>Credit</th><th className={th}>Running</th></tr></thead>
          <tbody>{shown.map((l) => { run += Number(l.debit) - Number(l.credit); return (
            <tr key={l.id}><td className={td}>{fmtDate(l.created_at)}</td><td className={td}><Link className="text-primary font-mono text-xs" to="/receipt/$id" params={{ id: l.transaction_id }}>{l.transactions?.ref}</Link></td><td className={td + " num"}>{Number(l.debit) ? naira(l.debit) : ""}</td><td className={td + " num"}>{Number(l.credit) ? naira(l.credit) : ""}</td><td className={td + " num"}>{naira(run)}</td></tr>); })}</tbody>
        </table>
      </TableWrap>}
    </div>
  );
}
