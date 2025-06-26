
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Newspaper, CalendarCheck2 } from "lucide-react";
import { getAppointmentsForUser } from "@/actions/dashboardActions";
import { getArticles } from "@/actions/newsActions";
import type { NewsArticle } from "@/types";
import NewsCard from "@/components/NewsCard";

export const dynamic = 'force-dynamic';

function deduplicateArticles(articles: NewsArticle[]): NewsArticle[] {
  const uniqueArticlesMap = new Map<string, NewsArticle>();
  for (const article of articles) {
    const key = article.sourceId || article.id;
    if (!uniqueArticlesMap.has(key)) {
      uniqueArticlesMap.set(key, article);
    }
  }
  return Array.from(uniqueArticlesMap.values());
}

const quickAccessItems = [
  {
    title: "Alle News anzeigen",
    description: "Lesen Sie alle Unternehmensankündigungen und Updates.",
    icon: Newspaper,
    href: "/news",
    cta: "Zu den News",
  },
  {
    title: "Wocheneinteilung",
    description: "Greifen Sie auf die aktuellen Wocheneinteilungen zu.",
    icon: CalendarCheck2,
    href: "/schedule",
    cta: "Pläne ansehen",
  },
];

export default async function DashboardPage() {
  const [appointments, allArticlesFromDb] = await Promise.all([
    getAppointmentsForUser(),
    getArticles({ limit: 1 })
  ]);
  
  const allArticles = deduplicateArticles(allArticlesFromDb);
  const latestArticle = allArticles[0];

  return (
    <div className="space-y-8">
      <section aria-labelledby="dashboard-welcome-title">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-primary text-primary-foreground">
          <div>
            <h1 id="dashboard-welcome-title" className="text-2xl font-headline font-semibold">
              Willkommen zurück!
            </h1>
            <p className="text-primary-foreground/90">
              Ihre zentrale Anlaufstelle für Neuigkeiten, Pläne und Termine.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
           <h2 className="text-xl font-headline font-semibold mb-4">
                Neueste Meldung
            </h2>
             {latestArticle ? (
              <NewsCard article={latestArticle} isFeatured />
            ) : (
              <Card className="flex items-center justify-center min-h-[300px]">
                <CardContent className="text-center text-muted-foreground p-6">
                    <p>Zurzeit sind keine Meldungen verfügbar.</p>
                </CardContent>
              </Card>
            )}
        </div>
        <div className="space-y-6">
             <h2 className="text-xl font-headline font-semibold mb-4">
                Schnellzugriff
            </h2>
             {quickAccessItems.map((item) => (
                <Card key={item.title} className="flex flex-col transition-all hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-lg font-medium">{item.title}</CardTitle>
                    <item.icon className="h-6 w-6 text-muted-foreground" />
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
                <CardFooter>
                    <Button asChild className="w-full">
                    <Link href={item.href}>
                        {item.cta}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    </Button>
                </CardFooter>
                </Card>
            ))}
        </div>
      </div>

      <section aria-labelledby="upcoming-events-title">
         <Card>
            <CardHeader>
                <CardTitle className="text-xl font-headline">Ihre anstehenden Termine</CardTitle>
                <CardDescription>Für Sie und Ihre Gruppen relevante Termine.</CardDescription>
            </CardHeader>
            <CardContent>
                {appointments.length > 0 ? (
                  <ul className="space-y-3">
                      {appointments.map(appointment => (
                          <li key={appointment.id} className="flex items-start justify-between p-3 bg-secondary/50 rounded-md">
                              <div>
                                  <p className="font-medium">{appointment.title}</p>
                                  <p className="text-sm text-muted-foreground">
                                      {new Date(appointment.date).toLocaleDateString('de-DE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                  </p>
                                  {appointment.description && (
                                    <p className="text-sm text-muted-foreground mt-1">{appointment.description}</p>
                                  )}
                              </div>
                              {appointment.groups && appointment.groups.length > 0 && (
                                <div className="text-right text-xs text-muted-foreground">
                                    {appointment.groups.join(', ')}
                                </div>
                              )}
                          </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                      Für Sie sind aktuell keine Termine eingetragen.
                  </p>
                )}
            </CardContent>
         </Card>
      </section>
    </div>
  );
}
