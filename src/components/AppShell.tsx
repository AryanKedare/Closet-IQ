import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard, Shirt, Wand2, ShoppingBag, User, Moon, Sun,
  CloudSun, MessageSquare, CalendarDays, Luggage, TrendingUp, MoreHorizontal, X,
} from "lucide-react";
import { Toaster } from "sonner";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useState } from "react";

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean };

const PRIMARY_NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/today", label: "Today", icon: CloudSun },
  { to: "/outfits", label: "Outfits", icon: Wand2 },
  { to: "/chat", label: "Stylist", icon: MessageSquare },
  { to: "/closet", label: "Closet", icon: Shirt },
];

const SECONDARY_NAV: NavItem[] = [
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/pack", label: "Packer", icon: Luggage },
  { to: "/trends", label: "Trends", icon: TrendingUp },
  { to: "/gaps", label: "Gaps", icon: ShoppingBag },
  { to: "/profile", label: "Profile", icon: User },
];

const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const theme = useStore((s) => s.theme);
  const toggleTheme = useStore((s) => s.toggleTheme);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Desktop top bar */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-2 px-4 sm:px-6">
          <Link to="/" className="flex flex-shrink-0 items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-xs font-bold">C</span>
            </div>
            <span className="text-base font-bold tracking-tight">ClosetIQ</span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex overflow-x-auto">
            {ALL_NAV.map((n) => {
              const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to as any}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <n.icon className="h-3.5 w-3.5" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 md:pb-12">{children}</main>

      <Toaster richColors closeButton position="bottom-right" />

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-between px-1 py-1">
          {PRIMARY_NAV.map((n) => {
            const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to as any}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <n.icon className="h-5 w-5" />
                {n.label}
              </Link>
            );
          })}
          {/* More button */}
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 rounded-md px-1 py-1.5 text-[10px] font-medium transition-colors",
              SECONDARY_NAV.some((n) => loc.pathname.startsWith(n.to)) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            More
          </button>
        </div>
      </nav>

      {/* More drawer (mobile) */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMoreOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-border bg-surface p-4 pb-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">More</p>
              <button onClick={() => setMoreOpen(false)} className="text-muted-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {SECONDARY_NAV.map((n) => {
                const active = n.exact ? loc.pathname === n.to : loc.pathname.startsWith(n.to);
                return (
                  <Link
                    key={n.to}
                    to={n.to as any}
                    onClick={() => setMoreOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-colors",
                      active
                        ? "border-primary/40 bg-primary/5 text-primary"
                        : "border-border bg-card text-foreground"
                    )}
                  >
                    <n.icon className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    {n.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
