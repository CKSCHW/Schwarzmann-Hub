
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase-admin';
import AdminDashboardClient from './AdminDashboardClient';
import * as adminActions from '@/actions/adminActions';
import AppointmentManager from './AppointmentManager';
import UserGroupManager from './UserGroupManager';
import SurveyManager from './SurveyManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getSurveysCreatedBy } from '@/actions/surveyActions';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentUser();

  if (!user || !user.isAdmin) {
    redirect('/');
  }

  const canManageSurveys = user.isAdmin || user.groups?.includes('Projektleiter') || user.groups?.includes('Schulungsleiter');

  // Fetch all data concurrently for better performance
  const [
    { articles, receipts }, 
    appointments,
    usersWithGroups,
    surveys
  ] = await Promise.all([
    adminActions.getNewsArticlesWithReadCounts(),
    adminActions.getAppointments(),
    adminActions.getUsersWithGroups(),
    canManageSurveys ? getSurveysCreatedBy(user.uid) : Promise.resolve([]),
  ]);

  const tabs = [
    { value: "news", label: "News & Statistiken", adminOnly: true },
    { value: "appointments", label: "Termine", adminOnly: true },
    { value: "users", label: "Benutzergruppen", adminOnly: true },
    { value: "surveys", label: "Umfragen", requiresSurveyManager: true },
  ];

  const availableTabs = tabs.filter(tab => {
    if (tab.requiresSurveyManager) return canManageSurveys;
    if (tab.adminOnly) return user.isAdmin;
    return true;
  });

  if (availableTabs.length === 0) {
      redirect('/');
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-headline font-semibold mb-2">Verwaltung</h1>
        <p className="text-muted-foreground">
          Hier können Sie Inhalte der App verwalten.
        </p>
      </section>

      <Tabs defaultValue={availableTabs[0].value} className="w-full">
        <TabsList className={`grid w-full grid-cols-${availableTabs.length}`}>
          {availableTabs.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        
        {user.isAdmin && (
          <TabsContent value="news" className="mt-6 space-y-6">
            <AdminDashboardClient
              initialArticles={articles}
              initialReceipts={receipts}
              adminEmail={user.email!}
            />
          </TabsContent>
        )}
        
        {user.isAdmin && (
          <TabsContent value="appointments" className="mt-6">
            <AppointmentManager initialAppointments={appointments} />
          </TabsContent>
        )}
        
        {user.isAdmin && (
          <TabsContent value="users" className="mt-6">
            <UserGroupManager initialUsers={usersWithGroups} />
          </TabsContent>
        )}

        {canManageSurveys && (
            <TabsContent value="surveys" className="mt-6">
                <SurveyManager 
                    initialSurveys={surveys}
                    allUsers={usersWithGroups}
                    currentUser={user}
                />
            </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
