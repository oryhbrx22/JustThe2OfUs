import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Heart } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { user, loading, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading || !user) return;
    let pending: string | null = null;
    try { pending = localStorage.getItem("solace.pendingInviteCode"); } catch {}
    if (pending) {
      navigate({ to: "/join/$code", params: { code: pending } });
    } else {
      navigate({ to: "/dashboard" });
    }
  }, [user, loading, navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = mode === "signin" ? await signIn(email, password) : await signUp(email, password, name || email.split("@")[0]);
    setBusy(false);
    if (res.error) toast.error(res.error);
    else toast.success(mode === "signin" ? "Welcome back" : "Welcome — your space awaits");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <Link to="/" className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground">
        <Heart className="w-4 h-4" fill="currentColor" />
        <span className="font-serif text-lg">Solace</span>
      </Link>
      <div className="paper p-8 w-full max-w-sm">
        <h1 className="font-serif text-3xl text-center">
          {mode === "signin" ? "Welcome back" : "Create your space"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-2">
          {mode === "signin" ? "Step back into your shared corner." : "It begins with you. You'll invite your person next."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          {mode === "signup" && (
            <input
              className="w-full px-4 py-3 rounded-2xl bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          )}
          <input
            type="email"
            required
            className="w-full px-4 py-3 rounded-2xl bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-2xl bg-input border border-border focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-medium shadow-soft hover:opacity-90 transition disabled:opacity-60"
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
