import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const [{ data: profile }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", u.user.id),
      ]);
      const isAdmin = !!roles?.some((r) => r.role === "admin");
      const isMember = !!roles?.length && !!profile?.active;
      const can = (perm: string) => isAdmin || (isMember && !!profile?.permissions?.includes(perm));
      return { user: u.user, profile, isAdmin, isMember, can };
    },
    staleTime: 60_000,
  });
}
