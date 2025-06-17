
"use client";

import *
as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Home, CalendarDays, LayoutDashboard, Briefcase, UserCircle, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Sheet is used internally by Sidebar for mobile

type NavItem = {
  href: string;
  label: string;
  icon: React.ElementType;
  match?: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home, match: (pathname) => pathname === "/" },
  { href: "/schedule", label: "Schedule", icon: CalendarDays },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

const AppHeader = () => {
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      {isMobile && (
        <Button
          variant="outline"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <Briefcase className="h-5 w-5" />
        </Button>
      )}
      <div className="flex w-full items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl font-semibold">Work News Hub</span>
        </Link>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

const NotificationBell = () => {
  // In a real app, this would fetch and display notifications
  const [notifications, setNotifications] = React.useState([
    { id: 1, message: "New schedule posted for next week." },
    { id: 2, message: "Maintenance alert: System downtime on Sunday." },
  ]);
  const [hasUnread, setHasUnread] = React.useState(true);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute right-0 top-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} className="text-sm">
              {notification.message}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No new notifications</DropdownMenuItem>
        )}
         <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => { setNotifications([]); setHasUnread(false); }} className="text-center text-primary">
            Clear all
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const UserMenu = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://placehold.co/40x40.png" alt="User avatar" data-ai-hint="user avatar" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Logout</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider defaultOpen={true}>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <Briefcase className="h-7 w-7 text-primary transition-all group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" />
            <span className="font-headline text-2xl font-semibold group-data-[collapsible=icon]:hidden">WorkHub</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => {
              const isActive = item.match ? item.match(pathname) : pathname.startsWith(item.href);
              return (
                <SidebarMenuItem key={item.href}>
                  <Link href={item.href} legacyBehavior passHref>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={{ children: item.label, side: "right", align: "center" }}
                      className="justify-start"
                    >
                      <item.icon className="h-5 w-5" />
                      <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                    </SidebarMenuButton>
                  </Link>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 border-t border-sidebar-border group-data-[collapsible=icon]:hidden">
          <p className="text-xs text-sidebar-foreground/70">
            © {new Date().getFullYear()} Work News Hub
          </p>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="flex flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
