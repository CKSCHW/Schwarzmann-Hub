
'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { NewsArticle } from '@/types';

// Action to get articles, sorted by date
export async function getArticles(options?: { limit?: number }): Promise<NewsArticle[]> {
    let query = adminDb.collection('articles').orderBy('date', 'desc');

    if (options?.limit) {
        query = query.limit(options.limit);
    }

    const articlesSnapshot = await query.get();
    const articles = articlesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as NewsArticle));
    return articles;
}

// Action to get a single article by ID
export async function getArticle(id: string): Promise<NewsArticle | null> {
    const doc = await adminDb.collection('articles').doc(id).get();
    if (!doc.exists) {
        return null;
    }
    return { id: doc.id, ...doc.data() } as NewsArticle;
}

// Action to mark an article as read
export async function markAsRead(articleId: string, userId: string): Promise<void> {
  if (!articleId || !userId) {
    console.error('Missing articleId or userId');
    return;
  }

  const receiptsCollection = adminDb.collection('readReceipts');
  
  // Create a unique ID for the receipt to prevent duplicates
  const receiptId = `${userId}_${articleId}`;
  
  const receiptRef = receiptsCollection.doc(receiptId);
  const doc = await receiptRef.get();

  // Only write if it doesn't exist yet
  if (!doc.exists) {
    await receiptRef.set({
      userId,
      articleId,
      readAt: new Date().toISOString(),
    });
  }
}
