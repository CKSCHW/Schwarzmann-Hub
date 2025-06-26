
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

  if (!user) {
    redirect('/login');
  }

  const isSurveyManager = user.isAdmin || user.groups?.includes('Projektleiter') || user.groups?.includes('Schulungsleiter');

  // If user is neither admin nor survey manager, they have no business here.
  if (!user.isAdmin && !isSurveyManager) {
    redirect('/');
  }

  // Fetch all data concurrently, but only if the user has the permission for it.
  const [
    articlesData,
    appointments,
    usersWithGroups,
    surveys
  ] = await Promise.all([
    user.isAdmin ? adminActions.getNewsArticlesWithReadCounts() : Promise.resolve({ articles: [], receipts: [] }),
    user.isAdmin ? adminActions.getAppointments() : Promise.resolve([]),
    // Users are needed for surveys, so fetch if admin or survey manager
    (user.isAdmin || isSurveyManager) ? adminActions.getUsersWithGroups() : Promise.resolve([]),
    isSurveyManager ? getSurveysCreatedBy(user.uid) : Promise.resolve([]),
  ]);
  
  const { articles, receipts } = articlesData;

  const tabs = [
    { value: "news", label: "News & Statistiken", condition: user.isAdmin },
    { value: "appointments", label: "Termine", condition: user.isAdmin },
    { value: "users", label: "Benutzergruppen", condition: user.isAdmin },
    { value: "surveys", label: "Umfragen", condition: isSurveyManager },
  ];

  const availableTabs = tabs.filter(tab => tab.condition);
  
  // If after filtering, no tabs are available (should not happen due to initial redirect), go home.
  if (availableTabs.length === 0) {
      redirect('/');
  }
  
  const gridColsClassMap: { [key: number]: string } = {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
  };
  const gridColsClass = gridColsClassMap[availableTabs.length] || 'grid-cols-1';

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-headline font-semibold mb-2">Verwaltung</h1>
        <p className="text-muted-foreground">
          Hier können Sie Inhalte der App verwalten.
        </p>
      </section>

      <Tabs defaultValue={availableTabs[0].value} className="w-full">
        <TabsList className={`grid w-full ${gridColsClass}`}>
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

        {isSurveyManager && (
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
