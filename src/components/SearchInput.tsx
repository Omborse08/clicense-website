import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

export function SearchInput() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { checkScanLimit, incrementScanCount } = useSubscription();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (!checkScanLimit()) {
      toast.error("Daily scan limit reached.", {
        description: "Upgrade to Pro for unlimited scans.",
        action: {
          label: "Upgrade",
          onClick: () => navigate("/pricing"),
        },
      });
      return;
    }

    setIsLoading(true);
    incrementScanCount();

    // Navigate to result page with URL as query param
    setTimeout(() => {
      navigate(`/result?url=${encodeURIComponent(url.trim())}`);
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="relative flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="url"
            placeholder="Paste Hugging Face / GitHub / Model URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="h-14 pl-12 pr-4 text-base shadow-soft-md border-border bg-card focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={!url.trim() || isLoading}
          className="h-14 px-6 shadow-soft-md"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              Scan License
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Supports Hugging Face, GitHub, and most public AI model repositories
      </p>
    </form>
  );
}
