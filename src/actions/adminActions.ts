'use server';

import { revalidatePath } from 'next/cache';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { NewsArticle, ReadReceipt, ReadReceiptWithUser } from '@/types';

// Action to seed initial data from mockData into Firestore
export async function seedInitialData(articles: NewsArticle[]) {
  const articlesCollection = adminDb.collection('articles');

  const batch = adminDb.batch();
  let count = 0;

  for (const article of articles) {
    // Use a specific ID to avoid duplicates on re-seeding
    const docRef = articlesCollection.doc(`mock-${article.id}`);
    const doc = await docRef.get();
    
    // Only seed if it doesn't already exist
    if (!doc.exists) {
        batch.set(docRef, {
            ...article,
            date: new Date(article.date).toISOString(),
        });
        count++;
    }
  }

  await batch.commit();

  revalidatePath('/');
  revalidatePath('/admin');
  return { count };
}

// Action to create a new article
export async function createArticle(articleData: Omit<NewsArticle, 'id' | 'date'>): Promise<NewsArticle> {
  const articlesCollection = adminDb.collection('articles');
  
  const newArticle = {
      ...articleData,
      date: new Date().toISOString(),
  };

  const docRef = await articlesCollection.add(newArticle);

  revalidatePath('/');
  revalidatePath('/admin');
  
  return {
      ...newArticle,
      id: docRef.id,
  };
}

// Action to get articles with their read counts for the admin dashboard
export async function getNewsArticlesWithReadCounts() {
    const articlesSnapshot = await adminDb.collection('articles').orderBy('date', 'desc').get();
    const articles: NewsArticle[] = articlesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as NewsArticle));

    const receiptsSnapshot = await adminDb.collection('readReceipts').get();
    const receipts: ReadReceipt[] = receiptsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as ReadReceipt));

    const userIds = [...new Set(receipts.map(r => r.userId))];
    const userRecords = userIds.length > 0 ? await adminAuth.getUsers(userIds.map(uid => ({ uid }))) : { users: [] };
    
    const userMap = new Map(userRecords.users.map(u => [u.uid, u]));

    const receiptsWithUsers: ReadReceiptWithUser[] = receipts.map(receipt => ({
        ...receipt,
        user: userMap.get(receipt.userId)
    }));

    return { articles, receipts: receiptsWithUsers };
}
