
import NewsCard from "@/components/NewsCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { mockFeaturedNews, mockRecentNews } from "@/lib/mockData";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section aria-labelledby="featured-news-title">
        <h1 id="featured-news-title" className="text-3xl font-headline font-semibold mb-6">
          Latest Update
        </h1>
        <NewsCard article={mockFeaturedNews} isFeatured />
      </section>

      <section aria-labelledby="recent-news-title">
        <div className="flex justify-between items-center mb-6">
          <h2 id="recent-news-title" className="text-2xl font-headline font-semibold">
            More News
          </h2>
          <Button variant="outline" asChild>
            <Link href="/news">View All News</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRecentNews.map((article) => (
            <NewsCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </div>
  );
}
