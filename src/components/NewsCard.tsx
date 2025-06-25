import Image from "next/image";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { NewsArticle } from "@/types";
import { ArrowRight, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  article: NewsArticle;
  isFeatured?: boolean;
}

export default function NewsCard({ article, isFeatured = false }: NewsCardProps) {
  const articleUrl = `/news/${article.id}`;

  return (
    <Card className={`w-full flex flex-col overflow-hidden transition-all hover:shadow-xl ${isFeatured ? 'md:col-span-2 lg:col-span-3' : ''}`}>
      {article.imageUrl && (
        <Link href={articleUrl} className={`relative block w-full ${isFeatured ? 'aspect-[2/1]' : 'aspect-video'}`}>
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            data-ai-hint="news article"
          />
        </Link>
      )}
      <CardHeader>
        <CardTitle className={`${isFeatured ? 'text-2xl md:text-3xl' : 'text-xl'} font-headline leading-tight`}>
          <Link href={articleUrl} className="hover:text-primary hover:underline">
              {article.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <div
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none",
            "text-muted-foreground",
            "[&_p]:my-2 first:[&_p]:mt-0 last:[&_p]:mb-0",
            isFeatured ? "sm:prose-base" : "prose-sm"
          )}
          dangerouslySetInnerHTML={{ __html: article.snippet }}
        />
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-auto">
        <div className="flex items-center text-xs text-muted-foreground">
          <CalendarDays className="mr-1.5 h-4 w-4" />
          <span>{new Date(article.date).toLocaleDateString('de-DE')}</span>
          {article.author && <span className="ml-2">von {article.author}</span>}
        </div>
        <Button asChild variant="secondary" size="sm">
          <Link href={articleUrl}>
            Weiterlesen <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
