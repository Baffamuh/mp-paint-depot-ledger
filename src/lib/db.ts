import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Calls a posting function in the database; all money movements go through these.
export async function rpc<T = string>(name: string, args: Record<string, unknown>): Promise<T> {
  const { data, error } = await (supabase.rpc as unknown as (n: string, a: unknown) => Promise<{ data: T; error: { message: string } | null }>)(name, args);
  if (error) throw new Error(error.message);
  return data;
}

export function useProducts(all = false) {
  return useQuery({
    queryKey: ["products", all],
    queryFn: async () => {
      let q = supabase.from("products").select("*").order("brand");
      if (!all) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}
export function useCustomers() {
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}
export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}
export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounts").select("*").eq("active", true).order("created_at");
      if (error) throw error;
      return data;
    },
  });
}
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });
}
export function useTransactions(from?: Date, to?: Date, type?: string) {
  return useQuery({
    queryKey: ["transactions", from?.toISOString(), to?.toISOString(), type],
    queryFn: async () => {
      let q = supabase
        .from("transactions")
        .select("*, customers(name), suppliers(name), accounts!transactions_account_id_fkey(name)")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (from) q = q.gte("created_at", from.toISOString());
      if (to) q = q.lt("created_at", to.toISOString());
      if (type) q = q.eq("tx_type", type);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useRefresh() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries();
}
