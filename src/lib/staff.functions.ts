import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  if (!data) throw new Error("Only the owner/admin can manage staff");
}

export const createStaff = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; password: string; full_name: string; permissions: string[] }) => {
    if (!d.email || !d.password || d.password.length < 8) throw new Error("Email and a password of at least 8 characters are required");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email.trim(),
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error) throw new Error(error.message);
    const id = created.user.id;
    await supabaseAdmin.from("profiles").update({ permissions: data.permissions, full_name: data.full_name }).eq("id", id);
    await supabaseAdmin.from("user_roles").insert({ user_id: id, role: "staff" });
    await supabaseAdmin.from("audit_log").insert({ user_id: context.userId, action: "staff_created", details: data.email });
    return { ok: true };
  });

export const grantStaffRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: data.user_id, role: "staff" }, { onConflict: "user_id,role" });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({ user_id: context.userId, action: "staff_approved", details: data.user_id });
    return { ok: true };
  });

export const resetStaffPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; password: string }) => {
    if (!d.password || d.password.length < 8) throw new Error("Password must be at least 8 characters");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, { password: data.password });
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("audit_log").insert({ user_id: context.userId, action: "staff_password_reset", details: data.user_id });
    return { ok: true };
  });
