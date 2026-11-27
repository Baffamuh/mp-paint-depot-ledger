export type PurchaseLine = { product_id: string; qty: number; unit_cost: number };

export function selectPurchaseProduct(line: PurchaseLine, productId: string, defaultCost: number): PurchaseLine {
  // Re-selecting the same paint must not overwrite an entered invoice cost.
  return line.product_id === productId ? line : { ...line, product_id: productId, unit_cost: defaultCost };
}

export function purchaseError(lines: PurchaseLine[], supplier: string, paid: number, total: number, account: string, balance?: number): string | null {
  if (!supplier) return "Select a supplier.";
  if (!lines.length || lines.some((line) => !line.product_id)) return "Select a product for every line.";
  if (lines.some((line) => !Number.isFinite(line.qty) || line.qty <= 0)) return "Enter a quantity greater than zero for every product.";
  if (lines.some((line) => !Number.isFinite(line.unit_cost) || line.unit_cost <= 0)) return "Enter a unit cost greater than ₦0 for every product.";
  if (!Number.isFinite(paid) || paid < 0 || paid > total) return "Amount paid must be between zero and the purchase total.";
  if (paid > 0 && !account) return "Choose the paying account.";
  if (paid > 0 && balance !== undefined && paid > balance) return "The selected account has insufficient funds. Enter only the amount paid now; the remainder is owed to the supplier.";
  return null;
}