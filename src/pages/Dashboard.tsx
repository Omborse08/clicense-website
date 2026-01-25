import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, ArrowLeft, History, Search, Sparkles, Trash2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";

interface ScanHistory {
  id: string;
  url: string;
  timestamp: Date;
  licenses: {
    name: string;
    status: "allowed" | "restricted" | "caution";
    description?: string;
  }[];
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { checkScanLimit, incrementScanCount } = useSubscription();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistory[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  const handleScan = (url: string) => {
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

    incrementScanCount();
    navigate(`/result?url=${encodeURIComponent(url)}`);
  };

  useEffect(() => {
    if (!user) return;

    // Load from localStorage and filter by user
    const saved = localStorage.getItem("scanHistory");
    if (saved) {
      const parsed = JSON.parse(saved);
      // Filter scans for current user only
      const userScans = parsed
        .filter((scan: any) => scan.user_id === user.id)
        .map((scan: any) => ({
          ...scan,
          timestamp: new Date(scan.timestamp),
        }));
      setScanHistory(userScans);
    }
    setIsFetching(false);
  }, [user]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    if (!confirm("Are you sure you want to delete this scan?")) return;

    try {
      // Remove from localStorage
      const saved = localStorage.getItem("scanHistory");
      if (saved) {
        const parsed = JSON.parse(saved);
        const updated = parsed.filter((scan: any) => scan.id !== id);
        localStorage.setItem("scanHistory", JSON.stringify(updated));
      }

      setScanHistory((prev) => prev.filter((scan) => scan.id !== id));
      toast.success("Scan deleted successfully");
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error("Failed to delete scan");
    }
  };

  const filteredHistory = useMemo(() => {
    if (!searchQuery.trim()) return scanHistory;
    const query = searchQuery.toLowerCase();
    return scanHistory.filter(scan =>
      scan.url.toLowerCase().includes(query) ||
      scan.licenses.some(l => l.name.toLowerCase().includes(query))
    );
  }, [scanHistory, searchQuery]);

  const recommendedModels = useMemo(() => {
    // Only show recommendations after some usage (e.g., at least 3 scans)
    if (scanHistory.length < 3) return [];

    const usageCount: Record<string, number> = {};
    scanHistory.forEach(scan => {
      // Try to extract a clean name from the URL
      let modelName = scan.url;
      try {
        const urlObj = new URL(scan.url);
        const parts = urlObj.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) {
          modelName = parts.slice(-2).join('/');
        }
      } catch (e) {
        // Fallback to URL if not a valid URL
      }
      usageCount[modelName] = (usageCount[modelName] || 0) + 1;
    });

    return Object.entries(usageCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([name]) => {
        // Find the original URL for this model name
        const originalScan = scanHistory.find(s => s.url.includes(name));
        return { name, url: originalScan?.url || name };
      });
  }, [scanHistory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center pt-32">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "allowed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "restricted":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "caution":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-16">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="mb-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  <h1 className="text-3xl font-bold">Dashboard</h1>
                </div>
                <p className="text-muted-foreground mt-1">
                  Manage your scans and history
                </p>
              </div>
            </div>

            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search history..."
                className="pl-9 h-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Recommendations Section */}
          {recommendedModels.length > 0 && !searchQuery && (
            <div className="mb-8 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Recommended for you
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {recommendedModels.map((model) => (
                  <Button
                    key={model.name}
                    variant="outline"
                    className="h-auto py-3 px-4 flex flex-col items-start gap-1 text-left bg-card/50 hover:bg-card hover:border-primary/50 transition-all border-dashed"
                    onClick={() => handleScan(model.url)}
                  >
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      Frequently scanned
                    </span>
                    <span className="font-medium truncate w-full">{model.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Scan History List */}
          {isFetching ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading your history...</p>
            </div>
          ) : scanHistory.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <p className="text-muted-foreground mb-4">No history available</p>
                <p className="text-sm text-muted-foreground mb-6">Start scanning repositories to build your history</p>
                <Button onClick={() => navigate("/")} variant="outline">
                  Go to Scanner
                </Button>
              </CardContent>
            </Card>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
              <p className="text-muted-foreground">No matches found for "{searchQuery}"</p>
              <Button
                variant="link"
                onClick={() => setSearchQuery("")}
                className="mt-2 text-primary"
              >
                Clear search
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((scan) => (
                <Card key={scan.id} className="overflow-hidden border-border/50 hover:border-border transition-colors">
                  <div
                    onClick={() =>
                      setExpandedId(expandedId === scan.id ? null : scan.id)
                    }
                    className="cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg truncate font-semibold">
                              {scan.url.length > 50
                                ? scan.url.substring(0, 50) + "..."
                                : scan.url}
                            </CardTitle>
                            <Badge variant="outline" className="text-[10px] font-normal">
                              {formatDate(scan.timestamp)}
                            </Badge>
                          </div>
                          <CardDescription className="text-xs">
                            {scan.licenses.length} license{scan.licenses.length !== 1 ? "s" : ""} detected
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(
                            scan.licenses.some(l => l.status === "restricted")
                              ? "restricted"
                              : scan.licenses.some(l => l.status === "caution")
                                ? "caution"
                                : "allowed"
                          )} px-2 py-0 h-6 text-[11px]`}>
                            {scan.licenses.some(l => l.status === "restricted")
                              ? "Restricted"
                              : scan.licenses.some(l => l.status === "caution")
                                ? "Caution"
                                : "Allowed"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive transition-colors"
                            onClick={(e) => handleDelete(e, scan.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          {expandedId === scan.id ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </div>

                  {/* Expanded License Details */}
                  {expandedId === scan.id && (
                    <CardContent className="border-t bg-muted/10 pt-4 space-y-3">
                      {scan.licenses.map((license) => (
                        <div
                          key={license.name}
                          className="p-3 rounded-lg bg-card border border-border/50"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-sm">{license.name}</h4>
                            <Badge
                              className={`text-[10px] ${getStatusColor(license.status)} border-none`}
                              variant="secondary"
                            >
                              {license.status.charAt(0).toUpperCase() +
                                license.status.slice(1)}
                            </Badge>
                          </div>
                          {license.description && (
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {license.description}
                            </p>
                          )}
                        </div>
                      ))}
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full mt-2 h-9 text-xs"
                        onClick={() => handleScan(scan.url)}
                      >
                        View Full Analysis
                      </Button>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

