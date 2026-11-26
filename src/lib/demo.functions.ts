import { createServerFn } from "@tanstack/react-start";
import { DEMO_EMAIL, DEMO_PASSWORD } from "@/lib/brand";

// One-time setup of the shared demo account + sample products. Only touches the fixed demo user.
export const ensureDemo = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: list } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  let user = list?.users.find((u) => u.email === DEMO_EMAIL);
  if (!user) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: DEMO_EMAIL, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { full_name: "Demo User" },
    });
    if (error) throw new Error(error.message);
    user = data.user;
  }
  const perms = ["pos", "purchases", "customers", "payments", "expenses", "accounts", "history", "reports", "closing"];
  await supabaseAdmin.from("profiles").update({ permissions: perms, full_name: "Demo User", active: true }).eq("id", user.id);
  await supabaseAdmin.from("user_roles").upsert({ user_id: user.id, role: "staff" }, { onConflict: "user_id,role" });
  const { count } = await supabaseAdmin.from("products").select("id", { count: "exact", head: true });
  if (!count) {
    await supabaseAdmin.from("products").insert([
      { brand: "Dulux", paint_type: "Emulsion", size: "20 Litres", colour: "Brilliant White", cost_price: 38000, selling_price: 45000, stock_qty: 25, reorder_level: 5 },
      { brand: "Dulux", paint_type: "Gloss", size: "4 Litres", colour: "Black", cost_price: 14000, selling_price: 17500, stock_qty: 18, reorder_level: 4 },
      { brand: "Meyer", paint_type: "Texcoat", size: "20 Litres", colour: "Off-White", cost_price: 30000, selling_price: 36000, stock_qty: 12, reorder_level: 3 },
      { brand: "Berger", paint_type: "Satin", size: "4 Litres", colour: "Magnolia", cost_price: 11000, selling_price: 13500, stock_qty: 3, reorder_level: 5 },
      { brand: "Local", paint_type: "Screeding putty", size: "Bag", colour: "White", cost_price: 6000, selling_price: 8000, stock_qty: 40, reorder_level: 10 },
    ]);
  }
  return { ok: true };
});
