import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Heart, MessageCircleHeart, Camera, Mic, Clock } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* floating hearts */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        {Array.from({ length: 14 }).map((_, i) => (
          <Heart
            key={i}
            className="absolute text-primary/20 animate-float"
            style={{
              left: `${(i * 73) % 100}%`,
              bottom: `-${(i * 17) % 60 + 10}px`,
              width: 14 + (i % 4) * 6,
              height: 14 + (i % 4) * 6,
              animationDelay: `${i * 1.1}s`,
              animationDuration: `${10 + (i % 5) * 3}s`,
            }}
            fill="currentColor"
          />
        ))}
      </div>

      <header className="px-6 py-6 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" fill="currentColor" />
          <span className="font-serif text-xl">Solace</span>
        </div>
        <Link
          to="/auth"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in
        </Link>
      </header>

      <main className="px-6 max-w-3xl mx-auto pt-10 pb-24 text-center">
        <p className="font-script text-2xl text-primary mb-3">just for the two of you</p>
        <h1 className="font-serif text-5xl sm:text-7xl leading-[1.05] text-foreground">
          A quiet, private
          <br />
          <span className="italic">corner of the world.</span>
        </h1>
        <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Solace is a tiny, intimate space made for two — your messages, photos, voice notes
          and memories live here, away from everyone else.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/auth"
            className="px-7 py-3.5 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-soft hover:opacity-90 transition"
          >
            Begin your space
          </Link>
          <Link
            to="/auth"
            className="px-7 py-3.5 rounded-full border border-border bg-card text-sm font-medium hover:bg-muted transition"
          >
            I have an invite
          </Link>
        </div>

        <div className="mt-20 grid sm:grid-cols-2 gap-4 text-left">
          {[
            { i: MessageCircleHeart, t: "Mini messenger", d: "Real-time messages, voice notes, seen receipts." },
            { i: Camera, t: "Shared scrapbook", d: "Photos with captions, albums and a soft timeline." },
            { i: Mic, t: "Audio vault", d: "Save songs and recordings that mean something." },
            { i: Clock, t: "Your timeline", d: "Anniversaries, firsts, and memory flashbacks." },
          ].map(({ i: Icon, t, d }) => (
            <div key={t} className="paper p-5 flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-accent/60 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-serif text-lg">{t}</h3>
                <p className="text-sm text-muted-foreground mt-1">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="text-center text-xs text-muted-foreground pb-8">
        Made for two. Held in confidence.
      </footer>
    </div>
  );
}
