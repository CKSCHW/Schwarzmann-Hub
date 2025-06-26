
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb, adminAuth, getCurrentUser } from '@/lib/firebase-admin';
import type { Survey, SurveyCompletion, SurveyResponse, SimpleUser, SurveyWithCompletion, SurveyResult } from '@/types';
import { firestore } from 'firebase-admin';
import { sendPushNotificationToUsers } from './notificationActions';
import { randomUUID } from 'crypto';

async function verifySurveyManager() {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Nicht angemeldet.');
    }
    const isManager = user.isAdmin || user.groups?.includes('Projektleiter') || user.groups?.includes('Schulungsleiter');
    if (!isManager) {
        throw new Error('Unzureichende Berechtigungen.');
    }
    return user;
}

export async function createSurvey(surveyData: Omit<Survey, 'id' | 'createdAt' | 'createdBy' | 'creatorEmail' | 'completionCount'>): Promise<Survey> {
    const user = await verifySurveyManager();

    const newSurveyData: Omit<Survey, 'id'> = {
        ...surveyData,
        // Ensure every question has a unique ID
        questions: surveyData.questions.map(q => ({ ...q, id: q.id || randomUUID() })),
        createdBy: user.uid,
        creatorEmail: user.displayName || user.email || 'Unbekannt',
        createdAt: new Date().toISOString(),
        completionCount: 0,
    };

    const docRef = await adminDb.collection('surveys').add(newSurveyData);
    const newSurvey = { ...newSurveyData, id: docRef.id };

    // Send push notification to assigned users
    if (newSurvey.assignedUserIds && newSurvey.assignedUserIds.length > 0) {
        await sendPushNotificationToUsers(
            newSurvey.assignedUserIds,
            {
                title: 'Neue Umfrage für dich',
                body: `Du wurdest zur Umfrage "${newSurvey.title}" eingeladen.`,
                url: `/surveys/${newSurvey.id}`,
            }
        );
    }
    
    revalidatePath('/admin');
    revalidatePath('/surveys');
    return newSurvey;
}

export async function updateSurvey(surveyId: string, surveyData: Omit<Survey, 'id' | 'createdAt' | 'createdBy' | 'creatorEmail' | 'completionCount'>): Promise<Survey> {
    const user = await verifySurveyManager();
    const surveyRef = adminDb.collection('surveys').doc(surveyId);
    const surveyDoc = await surveyRef.get();

    if (!surveyDoc.exists) {
        throw new Error("Umfrage nicht gefunden.");
    }

    const existingSurvey = surveyDoc.data() as Survey;
    if (existingSurvey.createdBy !== user.uid && !user.isAdmin) {
        throw new Error("Du bist nicht berechtigt, diese Umfrage zu bearbeiten.");
    }
    
    // Some fields should not be overwritten by an update
    const dataToUpdate = {
        title: surveyData.title,
        description: surveyData.description,
        questions: surveyData.questions.map(q => ({ ...q, id: q.id || randomUUID() })),
        assignedUserIds: surveyData.assignedUserIds,
    };

    await surveyRef.update(dataToUpdate);

    // --- START of new notification logic ---
    const existingUserIds = new Set(existingSurvey.assignedUserIds || []);
    const newlyAssignedUserIds = surveyData.assignedUserIds.filter(id => !existingUserIds.has(id));

    if (newlyAssignedUserIds.length > 0) {
        await sendPushNotificationToUsers(
            newlyAssignedUserIds,
            {
                title: 'Neue Umfrage für dich',
                body: `Du wurdest zur Umfrage "${surveyData.title}" eingeladen.`,
                url: `/surveys/${surveyId}`,
            }
        );
    }
    // --- END of new notification logic ---

    revalidatePath('/admin');
    revalidatePath(`/admin/surveys/edit/${surveyId}`);
    revalidatePath(`/surveys`);

    return { ...existingSurvey, ...dataToUpdate, id: surveyId };
}


export async function deleteSurvey(surveyId: string): Promise<void> {
    const user = await verifySurveyManager();
    const surveyRef = adminDb.collection('surveys').doc(surveyId);
    const surveyDoc = await surveyRef.get();

    if (!surveyDoc.exists) {
        throw new Error("Umfrage nicht gefunden.");
    }
    if (surveyDoc.data()?.createdBy !== user.uid && !user.isAdmin) {
        throw new Error("Du kannst nur deine eigenen Umfragen löschen.");
    }

    // In a real app, you might want to delete associated responses and completions too.
    // For now, we just delete the survey itself for simplicity.
    await surveyRef.delete();
    revalidatePath('/admin');
}

export async function duplicateSurvey(surveyId: string): Promise<Survey> {
    const user = await verifySurveyManager();
    const originalSurveyRef = adminDb.collection('surveys').doc(surveyId);
    const originalSurveyDoc = await originalSurveyRef.get();

    if (!originalSurveyDoc.exists) {
        throw new Error("Original-Umfrage nicht gefunden.");
    }

    const originalSurveyData = originalSurveyDoc.data() as Survey;

    const newSurveyData: Omit<Survey, 'id'> = {
        ...originalSurveyData,
        title: `${originalSurveyData.title} (Kopie)`,
        assignedUserIds: [], // Reset participants
        completionCount: 0, // Reset completion count
        createdBy: user.uid,
        creatorEmail: user.displayName || user.email || 'Unbekannt',
        createdAt: new Date().toISOString(),
    };

    const docRef = await adminDb.collection('surveys').add(newSurveyData);
    const newSurvey = { ...newSurveyData, id: docRef.id };

    revalidatePath('/admin?tab=surveys');
    
    return newSurvey;
}


