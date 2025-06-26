
'use client';

import { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2, Loader2, Users, GripVertical, Save } from 'lucide-react';
import type { Survey, SimpleUser } from '@/types';
import { questionTypes } from '@/types';
import { createSurvey, updateSurvey } from '@/actions/surveyActions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const surveySchema = z.object({
  title: z.string().min(5, 'Titel muss mindestens 5 Zeichen haben.'),
  description: z.string().min(10, 'Beschreibung muss mindestens 10 Zeichen haben.'),
  questions: z.array(z.object({
    id: z.string(),
    text: z.string().min(1, 'Frage darf nicht leer sein.'),
    type: z.enum(questionTypes, { required_error: "Bitte Fragetyp auswählen." }),
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
       if (q.options?.some(opt => !opt.text)) {
         ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Alle Optionen müssen Text enthalten.',
          path: [`questions`, index, 'options'],
        });
      }
    }
  });
});

type SurveyFormValues = z.infer<typeof surveySchema>;

interface SurveyFormProps {
  mode: 'create' | 'edit';
  initialData?: Survey;
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

const SurveyQuestionItem = ({ control, index, remove, fieldsLength, questionType }: { control: any, index: number, remove: (index: number) => void, fieldsLength: number, questionType: string }) => {
    return (
        <div className="p-4 border rounded-lg space-y-2 bg-muted/30">
            <div className="flex items-start gap-2">
                <GripVertical className="h-5 w-5 mt-2 text-muted-foreground" />
                <div className="flex-grow space-y-2">
                    <FormField control={control} name={`questions.${index}.text`} render={({ field }) => (
                        <FormItem><FormLabel>Frage {index + 1}</FormLabel><FormControl><Textarea {...field} placeholder={`Fragentext...`} rows={2} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Controller
                        control={control}
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
                        )} />
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fieldsLength <= 1}><Trash2 className="h-4 w-4" /></Button>
            </div>
            {questionType === 'multiple-choice' && (
                 <FormField
                    control={control}
                    name={`questions.${index}.options`}
                    render={() => (
                        <FormItem>
                            <FormLabel>Antwort-Optionen</FormLabel>
                            <FormControl>
                                <QuestionOptionsFieldArray control={control} questionIndex={index} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                 />
            )}
        </div>
    );
};

export default function SurveyForm({ mode, initialData, allUsers, currentUser }: SurveyFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const defaultValues = {
    title: initialData?.title || '',
    description: initialData?.description || '',
    assignedUserIds: initialData?.assignedUserIds || [],
    questions: initialData?.questions.map(q => ({
      id: q.id,
      text: q.text,
      type: q.type,
      options: q.options?.map(opt => ({ text: opt })) || [{ text: '' }, { text: '' }],
    })) || [{ id: `q-${Date.now()}`, text: '', type: 'rating', options: [{ text: '' }, { text: '' }] }],
  };

  const form = useForm<SurveyFormValues>({
    resolver: zodResolver(surveySchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });
  
  const questionTypesWatch = form.watch('questions');

  const onSubmit = async (data: SurveyFormValues) => {
    setIsSubmitting(true);
    const transformedData = {
        ...data,
        questions: data.questions.map(q => ({
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.type === 'multiple-choice' ? q.options?.map(opt => opt.text) : [],
        })),
    };
    
    try {
      if (mode === 'edit' && initialData) {
        await updateSurvey(initialData.id, transformedData);
        toast({ title: 'Erfolg', description: 'Umfrage erfolgreich aktualisiert.' });
      } else {
        await createSurvey(transformedData);
        toast({ title: 'Erfolg', description: 'Umfrage erfolgreich erstellt.' });
      }
      router.push('/admin?tab=surveys');
      router.refresh();
    } catch (error: any) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem><FormLabel>Titel</FormLabel><FormControl><Input {...field} placeholder="Feedback zur Schulung X" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="description" render={({ field }) => (
                  <FormItem><FormLabel>Beschreibung</FormLabel><FormControl><Textarea {...field} placeholder="Worum geht es in dieser Umfrage?" /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

            <Card>
                <CardHeader><CardTitle>Fragen</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {fields.map((field, index) => (
                       <SurveyQuestionItem
                            key={field.id}
                            control={form.control}
                            index={index}
                            remove={remove}
                            fieldsLength={fields.length}
                            questionType={questionTypesWatch[index]?.type}
                        />
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ id: `q-${Date.now()}`, text: '', type: 'rating', options: [{text: ''}, {text: ''}] })} className="mt-2">
                        <PlusCircle className="mr-2 h-4 w-4" /> Frage hinzufügen
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Teilnehmer</CardTitle></CardHeader>
                <CardContent>
                     <FormField control={form.control} name="assignedUserIds" render={({ field }) => (
                      <FormItem>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button type="button" variant="outline">
                                    <Users className="mr-2 h-4 w-4" />
                                    Teilnehmer auswählen
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Teilnehmer auswählen</DialogTitle>
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
                        <div className="pt-2 text-sm text-muted-foreground">
                          {field.value?.length || 0} Teilnehmer ausgewählt.
                        </div>
                        <FormMessage/>
                      </FormItem>
                    )} />
                </CardContent>
            </Card>
            
            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
                  {mode === 'create' ? 'Umfrage veröffentlichen' : 'Änderungen speichern'}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
