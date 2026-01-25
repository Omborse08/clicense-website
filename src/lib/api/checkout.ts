import { supabase } from "@/integrations/supabase/client";

export interface CheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
}

export async function createCheckout(
  variantId: string,
  userId: string,
  userEmail: string
): Promise<CheckoutResult> {
  try {
    const { data, error } = await supabase.functions.invoke("lemon-checkout", {
      body: { variantId, userId, userEmail },
    });

    if (error) {
      console.error("Checkout error:", error);
      return { success: false, error: error.message };
    }

    if (data.error) {
      return { success: false, error: data.error };
    }

    return { success: true, checkoutUrl: data.checkoutUrl };
  } catch (err) {
    console.error("Checkout exception:", err);
    return { success: false, error: "Failed to create checkout session" };
  }
}
