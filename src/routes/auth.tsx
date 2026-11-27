import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/brand";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — MP Paints Finance Records" },
      { name: "description", content: "Owner and staff sign in for MP Paints Finance Records." },
      { property: "og:title", content: "Sign in — MP Paints Finance Records" },
      { property: "og:description", content: "Owner and staff sign in." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"in" | "up" | "forgot">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function demo() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
    setBusy(false);
    if (error) { toast.error("Demo is not available right now."); return; }
    nav({ to: "/dashboard" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        nav({ to: "/dashboard" });
      } else if (mode === "up") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name } },
        });
        if (error) throw error;
        if (data.session) nav({ to: "/dashboard" });
        else toast.success("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
        if (error) throw error;
        toast.success("Password reset link sent to your email.");
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-navy px-4">
      <form onSubmit={submit} className="w-full max-w-sm bg-card rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex flex-col items-center gap-2">
          <h1 className="text-xl font-bold text-center">MP Paints Finance Records</h1>
          <p className="text-sm text-muted-foreground">{mode === "in" ? "Sign in to continue" : mode === "up" ? "Create owner account" : "Reset your password"}</p>
        </div>
        {mode === "up" && (
          <div className="space-y-1"><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
        )}
        <div className="space-y-1"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        {mode !== "forgot" && (
          <div className="space-y-1"><Label>Password</Label><Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required /></div>
        )}
        <Button className="w-full" disabled={busy}>{mode === "in" ? "Sign in" : mode === "up" ? "Create account" : "Send reset link"}</Button>
        {mode === "in" && (
          <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={demo}>Try the demo (no sign-up)</Button>
        )}
        <div className="flex justify-between text-sm">
          {mode !== "in" ? <button type="button" className="text-primary" onClick={() => setMode("in")}>Back to sign in</button>
            : <button type="button" className="text-primary" onClick={() => setMode("forgot")}>Forgot password?</button>}
          {mode === "in" && <button type="button" className="text-primary" onClick={() => setMode("up")}>First time? Register</button>}
        </div>
        <p className="text-xs text-muted-foreground text-center">The first account registered becomes the Owner/Admin. Other staff are added by the owner.</p>
      </form>
    </div>
  );
}
