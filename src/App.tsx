import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SubscriptionProvider } from "@/hooks/useSubscription";
import { AuthProvider } from "@/hooks/useAuth";
import { ProfileModal } from "@/components/ProfileModal";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Result from "./pages/Result";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <SubscriptionProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <ProfileModal />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/result" element={<Result />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </TooltipProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
