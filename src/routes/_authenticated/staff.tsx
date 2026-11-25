import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, TableWrap, th, td } from "@/components/app/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createStaff, grantStaffRole, resetStaffPassword } from "@/lib/staff.functions";

export const Route = createFileRoute("/_authenticated/staff")({
  head: () => ({ meta: [{ title: "Staff & Permissions — MP Paints" }, { name: "description", content: "Create staff accounts and control access." }] }),
  component: Staff,
});

const PERMS = [
  ["pos", "Sales / POS"], ["customers", "Customers"], ["payments", "Debt payments"], ["history", "Receipts & history"],
  ["purchases", "Purchases & suppliers"], ["expenses", "Expenses"], ["accounts", "Accounts & transfers"], ["closing", "Daily closing"], ["reports", "Reports & ledger"],
] as const;

function Staff() {
  const create = useServerFn(createStaff);
  const grant = useServerFn(grantStaffRole);
  const resetPw = useServerFn(resetStaffPassword);
  const q = useQuery({
    queryKey: ["staff"],
    queryFn: async () => {
      const [{ data: p }, { data: r }] = await Promise.all([supabase.from("profiles").select("*").order("created_at"), supabase.from("user_roles").select("*")]);
      return (p ?? []).map((x) => ({ ...x, roles: (r ?? []).filter((y) => y.user_id === x.id).map((y) => y.role) }));
    },
  });
  const [f, setF] = useState({ full_name: "", email: "", password: "", permissions: ["pos", "customers", "payments", "history"] as string[] });

  async function update(id: string, patch: { permissions?: string[]; active?: boolean }) {
    const { error } = await supabase.from("profiles").update(patch).eq("id", id);
    if (error) { toast.error(error.message); return; }
    await supabase.rpc("log_action", { _action: "staff_updated", _details: JSON.stringify({ id, ...patch }) });
    q.refetch();
  }

  return (
    <div>
      <PageHeader title="Staff" sub="Staff can only open the modules you tick. Nobody can delete completed transactions." />
      <Card className="p-4 mb-6 max-w-2xl">
        <form className="space-y-3" onSubmit={async (e) => {
          e.preventDefault();
          try { await create({ data: f }); toast.success("Staff account created"); setF({ ...f, full_name: "", email: "", password: "" }); q.refetch(); }
          catch (err) { toast.error((err as Error).message); }
        }}>
          <h2 className="font-semibold">Add staff member</h2>
          <div className="grid sm:grid-cols-3 gap-2">
            <Input placeholder="Full name" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} required />
            <Input type="email" placeholder="Email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
            <Input type="password" placeholder="Password (min 8)" minLength={8} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required />
          </div>
          <PermBoxes value={f.permissions} onChange={(p) => setF({ ...f, permissions: p })} />
          <Button>Create staff account</Button>
        </form>
      </Card>
      <TableWrap>
        <table className="w-full">
          <thead><tr><th className={th}>Name</th><th className={th}>Role</th><th className={th}>Permissions</th><th className={th}></th></tr></thead>
          <tbody>{q.data?.map((u) => {
            const isAdmin = u.roles.includes("admin");
            return (
              <tr key={u.id} className={u.active ? "" : "opacity-50"}>
                <td className={td}><div className="font-medium">{u.full_name}</div><div className="text-xs text-muted-foreground">{u.email}</div></td>
                <td className={td}>{isAdmin ? "Owner" : u.roles.length ? "Staff" : <Button size="sm" onClick={async () => { try { await grant({ data: { user_id: u.id } }); q.refetch(); toast.success("Approved"); } catch (e) { toast.error((e as Error).message); } }}>Approve</Button>}</td>
                <td className={td}>{isAdmin ? "Full access" : <PermBoxes value={u.permissions} onChange={(p) => update(u.id, { permissions: p })} />}</td>
                <td className={td + " whitespace-nowrap"}>{!isAdmin && <>
                  <Button size="sm" variant="outline" onClick={() => update(u.id, { active: !u.active })}>{u.active ? "Disable" : "Enable"}</Button>
                  <Button size="sm" variant="ghost" onClick={async () => { const pw = prompt("New password (min 8 characters)"); if (!pw) return; try { await resetPw({ data: { user_id: u.id, password: pw } }); toast.success("Password changed"); } catch (e) { toast.error((e as Error).message); } }}>Reset password</Button>
                </>}</td>
              </tr>
            );
          })}</tbody>
        </table>
      </TableWrap>
    </div>
  );
}

function PermBoxes({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1">
      {PERMS.map(([k, l]) => (
        <label key={k} className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={value.includes(k)} onChange={(e) => onChange(e.target.checked ? [...value, k] : value.filter((x) => x !== k))} /> {l}
        </label>
      ))}
    </div>
  );
}
