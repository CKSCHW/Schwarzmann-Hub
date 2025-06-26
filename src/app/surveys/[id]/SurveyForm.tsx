
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import type { Survey } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { submitSurveyResponse } from '@/actions/surveyActions';
import { Loader2, Send } from 'lucide-react';

interface SurveyFormProps {
    survey: Survey;
}

// Generate schema dynamically based on survey questions
const generateSchema = (survey: Survey) => {
    const schemaObject = survey.questions.reduce((acc, question) => {
        acc[question.id] = z.string().nonempty({ message: "Bitte wählen Sie eine Bewertung aus." }).transform(Number);
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
        } else {
            toast({
                title: "Fehler",
                description: result.message,
                variant: 'destructive',
            });
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {survey.questions.map((question, index) => (
                <Card key={question.id}>
                    <CardHeader>
                        <CardTitle>Frage {index + 1}: {question.text}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Controller
                            name={question.id}
                            control={control}
                            render={({ field }) => (
                                <div>
                                    <RadioGroup
                                        onValueChange={field.onChange}
                                        value={field.value?.toString()}
                                        className="flex justify-between items-center"
                                    >
                                        <div className="flex flex-col items-center space-y-1">
                                            <Label htmlFor={`${question.id}-1`}>1</Label>
                                            <RadioGroupItem value="1" id={`${question.id}-1`} />
                                        </div>
                                        <div className="flex flex-col items-center space-y-1">
                                            <Label htmlFor={`${question.id}-2`}>2</Label>
                                            <RadioGroupItem value="2" id={`${question.id}-2`} />
                                        </div>
                                        <div className="flex flex-col items-center space-y-1">
                                            <Label htmlFor={`${question.id}-3`}>3</Label>
                                            <RadioGroupItem value="3" id={`${question.id}-3`} />
                                        </div>
                                        <div className="flex flex-col items-center space-y-1">
                                            <Label htmlFor={`${question.id}-4`}>4</Label>
                                            <RadioGroupItem value="4" id={`${question.id}-4`} />
                                        </div>
                                        <div className="flex flex-col items-center space-y-1">
                                            <Label htmlFor={`${question.id}-5`}>5</Label>
                                            <RadioGroupItem value="5" id={`${question.id}-5`} />
                                        </div>
                                    </RadioGroup>
                                     <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                                        <span>Trifft gar nicht zu</span>
                                        <span>Trifft voll zu</span>
                                    </div>
                                </div>
                            )}
                        />
                        {errors[question.id] && <p className="text-sm font-medium text-destructive mt-2">{errors[question.id]?.message}</p>}
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
