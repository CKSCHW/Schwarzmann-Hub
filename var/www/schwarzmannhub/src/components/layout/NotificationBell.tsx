
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, BellRing, Trash2, CheckCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getNotificationsForUser, markNotificationsAsRead, deleteNotificationForUser } from "@/actions/notificationActions";
import type { NotificationWithStatus } from "@/types";
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = React.useState<NotificationWithStatus[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);

  const unreadCount = React.useMemo(() => notifications.filter(n => !n.isRead).length, [notifications]);
  const hasUnread = unreadCount > 0;

  React.useEffect(() => {
    if (!user?.uid) return;

    const fetchNotifications = async () => {
      const userNotifications = await getNotificationsForUser(user.uid);
      setNotifications(userNotifications);
    };

    fetchNotifications();
    // Fetch notifications every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);
    if (open && hasUnread) {
      const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
      await markNotificationsAsRead(user!.uid, unreadIds);
      // Optimistically update the UI
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Prevent dropdown from closing
    if (!user?.uid) return;
    
    // Optimistically update UI
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    await deleteNotificationForUser(notificationId, user.uid);
  };

  const handleMarkAllRead = async (e: React.MouseEvent) => {
     e.stopPropagation();
     if (!user?.uid || !hasUnread) return;
     const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
     await markNotificationsAsRead(user!.uid, unreadIds);
     setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs font-bold">
              {unreadCount}
            </span>
          )}
          <span className="sr-only">Benachrichtigungen</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 md:w-96">
        <DropdownMenuLabel className="flex justify-between items-center">
            <span>Benachrichtigungen</span>
            {hasUnread && <Button variant="ghost" size="sm" onClick={handleMarkAllRead}><CheckCheck className="mr-2 h-4 w-4"/>Alle als gelesen markieren</Button>}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length > 0 ? (
          <div className="max-h-80 overflow-y-auto flex flex-col gap-1 p-1">
          {notifications.map((notification) => (
            <DropdownMenuItem key={notification.id} asChild className="p-0 h-auto cursor-pointer">
              <Link href={notification.url} className={cn("flex items-start gap-3 p-2 rounded-md transition-colors hover:bg-muted/50 w-full", !notification.isRead && "bg-primary/10")}>
                <div className={cn("mt-1", !notification.isRead ? "text-primary" : "text-muted-foreground")}>
                    <BellRing className="h-4 w-4" />
                </div>
                <div className="flex-1">
                    <p className="font-semibold text-sm leading-tight">{notification.title}</p>
                    <p className="text-xs text-muted-foreground">{notification.body}</p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: de })}
                    </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full self-start" onClick={(e) => handleDelete(e, notification.id)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </Link>
            </DropdownMenuItem>
          ))}
          </div>
        ) : (
          <DropdownMenuItem disabled className="text-center justify-center">Keine Benachrichtigungen</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