export async function getSurveysCreatedBy(userId: string): Promise<Survey[]> {
    const snapshot = await adminDb.collection('surveys').where('createdBy', '==', userId).get();
    const surveys = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Survey));

    // Manually sort by creation date, descending, to avoid needing a composite index.
    surveys.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return surveys;
}

// ---- User-facing actions ----

export async function getSurveysForUser(): Promise<SurveyWithCompletion[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    // The combination of where('...','array-contains',...) and orderBy(...) on a different field
    // requires a composite index in Firestore. To avoid this manual configuration step for the user,
    // we fetch the documents first and then sort them in the application code.
    const surveysSnapshot = await adminDb.collection('surveys')
        .where('assignedUserIds', 'array-contains', user.uid)
        .get();
    
    const surveysData = surveysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Survey));
    
    // Manually sort by creation date, descending.
    const surveys = surveysData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());


    if (surveys.length === 0) return [];

    const surveyIds = surveys.map(s => s.id);
    const completionsSnapshot = await adminDb.collection('surveyCompletions')
        .where('userId', '==', user.uid)
        .where('surveyId', 'in', surveyIds)
        .get();
        
    const completedSurveyIds = new Set(completionsSnapshot.docs.map(doc => doc.data().surveyId));

    return surveys.map(survey => ({
        ...survey,
        completed: completedSurveyIds.has(survey.id),
    }));
}

export async function getSurveyById(surveyId: string): Promise<Survey | null> {
    const user = await getCurrentUser();
    if (!user) throw new Error("Nicht angemeldet.");

    const surveyDoc = await adminDb.collection('surveys').doc(surveyId).get();
    if (!surveyDoc.exists) return null;

    const survey = { id: surveyDoc.id, ...surveyDoc.data() } as Survey;
    if (!survey.assignedUserIds.includes(user.uid) && !user.isAdmin) {
        throw new Error("Du bist nicht für diese Umfrage berechtigt.");
    }

    return survey;
}

export async function getSurveyForEditing(surveyId: string): Promise<Survey | null> {
    const user = await verifySurveyManager();
    const surveyDoc = await adminDb.collection('surveys').doc(surveyId).get();

    if (!surveyDoc.exists) {
        return null;
    }
    
    const survey = { id: surveyDoc.id, ...surveyDoc.data() } as Survey;
    // Security check: only creator or admin can edit
    if (survey.createdBy !== user.uid && !user.isAdmin) {
        throw new Error("Du bist nicht berechtigt, diese Umfrage zu bearbeiten.");
    }
    
    return survey;
}


export async function submitSurveyResponse(
  surveyId: string,
  answers: { questionId: string; value: string | number }[]
): Promise<{ success: boolean, message: string }> {
  const user = await getCurrentUser();
  if (!user) {
    return { success: false, message: 'Nicht angemeldet.' };
  }

  const completionRef = adminDb.collection('surveyCompletions').doc(`${user.uid}_${surveyId}`);
  const surveyRef = adminDb.collection('surveys').doc(surveyId);

  try {
    await adminDb.runTransaction(async (transaction) => {
      const completionDoc = await transaction.get(completionRef);
      if (completionDoc.exists) {
        throw new Error('Du hast bereits an dieser Umfrage teilgenommen.');
      }
      
      const surveyDoc = await transaction.get(surveyRef);
      if (!surveyDoc.exists) {
          throw new Error('Umfrage nicht gefunden.');
      }
      const surveyData = surveyDoc.data() as Survey;
      if (!surveyData.assignedUserIds.includes(user.uid) && !user.isAdmin) {
          throw new Error('Du bist für diese Umfrage nicht berechtigt.');
      }

      // 1. Save the anonymous response
      const responseRef = adminDb.collection('surveyResponses').doc();
      const newResponse: SurveyResponse = {
        id: responseRef.id,
        surveyId,
        answers,
        submittedAt: new Date().toISOString(),
      };
      transaction.set(responseRef, newResponse);

      // 2. Save the completion record to prevent re-submission
      const newCompletion: SurveyCompletion = {
        id: completionRef.id,
        userId: user.uid,
        surveyId,
        completedAt: new Date().toISOString(),
      };
      transaction.set(completionRef, newCompletion);

      // 3. Increment completion count on the survey
      transaction.update(surveyRef, { completionCount: firestore.FieldValue.increment(1) });
    });

    revalidatePath('/surveys');
    return { success: true, message: 'Deine Antwort wurde anonym übermittelt. Vielen Dank!' };
  } catch (error: any) {
    console.error("Survey submission error:", error);
    return { success: false, message: error.message || 'Ein Fehler ist aufgetreten.' };
  }
}

export async function getSurveyResults(surveyId: string): Promise<SurveyResult | null> {
    const user = await verifySurveyManager();
    const surveyDoc = await adminDb.collection('surveys').doc(surveyId).get();

    if (!surveyDoc.exists) return null;
    
    const survey = { id: surveyDoc.id, ...surveyDoc.data() } as Survey;
    if (survey.createdBy !== user.uid && !user.isAdmin) {
        throw new Error("Du kannst nur Ergebnisse für deine eigenen Umfragen einsehen.");
    }
    
    const responsesSnapshot = await adminDb.collection('surveyResponses').where('surveyId', '==', surveyId).get();
    const responses = responsesSnapshot.docs.map(doc => doc.data() as SurveyResponse);
    
    return { survey, responses };
}
