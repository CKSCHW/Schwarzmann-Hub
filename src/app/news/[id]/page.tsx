
import { getArticle } from '@/actions/newsActions';
import MarkAsReadClientTrigger from './MarkAsRead';
import { getCurrentUser } from '@/lib/firebase-admin';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import { CalendarDays, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default async function NewsDetailPage({ params }: { params: { id: string } }) {
  const article = await getArticle(params.id);
  const user = await getCurrentUser();

  if (!article) {
    notFound();
  }

  return (
    <>
      {user && <MarkAsReadClientTrigger articleId={params.id} userId={user.uid} />}
      <article className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-headline font-bold mb-3 leading-tight">{article.title}</h1>
          <div className="flex items-center text-muted-foreground text-sm">
            <div className="flex items-center">
              <CalendarDays className="mr-2 h-4 w-4" />
              <span>{new Date(article.date).toLocaleDateString('de-DE')}</span>
            </div>
            {article.author && (
              <>
                <span className="mx-2">|</span>
                <div className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>{article.author}</span>
                </div>
              </>
            )}
          </div>
        </header>

        {article.imageUrl && (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-8 shadow-lg">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              unoptimized
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 896px"
              priority
              data-ai-hint="news article"
            />
          </div>
        )}

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <div dangerouslySetInnerHTML={{ __html: article.snippet }} />
          {article.content && <div dangerouslySetInnerHTML={{ __html: article.content }} />}
        </div>
      </article>
    </>
  );
}
