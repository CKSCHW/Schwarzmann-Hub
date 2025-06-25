
'use server';

import { adminDb } from '@/lib/firebase-admin';
import { getCurrentUser } from '@/lib/firebase-admin';
import type { Appointment, UserGroup } from '@/types';

export async function getAppointmentsForUser(): Promise<Appointment[]> {
  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  // Ensure claims and groups are correctly typed
  const claims = user.customClaims || {};
  const userGroups = (claims.groups as UserGroup[] | undefined) || [];
  
  // If user has no groups, they should not see any group-restricted appointments.
  // We can add logic for public appointments (e.g., where groups array is empty) if needed later.
  if (userGroups.length === 0) {
    return [];
  }

  // Firestore doesn't support 'array-contains-any-of-these-values' directly in a single query.
  // The most scalable way for many appointments would be to query for each group, but for a moderate amount,
  // fetching all and filtering in memory is simpler and often sufficient.
  // For this app, let's assume the number of appointments is manageable.
  const appointmentsSnapshot = await adminDb.collection('appointments').orderBy('date', 'asc').get();
  
  const allAppointments = appointmentsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  } as Appointment));

  // Filter appointments where there's an intersection between appointment.groups and user.groups
  const userAppointments = allAppointments.filter(appointment => 
    appointment.groups.some(group => userGroups.includes(group))
  );

  return userAppointments;
}
