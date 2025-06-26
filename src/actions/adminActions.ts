
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb, adminAuth, getCurrentUser } from '@/lib/firebase-admin';
import type { NewsArticle, ReadReceipt, ReadReceiptWithUser, Appointment, SimpleUser, UserGroup } from '@/types';
import https from 'https';
import axios from 'axios';
import { sendAndSavePushNotification } from './notificationActions';

// WARNING: This is a workaround for local development environments with SSL certificate issues.
// Do NOT use this in a production environment as it bypasses SSL certificate validation,
// which is a security risk.
const insecureAgent = new https.Agent({
  rejectUnauthorized: false,
});


// Helper function to strip HTML tags
function stripHtml(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
}

// Helper to extract the first image ID from vc_single_image shortcode
function extractFirstVcImageId(content: string): string | null {
    if (!content) return null;
    // Normalize various quote types to standard double quotes
    const normalized = content
        .replace(/“|”|„|″/g, '"') // Smart quotes to double
        .replace(/‘|’/g, "'");    // Smart single quotes to single

    // Regex to find image="123" in a vc_single_image shortcode. Handles optional single or double quotes.
    const regex = /vc_single_image[^\]]+?image\s*=\s*["']?(\d+)["']?/;
    const match = normalized.match(regex);
    return match ? match[1] : null;
}

// Helper to fetch an image URL by its media ID from WordPress APIs
async function fetchWpImageUrlById(id: string): Promise<string | null> {
    const urls = [
        `https://www.elektro-schwarzmann.at/wp-json/wp/v2/media/${id}`,
        `https://news.elektro-schwarzmann.at/wp-json/wp/v2/media/${id}`
    ];

    for (const url of urls) {
        try {
            const response = await axios.get(url, { httpsAgent: insecureAgent, timeout: 5000 });
            if (response.data && response.data.source_url) {
                return response.data.source_url;
            }
        } catch (error) {
            console.warn(`Failed to fetch media from ${url}, trying next fallback.`);
        }
    }
    return null;
}

// Helper to replace [vc_single_image] shortcodes with <img> tags and remove other vc_ shortcodes
async function processShortcodes(content: string): Promise<string> {
    if (!content) return '';

    const normalized = content
        .replace(/“|”|„|″/g, '"')
        .replace(/‘|’/g, "'");

    const imageShortcodeRegex = /\[vc_single_image[^\]]+?image\s*=\s*["']?(\d+)["']?[^\]]*\]/g;
    
    let processedContent = normalized;
    const matches = Array.from(normalized.matchAll(imageShortcodeRegex));

    for (const match of matches) {
        const shortcode = match[0];
        const imageId = match[1];
        if (imageId) {
            const imageUrl = await fetchWpImageUrlById(imageId);
            if (imageUrl) {
                // Replace the shortcode with a standard HTML <img> tag.
                // The 'prose' Tailwind classes will style this automatically.
                const imgTag = `<img src="${imageUrl}" alt="Bild aus Artikel" class="mx-auto my-4 rounded-lg shadow-md w-full h-auto" />`;
                processedContent = processedContent.replace(shortcode, imgTag);
            } else {
                 // If the image URL couldn't be fetched, remove the shortcode to avoid displaying it as text.
                 processedContent = processedContent.replace(shortcode, '');
            }
        }
    }
    
    // Remove all other Visual Composer shortcodes (like [vc_row], [/vc_column], etc.)
    const remainingShortcodesRegex = /\[\/?vc_[^\]]*\]/g;
    processedContent = processedContent.replace(remainingShortcodesRegex, '');

    return processedContent;
}


// Action to import articles from WordPress
export async function importWordPressArticles() {
  const wpSources = [
      { name: 'Elektro Schwarzmann', url: 'https://www.elektro-schwarzmann.at/wp-json/wp/v2/posts?_embed=true&per_page=20', author: 'Elektro Schwarzmann' },
      { name: 'News', url: 'https://news.elektro-schwarzmann.at/wp-json/wp/v2/posts?_embed=true&per_page=20', author: 'ES News' },
  ];

  const articlesCollection = adminDb.collection('articles');
  
  // Get all existing articles from Firestore to create a map of sourceId -> docId
  const existingArticlesSnapshot = await articlesCollection.get();
  const existingArticlesMap = new Map<string, string>();
  existingArticlesSnapshot.docs.forEach(doc => {
      if (doc.data().sourceId) {
          existingArticlesMap.set(doc.data().sourceId, doc.id);
      }
  });

  const batch = adminDb.batch();
  let totalNewArticles = 0;
  let totalUpdatedArticles = 0;
  const newArticleTitles: string[] = [];

  for (const source of wpSources) {
      let wpArticles;
      try {
        const response = await axios.get(source.url, { httpsAgent: insecureAgent, timeout: 10000 });
        wpArticles = response.data;
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error);
        continue;
      }

      for (const article of wpArticles) {
          const sourceId = `${source.name}-${article.id}`;
          
          let imageUrl = `https://placehold.co/1200x600.png`;
          
          // 1. Try to get featured media
          const featuredMedia = article._embedded?.['wp:featuredmedia']?.[0];
          if (featuredMedia?.source_url) {
              imageUrl = featuredMedia.source_url;
          } else {
              // 2. If no featured media, try to extract from content
              const imageId = extractFirstVcImageId(article.content.rendered);
              if (imageId) {
                  const foundUrl = await fetchWpImageUrlById(imageId);
                  if (foundUrl) {
                      imageUrl = foundUrl;
                  }
              }
          }
          
          const processedContent = await processShortcodes(article.content.rendered);
          const processedSnippet = await processShortcodes(article.excerpt.rendered);
          const authorName = article._embedded?.author?.[0]?.name;
          const articleTitle = stripHtml(article.title.rendered);

          const articlePayload: Omit<NewsArticle, 'id'> = {
              title: articleTitle,
              snippet: processedSnippet,
              content: processedContent,
              imageUrl: imageUrl,
              date: new Date(article.date).toISOString(),
              author: authorName || source.author,
              category: 'Unternehmens-News',
              source: source.name,
              sourceId: sourceId,
          };
          
          const existingDocId = existingArticlesMap.get(sourceId);
          if (existingDocId) {
              const docRef = articlesCollection.doc(existingDocId);
              batch.update(docRef, articlePayload);
              totalUpdatedArticles++;
          } else {
              const docRef = articlesCollection.doc();
              batch.set(docRef, articlePayload);
              totalNewArticles++;
              newArticleTitles.push(articleTitle);
          }
      }
  }

  if (totalNewArticles > 0 || totalUpdatedArticles > 0) {
      await batch.commit();
  }
  
  if(newArticleTitles.length > 0) {
    const notificationTitle = newArticleTitles.length > 1 ? `${newArticleTitles.length} neue Artikel verfügbar` : `Neuer Artikel: ${newArticleTitles[0]}`;
    const notificationBody = newArticleTitles.length > 1 ? `Neuigkeiten von den Webseiten.` : 'Jetzt in der App lesen.';
    await sendAndSavePushNotification({
        title: notificationTitle,
        body: notificationBody,
        url: '/news'
    });
  }

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/news');
  
  return { newCount: totalNewArticles, updatedCount: totalUpdatedArticles };
}


