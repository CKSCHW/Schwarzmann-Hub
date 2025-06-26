
import { NextResponse, type NextRequest } from 'next/server';
import { getCurrentUser, adminDb } from '@/lib/firebase-admin';
import type { ScheduleFile } from '@/types';
import fs from 'fs/promises';
import path from 'path';

export async function GET(request: NextRequest, { params }: { params: { scheduleId: string } }) {
  const { scheduleId } = params;

  // 1. Authenticate user
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Get schedule metadata from Firestore
  const scheduleDocRef = adminDb.collection('schedules').doc(scheduleId);
  const scheduleDoc = await scheduleDocRef.get();

  if (!scheduleDoc.exists) {
    return new NextResponse('Schedule not found', { status: 404 });
  }
  const scheduleData = scheduleDoc.data() as ScheduleFile;

  // 3. Log the download action
  try {
    const receiptRef = adminDb.collection('scheduleDownloads').doc(); // Auto-generate ID for each download event
    await receiptRef.set({
      id: receiptRef.id,
      userId: user.uid,
      scheduleId: scheduleId,
      scheduleName: scheduleData.name,
      downloadedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log schedule download:", error);
    // We can decide if we still want to serve the file even if logging fails.
    // For now, we'll continue and serve the file.
  }

  // 4. Read the file from the local filesystem and serve it
  try {
    const fileBuffer = await fs.readFile(scheduleData.filePath);
    
    // Set headers to trigger a download in the browser
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="${scheduleData.name}"`);

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error) {
    console.error(`Failed to read file for schedule ${scheduleId}:`, error);
    return new NextResponse('File not found on server', { status: 404 });
  }
}
