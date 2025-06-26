
'use server';

import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { getCurrentUser } from '@/lib/firebase-admin';
import type { Appointment, UserGroup } from '@/types';

export async function getAppointmentsForUser(): Promise<Appointment[]> {
  const sessionUser = await getCurrentUser(); // Get user from session cookie to confirm they are logged in
  if (!sessionUser) {
    return [];
  }

  // To ensure we have the latest group assignments, we fetch the user record directly from Firebase Auth.
  // This avoids issues with stale data in the session cookie after a user's groups are changed by an admin.
  const userRecord = await adminAuth.getUser(sessionUser.uid);
  const claims = userRecord.customClaims || {};
  
  // More robustly check if 'groups' from claims is an array.
  const userGroupsSource = claims.groups;
  const userGroups: UserGroup[] = Array.isArray(userGroupsSource) ? userGroupsSource : [];

  const appointmentsSnapshot = await adminDb.collection('appointments').orderBy('date', 'asc').get();
  
  const allAppointments = appointmentsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Appointment));

  // A user sees an appointment if:
  // 1. The appointment has no groups assigned (it's public for everyone).
  // 2. The user's list of groups has at least one group in common with the appointment's groups.
  const userAppointments = allAppointments.filter(appointment => {
    // Condition 1: Public appointment (visible to everyone). Also ensures appointment.groups is a valid array.
    if (!appointment.groups || !Array.isArray(appointment.groups) || appointment.groups.length === 0) {
      return true;
    }
    // Condition 2: User must have at least one of the required groups.
    // Checks for any intersection between the two arrays.
    return appointment.groups.some(requiredGroup => userGroups.includes(requiredGroup));
  });

  return userAppointments;
}
