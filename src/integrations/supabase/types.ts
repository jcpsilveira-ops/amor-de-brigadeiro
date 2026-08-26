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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      bolos: {
        Row: {
          criado_em: string
          id: number
          itens: Json
          nome: string
          preco_venda: number
        }
        Insert: {
          criado_em?: string
          id?: number
          itens?: Json
          nome: string
          preco_venda?: number
        }
        Update: {
          criado_em?: string
          id?: number
          itens?: Json
          nome?: string
          preco_venda?: number
        }
        Relationships: []
      }
      clientes: {
        Row: {
          criado_em: string
          id: number
          nome: string
          whatsapp: string
        }
        Insert: {
          criado_em?: string
          id?: number
          nome: string
          whatsapp: string
        }
        Update: {
          criado_em?: string
          id?: number
          nome?: string
          whatsapp?: string
        }
        Relationships: []
      }
      coberturas: {
        Row: {
          criado_em: string
          id: number
          itens: Json
          nome: string
          preco_venda: number
        }
        Insert: {
          criado_em?: string
          id?: number
          itens?: Json
          nome: string
          preco_venda?: number
        }
        Update: {
          criado_em?: string
          id?: number
          itens?: Json
          nome?: string
          preco_venda?: number
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          atualizado_em: string
          chave: string
          criado_em: string
          valor: string
        }
        Insert: {
          atualizado_em?: string
          chave: string
          criado_em?: string
          valor?: string
        }
        Update: {
          atualizado_em?: string
          chave?: string
          criado_em?: string
          valor?: string
        }
        Relationships: []
      }
      cursos: {
        Row: {
          criado_em: string
          id: number
          itens: Json
          nome: string
          preco_venda: number
        }
        Insert: {
          criado_em?: string
          id?: number
          itens?: Json
          nome: string
          preco_venda?: number
        }
        Update: {
          criado_em?: string
          id?: number
          itens?: Json
          nome?: string
          preco_venda?: number
        }
        Relationships: []
      }
      fatores_conversao: {
        Row: {
          base: string
          criado_em: string
          fator: number
          id: number
          observacao: string | null
          unidade: string
        }
        Insert: {
          base: string
          criado_em?: string
          fator?: number
          id?: never
          observacao?: string | null
          unidade: string
        }
        Update: {
          base?: string
          criado_em?: string
          fator?: number
          id?: never
          observacao?: string | null
          unidade?: string
        }
        Relationships: []
      }
      fatores_conversao_historico: {
        Row: {
          acao: string
          autor: string
          base: string
          criado_em: string
          fator: number
          fator_id: number | null
          id: number
          observacao: string | null
          unidade: string
          versao: number
        }
        Insert: {
          acao?: string
          autor?: string
          base: string
          criado_em?: string
          fator?: number
          fator_id?: number | null
          id?: never
          observacao?: string | null
          unidade: string
          versao?: number
        }
        Update: {
          acao?: string
          autor?: string
          base?: string
          criado_em?: string
          fator?: number
          fator_id?: number | null
          id?: never
          observacao?: string | null
          unidade?: string
          versao?: number
        }
        Relationships: []
      }
      historico_precos: {
        Row: {
          criado_em: string
          fonte: string | null
          id: number
          ingrediente_id: number
          ingrediente_nome: string
          mercado: string
          preco: number
        }
        Insert: {
          criado_em?: string
          fonte?: string | null
          id?: number
          ingrediente_id: number
          ingrediente_nome: string
          mercado: string
          preco?: number
        }
        Update: {
          criado_em?: string
          fonte?: string | null
          id?: number
          ingrediente_id?: number
          ingrediente_nome?: string
          mercado?: string
          preco?: number
        }
        Relationships: [
          {
            foreignKeyName: "historico_precos_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredientes: {
        Row: {
          criado_em: string
          custo_unitario: number
          estoque_quantidade: number
          estoque_unidade: string | null
          id: number
          nome: string
          unidade: string
        }
        Insert: {
          criado_em?: string
          custo_unitario?: number
          estoque_quantidade?: number
          estoque_unidade?: string | null
          id?: number
          nome: string
          unidade: string
        }
        Update: {
          criado_em?: string
          custo_unitario?: number
          estoque_quantidade?: number
          estoque_unidade?: string | null
          id?: number
          nome?: string
          unidade?: string
        }
        Relationships: []
      }
      mercados: {
        Row: {
          criado_em: string
          id: number
          nome: string
          origem: string
          url_busca: string | null
        }
        Insert: {
          criado_em?: string
          id?: never
          nome: string
          origem?: string
          url_busca?: string | null
        }
        Update: {
          criado_em?: string
          id?: never
          nome?: string
          origem?: string
          url_busca?: string | null
        }
        Relationships: []
      }
      movimentacoes_estoque: {
        Row: {
          criado_em: string
          custo_reposicao: number
          custo_unitario: number
          data: string
          id: number
          ingrediente_id: number
          observacao: string | null
          quantidade: number
          quantidade_anterior: number
          quantidade_nova: number
          tipo: string
          unidade: string
          valor: number
        }
        Insert: {
          criado_em?: string
          custo_reposicao?: number
          custo_unitario?: number
          data?: string
          id?: number
          ingrediente_id: number
          observacao?: string | null
          quantidade?: number
          quantidade_anterior?: number
          quantidade_nova?: number
          tipo?: string
          unidade: string
          valor?: number
        }
        Update: {
          criado_em?: string
          custo_reposicao?: number
          custo_unitario?: number
          data?: string
          id?: number
          ingrediente_id?: number
          observacao?: string | null
          quantidade?: number
          quantidade_anterior?: number
          quantidade_nova?: number
          tipo?: string
          unidade?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
        ]
      }
      outras_despesas: {
        Row: {
          criado_em: string
          data: string
          descricao: string
          id: number
          valor: number
        }
        Insert: {
          criado_em?: string
          data?: string
          descricao: string
          id?: number
          valor?: number
        }
        Update: {
          criado_em?: string
          data?: string
          descricao?: string
          id?: number
          valor?: number
        }
        Relationships: []
      }
      outras_receitas: {
        Row: {
          criado_em: string
          data: string
          descricao: string
          id: number
          valor: number
        }
        Insert: {
          criado_em?: string
          data?: string
          descricao: string
          id?: number
          valor?: number
        }
        Update: {
          criado_em?: string
          data?: string
          descricao?: string
          id?: number
          valor?: number
        }
        Relationships: []
      }
      pedidos: {
        Row: {
          bolo_id: number | null
          cliente_id: number
          cobertura_id: number | null
          criado_em: string
          curso_id: number | null
          data: string
          id: number
          outros_itens: Json
          outros_preco: number
        }
        Insert: {
          bolo_id?: number | null
          cliente_id: number
          cobertura_id?: number | null
          criado_em?: string
          curso_id?: number | null
          data?: string
          id?: number
          outros_itens?: Json
          outros_preco?: number
        }
        Update: {
          bolo_id?: number | null
          cliente_id?: number
          cobertura_id?: number | null
          criado_em?: string
          curso_id?: number | null
          data?: string
          id?: number
          outros_itens?: Json
          outros_preco?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_bolo_id_fkey"
            columns: ["bolo_id"]
            isOneToOne: false
            referencedRelation: "bolos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_cobertura_id_fkey"
            columns: ["cobertura_id"]
            isOneToOne: false
            referencedRelation: "coberturas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_curso_id_fkey"
            columns: ["curso_id"]
            isOneToOne: false
            referencedRelation: "cursos"
            referencedColumns: ["id"]
          },
        ]
      }
      precos_mercado: {
        Row: {
          atualizado_em: string
          criado_em: string
          fonte: string | null
          id: number
          ingrediente_id: number
          mercado_id: number
          nome_produto: string | null
          origem: string
          peso: string | null
          preco: number | null
        }
        Insert: {
          atualizado_em?: string
          criado_em?: string
          fonte?: string | null
          id?: never
          ingrediente_id: number
          mercado_id: number
          nome_produto?: string | null
          origem?: string
          peso?: string | null
          preco?: number | null
        }
        Update: {
          atualizado_em?: string
          criado_em?: string
          fonte?: string | null
          id?: never
          ingrediente_id?: number
          mercado_id?: number
          nome_produto?: string | null
          origem?: string
          peso?: string | null
          preco?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "precos_mercado_ingrediente_id_fkey"
            columns: ["ingrediente_id"]
            isOneToOne: false
            referencedRelation: "ingredientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "precos_mercado_mercado_id_fkey"
            columns: ["mercado_id"]
            isOneToOne: false
            referencedRelation: "mercados"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
