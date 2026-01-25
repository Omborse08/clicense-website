import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  Copy,
  Share2,
  ExternalLink,
  Lock
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LicenseData } from "@/lib/api/license";
import { generateLicensePDF } from "@/lib/pdfGenerator";

interface LicenseCardProps {
  data: LicenseData;
}

export function LicenseCard({ data }: LicenseCardProps) {
  const { user } = useAuth();
  const { hasPaidPlan } = useSubscription();
  const navigate = useNavigate();

  const handleAction = (action: string, callback: () => void) => {
    if (!user) {
      toast.error(`Sign in to ${action}`);
      navigate("/pricing");
      return;
    }

    if (!hasPaidPlan) {
      toast.error(`Upgrade to Pro to ${action}`);
      navigate("/pricing");
      return;
    }

    callback();
  };

  const handleDownload = () => {
    handleAction("download PDF", () => {
      try {
        generateLicensePDF(data);
        toast.success("Report downloaded successfully");
      } catch (error) {
        console.error("PDF Generation Error:", error);
        toast.error("Failed to generate PDF");
      }
    });
  };

  const copyToClipboardFallback = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;

    // Ensure textarea is not visible
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (successful) {
        toast.success("Report copied to clipboard");
      } else {
        throw new Error("Copy failed");
      }
    } catch (err) {
      console.error("Fallback copy error:", err);
      toast.error("Failed to copy report");
    }

    document.body.removeChild(textArea);
  };

  const handleCopy = () => {
    handleAction("copy report", async () => {
      const content = `License: ${data.licenseName}\nVerdict: ${data.verdict}\nLink: ${data.url}`;

      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(content);
          toast.success("Report copied to clipboard");
        } catch (err) {
          console.warn("Clipboard API failed, using fallback", err);
          copyToClipboardFallback(content);
        }
      } else {
        copyToClipboardFallback(content);
      }
    });
  };

  const handleShare = () => {
    handleAction("share report", async () => {
      const shareData = {
        title: `License Analysis: ${data.licenseName}`,
        text: `Check out this license analysis for ${data.licenseName}. Verdict: ${data.verdict}`,
        url: window.location.href
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.error("Share error:", err);
            toast.error("Failed to share");
          }
        }
      } else {
        // Fallback to copying the link
        if (navigator.clipboard && window.isSecureContext) {
          try {
            await navigator.clipboard.writeText(window.location.href);
            toast.info("Sharing not supported on this device. Link copied to clipboard instead.");
          } catch (err) {
            copyToClipboardFallback(window.location.href);
            toast.info("Link copied to clipboard");
          }
        } else {
          copyToClipboardFallback(window.location.href);
          toast.info("Link copied to clipboard");
        }
      }
    });
  };

  const getStatusIcon = (value: boolean | string) => {
    if (value === true || value === "yes") {
      return <CheckCircle className="h-5 w-5 text-safe" />;
    }
    if (value === false || value === "no") {
      return <XCircle className="h-5 w-5 text-danger" />;
    }
    return <AlertCircle className="h-5 w-5 text-warning" />;
  };

  const getStatusText = (value: boolean | string) => {
    if (value === true || value === "yes") return "Yes";
    if (value === false || value === "no") return "No";
    return "Conditional";
  };

  const getVerdictStyles = () => {
    switch (data.verdictType) {
      case "safe":
        return "bg-safe/10 border-safe/20 text-safe";
      case "warning":
        return "bg-warning/10 border-warning/20 text-warning";
      case "danger":
        return "bg-danger/10 border-danger/20 text-danger";
    }
  };

  const getLicenseTypeBadge = () => {
    switch (data.licenseType) {
      case "Open Source":
        return <Badge className="bg-safe/10 text-safe border-safe/20 hover:bg-safe/20">Open Source</Badge>;
      case "Research Only":
        return <Badge className="bg-warning/10 text-warning border-warning/20 hover:bg-warning/20">Research Only</Badge>;
      case "Restricted":
        return <Badge className="bg-danger/10 text-danger border-danger/20 hover:bg-danger/20">Restricted</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card className="shadow-soft-md">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">License Detected</p>
              <h2 className="text-2xl font-bold">{data.licenseName}</h2>
            </div>
            {getLicenseTypeBadge()}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{data.source}</Badge>
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              View Source <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardHeader>
      </Card>

      {/* Clear Answers */}
      <Card className="shadow-soft-md">
        <CardHeader>
          <h3 className="text-lg font-semibold">Quick Answers</h3>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              {getStatusIcon(data.commercialUse)}
              <div>
                <p className="text-sm text-muted-foreground">Commercial Use</p>
                <p className="font-semibold">{getStatusText(data.commercialUse)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              {getStatusIcon(data.modificationAllowed)}
              <div>
                <p className="text-sm text-muted-foreground">Modification</p>
                <p className="font-semibold">{getStatusText(data.modificationAllowed)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
              {getStatusIcon(data.redistributionAllowed)}
              <div>
                <p className="text-sm text-muted-foreground">Redistribution</p>
                <p className="font-semibold">{getStatusText(data.redistributionAllowed)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risks & Restrictions */}
      <Card className="shadow-soft-md">
        <CardHeader>
          <h3 className="text-lg font-semibold">Key Requirements</h3>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {data.risks.map((risk, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground">{risk}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Verdict */}
      <Card className={`shadow-soft-md border-2 ${getVerdictStyles()}`}>
        <CardContent className="py-6">
          <div className="flex items-center gap-3">
            {data.verdictType === "safe" && <CheckCircle className="h-6 w-6" />}
            {data.verdictType === "warning" && <AlertCircle className="h-6 w-6" />}
            {data.verdictType === "danger" && <XCircle className="h-6 w-6" />}
            <p className="text-lg font-semibold">{data.verdict}</p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          onClick={handleDownload}
          className="shadow-soft-sm"
        >
          {!hasPaidPlan && <Lock className="mr-2 h-4 w-4" />}
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
        <Button
          variant="outline"
          onClick={handleCopy}
          className="shadow-soft-sm"
        >
          {!hasPaidPlan && <Lock className="mr-2 h-4 w-4" />}
          <Copy className="mr-2 h-4 w-4" />
          Copy Report
        </Button>
        <Button
          variant="outline"
          onClick={handleShare}
          className="shadow-soft-sm"
        >
          {!hasPaidPlan && <Lock className="mr-2 h-4 w-4" />}
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </div>
    </div>
  );
}
