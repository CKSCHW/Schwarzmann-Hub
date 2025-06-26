
import { getSurveysForUser } from "@/actions/surveyActions";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, ClipboardList, Clock } from "lucide-react";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function SurveysPage() {
    const allSurveys = await getSurveysForUser();

    // Case 1: User has no surveys assigned at all.
    if (allSurveys.length === 0) {
        return (
            <div className="space-y-8">
                <section>
                    <h1 className="text-3xl font-headline font-semibold mb-2">Ihre Umfragen</h1>
                    <p className="text-muted-foreground">
                        Hier finden Sie Umfragen, zu denen Sie eingeladen wurden. Ihre Antworten sind anonym.
                    </p>
                </section>
                <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                    <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-lg font-medium">Keine Umfragen verfügbar</h3>
                    <p className="mt-1 text-sm">Für Sie sind im Moment keine Umfragen zugewiesen.</p>
                </div>
            </div>
        );
    }
    
    // Case 2: User has surveys, so we split them into open and completed.
    const openSurveys = allSurveys.filter(s => !s.completed);
    const completedSurveys = allSurveys.filter(s => s.completed);

    return (
        <div className="space-y-8">
            <section>
                <h1 className="text-3xl font-headline font-semibold mb-2">Ihre Umfragen</h1>
                <p className="text-muted-foreground">
                    Hier finden Sie Umfragen, zu denen Sie eingeladen wurden. Ihre Antworten sind anonym.
                </p>
            </section>

            <section>
                <h2 className="text-2xl font-headline font-semibold mb-4">Offene Umfragen</h2>
                {openSurveys.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {openSurveys.map(survey => (
                            <Card key={survey.id} className="flex flex-col">
                                <CardHeader>
                                    <CardTitle className="flex items-start gap-3">
                                        <ClipboardList className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                                        <span>{survey.title}</span>
                                    </CardTitle>
                                    <CardDescription>{survey.description}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-grow">
                                    <p className="text-xs text-muted-foreground">Erstellt von: {survey.creatorEmail}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Erstellt am: {new Date(survey.createdAt).toLocaleDateString('de-DE')}
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Button asChild className="w-full">
                                        <Link href={`/surveys/${survey.id}`}>
                                            Zur Umfrage <ArrowRight className="ml-2 h-4 w-4" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                        <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
                        <h3 className="mt-2 text-lg font-medium">Alles erledigt!</h3>
                        <p className="mt-1 text-sm">Sie haben aktuell keine offenen Umfragen.</p>
                    </div>
                )}
            </section>

             <section>
                <h2 className="text-2xl font-headline font-semibold mb-4">Abgeschlossene Umfragen</h2>
                 {completedSurveys.length > 0 ? (
                    <div className="space-y-3">
                        {completedSurveys.map(survey => (
                            <div key={survey.id} className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Clock className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="font-medium">{survey.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Teilgenommen am {new Date(survey.createdAt).toLocaleDateString('de-DE')}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm font-semibold text-green-600 flex items-center gap-1.5">
                                    <CheckCircle className="h-4 w-4" />
                                    Abgeschlossen
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">Sie haben noch an keiner Umfrage teilgenommen.</p>
                )}
            </section>
        </div>
    );
}