// Helper to verify admin privileges
async function verifyAdmin() {
    const user = await getCurrentUser();
    if (!user || user.isAdmin !== true) {
        throw new Error('Unauthorized');
    }
}

// Action to create a new article
export async function createArticle(articleData: Omit<NewsArticle, 'id' | 'date'>): Promise<NewsArticle> {
  await verifyAdmin();
  const articlesCollection = adminDb.collection('articles');
  
  const newArticleData = {
      ...articleData,
      date: new Date().toISOString(),
      source: 'internal', // Explicitly set source for internal articles
  };

  const docRef = await articlesCollection.add(newArticleData);
  const newArticle = { ...newArticleData, id: docRef.id };

  // Send push notification
  await sendAndSavePushNotification({
      title: 'Neue interne Meldung',
      body: newArticle.title,
      url: `/news/${newArticle.id}`,
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/news'); // Ensure the news list page is updated
  
  return newArticle;
}

// Action to delete a self-created article
export async function deleteArticle(articleId: string) {
    await verifyAdmin();

    const articleRef = adminDb.collection('articles').doc(articleId);
    const readReceiptsCollection = adminDb.collection('readReceipts');
    
    const articleDoc = await articleRef.get();
    if (!articleDoc.exists || articleDoc.data()?.source !== 'internal') {
        throw new Error('This article cannot be deleted.');
    }

    const batch = adminDb.batch();
    
    // 1. Delete the article itself
    batch.delete(articleRef);

    // 2. Find and delete all associated read receipts
    const receiptsQuery = readReceiptsCollection.where('articleId', '==', articleId);
    const receiptsSnapshot = await receiptsQuery.get();
    receiptsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    await batch.commit();

    revalidatePath('/');
    revalidatePath('/admin');
    revalidatePath('/news');
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
    
    const userMap = new Map(userRecords.users.map(u => {
        const simpleUser: SimpleUser = {
            uid: u.uid,
            email: u.email,
            displayName: u.displayName,
            photoURL: u.photoURL,
        };
        return [u.uid, simpleUser];
    }));

    const receiptsWithUsers: ReadReceiptWithUser[] = receipts.map(receipt => ({
        ...receipt,
        user: userMap.get(receipt.userId)
    }));

    return { articles, receipts: receiptsWithUsers };
}

// APPOINTMENT ACTIONS

// Action to get all appointments for the admin dashboard
export async function getAppointments(): Promise<Appointment[]> {
    const snapshot = await adminDb.collection('appointments').orderBy('date', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
}

// Action to create a new appointment
export async function createAppointment(appointmentData: Omit<Appointment, 'id'>): Promise<Appointment> {
    const docRef = await adminDb.collection('appointments').add(appointmentData);
    revalidatePath('/admin');
    revalidatePath('/dashboard');
    return { id: docRef.id, ...appointmentData };
}

// Action to delete an appointment
export async function deleteAppointment(id: string): Promise<void> {
    await adminDb.collection('appointments').doc(id).delete();
    revalidatePath('/admin');
    revalidatePath('/dashboard');
}


// USER & GROUP MANAGEMENT
export async function getUsersWithGroups(): Promise<SimpleUser[]> {
  const listUsersResult = await adminAuth.listUsers();
  const users: SimpleUser[] = listUsersResult.users.map(userRecord => {
    const customClaims = (userRecord.customClaims || {}) as { role?: string; groups?: UserGroup[] };
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      isAdmin: customClaims.role === 'admin',
      groups: customClaims.groups || [],
    };
  });
  return users;
}

export async function updateUserGroups(uid: string, groups: UserGroup[]): Promise<void> {
    const user = await adminAuth.getUser(uid);
    const existingClaims = user.customClaims || {};

    // Preserve existing claims like 'role'
    const newClaims = {
        ...existingClaims,
        groups: groups,
    };

    await adminAuth.setCustomUserClaims(uid, newClaims);
    revalidatePath('/admin');
}
