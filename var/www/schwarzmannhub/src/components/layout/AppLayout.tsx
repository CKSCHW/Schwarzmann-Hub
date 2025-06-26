
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Home, CalendarDays, LogOut, ShieldCheck, Newspaper, BellOff, BellRing, User, ClipboardList } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import NotificationBell from "./NotificationBell";
import { usePushManager } from "@/hooks/usePushManager";
import { Suspense } from "react";
import NotificationHandler from "./NotificationHandler";
import type { SimpleUser } from "@/types";

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  match?: (pathname: string) => boolean;
  adminOnly?: boolean;
  requiresAuth?: boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "Startseite", icon: Home, match: (pathname) => pathname === "/" },
  { href: "/news", label: "News", icon: Newspaper, match: (pathname) => pathname.startsWith("/news") },
  { href: "/schedule", label: "Wocheneinteilung", icon: CalendarDays },
  { href: "/surveys", label: "Umfragen", icon: ClipboardList, match: (pathname) => pathname.startsWith("/surveys")},
  { href: "/admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
];

const AppNav = () => {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarMenu>
      {navItems.map((item) => {
        if (item.adminOnly && !isAdmin) {
          return null;
        }
        const isActive = item.match ? item.match(pathname) : pathname.startsWith(item.href);
        return (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              tooltip={{ children: item.label, side: "right", align: "center" }}
              className="justify-start"
              onClick={handleLinkClick}
            >
              <Link href={item.href}>
                <item.icon className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
};

const AppHeader = ({user}: {user: SimpleUser | null}) => {
  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden" />
            <Link href="/" className="flex items-center gap-2 font-semibold">
                <Image src="https://www.elektro-schwarzmann.at/wp-content/uploads/2022/05/Elektro_Schwarzmann_Logo.svg" alt="Elektro Schwarzmann Logo" width={180} height={41} unoptimized />
            </Link>
        </div>
        <div className="flex items-center gap-4">
          <Suspense fallback={<div />}>
            <NotificationBell />
          </Suspense>
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
};

const UserMenu = ({user}: {user: SimpleUser | null}) => {
  const { logout, isAdmin } = useAuth();
  const router = useRouter();
  const { isSubscribed, subscribeToPush, unsubscribeFromPush, permission, loading } = usePushManager();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const handleToggleSubscription = () => {
    if (isSubscribed) {
      unsubscribeFromPush();
    } else {
      subscribeToPush();
    }
  };

  if (!user) return null;

  const initials = (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '') || user.email?.[0].toUpperCase() || 'ES';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'Benutzer-Avatar'} data-ai-hint="user avatar" />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="sr-only">Benutzermenü umschalten</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{user.displayName || user.email}</DropdownMenuLabel>
        {isAdmin && <DropdownMenuLabel className="text-xs font-normal text-accent -mt-2">Administrator</DropdownMenuLabel>}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
            <Link href="/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </Link>
        </DropdownMenuItem>
        
        {permission === 'denied' ? (
          <DropdownMenuItem disabled>
            <BellOff className="mr-2 h-4 w-4" />
            <span>Benachrichtigungen blockiert</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={handleToggleSubscription} disabled={loading}>
            {isSubscribed ? <BellOff className="mr-2 h-4 w-4" /> : <BellRing className="mr-2 h-4 w-4" />}
            <span>{isSubscribed ? 'Benachrichtigungen deaktivieren' : 'Benachrichtigungen aktivieren'}</span>
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Abmelden</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, fullUser } = useAuth();

  // Effect for registering the service worker
  React.useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => console.log('Service Worker registered with scope:', registration.scope))
        .catch(err => console.error('Service worker registration failed:', err));
    }
  }, []);

  React.useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login';

    if (!user && !isAuthPage) {
      router.replace('/login');
    } else if (user && isAuthPage) {
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Image
            src="https://www.elektro-schwarzmann.at/wp-content/uploads/2022/05/Elektro_Schwarzmann_Logo.svg"
            alt="Elektro Schwarzmann Logo"
            width={240}
            height={55}
            unoptimized
            className="animate-pulse"
        />
      </div>
    );
  }

  if (!user && pathname === '/login') {
    return <>{children}</>;
  }


  if (user) {
    return (
      <SidebarProvider defaultOpen={true}>
        <Suspense>
          <NotificationHandler />
        </Suspense>
        <Sidebar side="left" variant="sidebar" collapsible="icon">
          <SidebarHeader className="p-4">
            <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              {/* Full logo, hidden when collapsed */}
              <Image 
                  src="https://www.elektro-schwarzmann.at/wp-content/uploads/2022/05/Elektro_Schwarzmann_Logo.svg" 
                  alt="Elektro Schwarzmann Logo" 
                  width={160}
                  height={36} 
                  unoptimized 
                  className="group-data-[collapsible=icon]:hidden"
              />
              {/* Square icon, only shown when collapsed */}
              <Image 
                  src="https://www.elektro-schwarzmann.at/wp-content/uploads/2022/06/cropped-Favicon_Elektro_Schwarzmann-Wiener-Neustadt-180x180.png" 
                  alt="ES Logo" 
                  width={32}
                  height={32}
                  className="hidden group-data-[collapsible=icon]:block"
              />
            </Link>
          </SidebarHeader>
          <SidebarContent>
            <AppNav />
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
            <p className="text-xs text-sidebar-foreground/70">
              © {new Date().getFullYear()} Elektro Schwarzmann
            </p>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <AppHeader user={fullUser}/>
          <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return null;
}
