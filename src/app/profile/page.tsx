
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/firebase-admin';
import ProfileClient from './ProfileClient';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
        <section>
            <h1 className="text-3xl font-headline font-semibold mb-2">Dein Profil</h1>
            <p className="text-muted-foreground">
                Verwalte hier deine Kontoinformationen und dein Passwort.
            </p>
        </section>
        <ProfileClient user={user} />
    </div>
  );
}
