
'use client';

import { useState } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Loader2, Users, PieChart, Info, ClipboardList } from 'lucide-react';
import type { Survey, SurveyQuestion, SimpleUser, SurveyResult } from '@/types';
import { createSurvey, deleteSurvey, getSurveyResults } from '@/actions/surveyActions';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const questionSchema = z.object({
    id: z.string().optional(),
    text: z.string().min(1, 'Frage darf nicht leer sein.'),
    type: z.literal('rating'), // For now only rating
});

const surveySchema = z.object({
  title: z.string().min(5, 'Titel muss mindestens 5 Zeichen haben.'),
  description: z.string().min(10, 'Beschreibung muss mindestens 10 Zeichen haben.'),
  questions: z.array(questionSchema).min(1, 'Mindestens eine Frage ist erforderlich.'),
  assignedUserIds: z.array(z.string()).min(1, 'Weisen Sie mindestens einen Benutzer zu.'),
});

type SurveyFormValues = z.infer<typeof surveySchema>;

interface SurveyManagerProps {
  initialSurveys: Survey[];
  allUsers: SimpleUser[];
  currentUser: SimpleUser;
}

export default function SurveyManager({ initialSurveys, allUsers, currentUser }: SurveyManagerProps) {
  const [surveys, setSurveys] = useState(initialSurveys);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [results, setResults] = useState<SurveyResult | null>(null);
  const [isResultsLoading, setIsResultsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues: {
      title: '',
      description: '',
      questions: [{ text: '', type: 'rating' }],
      assignedUserIds: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const onSubmit: SubmitHandler<SurveyFormValues> = async (data) => {
    setIsSubmitting(true);
    try {
      const newSurvey = await createSurvey(data);
      setSurveys([newSurvey, ...surveys]);
      form.reset();
      toast({ title: 'Erfolg', description: 'Umfrage erfolgreich erstellt.' });
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (surveyId: string) => {
    setIsDeleting(surveyId);
    try {
        await deleteSurvey(surveyId);
        setSurveys(prev => prev.filter(s => s.id !== surveyId));
        toast({ title: 'Erfolg', description: 'Umfrage wurde gelöscht.' });
    } catch (error: any) {
        toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } finally {
        setIsDeleting(null);
    }
  }

  const handleFetchResults = async (surveyId: string) => {
    setIsResultsLoading(true);
    setResults(null);
    try {
        const surveyResults = await getSurveyResults(surveyId);
        setResults(surveyResults);
    } catch (error: any) {
        toast({ title: 'Fehler beim Laden der Ergebnisse', description: error.message, variant: 'destructive' });
    } finally {
        setIsResultsLoading(false);
    }
  };
  
  const processRatingData = (surveyResult: SurveyResult) => {
    if (!surveyResult) return [];
    
    return surveyResult.survey.questions.map(q => {
        const questionResponses = surveyResult.responses.map(r => r.answers.find(a => a.questionId === q.id));
        const ratingCounts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };

        questionResponses.forEach(res => {
            if (res && typeof res.value === 'number' && res.value >= 1 && res.value <= 5) {
                ratingCounts[res.value.toString() as keyof typeof ratingCounts]++;
            }
        });
        
        const totalRatings = Object.values(ratingCounts).reduce((a, b) => a + b, 0);
        const average = totalRatings > 0 
            ? (Object.entries(ratingCounts).reduce((sum, [rating, count]) => sum + (parseInt(rating) * count), 0) / totalRatings).toFixed(2)
            : 'N/A';

        return {
            questionText: q.text,
            average: average,
            data: [
                { rating: '1 Stern', anzahl: ratingCounts['1'] },
                { rating: '2 Sterne', anzahl: ratingCounts['2'] },
                { rating: '3 Sterne', anzahl: ratingCounts['3'] },
                { rating: '4 Sterne', anzahl: ratingCounts['4'] },
                { rating: '5 Sterne', anzahl: ratingCounts['5'] },
            ]
        };
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Neue Umfrage erstellen
            </CardTitle>
            <CardDescription>Erstellen Sie eine neue anonyme Umfrage für Mitarbeiter.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Titel</FormLabel><FormControl><Input {...field} placeholder="Feedback zur Schulung X" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Beschreibung</FormLabel><FormControl><Textarea {...field} placeholder="Worum geht es in dieser Umfrage?" /></FormControl><FormMessage /></FormItem>
                )} />

                <div>
                    <FormLabel>Fragen (1-5 Sterne Bewertung)</FormLabel>
                    <div className="space-y-2 mt-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-center gap-2">
                        <FormField control={form.control} name={`questions.${index}.text`} render={({ field }) => (
                            <FormItem className="flex-grow"><FormControl><Input {...field} placeholder={`Frage ${index + 1}`} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ text: '', type: 'rating' })} className="mt-2">Frage hinzufügen</Button>
                </div>
                
                <FormField control={form.control} name="assignedUserIds" render={({ field }) => (
                  <FormItem>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full"><Users className="mr-2" />Benutzer zuweisen ({field.value?.length || 0})</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Benutzer zuweisen</DialogTitle>
                                <DialogDescription>Wählen Sie die Benutzer aus, die an dieser Umfrage teilnehmen sollen.</DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="h-72">
                            <div className="p-4 space-y-2">
                            {allUsers.map((user) => (
                                <div key={user.uid} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`user-${user.uid}`}
                                    checked={field.value?.includes(user.uid)}
                                    onCheckedChange={(checked) => {
                                        const currentAssigned = field.value || [];
                                        if (checked) {
                                            field.onChange([...currentAssigned, user.uid]);
                                        } else {
                                            field.onChange(currentAssigned.filter(id => id !== user.uid));
                                        }
                                    }}
                                />
                                <label htmlFor={`user-${user.uid}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    {user.displayName || user.email}
                                </label>
                                </div>
                            ))}
                            </div>
                            </ScrollArea>
                        </DialogContent>
                    </Dialog>
                    <FormMessage/>
                  </FormItem>
                )} />

                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <PlusCircle className="mr-2" />}
                  Umfrage veröffentlichen
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Ihre erstellten Umfragen</CardTitle>
            <CardDescription>Verwalten Sie Ihre Umfragen und sehen Sie die Ergebnisse ein.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titel</TableHead>
                  <TableHead>Teilnehmer</TableHead>
                  <TableHead>Antworten</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {surveys.length > 0 ? (
                  surveys.map((survey) => (
                    <TableRow key={survey.id}>
                      <TableCell className="font-medium">{survey.title}</TableCell>
                      <TableCell>{survey.assignedUserIds.length}</TableCell>
                      <TableCell>{survey.completionCount}</TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Dialog onOpenChange={(open) => !open && setResults(null)}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => handleFetchResults(survey.id)}><PieChart className="h-4 w-4 mr-2" />Ergebnisse</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>Ergebnisse für: {results?.survey.title}</DialogTitle>
                                    <DialogDescription>
                                        Hier sehen Sie die anonymisierten Antworten. {results?.survey.completionCount} von {results?.survey.assignedUserIds.length} Teilnehmern haben geantwortet.
                                    </DialogDescription>
                                </DialogHeader>
                                <ScrollArea className="max-h-[70vh]">
                                <div className="p-4 space-y-8">
                                {isResultsLoading && <Loader2 className="animate-spin mx-auto my-8" />}
                                {results && processRatingData(results).map((q, index) => (
                                    <div key={index}>
                                        <h3 className="font-semibold text-lg">{q.questionText}</h3>
                                        <p className="text-sm text-muted-foreground mb-4">Durchschnittliche Bewertung: {q.average}</p>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={q.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="rating" />
                                                <YAxis allowDecimals={false} />
                                                <Tooltip />
                                                <Bar dataKey="anzahl" fill="hsl(var(--primary))" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                ))}
                                {!isResultsLoading && !results?.responses.length && <p className="text-center text-muted-foreground">Noch keine Antworten eingegangen.</p>}
                                </div>
                                </ScrollArea>
                            </DialogContent>
                        </Dialog>

                        <Button variant="destructive" size="sm" onClick={() => handleDelete(survey.id)} disabled={isDeleting === survey.id}>
                            {isDeleting === survey.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">Sie haben noch keine Umfragen erstellt.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
