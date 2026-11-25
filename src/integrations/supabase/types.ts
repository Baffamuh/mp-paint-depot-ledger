export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          active: boolean
          balance: number
          created_at: string
          id: string
          kind: string
          name: string
        }
        Insert: {
          active?: boolean
          balance?: number
          created_at?: string
          id?: string
          kind?: string
          name: string
        }
        Update: {
          active?: boolean
          balance?: number
          created_at?: string
          id?: string
          kind?: string
          name?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          balance: number
          created_at: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          balance?: number
          created_at?: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          balance?: number
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      daily_closings: {
        Row: {
          account_id: string
          close_date: string
          counted: number
          created_at: string
          difference: number
          expected: number
          id: string
          notes: string | null
          staff_name: string | null
        }
        Insert: {
          account_id: string
          close_date?: string
          counted: number
          created_at?: string
          difference: number
          expected: number
          id?: string
          notes?: string | null
          staff_name?: string | null
        }
        Update: {
          account_id?: string
          close_date?: string
          counted?: number
          created_at?: string
          difference?: number
          expected?: number
          id?: string
          notes?: string | null
          staff_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_closings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          created_at: string
          credit: number
          debit: number
          id: string
          ledger: string
          transaction_id: string
        }
        Insert: {
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          ledger: string
          transaction_id: string
        }
        Update: {
          created_at?: string
          credit?: number
          debit?: number
          id?: string
          ledger?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          brand: string
          colour: string
          cost_price: number
          created_at: string
          id: string
          paint_type: string
          reorder_level: number
          selling_price: number
          size: string
          sku: string | null
          stock_qty: number
        }
        Insert: {
          active?: boolean
          brand: string
          colour?: string
          cost_price?: number
          created_at?: string
          id?: string
          paint_type?: string
          reorder_level?: number
          selling_price?: number
          size?: string
          sku?: string | null
          stock_qty?: number
        }
        Update: {
          active?: boolean
          brand?: string
          colour?: string
          cost_price?: number
          created_at?: string
          id?: string
          paint_type?: string
          reorder_level?: number
          selling_price?: number
          size?: string
          sku?: string | null
          stock_qty?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          full_name: string
          id: string
          permissions: string[]
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          permissions?: string[]
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          permissions?: string[]
        }
        Relationships: []
      }
      settings: {
        Row: {
          address: string
          business_name: string
          id: number
          phone: string
          receipt_footer: string
          updated_at: string
        }
        Insert: {
          address?: string
          business_name?: string
          id?: number
          phone?: string
          receipt_footer?: string
          updated_at?: string
        }
        Update: {
          address?: string
          business_name?: string
          id?: number
          phone?: string
          receipt_footer?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          balance: number
          created_at: string
          id: string
          name: string
          phone: string | null
        }
        Insert: {
          address?: string | null
          balance?: number
          created_at?: string
          id?: string
          name: string
          phone?: string | null
        }
        Update: {
          address?: string | null
          balance?: number
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      transaction_items: {
        Row: {
          description: string
          id: string
          line_total: number
          product_id: string | null
          qty: number
          transaction_id: string
          unit_cost: number
          unit_price: number
        }
        Insert: {
          description: string
          id?: string
          line_total: number
          product_id?: string | null
          qty: number
          transaction_id: string
          unit_cost?: number
          unit_price: number
        }
        Update: {
          description?: string
          id?: string
          line_total?: number
          product_id?: string | null
          qty?: number
          transaction_id?: string
          unit_cost?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "transaction_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string | null
          balance_due: number
          category: string | null
          client_key: string | null
          cost_total: number
          created_at: string
          customer_id: string | null
          description: string | null
          id: string
          paid: number
          payment_method: string | null
          print_count: number
          ref: string
          refunded: boolean
          related_id: string | null
          staff_id: string | null
          staff_name: string | null
          supplier_id: string | null
          to_account_id: string | null
          total: number
          tx_type: string
        }
        Insert: {
          account_id?: string | null
          balance_due?: number
          category?: string | null
          client_key?: string | null
          cost_total?: number
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          paid?: number
          payment_method?: string | null
          print_count?: number
          ref: string
          refunded?: boolean
          related_id?: string | null
          staff_id?: string | null
          staff_name?: string | null
          supplier_id?: string | null
          to_account_id?: string | null
          total?: number
          tx_type: string
        }
        Update: {
          account_id?: string | null
          balance_due?: number
          category?: string | null
          client_key?: string | null
          cost_total?: number
          created_at?: string
          customer_id?: string | null
          description?: string | null
          id?: string
          paid?: number
          payment_method?: string | null
          print_count?: number
          ref?: string
          refunded?: boolean
          related_id?: string | null
          staff_id?: string | null
          staff_name?: string | null
          supplier_id?: string | null
          to_account_id?: string | null
          total?: number
          tx_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_related_id_fkey"
            columns: ["related_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _acct: { Args: { _delta: number; _id: string }; Returns: string }
      _audit: {
        Args: { _action: string; _details: string; _name: string }
        Returns: undefined
      }
      _begin: { Args: { _perm: string }; Returns: string }
      _check_balanced: { Args: { _tx: string }; Returns: undefined }
      _existing: { Args: { _key: string }; Returns: string }
      _jl: {
        Args: { _cr: number; _dr: number; _ledger: string; _tx: string }
        Returns: undefined
      }
      _ref: { Args: { _prefix: string }; Returns: string }
      has_perm: { Args: { _perm: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_member: { Args: { _user_id: string }; Returns: boolean }
      log_action: {
        Args: { _action: string; _details: string }
        Returns: undefined
      }
      mark_printed: { Args: { _tx: string }; Returns: number }
      post_account_movement: {
        Args: {
          _account_id: string
          _amount: number
          _key: string
          _kind: string
          _note: string
        }
        Returns: string
      }
      post_customer_payment: {
        Args: {
          _account_id: string
          _amount: number
          _customer_id: string
          _key: string
          _method: string
          _note: string
        }
        Returns: string
      }
      post_daily_close: {
        Args: { _account_id: string; _counted: number; _notes: string }
        Returns: string
      }
      post_expense: {
        Args: {
          _account_id: string
          _amount: number
          _category: string
          _key: string
          _method: string
          _note: string
        }
        Returns: string
      }
      post_purchase: {
        Args: {
          _account_id: string
          _items: Json
          _key: string
          _method: string
          _note: string
          _paid: number
          _supplier_id: string
        }
        Returns: string
      }
      post_refund: {
        Args: {
          _account_id: string
          _key: string
          _reason: string
          _sale_id: string
        }
        Returns: string
      }
      post_sale: {
        Args: {
          _account_id: string
          _customer_id: string
          _items: Json
          _key: string
          _method: string
          _note: string
          _paid: number
        }
        Returns: string
      }
      post_supplier_payment: {
        Args: {
          _account_id: string
          _amount: number
          _key: string
          _method: string
          _note: string
          _supplier_id: string
        }
        Returns: string
      }
      post_transfer: {
        Args: {
          _amount: number
          _from: string
          _key: string
          _note: string
          _to: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
    },
  },
} as const
