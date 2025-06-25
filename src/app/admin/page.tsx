
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase-admin';
import AdminDashboardClient from './AdminDashboardClient';
import { getNewsArticlesWithReadCounts, getAppointments, getUsersWithGroups } from '@/actions/adminActions';
import AppointmentManager from './AppointmentManager';
import UserGroupManager from './UserGroupManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.customClaims?.role !== 'admin') {
    redirect('/');
  }

  // Fetch all data concurrently for better performance
  const [
    { articles, receipts }, 
    appointments,
    usersWithGroups
  ] = await Promise.all([
    getNewsArticlesWithReadCounts(),
    getAppointments(),
    getUsersWithGroups()
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-headline font-semibold mb-2">Admin-Dashboard</h1>
        <p className="text-muted-foreground">
          Hier können Sie News verwalten, Termine erstellen und Benutzergruppen zuweisen.
        </p>
      </section>

      <Tabs defaultValue="news" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="news">News & Statistiken</TabsTrigger>
          <TabsTrigger value="appointments">Termine</TabsTrigger>
          <TabsTrigger value="users">Benutzergruppen</TabsTrigger>
        </TabsList>
        
        <TabsContent value="news" className="mt-6 space-y-6">
           <AdminDashboardClient
            initialArticles={articles}
            initialReceipts={receipts}
            adminEmail={user.email!}
          />
        </TabsContent>
        
        <TabsContent value="appointments" className="mt-6">
          <AppointmentManager initialAppointments={appointments} />
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <UserGroupManager initialUsers={usersWithGroups} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
