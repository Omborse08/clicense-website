import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Subscription {
  id: string;
  plan_name: string;
  status: string;
  renews_at: string | null;
  ends_at: string | null;
}

interface SubscriptionContextType {
  subscription: Subscription | null;
  loading: boolean;
  isPro: boolean;
  isTeam: boolean;
  hasPaidPlan: boolean;
  upgradeUserPlan: (planName: string) => Promise<boolean>;
  dailyScansUsed: number;
  dailyScanLimit: number;
  checkScanLimit: () => boolean;
  incrementScanCount: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  // Scan limit state
  const [dailyScansUsed, setDailyScansUsed] = useState<number>(0);
  const [dailyScanLimit, setDailyScanLimit] = useState<number>(10);

  // Initialize and check reset logic
  useEffect(() => {
    if (!user) return;

    const initializeScanLimits = () => {
      const storageKeyLimit = `dailyScanLimit_${user.id}`;
      const storageKeyUsed = `dailyScansUsed_${user.id}`;
      const storageKeyReset = `nextResetTime_${user.id}`;

      const storedLimit = localStorage.getItem(storageKeyLimit);
      const storedUsed = localStorage.getItem(storageKeyUsed);
      const nextResetTimeStr = localStorage.getItem(storageKeyReset);

      const now = new Date();
      let shouldReset = false;

      if (!nextResetTimeStr) {
        shouldReset = true;
      } else {
        const nextReset = new Date(nextResetTimeStr);
        if (now > nextReset) {
          shouldReset = true;
        }
      }

      if (shouldReset) {
        // Generate random limit between 10 and 15
        const newLimit = Math.floor(Math.random() * (15 - 10 + 1)) + 10;

        // Calculate next 11 PM reset time
        const newNextReset = new Date();
        newNextReset.setHours(23, 0, 0, 0); // 11 PM today

        // If it's already past 11 PM, next reset is tomorrow 11 PM
        if (now >= newNextReset) {
          newNextReset.setDate(newNextReset.getDate() + 1);
        }

        setDailyScanLimit(newLimit);
        setDailyScansUsed(0);

        localStorage.setItem(storageKeyLimit, newLimit.toString());
        localStorage.setItem(storageKeyUsed, '0');
        localStorage.setItem(storageKeyReset, newNextReset.toISOString());
      } else {
        // Restore from storage
        setDailyScanLimit(storedLimit ? parseInt(storedLimit) : 10);
        setDailyScansUsed(storedUsed ? parseInt(storedUsed) : 0);
      }
    };

    initializeScanLimits();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    async function fetchSubscription() {
      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", user!.id)
          .in("status", ["active", "on_trial", "paused"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Error fetching subscription:", error);
        } else {
          setSubscription(data);
        }
      } catch (err) {
        console.error("Subscription fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchSubscription();
  }, [user]);

  const upgradeUserPlan = async (planName: string) => {
    if (!user) return false;

    try {
      // 1. Assign credits based on plan
      let credits = 20;
      if (planName === "Pro") credits = 500;
      if (planName === "Team") credits = 2000;

      // 2. Update user metadata
      const { error: userError } = await supabase.auth.updateUser({
        data: {
          credits: credits,
          plan: planName.toLowerCase(),
        },
      });

      if (userError) throw userError;

      const newSubscription: Subscription = {
        id: "temp_id_" + Date.now(), // Temporary ID until refetch
        plan_name: planName,
        status: "active",
        renews_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        ends_at: null
      };

      // 3. Create/Update subscription record (Simulated logic for now)
      const { error: subError } = await supabase
        .from("subscriptions")
        .upsert({
          user_id: user.id,
          plan_name: planName,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Mock data for LEMON SQUEEZY fields
          lemon_squeezy_id: "mock_ls_id_" + Date.now(),
          order_id: "mock_order_" + Date.now(),
          product_id: "mock_prod_id",
          variant_id: "mock_var_id",
          renews_at: newSubscription.renews_at,
        });

      if (subError) throw subError;

      // Update local state immediately
      setSubscription(newSubscription);

      return true;
    } catch (error) {
      console.error("Upgrade error:", error);
      return false;
    }
  };

  // Fallback to user metadata if no subscription record found
  const planFromMetadata = user?.user_metadata?.plan;

  // Calculate status based on EITHER subscription table OR user metadata (case-insensitive)
  const isPro =
    (subscription?.plan_name === "Pro" && subscription?.status === "active") ||
    planFromMetadata?.toLowerCase() === "pro";

  const isTeam =
    (subscription?.plan_name === "Team" && subscription?.status === "active") ||
    planFromMetadata?.toLowerCase() === "team";

  const hasPaidPlan = isPro || isTeam;

  // Scan Logic Functions
  const checkScanLimit = () => {
    if (hasPaidPlan) return true;
    return dailyScansUsed < dailyScanLimit;
  };

  const incrementScanCount = () => {
    if (hasPaidPlan || !user) return;
    const newCount = dailyScansUsed + 1;
    setDailyScansUsed(newCount);
    localStorage.setItem(`dailyScansUsed_${user.id}`, newCount.toString());
  };

  // If we have a paid plan from metadata but no subscription object, create a synthetic one for the UI
  const effectiveSubscription = subscription || (hasPaidPlan ? {
    id: "legacy",
    plan_name: isPro ? "Pro" : "Team",
    status: "active",
    renews_at: null,
    ends_at: null
  } : null);

  return (
    <SubscriptionContext.Provider value={{
      subscription: effectiveSubscription,
      loading,
      isPro,
      isTeam,
      hasPaidPlan,
      upgradeUserPlan,
      dailyScansUsed,
      dailyScanLimit,
      checkScanLimit,
      incrementScanCount,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error("useSubscription must be used within a SubscriptionProvider");
  }
  return context;
}
