import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard, ShoppingCart, PaintBucket, Truck, Factory, Users, HandCoins, Receipt, Wallet,
  History, BookOpen, CalendarCheck, BarChart3, UserCog, Settings, ShieldCheck, LogOut, Menu, X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/me";
import { useT } from "@/lib/i18n";
import { badge } from "@/lib/brand";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, perm: null },
  { to: "/pos", label: "Sales / POS", icon: ShoppingCart, perm: "pos" },
  { to: "/products", label: "Products", icon: PaintBucket, perm: null },
  { to: "/purchases", label: "Purchases", icon: Truck, perm: "purchases" },
  { to: "/suppliers", label: "Suppliers", icon: Factory, perm: "purchases" },
  { to: "/customers", label: "Customers", icon: Users, perm: "customers" },
  { to: "/payments", label: "Payments", icon: HandCoins, perm: "payments" },
  { to: "/expenses", label: "Expenses", icon: Receipt, perm: "expenses" },
  { to: "/accounts", label: "Accounts", icon: Wallet, perm: "accounts" },
  { to: "/transactions", label: "Receipts & History", icon: History, perm: "history" },
  { to: "/ledger", label: "Ledger", icon: BookOpen, perm: "reports" },
  { to: "/closing", label: "Daily Closing", icon: CalendarCheck, perm: "closing" },
  { to: "/reports", label: "Reports", icon: BarChart3, perm: "reports" },
  { to: "/staff", label: "Staff", icon: UserCog, perm: "admin" },
  { to: "/settings", label: "Settings", icon: Settings, perm: "admin" },
  { to: "/audit", label: "Audit Log", icon: ShieldCheck, perm: "admin" },
] as const;

export function AppShell() {
  const { data: me, isLoading } = useMe();
  const { t, lang, setLang } = useT();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  if (isLoading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (!me?.isMember) {
    return (
      <div className="min-h-screen grid place-items-center px-4">
        <div className="max-w-md text-center space-y-3">
          <img src={badge.url} alt="" className="h-20 mx-auto" />
          <h1 className="text-xl font-bold">Waiting for owner approval</h1>
          <p className="text-muted-foreground text-sm">Your account ({me?.user.email}) has no access yet. Ask the shop owner to approve you on the Staff page.</p>
          <Button variant="outline" onClick={() => supabase.auth.signOut().then(() => nav({ to: "/auth" }))}>Sign out</Button>
        </div>
      </div>
    );
  }
  const items = NAV.filter((n) => n.perm === null || (n.perm === "admin" ? me.isAdmin : me.can(n.perm)));

  const side = (
    <nav className="flex flex-col gap-0.5 p-3">
      {items.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          onClick={() => setOpen(false)}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
            path.startsWith(n.to) ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent",
          )}
        >
          <n.icon className="h-4 w-4 shrink-0" /> {t(n.label)}
        </Link>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen flex">
      <aside className="no-print hidden lg:flex w-60 shrink-0 flex-col bg-sidebar text-sidebar-foreground sticky top-0 h-screen overflow-y-auto">
        <Brand />
        {side}
      </aside>
      {open && (
        <div className="no-print fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-sidebar text-sidebar-foreground overflow-y-auto">
            <div className="flex justify-end p-2"><button onClick={() => setOpen(false)}><X /></button></div>
            <Brand />
            {side}
          </aside>
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="no-print sticky top-0 z-30 flex items-center gap-2 border-b bg-card/95 backdrop-blur px-3 sm:px-6 h-14">
          <button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu /></button>
          <div className="font-display font-semibold truncate">MP Paints Finance Records</div>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setLang(lang === "en" ? "ha" : "en")} className="text-xs border rounded px-2 py-1">{lang === "en" ? "Hausa" : "English"}</button>
            <span className="hidden sm:inline text-sm text-muted-foreground">{me.profile?.full_name} · {me.isAdmin ? "Owner" : "Staff"}</span>
            <Button size="sm" variant="ghost" onClick={() => supabase.auth.signOut().then(() => nav({ to: "/auth" }))}>
              <LogOut className="h-4 w-4" /><span className="hidden sm:inline">{t("Sign out")}</span>
            </Button>
          </div>
        </header>
        <main className="flex-1 p-3 sm:p-6 min-w-0"><Outlet /></main>
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
      <img src={badge.url} alt="MP Paint logo" className="h-10 w-10 rounded-full bg-card" />
      <div className="leading-tight">
        <div className="font-display font-bold text-sidebar-accent-foreground">MP PAINT DEPOT</div>
        <div className="text-xs opacity-70">Azare · Finance Records</div>
      </div>
    </div>
  );
}
