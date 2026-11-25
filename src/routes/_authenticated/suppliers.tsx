import { createFileRoute } from "@tanstack/react-router";
import { PartyList } from "@/components/app/PartyList";
import { useSuppliers } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/suppliers")({
  head: () => ({ meta: [{ title: "Suppliers — MP Paints" }, { name: "description", content: "Supplier register and amounts owed." }] }),
  component: () => {
    const s = useSuppliers();
    return <PartyList kind="suppliers" rows={s.data ?? []} title="Suppliers" balanceLabel="We owe" />;
  },
});
