
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase-admin';
import AdminDashboardClient from './AdminDashboardClient';
import { getNewsArticlesWithReadCounts, getAppointments } from '@/actions/adminActions';
import AppointmentManager from './AppointmentManager';

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.customClaims?.role !== 'admin') {
    redirect('/');
  }

  const { articles, receipts } = await getNewsArticlesWithReadCounts();
  const appointments = await getAppointments();

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-headline font-semibold mb-2">Admin-Dashboard</h1>
        <p className="text-muted-foreground">
          Hier können Sie News-Artikel verwalten, Lesebestätigungen einsehen und Termine erstellen.
        </p>
      </section>

      <AdminDashboardClient
        initialArticles={articles}
        initialReceipts={receipts}
        adminEmail={user.email!}
      />

      <AppointmentManager initialAppointments={appointments} />
    </div>
  );
}
