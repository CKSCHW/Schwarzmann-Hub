import NewsCard from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getArticles } from "@/actions/newsActions";

export default async function HomePage() {
  const allArticles = await getArticles();
  
  const featuredNews = allArticles[0];
  const recentNews = allArticles.slice(1, 4);

  return (
    <div className="space-y-8">
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

      {recentNews.length > 0 && (
        <section aria-labelledby="recent-news-title">
          <div className="flex justify-between items-center mb-6">
            <h2 id="recent-news-title" className="text-2xl font-headline font-semibold">
              Weitere Meldungen
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentNews.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
