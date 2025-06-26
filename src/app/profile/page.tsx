import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase-admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const userEmail = user.email;
  if (!userEmail) {
      return (
          <div className="space-y-6 max-w-2xl mx-auto">
              <h1 className="text-3xl font-headline font-semibold">Profil</h1>
              <Card>
                  <CardHeader>
                      <CardTitle>Fehler</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <p>Ihre E-Mail-Adresse konnte nicht gefunden werden. Passwortänderung ist nicht möglich.</p>
                  </CardContent>
              </Card>
          </div>
      )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
        <section>
            <h1 className="text-3xl font-headline font-semibold mb-2">Profil</h1>
            <p className="text-muted-foreground">
                Verwalten Sie hier Ihre Kontoeinstellungen.
            </p>
        </section>
        <ProfileClient userEmail={userEmail} />
    </div>
  );
}
