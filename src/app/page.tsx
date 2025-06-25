
import NewsCard from "@/components/NewsCard";
import { getArticles } from "@/actions/newsActions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function HomePage() {
  // Fetch latest 20 articles to have a good pool for all categories
  const allArticles = await getArticles({ limit: 20 });

  const featuredNews = allArticles[0]; // The absolute latest article is featured

  // The rest of the articles are filtered into their respective categories
  const otherArticles = allArticles.slice(1);
  const internalNews = otherArticles.filter(a => a.source === 'internal').slice(0, 3);
  const wordpressNews = otherArticles.filter(a => a.source === 'Elektro Schwarzmann' || a.source === 'News').slice(0, 3);

  return (
    <div className="space-y-12">
      <section aria-labelledby="featured-news-title">
        <h1 id="featured-news-title" className="text-3xl font-headline font-semibold mb-6">
          Neueste Meldung
        </h1>
        {featuredNews ? (
          <NewsCard article={featuredNews} isFeatured />
        ) : (
          <p className="text-muted-foreground">Zurzeit sind keine Meldungen verfügbar.</p>
        )}
      </section>

      {internalNews.length > 0 && (
        <section aria-labelledby="internal-news-title">
          <div className="flex justify-between items-center my-6">
            <h2 id="internal-news-title" className="text-2xl font-headline font-semibold">
              Weitere interne Meldungen
            </h2>
            <Button asChild variant="ghost">
              <Link href="/news">
                Alle anzeigen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {internalNews.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {wordpressNews.length > 0 && (
        <section aria-labelledby="wordpress-news-title">
          <div className="flex justify-between items-center my-6 pt-8 border-t">
            <h2 id="wordpress-news-title" className="text-2xl font-headline font-semibold">
              Aktuelles von unseren Webseiten
            </h2>
             <Button asChild variant="ghost">
              <Link href="/news">
                Alle anzeigen <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wordpressNews.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
