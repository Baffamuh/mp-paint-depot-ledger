import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, Stat, TableWrap, th, td, selectCls } from "@/components/app/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { rpc, useAccounts, useRefresh, useTransactions } from "@/lib/db";
import { fmtDay, naira, startOf } from "@/lib/format";
import { summarize } from "@/lib/profit";

export const Route = createFileRoute("/_authenticated/closing")({
  head: () => ({ meta: [{ title: "Daily Closing — MP Paints" }, { name: "description", content: "End-of-day cash count and reconciliation." }] }),
  component: Closing,
});

function Closing() {
  const accounts = useAccounts();
  const refresh = useRefresh();
  const today = summarize(useTransactions(startOf("day")).data ?? []);
  const hist = useQuery({
    queryKey: ["closings"],
    queryFn: async () => (await supabase.from("daily_closings").select("*, accounts(name)").order("created_at", { ascending: false }).limit(100)).data ?? [],
  });
  const [account, setAccount] = useState("");
  const [counted, setCounted] = useState("");
  const [notes, setNotes] = useState("");
  const sel = accounts.data?.find((a) => a.id === account);

  return (
    <div>
      <PageHeader title="Daily Closing" sub="Count the money and compare with what the system expects." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <Stat label="Sales today" value={naira(today.revenue)} />
        <Stat label="Received today" value={naira(today.cashIn)} tone="good" />
        <Stat label="Paid out today" value={naira(today.cashOut)} tone="bad" />
        <Stat label="Profit today" value={naira(today.net)} />
      </div>
      <Card className="p-4 max-w-lg space-y-3 mb-6">
        <select className={selectCls} value={account} onChange={(e) => setAccount(e.target.value)}><option value="">Account to close…</option>{accounts.data?.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        {sel && <p className="text-sm">System expects: <b>{naira(sel.balance)}</b></p>}
        <Input type="number" placeholder="Amount physically counted ₦" value={counted} onChange={(e) => setCounted(e.target.value)} />
        {sel && counted !== "" && <p className={"text-sm font-semibold " + (Number(counted) - Number(sel.balance) === 0 ? "text-success" : "text-destructive")}>Difference: {naira(Number(counted) - Number(sel.balance))}</p>}
        <Input placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
        <Button disabled={!account || counted === ""} onClick={async () => {
          try { await rpc("post_daily_close", { _account_id: account, _counted: Number(counted), _notes: notes || null }); toast.success("Day closed"); setCounted(""); setNotes(""); refresh(); }
          catch (e) { toast.error((e as Error).message); }
        }}>Close day for this account</Button>
      </Card>
      <TableWrap>
        <table className="w-full">
          <thead><tr><th className={th}>Date</th><th className={th}>Account</th><th className={th}>Expected</th><th className={th}>Counted</th><th className={th}>Difference</th><th className={th}>By</th></tr></thead>
          <tbody>{hist.data?.map((c) => (
            <tr key={c.id}><td className={td}>{fmtDay(c.close_date)}</td><td className={td}>{c.accounts?.name}</td><td className={td + " num"}>{naira(c.expected)}</td><td className={td + " num"}>{naira(c.counted)}</td>
              <td className={td + " num " + (Number(c.difference) ? "text-destructive" : "text-success")}>{naira(c.difference)}</td><td className={td}>{c.staff_name}{c.notes ? ` – ${c.notes}` : ""}</td></tr>
          ))}</tbody>
        </table>
      </TableWrap>
    </div>
  );
}
