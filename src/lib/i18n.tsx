import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Lang = "en" | "ha";
const HA: Record<string, string> = {
  Dashboard: "Allon Bayani",
  "Sales / POS": "Sayarwa / POS",
  Products: "Kayayyaki (Fenti)",
  Purchases: "Sayayya",
  Suppliers: "Masu Kawo Kaya",
  Customers: "Abokan Ciniki",
  Payments: "Biyan Bashi",
  Expenses: "Kashe Kudi",
  Accounts: "Asusu",
  "Receipts & History": "Rasit da Tarihi",
  Ledger: "Littafin Lissafi",
  "Daily Closing": "Rufe Rana",
  Reports: "Rahotanni",
  Staff: "Ma'aikata",
  Settings: "Saituna",
  "Audit Log": "Bayanan Bincike",
  "Sign out": "Fita",
  "Complete Sale": "Kammala Sayarwa",
  "Today's Sales": "Sayarwar Yau",
  "Cash Received Today": "Kudin da aka karba yau",
  "Customer Debts": "Bashin Abokan Ciniki",
  "Low Stock": "Kaya sun kusa karewa",
  "Net Profit (Month)": "Ribar Wata",
  Print: "Buga",
  Save: "Ajiye",
  Search: "Nema",
};
const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: (s: string) => string }>({
  lang: "en",
  setLang: () => {},
  t: (s) => s,
});
export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangS] = useState<Lang>("en");
  useEffect(() => {
    const s = localStorage.getItem("mp-lang");
    if (s === "ha") setLangS("ha");
  }, []);
  const setLang = (l: Lang) => {
    setLangS(l);
    localStorage.setItem("mp-lang", l);
  };
  return <Ctx.Provider value={{ lang, setLang, t: (s) => (lang === "ha" ? (HA[s] ?? s) : s) }}>{children}</Ctx.Provider>;
}
export const useT = () => useContext(Ctx);
