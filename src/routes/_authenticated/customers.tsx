import { createFileRoute } from "@tanstack/react-router";
import { PartyList } from "@/components/app/PartyList";
import { useCustomers } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({ meta: [{ title: "Customers & Debts — MP Paints" }, { name: "description", content: "Customer register and credit balances." }] }),
  component: () => {
    const c = useCustomers();
    return <PartyList kind="customers" rows={c.data ?? []} title="Customers & Debts" balanceLabel="Debt owed" />;
  },
});
