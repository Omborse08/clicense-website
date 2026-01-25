import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function verifySignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signedData = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expectedSignature = Array.from(new Uint8Array(signedData))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  return signature === expectedSignature;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("X-Signature") || "";
    const webhookSecret = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");

    if (!webhookSecret) {
      console.error("Webhook secret not configured");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    // Verify webhook signature
    const isValid = await verifySignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data || {};
    const subscriptionData = payload.data.attributes;

    console.log("Received webhook event:", eventName);
    console.log("Custom data:", customData);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userId = customData.user_id;
    if (!userId) {
      console.error("No user_id in custom data");
      return new Response("No user_id provided", { status: 400 });
    }

    // Map variant to plan name
    const variantId = String(subscriptionData.variant_id);
    const planName = variantId === Deno.env.get("LEMONSQUEEZY_PRO_VARIANT_ID") ? "Pro" : "Team";

    const subscriptionRecord = {
      user_id: userId,
      lemon_squeezy_id: String(payload.data.id),
      order_id: String(subscriptionData.order_id),
      product_id: String(subscriptionData.product_id),
      variant_id: variantId,
      plan_name: planName,
      status: subscriptionData.status,
      renews_at: subscriptionData.renews_at,
      ends_at: subscriptionData.ends_at,
      trial_ends_at: subscriptionData.trial_ends_at,
    };

    switch (eventName) {
      case "subscription_created":
        console.log("Creating subscription:", subscriptionRecord);
        const { error: createError } = await supabase
          .from("subscriptions")
          .insert(subscriptionRecord);
        
        if (createError) {
          console.error("Error creating subscription:", createError);
          throw createError;
        }
        break;

      case "subscription_updated":
      case "subscription_resumed":
        console.log("Updating subscription:", subscriptionRecord);
        const { error: updateError } = await supabase
          .from("subscriptions")
          .upsert(subscriptionRecord, { onConflict: "lemon_squeezy_id" });
        
        if (updateError) {
          console.error("Error updating subscription:", updateError);
          throw updateError;
        }
        break;

      case "subscription_cancelled":
      case "subscription_expired":
        console.log("Cancelling subscription:", payload.data.id);
        const { error: cancelError } = await supabase
          .from("subscriptions")
          .update({ 
            status: subscriptionData.status,
            ends_at: subscriptionData.ends_at 
          })
          .eq("lemon_squeezy_id", String(payload.data.id));
        
        if (cancelError) {
          console.error("Error cancelling subscription:", cancelError);
          throw cancelError;
        }
        break;

      default:
        console.log("Unhandled event:", eventName);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
