import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Radio,
  Calculator,
  Sparkles,
  Layers,
  Target,
  Activity,
  Brain,
  FileText,
  LogOut,
  Zap,
  Compass,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { lock } from "@/lib/access";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/live", label: "Dashboard Live", icon: Radio },
  { to: "/kalkulator", label: "Kalkulator", icon: Calculator },
  { to: "/smart-ai", label: "Smart AI (CERDAS)", icon: Sparkles },
  { to: "/tardal", label: "TARDAL", icon: Layers },
  { to: "/prediksi", label: "Prediksi", icon: Target },
  { to: "/colok-bebas", label: "Colok Bebas", icon: Zap },
  { to: "/shio", label: "Prediksi Shio", icon: Compass },
  { to: "/akurasi", label: "Akurasi Tracker", icon: Activity },
  { to: "/otak-ai", label: "Otak AI", icon: Brain },
  { to: "/laporan", label: "Laporan", icon: FileText },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/30">
            <span className="text-lg font-black text-primary-foreground">4D</span>
            <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar bg-emerald-400" />
          </div>
          <div className="flex flex-col leading-tight group-data-[collapsible=icon]:hidden">
            <span className="text-sm font-black tracking-tight text-sidebar-foreground">4D Macau</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Strategi BESAR</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                      <Link to={item.to as never} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Keluar"
              onClick={() => {
                lock();
                navigate({ to: "/unlock" });
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}