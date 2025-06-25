
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb, adminStorage, getCurrentUser } from '@/lib/firebase-admin';
import type { ScheduleFile } from '@/types';

async function verifyAdmin() {
    const user = await getCurrentUser();
    if (!user || user.isAdmin !== true) {
        throw new Error('Unauthorized');
    }
    return user;
}

export async function getSchedules(): Promise<ScheduleFile[]> {
    const snapshot = await adminDb.collection('schedules').orderBy('dateAdded', 'desc').get();
    return snapshot.docs.map(doc => doc.data() as ScheduleFile);
}

export async function uploadSchedule(formData: FormData): Promise<{ success: boolean, message: string }> {
    try {
        await verifyAdmin();
        const file = formData.get('file') as File;

        if (!file || file.size === 0) {
            return { success: false, message: 'Bitte wählen Sie eine Datei aus.' };
        }

        if (file.type !== 'application/pdf') {
            return { success: false, message: 'Es sind nur PDF-Dateien erlaubt.' };
        }
        
        const bucket = adminStorage.bucket();
        const filePath = `schedules/${Date.now()}-${file.name}`;
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        const fileUpload = bucket.file(filePath);
        await fileUpload.save(fileBuffer, {
            metadata: {
                contentType: file.type,
            },
        });
        
        // Make the file public to get a download URL
        await fileUpload.makePublic();

        const newSchedule: Omit<ScheduleFile, 'id'> = {
            name: file.name,
            filePath: filePath,
            url: fileUpload.publicUrl(),
            size: file.size,
            dateAdded: new Date().toISOString(),
        };

        const docRef = adminDb.collection('schedules').doc();
        await docRef.set({
            ...newSchedule,
            id: docRef.id,
        });

        revalidatePath('/schedule');
        revalidatePath('/api/schedules');
        return { success: true, message: 'Plan erfolgreich hochgeladen.' };

    } catch (error: any) {
        console.error("Upload error:", error);
        return { success: false, message: error.message || 'Ein Fehler ist aufgetreten.' };
    }
}

export async function deleteSchedule(scheduleId: string, filePath: string): Promise<{ success: boolean, message: string }> {
     try {
        await verifyAdmin();

        const bucket = adminStorage.bucket();
        
        // Find the document to delete to get the filePath
        const scheduleDoc = await adminDb.collection('schedules').where('id', '==', scheduleId).limit(1).get();
        if (scheduleDoc.empty) {
            return { success: false, message: 'Dokument nicht gefunden.'};
        }
        const docToDelete = scheduleDoc.docs[0];
        const docData = docToDelete.data() as ScheduleFile;
        
        // Delete from Firestore
        await docToDelete.ref.delete();
        
        // Delete from Storage
        await bucket.file(docData.filePath).delete();
        
        revalidatePath('/schedule');
        revalidatePath('/api/schedules');
        return { success: true, message: 'Plan erfolgreich gelöscht.' };

    } catch (error: any) {
        console.error("Delete error:", error);
        return { success: false, message: error.message || 'Ein Fehler ist aufgetreten.' };
    }
}
