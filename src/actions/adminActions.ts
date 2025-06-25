
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { NewsArticle, ReadReceipt, ReadReceiptWithUser } from '@/types';

// Helper function to strip HTML tags
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
}

// Action to import articles from WordPress
export async function importWordPressArticles() {
  const response = await fetch('https://www.elektro-schwarzmann.at/wp-json/wp/v2/posts?_embed=true&per_page=20');
  if (!response.ok) {
    throw new Error('Failed to fetch WordPress articles.');
  }
  const wpArticles = await response.json();

  const articlesCollection = adminDb.collection('articles');
  
  // Get existing WordPress articles from Firestore to prevent duplicates
  const existingWpArticlesSnapshot = await articlesCollection.where('source', '==', 'wordpress').get();
  const existingSourceIds = new Set(existingWpArticlesSnapshot.docs.map(doc => doc.data().sourceId));

  const batch = adminDb.batch();
  let newArticlesCount = 0;

  for (const article of wpArticles) {
    const sourceId = article.id.toString();
    if (!existingSourceIds.has(sourceId)) {
      
      const featuredMedia = article._embedded?.['wp:featuredmedia']?.[0];
      const imageUrl = featuredMedia?.source_url || `https://placehold.co/1200x600.png`;

      const newArticle: Omit<NewsArticle, 'id'> = {
        title: stripHtml(article.title.rendered),
        snippet: stripHtml(article.excerpt.rendered),
        content: article.content.rendered,
        imageUrl: imageUrl,
        date: new Date(article.date).toISOString(),
        author: 'Elektro Schwarzmann',
        category: 'Unternehmens-News',
        source: 'wordpress',
        sourceId: sourceId,
      };

      const docRef = articlesCollection.doc(); // new doc with auto-generated ID
      batch.set(docRef, newArticle);
      newArticlesCount++;
    }
  }

  if (newArticlesCount > 0) {
    await batch.commit();
  }
  
  revalidatePath('/');
  revalidatePath('/admin');
  
  return { count: newArticlesCount };
}

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
            source: 'internal',
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
      source: 'internal',
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
