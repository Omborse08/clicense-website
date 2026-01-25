import { useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, ArrowLeft, Star } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { createCheckout } from "@/lib/api/checkout";
import { useState } from "react";

// Replace these with your actual Lemon Squeezy variant IDs
const VARIANT_IDS = {
  Pro: "1246978",
  Team: "",
};

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For trying out CLicense",
    features: [
      "20 credits",
      "Limited daily scans",
      "Basic license detection",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Pro",
    price: "$4.99",
    period: "/ month",
    description: "For individual developers",
    features: [
      "500 credits / month",
      "Unlimited scans",
      "Private GitHub repos",
      "PDF export",
      "Full scan history",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    popular: true,
  },
  {
    name: "Team",
    price: "$25",
    period: "/ month",
    description: "For teams and organizations",
    features: [
      "2000 credits / month",
      "Unlimited scans",
      "Shared team credits",
      "API access",
      "CI/CD integration",
      "SSO authentication",
      "Dedicated support",
    ],
    cta: "Coming Soon",
    popular: false,
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const { subscription, loading: subLoading, isPro, isTeam, hasPaidPlan, upgradeUserPlan } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    const handleSuccess = async () => {
      if (searchParams.get("success") !== "true") return;

      const plan = sessionStorage.getItem("intendedPlan") || "Pro";
      toast.loading("Activating your subscription...");

      const upgraded = await upgradeUserPlan(plan);

      if (upgraded) {
        toast.dismiss();
        toast.success(`Welcome to ${plan}! Your credits have been added.`);
        sessionStorage.removeItem("intendedPlan");
        navigate("/pricing", { replace: true });
      } else {
        toast.dismiss();
        toast.error("Activation failed. Please contact support.");
      }
    };

    handleSuccess();
  }, [searchParams, upgradeUserPlan, navigate]);

  const handlePlanClick = async (planName: string) => {
    if (planName === "Free") {
      if (!user) {
        navigate("/auth");
      } else {
        toast.success("You're already on the Free plan!");
      }
      return;
    }

    if (!user) {
      toast.error("Please sign in to upgrade");
      navigate("/auth");
      return;
    }

    // Check if user already has this plan
    if ((planName === "Pro" && isPro) || (planName === "Team" && isTeam)) {
      toast.info(`You're already on the ${planName} plan!`);
      return;
    }

    const variantId = VARIANT_IDS[planName as keyof typeof VARIANT_IDS];
    if (!variantId || variantId.startsWith("YOUR_")) {
      toast.error("Payment integration not fully configured. Please contact support.");
      return;
    }

    setLoadingPlan(planName);
    sessionStorage.setItem("intendedPlan", planName);

    try {
      const result = await createCheckout(variantId, user.id, user.email || "");

      if (result.success && result.checkoutUrl) {
        // Open Lemon Squeezy checkout
        window.location.href = result.checkoutUrl;
      } else {
        toast.error(result.error || "Failed to create checkout");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const getButtonText = (plan: typeof plans[0]) => {
    if (loadingPlan === plan.name) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }

    if (plan.name === "Pro" && isPro) return "Current Plan";
    if (plan.name === "Team" && isTeam) return "Current Plan";
    if (plan.name === "Free" && user && !hasPaidPlan) return "Current Plan";

    return plan.cta;
  };

  const isCurrentPlan = (planName: string) => {
    if (planName === "Pro" && isPro) return true;
    if (planName === "Team" && isTeam) return true;
    if (planName === "Free" && user && !hasPaidPlan) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-20">
        <div className="mx-auto max-w-5xl">
          {/* Back Button and Title */}
          <div className="mb-12 flex flex-col items-center text-center">
            <div className="w-full flex justify-start mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="hover:bg-accent group"
              >
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Scanner
              </Button>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-4 animate-fade-in">
              <Star className="h-3 w-3 fill-current" />
              <span>Choose your journey</span>
            </div>

            <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl animate-fade-in">
              Simple, transparent pricing
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground md:text-xl animate-fade-in [animation-delay:200ms]">
              Choose the plan that fits your needs. Upgrade or downgrade anytime.
            </p>
          </div>

          {hasPaidPlan && (
            <div className="mb-8 p-4 rounded-xl bg-primary/10 border border-primary/20 animate-fade-in [animation-delay:300ms]">
              <p className="text-sm font-medium text-center">
                You're on the <span className="text-primary font-bold">{subscription?.plan_name}</span> plan
                {subscription?.renews_at && (
                  <span className="text-muted-foreground">
                    {" "}· Renews on {new Date(subscription.renews_at).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="grid gap-8 md:grid-cols-3 animate-fade-in [animation-delay:400ms]">
            {plans.map((plan, index) => (
              <Card
                key={plan.name}
                className={`flex flex-col relative shadow-soft-md transition-all duration-300 hover:shadow-soft-xl hover:-translate-y-1 ${plan.popular ? "border-2 border-primary scale-105 z-10 md:scale-110" : "border-border/50"
                  } ${isCurrentPlan(plan.name) ? "ring-2 ring-primary/30" : ""}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 shadow-md">
                    Most Popular
                  </Badge>
                )}
                {isCurrentPlan(plan.name) && (
                  <Badge className="absolute -top-3 right-4 bg-safe text-safe-foreground shadow-sm">
                    Current
                  </Badge>
                )}
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="min-h-[40px]">{plan.description}</CardDescription>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold tracking-tight">{plan.price}</span>
                    <span className="text-muted-foreground text-lg">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-between space-y-8">
                  <ul className="space-y-4 text-left">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 group">
                        <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-safe/10 text-safe transition-colors group-hover:bg-safe group-hover:text-white">
                          <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm group-hover:text-foreground transition-colors">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={`w-full h-12 text-base font-semibold transition-all duration-300 ${plan.popular ? "shadow-primary/25 shadow-lg" : ""
                      }`}
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handlePlanClick(plan.name)}
                    disabled={loadingPlan !== null || isCurrentPlan(plan.name) || plan.name === "Team"}
                  >
                    {getButtonText(plan)}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-24 text-center animate-fade-in [animation-delay:600ms]">
            <h2 className="mb-10 text-3xl font-bold">
              Frequently Asked Questions
            </h2>
            <div className="mx-auto max-w-3xl grid gap-8 md:grid-cols-2 text-left">
              <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all hover:shadow-soft-md">
                <h3 className="font-bold text-lg mb-2">How do credits work?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Credits are used for AI chat interactions. Each message to the AI assistant costs 1 credit. Scans are unlimited.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all hover:shadow-soft-md">
                <h3 className="font-bold text-lg mb-2">Can I cancel anytime?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all hover:shadow-soft-md md:col-span-2">
                <h3 className="font-bold text-lg mb-2">What happens when I run out of credits?</h3>
                <p className="text-muted-foreground leading-relaxed">
                  On the Free plan, you'll need to upgrade to Pro to continue chatting. Pro users receive monthly credits and can purchase add-ons if needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

