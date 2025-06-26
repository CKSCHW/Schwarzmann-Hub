
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import type { Survey } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { submitSurveyResponse } from '@/actions/surveyActions';
import { Loader2, Send } from 'lucide-react';

interface SurveyFormProps {
    survey: Survey;
}

// Generate schema dynamically based on survey questions
const generateSchema = (survey: Survey) => {
    const schemaObject = survey.questions.reduce((acc, question) => {
        switch(question.type) {
            case 'rating':
                acc[question.id] = z.string({ required_error: "Bitte wählen Sie eine Bewertung aus."}).nonempty("Bitte wählen Sie eine Bewertung aus.").transform(Number);
                break;
            case 'multiple-choice':
                acc[question.id] = z.string({ required_error: "Bitte wählen Sie eine Option aus." });
                break;
            case 'text':
                acc[question.id] = z.string().nonempty({ message: "Bitte geben Sie eine Antwort ein." });
                break;
        }
        return acc;
    }, {} as Record<string, z.ZodType<any, any>>);
    return z.object(schemaObject);
};


export default function SurveyForm({ survey }: SurveyFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    
    const surveySchema = generateSchema(survey);
    type SurveyFormValues = z.infer<typeof surveySchema>;

    const { control, handleSubmit, formState: { errors } } = useForm<SurveyFormValues>({
        resolver: zodResolver(surveySchema),
    });

    const onSubmit = async (data: SurveyFormValues) => {
        setIsLoading(true);
        const answers = Object.entries(data).map(([questionId, value]) => ({
            questionId,
            value,
        }));
        
        const result = await submitSurveyResponse(survey.id, answers);

        if (result.success) {
            toast({
                title: "Vielen Dank!",
                description: result.message,
            });
            router.push('/surveys');
            router.refresh(); // Refresh to show the updated list
        } else {
            toast({
                title: "Fehler",
                description: result.message,
                variant: 'destructive',
            });
            setIsLoading(false);
        }
    };

    const renderQuestionInput = (question: Survey['questions'][0]) => {
        switch (question.type) {
            case 'rating':
                return (
                    <Controller
                        name={question.id}
                        control={control}
                        render={({ field }) => (
                            <div>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    value={field.value?.toString()}
                                    className="flex justify-between items-center max-w-sm mx-auto"
                                >
                                    {[1, 2, 3, 4, 5].map(value => (
                                        <div key={value} className="flex flex-col items-center space-y-1">
                                            <Label htmlFor={`${question.id}-${value}`}>{value}</Label>
                                            <RadioGroupItem value={value.toString()} id={`${question.id}-${value}`} />
                                        </div>
                                    ))}
                                </RadioGroup>
                                <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1 max-w-sm mx-auto">
                                    <span>Trifft gar nicht zu</span>
                                    <span>Trifft voll zu</span>
                                </div>
                            </div>
                        )}
                    />
                );
            case 'multiple-choice':
                return (
                    <Controller
                        name={question.id}
                        control={control}
                        render={({ field }) => (
                             <RadioGroup
                                onValueChange={field.onChange}
                                value={field.value as string}
                                className="space-y-2"
                            >
                                {question.options?.map((option, i) => (
                                    <Label key={i} htmlFor={`${question.id}-${i}`} className="flex items-center gap-3 p-3 border rounded-md has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                                        <RadioGroupItem value={option} id={`${question.id}-${i}`} />
                                        <span>{option}</span>
                                    </Label>
                                ))}
                            </RadioGroup>
                        )}
                    />
                );
            case 'text':
                return (
                    <Controller
                        name={question.id}
                        control={control}
                        render={({ field }) => (
                            <Textarea
                                {...field}
                                placeholder="Ihre anonyme Antwort..."
                                rows={4}
                            />
                        )}
                    />
                );
            default:
                return <p>Unbekannter Fragetyp</p>;
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {survey.questions.map((question, index) => (
                <Card key={question.id}>
                    <CardHeader>
                        <CardTitle>Frage {index + 1}</CardTitle>
                        <CardDescription className="text-lg text-foreground">{question.text}</CardDescription>
                    </CardHeader>
                    <CardContent>
                       {renderQuestionInput(question)}
                       {errors[question.id] && <p className="text-sm font-medium text-destructive mt-2">{errors[question.id]?.message as string}</p>}
                    </CardContent>
                </Card>
            ))}
            <div className="flex justify-end">
                <Button type="submit" disabled={isLoading} size="lg">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Anonym absenden
                </Button>
            </div>
        </form>
    );
}
