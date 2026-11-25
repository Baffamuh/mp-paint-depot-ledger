import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/app/ui";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRefresh, useSettings } from "@/lib/db";
import badge from "@/assets/mp-badge.png.asset.json";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Business & Receipt Settings — MP Paints" }, { name: "description", content: "Business details printed on receipts." }] }),
  component: Settings,
});

function Settings() {
  const s = useSettings();
  const refresh = useRefresh();
  const [f, setF] = useState({ business_name: "", address: "", phone: "", receipt_footer: "" });
  useEffect(() => { if (s.data) setF({ business_name: s.data.business_name, address: s.data.address, phone: s.data.phone, receipt_footer: s.data.receipt_footer }); }, [s.data]);
  return (
    <div>
      <PageHeader title="Settings" sub="These details appear on every receipt." />
      <Card className="p-4 max-w-xl space-y-3">
        <img src={badge.url} alt="Logo" className="h-20 w-20" />
        <div className="space-y-1"><Label>Business name</Label><Input value={f.business_name} onChange={(e) => setF({ ...f, business_name: e.target.value })} /></div>
        <div className="space-y-1"><Label>Address</Label><Textarea value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
        <div className="space-y-1"><Label>Phone numbers</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div className="space-y-1"><Label>Receipt footer</Label><Textarea value={f.receipt_footer} onChange={(e) => setF({ ...f, receipt_footer: e.target.value })} /></div>
        <Button onClick={async () => {
          const { error } = await supabase.from("settings").update({ ...f, updated_at: new Date().toISOString() }).eq("id", 1);
          if (error) { toast.error(error.message); return; }
          await supabase.rpc("log_action", { _action: "settings_updated", _details: f.business_name });
          toast.success("Saved"); refresh();
        }}>Save</Button>
      </Card>
    </div>
  );
}
