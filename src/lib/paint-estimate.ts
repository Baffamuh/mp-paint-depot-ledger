import { z } from "zod";

export const paintProjectSchema = z.object({
  surface: z.enum(["Plaster / masonry", "Wood", "Metal", "Concrete floor"]),
  location: z.enum(["Interior", "Exterior"]),
  finish: z.enum(["Matt", "Satin", "Gloss", "No preference"]),
  condition: z.enum(["New / unpainted", "Previously painted", "Damp / damaged"]),
  width: z.number().finite().positive().max(1000),
  height: z.number().finite().positive().max(1000),
  surfaces: z.number().int().min(1).max(100),
  openings: z.number().finite().min(0).max(100000),
  coats: z.number().int().min(1).max(5),
  waste: z.number().min(0).max(30),
  colour: z.string().trim().max(80),
}).refine((value) => value.width * value.height * value.surfaces > value.openings, {
  message: "Doors and windows must be smaller than the total surface area.",
  path: ["openings"],
});
export type PaintProject = z.infer<typeof paintProjectSchema>;
export type CatalogPaint = { id: string; brand: string; paint_type: string; colour: string; size: string; stock_qty: number; selling_price: number };
export const paintAdviceSchema = z.object({
  summary: z.string().max(2000),
  warnings: z.array(z.string().max(1000)).max(10),
  products: z.array(z.object({
    product_id: z.string().uuid(),
    role: z.enum(["Topcoat", "Primer"]),
    reason: z.string().max(1200),
    coverage: z.number().finite().min(1).max(30),
    coats: z.number().int().min(1).max(5),
  })).max(4),
});
export type PaintAdvice = z.infer<typeof paintAdviceSchema>;

export function paintArea(project: PaintProject) {
  return project.width * project.height * project.surfaces - project.openings;
}
export function packLitres(size: string): number | null {
  // Never guess a bucket's capacity or silently treat kilograms as litres.
  const match = size.trim().match(/^(\d+(?:\.\d+)?)\s*(?:l|ltr|litres?|liters?)$/i);
  if (!match?.[1]) return null;
  const value = Number(match[1]);
  return value > 0 ? value : null;
}
export function catalogEstimates(advice: PaintAdvice, catalog: CatalogPaint[], project: PaintProject) {
  const seen = new Set<string>();
  return advice.products.map((item) => {
    const product = catalog.find((value) => value.id === item.product_id);
    if (!product || seen.has(item.product_id)) throw new Error("The recommendation included an unavailable catalog item. No estimate was saved.");
    seen.add(item.product_id);
    const coats = item.role === "Topcoat" ? project.coats : item.coats;
    // Epsilon keeps binary rounding noise (e.g. 1210.0000000000002) from adding a phantom pack.
    const needed = paintArea(project) * coats * (1 + project.waste / 100) / item.coverage;
    const litres = Math.ceil((needed - 1e-9) * 100) / 100;
    const packSize = packLitres(product.size);
    const packs = packSize === null ? null : Math.ceil(litres / packSize);
    return { ...item, coats, product, litres, packs, estimatedCost: packs === null ? null : packs * Number(product.selling_price) };
  });
}