import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingCart, PaintBucket, Users, Printer, Wallet, BarChart3 } from "lucide-react";
import { banner, badge } from "@/lib/brand";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MP Paints Finance Records — MP Paint Depot Azare" },
      { name: "description", content: "Point of sale, paint inventory, customer debts, accounts and receipts for MP Paint Depot Azare." },
      { property: "og:title", content: "MP Paints Finance Records" },
      { property: "og:description", content: "Point of sale, paint inventory, debts, accounts and receipts for MP Paint Depot Azare." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STEPS = [
  { icon: ShoppingCart, title: "Sell", text: "Tap paints, choose payment, done." },
  { icon: Printer, title: "Print", text: "Receipt with your logo, thermal or A4." },
  { icon: PaintBucket, title: "Stock", text: "Stock updates by itself. Low-stock alerts." },
  { icon: Users, title: "Debts", text: "See who owes you and collect payments." },
  { icon: Wallet, title: "Money", text: "Cash, bank and POS balances in one place." },
  { icon: BarChart3, title: "Profit", text: "Daily closing and real profit reports." },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-navy text-navy-foreground">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <img src={badge.url} alt="MP Paint logo" className="h-10 w-10 rounded-full bg-card" />
          <span className="font-display font-bold">MP PAINT DEPOT</span>
          <Button asChild size="sm" variant="secondary" className="ml-auto"><Link to="/auth">Sign in</Link></Button>
        </div>
        <div className="max-w-6xl mx-auto px-4 pb-14 pt-8 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm uppercase tracking-widest opacity-70">Azare · Bauchi State</p>
            <h1 className="mt-3 text-4xl sm:text-5xl font-extrabold leading-tight">Your paint shop records, made simple.</h1>
            <p className="mt-4 text-lg opacity-80">Sales, stock, debts, money and printed receipts — all in one easy app.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-brand-red text-primary-foreground hover:bg-brand-red/90"><Link to="/auth">Try the demo</Link></Button>
              <Button asChild size="lg" variant="secondary"><Link to="/dashboard">Open my shop</Link></Button>
            </div>
          </div>
          <img src={banner.url} alt="MP Paint Depot Azare" className="w-full rounded-2xl shadow-2xl ring-1 ring-navy-foreground/10" />
        </div>
      </header>
      <section className="max-w-6xl mx-auto px-4 py-14">
        <h2 className="text-2xl font-bold text-center">Everything in 6 simple steps</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="rounded-xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent text-accent-foreground grid place-items-center"><s.icon className="h-5 w-5" /></div>
                <div className="font-display font-semibold">{i + 1}. {s.title}</div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground px-4">
        Shop No 6-8 opp Yaji and Grill Restaurant, Layin Asibitin Ali Kwara, Azare, Bauchi State · 09033154072, 07038596473
      </footer>
    </div>
  );
}
