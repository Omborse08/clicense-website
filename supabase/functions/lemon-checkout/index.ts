import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { variantId, userId, userEmail } = await req.json();

    console.log("Creating checkout for variant:", variantId, "user:", userId);

    if (!variantId) {
      throw new Error("Variant ID is required");
    }

    const apiKey = Deno.env.get("LEMONSQUEEZY_API_KEY");
    if (!apiKey) {
      throw new Error("Lemon Squeezy API key not configured");
    }

    // Create checkout session via Lemon Squeezy API
    const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        "Accept": "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: userEmail,
              custom: {
                user_id: userId,
              },
            },
            product_options: {
              redirect_url: `${req.headers.get("origin") || "https://clicense.app"}/pricing?success=true`,
            },
          },
          relationships: {
            store: {
              data: {
                type: "stores",
                id: Deno.env.get("LEMONSQUEEZY_STORE_ID") || "0",
              },
            },
            variant: {
              data: {
                type: "variants",
                id: variantId,
              },
            },
          },
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Lemon Squeezy API error:", errorData);
      throw new Error(`Failed to create checkout: ${response.status}`);
    }

    const data = await response.json();
    const checkoutUrl = data.data.attributes.url;

    console.log("Checkout created successfully:", checkoutUrl);

    return new Response(
      JSON.stringify({ checkoutUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating checkout:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
