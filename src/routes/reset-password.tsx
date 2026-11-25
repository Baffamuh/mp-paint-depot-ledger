import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — MP Paints Finance Records" },
      { name: "description", content: "Set a new password." },
      { property: "og:title", content: "Reset password" },
      { property: "og:description", content: "Set a new password." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const nav = useNavigate();
  return (
    <div className="min-h-screen grid place-items-center bg-navy px-4">
      <form
        className="w-full max-w-sm bg-card rounded-2xl p-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const { error } = await supabase.auth.updateUser({ password: pw });
          if (error) { toast.error(error.message); return; }
          toast.success("Password updated");
          nav({ to: "/dashboard" });
        }}
      >
        <h1 className="text-xl font-bold">Set a new password</h1>
        <Input type="password" minLength={8} required value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (min 8 characters)" />
        <Button className="w-full">Update password</Button>
      </form>
    </div>
  );
}
