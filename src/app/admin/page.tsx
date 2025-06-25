import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase-admin';
import AdminDashboardClient from './AdminDashboardClient';
import { getNewsArticlesWithReadCounts } from '@/actions/adminActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { allNewsArticles as mockArticles } from '@/lib/mockData';

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || user.customClaims?.role !== 'admin') {
    redirect('/');
  }

  const { articles, receipts } = await getNewsArticlesWithReadCounts();
  const allUsers = []; // In a real app, you might fetch all users to show who hasn't read.

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-headline font-semibold mb-2">Admin-Dashboard</h1>
        <p className="text-muted-foreground">
          Hier können Sie News-Artikel verwalten und Lesebestätigungen einsehen.
        </p>
      </section>

      <AdminDashboardClient
        initialArticles={articles}
        initialReceipts={receipts}
        mockArticles={mockArticles}
        adminEmail={user.email!}
      />
    </div>
  );
}
