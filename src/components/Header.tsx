import { Link, useNavigate } from "react-router-dom";
import { Moon, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LayoutDashboard, LogOut } from "lucide-react";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { dailyScansUsed, dailyScanLimit, hasPaidPlan } = useSubscription();
  const navigate = useNavigate();

  const getProfileDisplayName = () => {
    const fullName = user?.user_metadata?.full_name || "";
    if (fullName) {
      const trimmed = fullName.trim();
      return trimmed.length <= 3 ? trimmed : trimmed.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const getFullName = () => {
    return user?.user_metadata?.full_name || user?.email || "User";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">CL</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">CLicense</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Pricing
          </Link>
          <a href="#features" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Features
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold uppercase">
                      {getProfileDisplayName()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="end" forceMount>
                <DropdownMenuLabel className="font-normal border-b pb-3 mb-1 mt-1">
                  <div className="flex items-center gap-3 px-1">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold uppercase">
                        {getProfileDisplayName()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-0.5 overflow-hidden">
                      <p className="text-sm font-semibold truncate leading-none">{getFullName()}</p>
                      <p className="text-xs text-muted-foreground truncate leading-none">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate("/dashboard")} className="gap-2 cursor-pointer">
                  <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                  Dashboard
                </DropdownMenuItem>
                <div className="flex items-center justify-between px-2 py-1.5 text-sm">
                  <span className="text-muted-foreground">Available Credits</span>
                  <span className="font-bold text-primary">{user?.user_metadata?.credits ?? 0}</span>
                </div>

                <div className="px-2 py-1.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Daily Scans</span>
                    {hasPaidPlan && <span className="text-primary font-bold">Unlimited</span>}
                  </div>

                  {hasPaidPlan ? (
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden relative">
                      <div className="absolute inset-0 bg-purple-500/20 animate-pulse"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-purple-500 leading-none">∞</span>
                      </div>
                      <div className="h-full bg-purple-500 w-full origin-left" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500 ease-out"
                          style={{ width: `${Math.min((dailyScansUsed / dailyScanLimit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/auth")}
              className="text-sm"
            >
              <User className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
