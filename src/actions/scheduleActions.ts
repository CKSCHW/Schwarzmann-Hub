
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb, adminAuth, getCurrentUser } from '@/lib/firebase-admin';
import type { ScheduleFile, ScheduleDownloadReceiptWithUser, SimpleUser } from '@/types';
import { sendAndSavePushNotification } from './notificationActions';
import fs from 'fs/promises';
import path from 'path';

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

        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const uploadDir = path.join(process.cwd(), 'public', 'schedules');
        
        // Ensure the upload directory exists
        await fs.mkdir(uploadDir, { recursive: true });

        // Create a unique filename
        const uniqueFilename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const localFilePath = path.join(uploadDir, uniqueFilename);
        const publicUrl = `/schedules/${uniqueFilename}`;

        // Write the file to the local filesystem
        await fs.writeFile(localFilePath, fileBuffer);

        const newSchedule: Omit<ScheduleFile, 'id'> = {
            name: file.name,
            filePath: localFilePath, // Store absolute path for server-side operations
            url: publicUrl, // Store public URL for client-side access
            size: file.size,
            dateAdded: new Date().toISOString(),
        };

        const docRef = adminDb.collection('schedules').doc();
        await docRef.set({
            ...newSchedule,
            id: docRef.id,
        });

        // Send push notification
        await sendAndSavePushNotification({
            title: "Neuer Wochenplan",
            body: `Der Plan "${file.name}" wurde hochgeladen.`,
            url: "/schedule",
        });

        revalidatePath('/schedule');
        return { success: true, message: 'Plan erfolgreich hochgeladen.' };

    } catch (error: any) {
        console.error("Upload error:", error);
        return { success: false, message: error.message || 'Ein Fehler ist aufgetreten.' };
    }
}

export async function deleteSchedule(scheduleId: string): Promise<{ success: boolean, message: string }> {
     try {
        await verifyAdmin();

        const scheduleDocRef = adminDb.collection('schedules').doc(scheduleId);
        const scheduleDoc = await scheduleDocRef.get();
        
        if (!scheduleDoc.exists) {
            return { success: false, message: 'Dokument nicht gefunden.'};
        }
        
        const docData = scheduleDoc.data() as ScheduleFile;
        
        // Delete from local filesystem
        try {
            if (docData.filePath) {
                await fs.unlink(docData.filePath);
            }
        } catch (fsError: any) {
            // Log if file doesn't exist, but don't block deletion from DB
            console.warn(`Could not delete file from filesystem: ${docData.filePath}. Error: ${fsError.message}`);
        }

        // Delete from Firestore
        await scheduleDocRef.delete();
        
        revalidatePath('/schedule');
        return { success: true, message: 'Plan erfolgreich gelöscht.' };

    } catch (error: any) {
        console.error("Delete error:", error);
        return { success: false, message: error.message || 'Ein Fehler ist aufgetreten.' };
    }
}

// Action to get schedule download receipts with user information
export async function getScheduleDownloadReceipts(): Promise<ScheduleDownloadReceiptWithUser[]> {
    const receiptsSnapshot = await adminDb.collection('scheduleDownloads').orderBy('downloadedAt', 'desc').get();
    
    const receiptsData = receiptsSnapshot.docs.map(doc => doc.data() as ScheduleDownloadReceiptWithUser);
    
    const userIds = [...new Set(receiptsData.map(r => r.userId))];
    
    if (userIds.length === 0) {
        return [];
    }

    const userRecords = await adminAuth.getUsers(userIds.map(uid => ({ uid })));
    
    const userMap = new Map(userRecords.users.map(u => {
        const simpleUser: SimpleUser = {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
        };
        return [u.uid, simpleUser];
    }));

    const receiptsWithUsers: ScheduleDownloadReceiptWithUser[] = receiptsData.map(receipt => ({
        ...receipt,
        user: userMap.get(receipt.userId),
    }));

    return receiptsWithUsers;
}
