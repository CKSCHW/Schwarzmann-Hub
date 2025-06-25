
import { getArticles } from '@/actions/newsActions';
import NewsCard from '@/components/NewsCard';
import type { NewsArticle } from '@/types';

/**
 * Deduplicates articles based on their sourceId or, as a fallback, their unique id.
 * Since articles are fetched sorted by date descending, this will always keep the newest version.
 */
function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const uniqueArticlesMap = new Map<string, NewsArticle>();
  for (const article of articles) {
    // Use sourceId as the primary key for deduplication, as it's consistent for WordPress posts.
    // Fallback to the Firestore document ID for internal posts.
    const key = article.sourceId || article.id;
    if (!uniqueArticlesMap.has(key)) {
      uniqueArticlesMap.set(key, article);
    }
  }
  return Array.from(uniqueArticlesMap.values());
}


export default async function AllNewsPage() {
  const articlesFromDb = await getArticles();
  const articles = deduplicateArticles(articlesFromDb);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-headline font-semibold mb-2">Alle Neuigkeiten</h1>
        <p className="text-muted-foreground">
          Ein Archiv aller internen Meldungen und Webseiten-Beiträge.
        </p>
      </section>

      {articles.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </section>
      ) : (
        <div className="text-center text-muted-foreground py-8">
            <p>Keine Artikel in der Datenbank gefunden.</p>
            <p className="text-sm mt-2">Bitte importieren Sie die Artikel im Admin-Bereich.</p>
        </div>
      )}
    </div>
  );
}
