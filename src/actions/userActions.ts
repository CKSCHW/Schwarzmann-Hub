
'use server';

import { revalidatePath } from 'next/cache';
import { adminAuth, adminDb, getCurrentUser } from '@/lib/firebase-admin';

export async function updateUserProfile(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Nicht angemeldet.');
  }

  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const title = formData.get('title') as string;

  if (!firstName || !lastName) {
    return { success: false, message: 'Vor- und Nachname sind erforderlich.' };
  }

  const newDisplayName = `${firstName} ${lastName}`;
  const profileData = {
    firstName,
    lastName,
    title,
    email: user.email, // Keep email in profile for easy access
  };

  try {
    // Update Firestore document
    const userRef = adminDb.collection('users').doc(user.uid);
    await userRef.set(profileData, { merge: true });

    // Update Firebase Auth display name
    await adminAuth.updateUser(user.uid, {
      displayName: newDisplayName,
    });

    // Revalidate paths to reflect changes across the app
    revalidatePath('/profile');
    revalidatePath('/admin', 'layout'); // Revalidate the whole admin section and its layout

    return { success: true, message: 'Dein Profil wurde erfolgreich aktualisiert.' };
  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return { success: false, message: 'Dein Profil konnte nicht aktualisiert werden.' };
  }
}
