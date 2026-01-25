import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Mail } from "lucide-react";

export default function Auth() {
  const { user, loading, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      return;
    }
    setIsLoading(true);
    await signInWithEmail(email, password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      return;
    }
    if (password !== confirmPassword) {
      return;
    }
    setIsLoading(true);
    await signUpWithEmail(email, password);
    setIsLoading(false);
  };

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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto flex items-center justify-center px-4 pt-32">
        <Card className="w-full max-w-md shadow-soft-lg animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <span className="text-lg font-bold text-primary-foreground">CL</span>
            </div>
            <CardTitle className="text-2xl">Welcome to CLicense</CardTitle>
            <CardDescription>
              {isSignUp ? "Create your account" : "Sign in to unlock unlimited scans and AI chat"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {isSignUp && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isLoading}
              >
                <Mail className="mr-2 h-5 w-5" />
                {isLoading ? "Loading..." : isSignUp ? "Create Account" : "Sign In with Email"}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {isSignUp ? "Already have an account?" : "Don't have an account?"}
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 text-base"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setEmail("");
                setPassword("");
                setConfirmPassword("");
              }}
            >
              {isSignUp ? "Sign In" : "Create New Account"}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
