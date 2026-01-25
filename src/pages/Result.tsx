import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { LicenseCard } from "@/components/LicenseCard";
import { LicenseChat } from "@/components/LicenseChat";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { scanLicense, LicenseData } from "@/lib/api/license";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Result() {
  const { user, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const url = searchParams.get("url") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);

  useEffect(() => {
    if (!url) {
      navigate("/");
      return;
    }

    const analyze = async () => {
      if (authLoading || licenseData || error) return;
      setLoading(true);
      setError(null);

      try {
        const result = await scanLicense(url);

        if (result.success && result.data) {
          setLicenseData(result.data);

          // Save to localStorage for all users
          const scanHistory = JSON.parse(localStorage.getItem("scanHistory") || "[]");
          const newScan = {
            id: Date.now().toString(),
            url: url,
            timestamp: new Date().toISOString(),
            user_id: user?.id || "guest",
            licenses: [{
              name: result.data.licenseName,
              status: result.data.verdictType === "safe" ? "allowed" : result.data.verdictType === "danger" ? "restricted" : "caution",
              description: result.data.verdict
            }],
          };
          scanHistory.unshift(newScan);
          localStorage.setItem("scanHistory", JSON.stringify(scanHistory));
          toast.success("Scan saved to your dashboard!");
        } else {
          setError(result.error || "Failed to analyze license");
          toast.error(result.error || "Failed to analyze license");
        }
      } catch (err) {
        console.error("Failed to analyze license:", err);
        setError("An unexpected error occurred");
        toast.error("Failed to analyze license");
      } finally {
        setLoading(false);
      }
    };

    analyze();
  }, [url, navigate, authLoading, user, licenseData, error]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex flex-col items-center justify-center px-4 pt-32">
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg font-medium">Analyzing license...</p>
            <p className="text-sm text-muted-foreground max-w-md text-center">
              Fetching and analyzing {url.length > 60 ? url.substring(0, 60) + "..." : url}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This may take 10-20 seconds...
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto flex flex-col items-center justify-center px-4 pt-32">
          <div className="flex flex-col items-center gap-4 animate-fade-in text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">Analysis Failed</h2>
            <p className="text-muted-foreground max-w-md">{error}</p>
            <div className="flex gap-3 mt-4">
              <Button variant="outline" onClick={() => navigate("/")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Try Another URL
              </Button>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          New Scan
        </Button>

        <div className="mx-auto max-w-3xl space-y-8 animate-fade-in">
          {licenseData && (
            <>
              <LicenseCard data={licenseData} />
              <LicenseChat licenseData={licenseData} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
