
'use server';

import { adminDb } from '@/lib/firebase-admin';
import type { NewsArticle, Comment, SimpleUser } from '@/types';
import { revalidatePath } from 'next/cache';
import { firestore } from 'firebase-admin';

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

// Action for a user to like or unlike an article
export async function toggleLikeArticle(articleId: string, userId: string): Promise<void> {
  const articleRef = adminDb.collection('articles').doc(articleId);

  await adminDb.runTransaction(async (transaction) => {
    const articleDoc = await transaction.get(articleRef);
    if (!articleDoc.exists) {
      throw new Error("Artikel nicht gefunden.");
    }
    const data = articleDoc.data() as NewsArticle;
    const likes = data.likes || [];
    
    if (likes.includes(userId)) {
      // Unlike: Remove user's ID from the 'likes' array
      transaction.update(articleRef, {
        likes: firestore.FieldValue.arrayRemove(userId)
      });
    } else {
      // Like: Add user's ID to the 'likes' array
      transaction.update(articleRef, {
        likes: firestore.FieldValue.arrayUnion(userId)
      });
    }
  });

  revalidatePath(`/news/${articleId}`);
}

// Action to get all comments for a specific article
export async function getComments(articleId: string): Promise<Comment[]> {
  const commentsSnapshot = await adminDb.collection('comments')
    .where('articleId', '==', articleId)
    .get();
  
  const comments = commentsSnapshot.docs.map(doc => doc.data() as Comment);
  
  // Sort in-memory to avoid needing a composite index in Firestore.
  comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return comments;
}

// Action to add a new comment to an article
export async function addComment(articleId: string, text: string, user: SimpleUser): Promise<Comment> {
  if (!text.trim()) {
    throw new Error("Der Kommentar darf nicht leer sein.");
  }

  const articleRef = adminDb.collection('articles').doc(articleId);
  const commentRef = adminDb.collection('comments').doc();

  const newComment: Comment = {
    id: commentRef.id,
    articleId,
    userId: user.uid,
    user: {
      displayName: user.displayName || user.email!,
      photoURL: user.photoURL,
    },
    text: text.trim(),
    createdAt: new Date().toISOString(),
  };

  await adminDb.runTransaction(async (transaction) => {
    const articleDoc = await transaction.get(articleRef);
    if (!articleDoc.exists || !articleDoc.data()?.commentsEnabled) {
      throw new Error("Kommentare für diesen Artikel sind nicht aktiviert.");
    }
    
    transaction.set(commentRef, newComment);
    transaction.update(articleRef, {
      commentCount: firestore.FieldValue.increment(1)
    });
  });

  revalidatePath(`/news/${articleId}`);
  return newComment;
}
