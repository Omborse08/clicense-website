import { Header } from "@/components/Header";
import { SearchInput } from "@/components/SearchInput";
import { Shield, Zap, FileText, GitBranch } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Commercial Use Check",
    description: "Instantly know if a model can be used in commercial products.",
  },
  {
    icon: Zap,
    title: "Instant Analysis",
    description: "Get results in seconds, not hours of legal research.",
  },
  {
    icon: FileText,
    title: "Plain English",
    description: "No legal jargon. Clear, actionable answers.",
  },
  {
    icon: GitBranch,
    title: "Multi-Source",
    description: "Supports Hugging Face, GitHub, and more.",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <main className="container mx-auto px-4 pt-32 pb-20">
        <div className="mx-auto max-w-4xl text-center animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>License compliance made simple</span>
          </div>
          
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Check AI & Open-Source
            <br />
            <span className="text-muted-foreground">Licenses Instantly</span>
          </h1>
          
          <p className="mb-12 text-lg text-muted-foreground md:text-xl">
            Know if you can use a model commercially in seconds.
          </p>

          <SearchInput />
        </div>

        {/* Features Grid */}
        <section id="features" className="mt-32">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-2xl font-semibold">
              Why use CLicense?
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-soft-sm transition-all hover:shadow-soft-md"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                    <feature.icon className="h-6 w-6 text-foreground" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="mt-32 text-center">
          <p className="text-sm text-muted-foreground">
            Trusted by developers and companies worldwide
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 opacity-50">
            <div className="text-2xl font-bold tracking-tight">Acme Inc</div>
            <div className="text-2xl font-bold tracking-tight">TechCorp</div>
            <div className="text-2xl font-bold tracking-tight">StartupAI</div>
            <div className="text-2xl font-bold tracking-tight">DevTools</div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <span className="text-xs font-bold text-primary-foreground">CL</span>
              </div>
              <span className="font-semibold">CLicense</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 CLicense. Not legal advice.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
