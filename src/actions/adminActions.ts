
'use server';

import { revalidatePath } from 'next/cache';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import type { NewsArticle, ReadReceipt, ReadReceiptWithUser } from '@/types';

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
            const response = await fetch(url, { next: { revalidate: 0 } });
            if (response.ok) {
                const media = await response.json();
                if (media.source_url) {
                    return media.source_url;
                }
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
                const imgTag = `<img src="${imageUrl}" alt="Bild aus Artikel" class="mx-auto my-4 rounded-lg shadow-md" />`;
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

  for (const source of wpSources) {
      let wpArticles;
      try {
        const response = await fetch(source.url, { next: { revalidate: 0 } }); // No caching for imports
        if (!response.ok) {
            console.error(`Failed to fetch WordPress articles from ${source.name}. Status: ${response.status}`);
            continue; // Skip to the next source
        }
        wpArticles = await response.json();
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

          const articlePayload: Omit<NewsArticle, 'id'> = {
              title: stripHtml(article.title.rendered),
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
          }
      }
  }

  if (totalNewArticles > 0 || totalUpdatedArticles > 0) {
      await batch.commit();
  }
  
  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/news');
  
  return { newCount: totalNewArticles, updatedCount: totalUpdatedArticles };
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
