import { describe, it, expect } from "vitest";
import { catalogEstimates, packLitres, paintArea, paintProjectSchema, type PaintProject } from "@/lib/paint-estimate";

const project: PaintProject = { surface: "Plaster / masonry", location: "Interior", finish: "Matt", condition: "New / unpainted", width: 5, height: 3, surfaces: 4, openings: 5, coats: 2, waste: 10, colour: "White" };
const product = { id: "00000000-0000-4000-8000-000000000001", brand: "MP", paint_type: "Emulsion", colour: "White", size: "20L", stock_qty: 10, selling_price: 20000 };
const advice = { summary: "", warnings: [], products: [{ product_id: product.id, role: "Topcoat" as const, reason: "", coverage: 10, coats: 1 }] };

describe("Catalog paint estimates", () => {
  it("deducts openings from the measured area", () => { expect(paintArea(project)).toBe(55); });
  it("calculates litres using requested coats and allowance, rounding to whole catalog packs", () => {
    const estimate = catalogEstimates(advice, [product], project)[0];
    expect(estimate?.litres).toBe(12.1);
    expect(estimate?.packs).toBe(1);
    expect(estimate?.estimatedCost).toBe(20000);
  });
  it("never recommends an invented product outside the catalog", () => {
    expect(() => catalogEstimates(advice, [], project)).toThrow("unavailable catalog item");
  });
  it("does not invent the capacity of a bucket or convert kg to litres", () => {
    expect(packLitres("Bucket")).toBeNull();
    expect(packLitres("20kg")).toBeNull();
    expect(catalogEstimates(advice, [{ ...product, size: "Bucket" }], project)[0]?.packs).toBeNull();
  });
  it("rejects invalid dimensions and openings greater than the surface", () => {
    expect(paintProjectSchema.safeParse({ ...project, width: 0 }).success).toBe(false);
    expect(paintProjectSchema.safeParse({ ...project, openings: 60 }).success).toBe(false);
  });
});