import { createFileRoute, Link } from "@tanstack/react-router";
import banner from "@/assets/mp-banner.jpg.asset.json";
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

function Index() {
  return (
    <div className="min-h-screen bg-navy text-navy-foreground flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 gap-8">
        <img src={banner.url} alt="MP Paint Depot Azare" className="w-full max-w-3xl rounded-xl shadow-2xl" />
        <div className="text-center max-w-xl">
          <h1 className="text-3xl sm:text-4xl font-bold">MP Paints Finance Records</h1>
          <p className="mt-3 opacity-80">Sales, paint stock, customer debts, suppliers, cash & bank accounts, profit and printed receipts — in one place.</p>
          <p className="mt-2 text-sm opacity-60">Shop No 6-8 opp Yaji and Grill Restaurant, Layin Asibitin Ali Kwara, Azare, Bauchi State · 09033154072, 07038596473</p>
        </div>
        <div className="flex gap-3">
          <Button asChild size="lg" variant="secondary"><Link to="/dashboard">Open dashboard</Link></Button>
          <Button asChild size="lg" variant="outline" className="bg-transparent text-navy-foreground"><Link to="/auth">Sign in</Link></Button>
        </div>
      </div>
    </div>
  );
}
