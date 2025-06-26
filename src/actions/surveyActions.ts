
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb, adminAuth, getCurrentUser } from '@/lib/firebase-admin';
import type { Survey, SurveyCompletion, SurveyResponse, SimpleUser, SurveyWithCompletion, SurveyResult } from '@/types';
import { firestore } from 'firebase-admin';

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

    const newSurvey: Omit<Survey, 'id'> = {
        ...surveyData,
        createdBy: user.uid,
        creatorEmail: user.email || 'Unbekannt',
        createdAt: new Date().toISOString(),
        completionCount: 0,
    };

    const docRef = await adminDb.collection('surveys').add(newSurvey);
    revalidatePath('/admin');
    return { ...newSurvey, id: docRef.id };
}

export async function deleteSurvey(surveyId: string): Promise<void> {
    const user = await verifySurveyManager();
    const surveyRef = adminDb.collection('surveys').doc(surveyId);
    const surveyDoc = await surveyRef.get();

    if (!surveyDoc.exists) {
        throw new Error("Umfrage nicht gefunden.");
    }
    if (surveyDoc.data()?.createdBy !== user.uid && !user.isAdmin) {
        throw new Error("Sie können nur Ihre eigenen Umfragen löschen.");
    }

    // In a real app, you might want to delete associated responses and completions too.
    // For now, we just delete the survey itself for simplicity.
    await surveyRef.delete();
    revalidatePath('/admin');
}

export async function getSurveysCreatedBy(userId: string): Promise<Survey[]> {
    const snapshot = await adminDb.collection('surveys').where('createdBy', '==', userId).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Survey));
}

// ---- User-facing actions ----

export async function getSurveysForUser(): Promise<SurveyWithCompletion[]> {
    const user = await getCurrentUser();
    if (!user) return [];

    const surveysSnapshot = await adminDb.collection('surveys')
        .where('assignedUserIds', 'array-contains', user.uid)
        .orderBy('createdAt', 'desc')
        .get();

    const surveys = surveysSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Survey));

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
    if (!survey.assignedUserIds.includes(user.uid)) {
        throw new Error("Sie sind nicht für diese Umfrage berechtigt.");
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
        throw new Error('Sie haben bereits an dieser Umfrage teilgenommen.');
      }
      
      const surveyDoc = await transaction.get(surveyRef);
      if (!surveyDoc.exists) {
          throw new Error('Umfrage nicht gefunden.');
      }
      const surveyData = surveyDoc.data() as Survey;
      if (!surveyData.assignedUserIds.includes(user.uid)) {
          throw new Error('Sie sind nicht für diese Umfrage berechtigt.');
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
    return { success: true, message: 'Ihre Antwort wurde anonym übermittelt. Vielen Dank!' };
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
        throw new Error("Sie können nur Ergebnisse für Ihre eigenen Umfragen einsehen.");
    }
    
    const responsesSnapshot = await adminDb.collection('surveyResponses').where('surveyId', '==', surveyId).get();
    const responses = responsesSnapshot.docs.map(doc => doc.data() as SurveyResponse);
    
    return { survey, responses };
}
