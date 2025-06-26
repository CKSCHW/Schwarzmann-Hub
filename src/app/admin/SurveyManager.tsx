
'use client';

import { useState } from 'react';
import { useForm, useFieldArray, type SubmitHandler, useWatch, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Loader2, Users, PieChart, Info, ClipboardList, GripVertical } from 'lucide-react';
import type { Survey, SurveyQuestion, SimpleUser, SurveyResult, QuestionType } from '@/types';
import { questionTypes } from '@/types';
import { createSurvey, deleteSurvey, getSurveyResults } from '@/actions/surveyActions';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { randomUUID } from 'crypto';

const surveySchema = z.object({
  title: z.string().min(5, 'Titel muss mindestens 5 Zeichen haben.'),
  description: z.string().min(10, 'Beschreibung muss mindestens 10 Zeichen haben.'),
  questions: z.array(z.object({
    id: z.string(),
    text: z.string().min(1, 'Frage darf nicht leer sein.'),
    type: z.enum(questionTypes),
    options: z.array(z.object({ text: z.string().min(1, 'Option darf nicht leer sein.') })).optional()
  })).min(1, 'Mindestens eine Frage ist erforderlich.'),
  assignedUserIds: z.array(z.string()).min(1, 'Weisen Sie mindestens einen Benutzer zu.'),
}).superRefine((data, ctx) => {
  data.questions.forEach((q, index) => {
    if (q.type === 'multiple-choice') {
      if (!q.options || q.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Mindestens zwei Optionen erforderlich.',
          path: [`questions`, index, 'options'],
        });
      }
    }
  });
});

type SurveyFormValues = z.infer<typeof surveySchema>;

interface SurveyManagerProps {
  initialSurveys: Survey[];
  allUsers: SimpleUser[];
  currentUser: SimpleUser;
}

const QuestionOptionsFieldArray = ({ control, questionIndex }: { control: any, questionIndex: number }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `questions.${questionIndex}.options`
    });

    return (
        <div className="pl-6 mt-2 space-y-2">
            {fields.map((field, optionIndex) => (
                <div key={field.id} className="flex items-center gap-2">
                    <FormField
                        control={control}
                        name={`questions.${questionIndex}.options.${optionIndex}.text`}
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                                <FormControl><Input {...field} placeholder={`Option ${optionIndex + 1}`} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(optionIndex)} disabled={fields.length <= 2}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => append({ text: '' })}>Option hinzufügen</Button>
        </div>
    );
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
      questions: [{ id: `q-${Date.now()}`, text: '', type: 'rating', options: [] }],
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
        const surveyToCreate = {
            ...data,
            questions: data.questions.map(q => ({
                id: q.id,
                text: q.text,
                type: q.type,
                options: q.type === 'multiple-choice' ? q.options?.map(opt => opt.text) : [],
            }))
        }
      const newSurvey = await createSurvey(surveyToCreate);
      setSurveys([newSurvey, ...surveys]);
      form.reset({
        title: '',
        description: '',
        questions: [{ id: `q-${Date.now()}`, text: '', type: 'rating', options: [] }],
        assignedUserIds: [],
      });
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
  
  const processSurveyResults = (surveyResult: SurveyResult) => {
    if (!surveyResult) return [];

    return surveyResult.survey.questions.map(q => {
        const questionResponses = surveyResult.responses.map(r => r.answers.find(a => a.questionId === q.id));

        if (q.type === 'text') {
            const textAnswers = questionResponses.map(r => r?.value as string).filter(Boolean);
            return { questionText: q.text, type: q.type, textAnswers };
        }
        
        if (q.type === 'rating') {
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
                type: q.type,
                average: average,
                chartData: [
                    { name: '1 Stern', count: ratingCounts['1'] },
                    { name: '2 Sterne', count: ratingCounts['2'] },
                    { name: '3 Sterne', count: ratingCounts['3'] },
                    { name: '4 Sterne', count: ratingCounts['4'] },
                    { name: '5 Sterne', count: ratingCounts['5'] },
                ]
            };
        }

        if (q.type === 'multiple-choice') {
            const optionCounts = q.options?.reduce((acc, option) => ({ ...acc, [option]: 0 }), {} as Record<string, number>) || {};
            questionResponses.forEach(res => {
                if (res && typeof res.value === 'string' && res.value in optionCounts) {
                    optionCounts[res.value]++;
                }
            });
            return {
                questionText: q.text,
                type: q.type,
                chartData: Object.entries(optionCounts).map(([name, count]) => ({ name, count }))
            };
        }

        return { questionText: q.text, type: q.type, textAnswers: ['Unbekannter Fragetyp'] };
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
                    <FormLabel>Fragen</FormLabel>
                    <div className="space-y-4 mt-2">
                    {fields.map((field, index) => {
                        const questionType = useWatch({ control: form.control, name: `questions.${index}.type` });
                        return (
                        <div key={field.id} className="p-4 border rounded-lg space-y-2 bg-muted/30">
                            <div className="flex items-start gap-2">
                                <GripVertical className="h-5 w-5 mt-2 text-muted-foreground" />
                                <div className="flex-grow space-y-2">
                                    <FormField control={form.control} name={`questions.${index}.text`} render={({ field }) => (
                                        <FormItem><FormLabel>Frage {index+1}</FormLabel><FormControl><Textarea {...field} placeholder={`Fragentext...`} rows={2} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                     <Controller
                                        control={form.control}
                                        name={`questions.${index}.type`}
                                        render={({ field }) => (
                                        <FormItem><FormLabel>Fragetyp</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger><SelectValue placeholder="Typ auswählen..." /></SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="rating">Bewertung (1-5 Sterne)</SelectItem>
                                                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                                    <SelectItem value="text">Textantwort</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        <FormMessage /></FormItem>
                                    )}/>
                                </div>
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                            {questionType === 'multiple-choice' && <QuestionOptionsFieldArray control={form.control} questionIndex={index} />}
                        </div>
                    )})}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ id: `q-${Date.now()}`, text: '', type: 'rating', options: [] })} className="mt-2">
                        <PlusCircle className="mr-2 h-4 w-4" /> Frage hinzufügen
                    </Button>
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
                                {isResultsLoading && <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8" /></div>}
                                {results && processSurveyResults(results).map((q, index) => (
                                    <div key={index}>
                                        <h3 className="font-semibold text-lg">{q.questionText}</h3>
                                        {(q.type === 'rating' || q.type === 'multiple-choice') && q.chartData ? (
                                            <>
                                            {q.type === 'rating' && <p className="text-sm text-muted-foreground mb-4">Durchschnittliche Bewertung: {q.average}</p>}
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={q.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" />
                                                    <YAxis allowDecimals={false} />
                                                    <Tooltip />
                                                    <Bar dataKey="count" name="Anzahl" fill="hsl(var(--primary))" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                            </>
                                        ) : q.type === 'text' && q.textAnswers ? (
                                            <Card className="mt-2"><CardContent className="p-4 space-y-3">
                                                {q.textAnswers.length > 0 ? q.textAnswers.map((answer, i) => (
                                                    <p key={i} className="text-sm border-b pb-2 last:border-none">"{answer}"</p>
                                                )) : <p className="text-sm text-muted-foreground">Keine Antworten zu dieser Frage.</p>}
                                            </CardContent></Card>
                                        ) : null}
                                    </div>
                                ))}
                                {!isResultsLoading && !results?.responses.length && <p className="text-center text-muted-foreground py-8">Noch keine Antworten eingegangen.</p>}
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
