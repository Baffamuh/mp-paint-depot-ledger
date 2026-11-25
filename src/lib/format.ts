export const naira = (n: number | string | null | undefined) =>
  "₦" + Number(n ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const fmtDay = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

export const newKey = () => crypto.randomUUID();

export const TX_LABELS: Record<string, string> = {
  sale: "Paint Sale",
  customer_payment: "Customer Debt Repayment",
  purchase: "Paint Purchase",
  supplier_payment: "Supplier Payment",
  expense: "Business Expense",
  deposit: "Account Deposit",
  withdrawal: "Account Withdrawal",
  transfer: "Account Transfer",
  refund: "Sale Refund",
};

export const METHODS = ["Cash", "Bank Transfer", "POS", "Cheque", "Other"];
export const EXPENSE_CATEGORIES = ["Rent", "Salaries", "Electricity / Fuel", "Transport", "Shop Maintenance", "Phone / Data", "Tax / Levies", "Miscellaneous"];
export const PAINT_TYPES = ["Emulsion", "Satin", "Gloss", "Textured", "Primer", "Undercoat", "Oil Paint", "Enamel", "Varnish", "Thinner", "Other"];
export const SIZES = ["1L", "4L", "5L", "10L", "20L", "Bucket", "Drum", "Other"];

export function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]!);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}
export function downloadCSV(name: string, rows: Record<string, unknown>[]) {
  const blob = new Blob([toCSV(rows)], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
}

export function startOf(period: "day" | "week" | "month" | "year", d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  if (period === "week") x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  if (period === "month") x.setDate(1);
  if (period === "year") { x.setMonth(0, 1); }
  return x;
}
