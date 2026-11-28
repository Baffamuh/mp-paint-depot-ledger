import { receiptLogo } from "@/lib/brand";
import { fmtDate, naira, TX_LABELS } from "@/lib/format";

export type ReceiptData = {
  ref: string; tx_type: string; created_at: string; description: string | null; category: string | null;
  total: number; paid: number; balance_due: number; payment_method: string | null; staff_name: string | null;
  party?: string | null; partyLabel?: string | undefined; account?: string | null; toAccount?: string | null;
  items: { description: string; qty: number; unit_price: number; line_total: number }[];
};
type Biz = { business_name: string; address: string; phone: string; receipt_footer: string };

export function Receipt({ r, biz, format, copy }: { r: ReceiptData; biz: Biz; format: "thermal" | "a4"; copy: boolean }) {
  const title = TX_LABELS[r.tx_type] ?? r.tx_type;
  const showPaidBal = ["sale", "purchase", "customer_payment", "supplier_payment"].includes(r.tx_type);
  const accountLine = r.tx_type === "transfer" ? `${r.account} → ${r.toAccount}` : r.account;

  if (format === "thermal") {
    return (
      <div className="print-area receipt-thermal mx-auto bg-card text-foreground font-mono text-[11px] leading-snug p-3 shadow">
        <div className="text-center">
          <img src={receiptLogo.url} alt="MP Paint Depot Azare receipt logo" className="receipt-logo mx-auto object-contain" />
          <div className="font-display text-sm font-extrabold mt-1">{biz.business_name}</div>
          <div>{biz.address}</div>
          <div>Tel: {biz.phone}</div>
          <div className="my-1 border-t border-dashed border-foreground" />
          <div className="font-bold uppercase">{title} Receipt</div>
          {copy && <div className="font-bold">*** REPRINT – COPY ***</div>}
        </div>
        <div className="my-1 border-t border-dashed border-foreground" />
        <Row k="Receipt No" v={r.ref} />
        <Row k="Date" v={fmtDate(r.created_at)} />
        {r.party && <Row k={r.partyLabel ?? "Name"} v={r.party} />}
        {r.category && <Row k="Category" v={r.category} />}
        {accountLine && <Row k="Account" v={accountLine} />}
        {r.items.length > 0 && (
          <>
            <div className="my-1 border-t border-dashed border-foreground" />
            {r.items.map((i, n) => (
              <div key={n} className="mb-1">
                <div>{i.description}</div>
                <div className="flex justify-between gap-2"><span>{Number(i.qty)} x {naira(i.unit_price)}</span><span className="shrink-0">{naira(i.line_total)}</span></div>
              </div>
            ))}
          </>
        )}
        {r.description && <div className="mt-1">Note: {r.description}</div>}
        <div className="my-1 border-t border-dashed border-foreground" />
        <Row k="TOTAL" v={naira(r.total)} bold />
        {showPaidBal && <Row k="Amount Paid" v={naira(r.paid)} />}
        {showPaidBal && Number(r.balance_due) > 0 && <Row k="Outstanding" v={naira(r.balance_due)} bold />}
        {r.payment_method && <Row k="Payment" v={r.payment_method} />}
        <Row k="Served by" v={r.staff_name ?? ""} />
        <div className="my-1 border-t border-dashed border-foreground" />
        <div className="text-center">{biz.receipt_footer}</div>
      </div>
    );
  }

  return (
    <div className="print-area receipt-a4 mx-auto bg-card text-foreground shadow p-4 sm:p-8 relative">
      {copy && <div className="absolute right-8 top-8 rotate-12 border-2 border-brand-red text-brand-red font-bold px-3 py-1 text-lg">COPY</div>}
      <img src={receiptLogo.url} alt="MP Paint Depot Azare receipt logo" className="receipt-logo mx-auto object-contain" />
      <div className="text-center font-display text-2xl font-extrabold mt-2">{biz.business_name}</div>
      <div className="text-center text-sm mt-2">{biz.address} · Tel: {biz.phone}</div>
      <div className="mt-4 bg-navy text-navy-foreground px-4 py-2 flex justify-between items-center">
        <span className="font-display font-bold uppercase tracking-wide">{title} Receipt</span>
        <span className="font-mono break-all text-right">{r.ref}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mt-4">
        <Row k="Date & Time" v={fmtDate(r.created_at)} />
        <Row k="Transaction" v={title} />
        {r.party && <Row k={r.partyLabel ?? "Name"} v={r.party} />}
        {accountLine && <Row k="Account" v={accountLine} />}
        {r.category && <Row k="Category" v={r.category} />}
        {r.payment_method && <Row k="Payment Method" v={r.payment_method} />}
        <Row k="Processed by" v={r.staff_name ?? ""} />
      </div>
      <table className="w-full mt-6 text-sm border">
        <thead className="bg-muted">
          <tr><th className="text-left p-2">#</th><th className="text-left p-2">Description</th><th className="text-right p-2">Qty</th><th className="text-right p-2">Unit Price</th><th className="text-right p-2">Amount</th></tr>
        </thead>
        <tbody>
          {r.items.length ? r.items.map((i, n) => (
            <tr key={n} className="border-t"><td className="p-2">{n + 1}</td><td className="p-2">{i.description}</td><td className="p-2 text-right">{Number(i.qty)}</td><td className="p-2 text-right">{naira(i.unit_price)}</td><td className="p-2 text-right">{naira(i.line_total)}</td></tr>
          )) : (
            <tr className="border-t"><td className="p-2">1</td><td className="p-2">{r.description || title}</td><td className="p-2 text-right">1</td><td className="p-2 text-right">{naira(r.total)}</td><td className="p-2 text-right">{naira(r.total)}</td></tr>
          )}
        </tbody>
      </table>
      {r.items.length > 0 && r.description && <p className="text-sm mt-2">Note: {r.description}</p>}
      <div className="ml-auto mt-4 w-72 max-w-full text-sm space-y-1">
        <Row k="Total" v={naira(r.total)} bold />
        {showPaidBal && <Row k="Amount Paid" v={naira(r.paid)} />}
        {showPaidBal && <Row k="Outstanding Balance" v={naira(r.balance_due)} bold />}
      </div>
      <p className="text-center text-xs text-muted-foreground mt-8">{biz.receipt_footer}</p>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={"flex justify-between gap-2 " + (bold ? "font-bold" : "")}>
      <span>{k}</span><span className="text-right break-all">{v}</span>
    </div>
  );
}
