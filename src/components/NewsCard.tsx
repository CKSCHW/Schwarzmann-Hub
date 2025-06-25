import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { NewsArticle } from "@/types";
import { ExternalLink, CalendarDays } from "lucide-react";

interface NewsCardProps {
  article: NewsArticle;
  isFeatured?: boolean;
}

export default function NewsCard({ article, isFeatured = false }: NewsCardProps) {
  return (
    <Card className={`w-full overflow-hidden transition-all hover:shadow-xl ${isFeatured ? 'md:col-span-2 lg:col-span-3' : ''}`}>
      {article.imageUrl && (
        <div className={`relative w-full ${isFeatured ? 'aspect-[2/1]' : 'aspect-video'}`}>
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint="news article"
          />
        </div>
      )}
      <CardHeader>
        <CardTitle className={`${isFeatured ? 'text-2xl md:text-3xl' : 'text-xl'} font-headline leading-tight`}>
          {article.link ? (
            <Link href={article.link} target="_blank" rel="noopener noreferrer" className="hover:text-primary hover:underline">
              {article.title}
            </Link>
          ) : (
            article.title
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-muted-foreground ${isFeatured ? 'text-base' : 'text-sm'}`}>{article.snippet}</p>
        {isFeatured && article.content && (
          <p className="mt-2 text-sm">{article.content}</p>
        )}
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div className="flex items-center text-xs text-muted-foreground">
          <CalendarDays className="mr-1.5 h-4 w-4" />
          <span>{new Date(article.date).toLocaleDateString('de-DE')}</span>
          {article.author && <span className="ml-2">von {article.author}</span>}
        </div>
        {article.link && (
          <Button asChild variant="outline" size="sm">
            <Link href={article.link} target="_blank" rel="noopener noreferrer">
              Weiterlesen <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
