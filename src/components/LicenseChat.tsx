import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { chatAboutLicense, LicenseData } from "@/lib/api/license";
import { supabase } from "@/integrations/supabase/client";

interface LicenseChatProps {
  licenseData: LicenseData;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const MAX_FREE_MESSAGES = 2;

export function LicenseChat({ licenseData }: LicenseChatProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messageCount, setMessageCount] = useState(0);

  const credits = user?.user_metadata?.credits ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Check message limit for free users (not logged in)
    if (!user) {
      if (messageCount >= MAX_FREE_MESSAGES) {
        toast.error("Sign in to continue chatting");
        navigate("/auth");
        return;
      }
    } else {
      // Check credits for logged-in users
      if (credits <= 0) {
        toast.error("You have exhausted your free credits. Please get a paid subscription.");
        return;
      }
    }

    const userMessage: Message = { role: "user", content: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await chatAboutLicense(userMessage.content, licenseData);

      if (result.success && result.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: result.response! }]);
        setMessageCount((prev) => prev + 1);

        // Deduct 1 credit for logged-in users
        if (user) {
          const { error } = await supabase.auth.updateUser({
            data: { credits: Math.max(0, credits - 1) }
          });
          if (error) console.error("Failed to decrement credits:", error);
        }
      } else {
        toast.error(result.error || "Failed to get response");
        setMessages((prev) => prev.slice(0, -1));
      }
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to chat about license");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const remainingMessages = Math.max(0, MAX_FREE_MESSAGES - messageCount);

  return (
    <Card className="shadow-soft-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <MessageCircle className="h-5 w-5" />
          Chat with AI about this license
        </CardTitle>
        {user ? (
          <p className="text-sm text-muted-foreground">
            {credits > 0
              ? `${credits} credit${credits !== 1 ? 's' : ''} remaining`
              : "No credits remaining. Upgrade to Pro for unlimited chat."
            }
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {remainingMessages > 0
              ? `${remainingMessages} free message${remainingMessages !== 1 ? 's' : ''} remaining`
              : "Sign in to continue chatting"
            }
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="min-h-[200px] max-h-[400px] overflow-y-auto space-y-4 p-4 bg-secondary/30 rounded-xl">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-sm gap-2">
              <p>Ask a question about this license...</p>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {["Can I use this commercially?", "Do I need attribution?", "Can I modify the code?"].map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      if (!user && messageCount >= MAX_FREE_MESSAGES) {
                        toast.error("Sign in to continue chatting");
                        navigate("/auth");
                        return;
                      }
                      if (user && credits <= 0) {
                        toast.error("You have exhausted your free credits.");
                        return;
                      }
                      setInput(q);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                    }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-card border border-border rounded-2xl px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about commercial use, attribution, etc..."
            disabled={isLoading || (!user && messageCount >= MAX_FREE_MESSAGES) || (user && credits <= 0)}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading || (!user && messageCount >= MAX_FREE_MESSAGES) || (user && credits <= 0)}
          >
            {(!user && messageCount >= MAX_FREE_MESSAGES) || (user && credits <= 0) ? (
              <Lock className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>

        {!user && messageCount >= MAX_FREE_MESSAGES && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/auth")}
          >
            Sign in to continue chatting
          </Button>
        )}

        {user && credits <= 0 && (
          <Button
            variant="default"
            className="w-full bg-primary hover:bg-primary/90"
            onClick={() => navigate("/pricing")}
          >
            Get a paid subscription
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
