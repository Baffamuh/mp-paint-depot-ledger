import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableWrap, th, td } from "@/components/app/ui";
import { fmtDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({ meta: [{ title: "Audit Log — MP Paints" }, { name: "description", content: "Who did what and when." }] }),
  component: Audit,
});

function Audit() {
  const q = useQuery({ queryKey: ["audit"], queryFn: async () => (await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(500)).data ?? [] });
  return (
    <div>
      <PageHeader title="Audit Log" />
      <TableWrap>
        <table className="w-full">
          <thead><tr><th className={th}>When</th><th className={th}>User</th><th className={th}>Action</th><th className={th}>Details</th></tr></thead>
          <tbody>{q.data?.map((a) => <tr key={a.id}><td className={td + " whitespace-nowrap"}>{fmtDate(a.created_at)}</td><td className={td}>{a.user_name}</td><td className={td}>{a.action}</td><td className={td + " break-all"}>{a.details}</td></tr>)}</tbody>
        </table>
      </TableWrap>
    </div>
  );
}
