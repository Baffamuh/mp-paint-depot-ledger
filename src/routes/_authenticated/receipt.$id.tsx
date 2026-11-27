import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Printer, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Receipt, type ReceiptData } from "@/components/app/Receipt";
import { Button } from "@/components/ui/button";
import { rpc, useSettings } from "@/lib/db";

export const Route = createFileRoute("/_authenticated/receipt/$id")({
  head: () => ({ meta: [{ title: "Receipt — MP Paints Finance Records" }, { name: "description", content: "Printable transaction receipt." }] }),
  component: ReceiptPage,
});

function ReceiptPage() {
  const { id } = Route.useParams();
  const [format, setFormat] = useState<"thermal" | "a4">("thermal");
  const [printing, setPrinting] = useState(false);
  const settings = useSettings();
  const q = useQuery({
    queryKey: ["receipt", id],
    queryFn: async () => {
      const { data: t, error } = await supabase
        .from("transactions")
        .select("*, customers(name), suppliers(name), acc:accounts!transactions_account_id_fkey(name), to:accounts!transactions_to_account_id_fkey(name)")
        .eq("id", id).single();
      if (error) throw error;
      const { data: items, error: itemsError } = await supabase.from("transaction_items").select("*").eq("transaction_id", id).order("id");
      if (itemsError) throw itemsError;
      const r: ReceiptData = {
        ...t,
        party: t.customers?.name ?? t.suppliers?.name ?? null,
        partyLabel: t.customers ? "Customer" : t.suppliers ? "Supplier" : undefined,
        account: t.acc?.name ?? null,
        toAccount: t.to?.name ?? null,
        items: items ?? [],
      };
      return { r, wasPrinted: t.print_count > 0 };
    },
    staleTime: Infinity,
  });

  async function print() {
    if (printing) return;
    setPrinting(true);
    try {
      await document.fonts.ready;
      await Promise.all(Array.from(document.querySelectorAll<HTMLImageElement>(".print-area img")).map((image) => image.decode()));
      await rpc("mark_printed", { _tx: id });
      window.print();
    } catch { toast.error("Receipt could not be prepared for printing. Check the logo and your connection, then try again."); }
    finally { setPrinting(false); }
  }

  if (q.isLoading || settings.isLoading) return <div className="text-muted-foreground">Loading receipt…</div>;
  if (q.error || !q.data || !settings.data) return <div className="text-destructive">Receipt not found.</div>;

  return (
    <div>
      <style>{format === "thermal" ? "@page { size: auto; margin: 2mm; }" : "@page { size: A4; margin: 8mm; }"}</style>
      <div className="no-print mb-4 flex flex-wrap gap-2 items-center">
        <Button variant="ghost" asChild><Link to="/transactions"><ArrowLeft className="h-4 w-4" /> History</Link></Button>
        <div className="flex rounded-md border overflow-hidden">
          {(["thermal", "a4"] as const).map((f) => (
            <Button key={f} disabled={printing} variant={format === f ? "default" : "ghost"} aria-pressed={format === f} onClick={() => setFormat(f)} className="rounded-none">
              {f === "thermal" ? "Thermal 80mm" : "A4"}
            </Button>
          ))}
        </div>
        <Button disabled={printing} onClick={print}><Printer className="h-4 w-4" /> Print</Button>
        <Button disabled={printing} variant="outline" onClick={print}>Download PDF</Button>
        <span className="text-xs text-muted-foreground">For PDF, choose "Save as PDF" as the printer.</span>
      </div>
      <div className="receipt-preview overflow-x-auto">
        <Receipt r={q.data.r} biz={settings.data} format={format} copy={q.data.wasPrinted} />
      </div>
    </div>
  );
}
