import { describe, expect, it } from "vitest";
import { purchaseError, selectPurchaseProduct } from "@/lib/purchase-validation";

describe("Purchase safeguards", () => {
  const line = { product_id: "paint", qty: 20, unit_cost: 20000 };
  it("blocks a zero-cost product", () => {
    expect(purchaseError([{ ...line, unit_cost: 0 }], "supplier", 0, 0, "")).toContain("unit cost greater than ₦0");
  });
  it("preserves an entered cost when the same paint is selected again", () => {
    expect(selectPurchaseProduct(line, "paint", 0).unit_cost).toBe(20000);
  });
  it("does not change another line when a product selection changes", () => {
    const lines = [line, { product_id: "roller", qty: 19, unit_cost: 1500 }];
    const updated = lines.map((value, index) => index === 1 ? selectPurchaseProduct(value, "brush", 1000) : value);
    expect(updated[0]?.unit_cost).toBe(20000);
  });
  it("allows a ₦400,000 purchase with ₦54,000 paid and the remainder owed", () => {
    expect(purchaseError([line], "supplier", 54000, 400000, "cash", 54000)).toBeNull();
  });
  it("blocks payment above the ₦54,000 available balance", () => {
    expect(purchaseError([line], "supplier", 400000, 400000, "cash", 54000)).toContain("insufficient funds");
  });
});