
import { getArticles } from '@/actions/newsActions';
import NewsCard from '@/components/NewsCard';

export default async function AllNewsPage() {
  const articles = await getArticles();

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
