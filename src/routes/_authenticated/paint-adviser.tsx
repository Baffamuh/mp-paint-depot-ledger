import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PaintBucket, Sparkles, Loader2, AlertTriangle, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, selectCls } from "@/components/app/ui";
import { recommendPaint } from "@/lib/paint-adviser.functions";
import { paintProjectSchema, paintArea, type PaintProject } from "@/lib/paint-estimate";
import { pageHead } from "@/lib/page-head";
import { naira } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/paint-adviser")({
  head: () => pageHead("Paint Adviser — MP Paints Finance Records", "Catalog-based paint recommendations and estimated quantities for customer projects."),
  component: PaintAdviser,
});

function PaintAdviser() {
  const recommend = useServerFn(recommendPaint);
  const [project, setProject] = useState<PaintProject>({ surface: "Plaster / masonry", location: "Interior", finish: "Matt", condition: "New / unpainted", width: 0, height: 0, surfaces: 1, openings: 0, coats: 2, waste: 10, colour: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Extract<Awaited<ReturnType<typeof recommendPaint>>, { ok: true }> | null>(null);
  function change<K extends keyof PaintProject>(key: K, value: PaintProject[K]) {
    setProject((previous) => ({ ...previous, [key]: value }));
    setResult(null); setError("");
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    const parsed = paintProjectSchema.safeParse(project);
    if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Check the measurements."); return; }
    setBusy(true); setError(""); setResult(null);
    try {
      const advice = await recommend({ data: parsed.data });
      if (advice.ok) setResult(advice);
      else setError(advice.error);
    } catch { setError("The adviser could not be reached. Your measurements are unchanged. Check your connection and sign-in."); }
    finally { setBusy(false); }
  }

  return (
    <div className="max-w-6xl">
      <PageHeader title="Paint Adviser" />
      <div className="grid gap-8 xl:grid-cols-[360px_minmax(0,1fr)]">
        <form onSubmit={submit} className="space-y-5 xl:border-r xl:pr-8">
          <fieldset disabled={busy} className="space-y-5">
            <div className="flex items-center gap-2 font-semibold"><PaintBucket className="h-4 w-4 text-primary" /> Customer project</div>
            <Choice id="surface" label="Surface" value={project.surface} options={["Plaster / masonry", "Wood", "Metal", "Concrete floor"]} onChange={(value) => change("surface", value)} />
            <div className="grid grid-cols-2 gap-3">
              <Choice id="location" label="Location" value={project.location} options={["Interior", "Exterior"]} onChange={(value) => change("location", value)} />
              <Choice id="finish" label="Finish" value={project.finish} options={["Matt", "Satin", "Gloss", "No preference"]} onChange={(value) => change("finish", value)} />
            </div>
            <Choice id="condition" label="Condition" value={project.condition} options={["New / unpainted", "Previously painted", "Damp / damaged"]} onChange={(value) => change("condition", value)} />
            <div className="space-y-1"><Label htmlFor="colour">Preferred colour</Label><Input id="colour" maxLength={80} placeholder="Any colour" value={project.colour} onChange={(e) => change("colour", e.target.value)} /></div>
            <div className="border-t pt-4 flex items-center gap-2 font-semibold"><Ruler className="h-4 w-4 text-primary" /> Measurements</div>
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="width" label="Width (m)" value={project.width} min={0.01} max={1000} step={0.01} onChange={(value) => change("width", value)} />
              <NumberField id="height" label="Height / length (m)" value={project.height} min={0.01} max={1000} step={0.01} onChange={(value) => change("height", value)} />
              <NumberField id="surfaces" label="Identical surfaces" value={project.surfaces} min={1} max={100} step={1} onChange={(value) => change("surfaces", value)} />
              <NumberField id="openings" label="Doors / windows (m²)" value={project.openings} min={0} max={100000} step={0.01} onChange={(value) => change("openings", value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <NumberField id="coats" label="Topcoats" value={project.coats} min={1} max={5} step={1} onChange={(value) => change("coats", value)} />
              <NumberField id="waste" label="Extra allowance (%)" value={project.waste} min={0} max={30} step={1} onChange={(value) => change("waste", value)} />
            </div>
            <div className="flex justify-between border-y py-3"><span className="text-sm text-muted-foreground">Net paint area</span><strong className="num">{Math.max(0, paintArea(project)).toFixed(2)} m²</strong></div>
            <Button type="submit" disabled={busy} className="w-full">{busy ? <Loader2 className="animate-spin" /> : <Sparkles />} {busy ? "Preparing estimate…" : "Recommend paint"}</Button>
          </fieldset>
          {error && <div role="alert" className="flex items-start gap-2 text-sm text-destructive"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" /><span>{error}</span></div>}
        </form>
        <section aria-live="polite" aria-busy={busy} className="min-w-0">
          {busy && <div className="flex items-center gap-3 py-16 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Checking suitable catalog paints…</div>}
          {!busy && !result && <div className="border-y py-12 space-y-3"><PaintBucket className="h-10 w-10 text-primary" /><h2 className="font-semibold text-xl">Project estimate</h2><p className="text-sm text-muted-foreground">No estimate yet.</p></div>}
          {result && <div className="space-y-6">
            <div className="border-b pb-4"><div className="text-xs font-semibold uppercase text-success mb-2">Catalog recommendations</div><h2 className="text-xl font-semibold">{result.area.toFixed(2)} m² · {project.finish} · {project.location}</h2><p className="text-sm mt-2 text-muted-foreground">{result.summary}</p></div>
            {!result.products.length && <p className="font-medium">No suitable paint found in the current catalog.</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              {result.products.map((item) => <article key={item.product.id} className="rounded-md border bg-card p-4 min-w-0">
                <div className="flex justify-between gap-2 text-xs mb-3"><span className="text-primary font-semibold">{item.role === "Topcoat" ? "Topcoat option" : "Preparation · primer"}</span><span className={Number(item.product.stock_qty) <= 0 ? "text-destructive" : "text-muted-foreground"}>{Number(item.product.stock_qty)} in stock</span></div>
                <h3 className="font-semibold break-words">{item.product.brand} · {item.product.paint_type}</h3><p className="text-sm text-muted-foreground">{item.product.colour} · {item.product.size}</p>
                <p className="text-sm my-3">{item.reason}</p>
                <div className="border-t pt-3 grid grid-cols-2 gap-3"><div><div className="text-xs text-muted-foreground">Estimated paint</div><div className="text-xl font-bold num">{item.litres} L</div></div><div><div className="text-xs text-muted-foreground">Catalog packs</div><div className="text-xl font-bold num">{item.packs ?? "Unverified"}</div></div></div>
                <p className="text-xs text-muted-foreground mt-3">Approx. {item.coverage} m²/L per coat · {item.coats} coat{item.coats === 1 ? "" : "s"} · {project.waste}% extra</p>
                <div className="mt-3 text-sm"><span className="text-muted-foreground">Price / pack: </span><strong>{naira(item.product.selling_price)}</strong>{item.estimatedCost !== null && <div className="mt-1">Estimated total: <strong>{naira(item.estimatedCost)}</strong></div>}</div>
                {item.packs === null ? <p className="text-sm text-warning mt-3">Verify the pack’s litre capacity before quoting quantities or a total.</p> : item.packs > Number(item.product.stock_qty) && <p className="text-sm text-destructive mt-3">Short by {Math.max(0, item.packs - Number(item.product.stock_qty))} pack(s).</p>}
              </article>)}
            </div>
            <div className="border-t pt-4 text-sm text-muted-foreground space-y-2"><h3 className="font-semibold text-foreground">Before quoting</h3><p>Each topcoat is an alternative, not an additional purchase. Coverage is an AI estimate; confirm manufacturer coverage, finish and pack volume. Surface texture, thinning and colour changes affect consumption.</p>{result.warnings.map((warning, index) => <p key={index} className="flex gap-2"><AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" /><span>{warning}</span></p>)}</div>
          </div>}
        </section>
      </div>
    </div>
  );
}

function Choice<Value extends string>({ id, label, value, options, onChange }: { id: string; label: string; value: Value; options: Value[]; onChange: (value: Value) => void }) {
  return <div className="space-y-1"><Label htmlFor={id}>{label}</Label><select id={id} className={selectCls} value={value} onChange={(e) => { const selected = options.find((option) => option === e.target.value); if (selected) onChange(selected); }}>{options.map((option) => <option key={option}>{option}</option>)}</select></div>;
}
function NumberField({ id, label, value, min, max, step, onChange }: { id: string; label: string; value: number; min: number; max: number; step: number; onChange: (value: number) => void }) {
  return <div className="space-y-1"><Label htmlFor={id}>{label}</Label><Input id={id} type="number" min={min} max={max} step={step} required value={value === 0 && min > 0 ? "" : value} onChange={(e) => onChange(Number(e.target.value))} /></div>;
}