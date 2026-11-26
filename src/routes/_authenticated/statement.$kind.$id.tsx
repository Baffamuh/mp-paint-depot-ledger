import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableWrap, th, td } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { fmtDate, naira, TX_LABELS } from "@/lib/format";
import { useSettings } from "@/lib/db";
import { banner } from "@/lib/brand";

export const Route = createFileRoute("/_authenticated/statement/$kind/$id")({
  head: () => ({ meta: [{ title: "Statement — MP Paints" }, { name: "description", content: "Customer or supplier statement." }] }),
  component: Statement,
});

function Statement() {
  const { kind, id } = Route.useParams();
  const settings = useSettings();
  const q = useQuery({
    queryKey: ["statement", kind, id],
    queryFn: async () => {
      const table = kind === "suppliers" ? "suppliers" : "customers";
      const col = kind === "suppliers" ? "supplier_id" : "customer_id";
      const { data: party } = await supabase.from(table).select("*").eq("id", id).single();
      const { data: txs } = await supabase.from("transactions").select("*").eq(col, id).order("created_at");
      return { party, txs: txs ?? [] };
    },
  });
  if (!q.data?.party) return <div className="text-muted-foreground">Loading…</div>;
  let run = 0;
  const rows = q.data.txs.map((t) => {
    let dr = 0, cr = 0;
    if (t.tx_type === "sale" || t.tx_type === "purchase") dr = Number(t.total) - Number(t.paid);
    if (t.tx_type === "customer_payment" || t.tx_type === "supplier_payment") cr = Number(t.total);
    if (t.tx_type === "refund") cr = Number(t.total) - Number(t.paid);
    run += dr - cr;
    return { t, dr, cr, run };
  });
  return (
    <div>
      <PageHeader title={`Statement: ${q.data.party.name}`}>
        <Button variant="outline" asChild><Link to={kind === "suppliers" ? "/suppliers" : "/customers"}>Back</Link></Button>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Print / PDF</Button>
      </PageHeader>
      <div className="print-area bg-card rounded-lg p-4">
        <div className="hidden print:block mb-4">
          <img src={banner.url} alt="" className="w-full max-h-32 object-contain" />
          <div className="text-center text-sm">{settings.data?.address} · {settings.data?.phone}</div>
          <h2 className="text-lg font-bold mt-2">Statement of Account — {q.data.party.name}</h2>
        </div>
        <TableWrap>
          <table className="w-full">
            <thead><tr><th className={th}>Date</th><th className={th}>Ref</th><th className={th}>Type</th><th className={th}>Total</th><th className={th}>Debt +</th><th className={th}>Paid −</th><th className={th}>Balance</th></tr></thead>
            <tbody>
              {rows.map(({ t, dr, cr, run }) => (
                <tr key={t.id}>
                  <td className={td}>{fmtDate(t.created_at)}</td>
                  <td className={td}><Link to="/receipt/$id" params={{ id: t.id }} className="text-primary font-mono text-xs">{t.ref}</Link></td>
                  <td className={td}>{TX_LABELS[t.tx_type]}</td>
                  <td className={td + " num"}>{naira(t.total)}</td>
                  <td className={td + " num"}>{dr ? naira(dr) : ""}</td>
                  <td className={td + " num"}>{cr ? naira(cr) : ""}</td>
                  <td className={td + " num font-semibold"}>{naira(run)}</td>
                </tr>
              ))}
              {!rows.length && <tr><td className={td} colSpan={7}>No transactions yet.</td></tr>}
            </tbody>
          </table>
        </TableWrap>
        <div className="text-right mt-3 font-bold">Current balance: {naira(q.data.party.balance)}</div>
      </div>
    </div>
  );
}
