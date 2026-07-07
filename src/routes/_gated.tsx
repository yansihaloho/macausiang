import { createFileRoute, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { Suspense, useEffect, useState } from "react";
import { Toaster } from "sonner";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { isUnlocked } from "@/lib/access";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_gated")({
  component: GatedLayout,
});

const PAGE_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/live": "Dashboard Live",
  "/kalkulator": "Kalkulator Martingale",
  "/smart-ai": "Smart AI · CERDAS",
  "/tardal": "TARDAL · Per-Position",
  "/prediksi": "Prediksi Slot-Chain",
  "/akurasi": "Akurasi Tracker",
  "/otak-ai": "Otak AI",
  "/laporan": "Laporan Prediksi",
  "/kick": "KickLive",
};

function GatedLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isUnlocked()) {
      navigate({ to: "/unlock", replace: true });
    } else {
      setChecked(true);
    }
  }, [navigate]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Memuat…
      </div>
    );
  }

  const title = PAGE_TITLES[pathname] ?? "4D Macau";

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground">
        <AppSidebar />
        <div className="flex flex-1 flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md">
            <SidebarTrigger />
            <div className="flex flex-col leading-tight">
              <h1 className="text-sm font-black tracking-tight text-foreground">{title}</h1>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                4D Macau · Strategi BESAR
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
              <span className="font-semibold">LIVE · nomorupdate.org</span>
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden p-4 md:p-6">
            <Suspense
              fallback={
                <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menarik data dari nomorupdate.org…
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
      <Toaster position="top-right" theme="dark" richColors />
    </SidebarProvider>
  );
}