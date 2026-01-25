export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "12"
    }
    public: {
        Tables: {
            subscriptions: {
                Row: {
                    created_at: string
                    ends_at: string | null
                    id: string
                    lemon_squeezy_id: string
                    order_id: string
                    plan_name: string
                    product_id: string
                    renews_at: string | null
                    status: string
                    trial_ends_at: string | null
                    updated_at: string
                    user_id: string
                    variant_id: string
                }
                Insert: {
                    created_at?: string
                    ends_at?: string | null
                    id?: string
                    lemon_squeezy_id: string
                    order_id: string
                    plan_name: string
                    product_id: string
                    renews_at?: string | null
                    status?: string
                    trial_ends_at?: string | null
                    updated_at?: string
                    user_id: string
                    variant_id: string
                }
                Update: {
                    created_at?: string
                    ends_at?: string | null
                    id?: string
                    lemon_squeezy_id?: string
                    order_id?: string
                    plan_name?: string
                    product_id?: string
                    renews_at?: string | null
                    status?: string
                    trial_ends_at?: string | null
                    updated_at?: string
                    user_id?: string
                    variant_id?: string
                }
                Relationships: []
            }
            scans: {
                Row: {
                    id: string
                    user_id: string
                    url: string
                    license_name: string
                    license_type: string
                    verdict: string
                    verdict_type: string
                    full_data: Json
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    url: string
                    license_name: string
                    license_type: string
                    verdict: string
                    verdict_type: string
                    full_data: Json
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    url?: string
                    license_name?: string
                    license_type?: string
                    verdict?: string
                    verdict_type?: string
                    full_data?: Json
                    created_at?: string
                }
                Relationships: []
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
