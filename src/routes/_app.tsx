import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useCouple } from "@/lib/couple";
import { Home, MessageCircle, BookHeart, Image as ImageIcon, Mic, Clock, Settings, Gamepad2, Camera } from "lucide-react";
import { BackgroundLayer } from "@/components/BackgroundLayer";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

const tabs = [
  { to: "/dashboard", icon: Home, label: "Home" },
  { to: "/messages", icon: MessageCircle, label: "Chat" },
  { to: "/notes", icon: BookHeart, label: "Notes" },
  { to: "/gallery", icon: ImageIcon, label: "Gallery" },
  { to: "/audio", icon: Mic, label: "Audio" },
  { to: "/games", icon: Gamepad2, label: "Games" },
  { to: "/photobooth", icon: Camera, label: "Booth" },
  { to: "/timeline", icon: Clock, label: "Timeline" },
  { to: "/settings", icon: Settings, label: "Settings" },
] as const;

function AppLayout() {
  const { user, loading } = useAuth();
  const { couple, loading: cLoading } = useCouple();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || cLoading) return;
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    if (!couple && location.pathname !== "/connect") {
      navigate({ to: "/connect" });
    }
  }, [user, loading, couple, cLoading, navigate, location.pathname]);

  return (
    <div className="min-h-screen pb-24">
      <BackgroundLayer />
      <Outlet />
      {couple && (
        <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 max-w-[95vw]">
          <div className="glass rounded-full px-2 py-2 shadow-soft overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1 w-max">
              {tabs.map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-full transition shrink-0 ${
                      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                    aria-label={label}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
