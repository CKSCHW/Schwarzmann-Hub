
'use client';

import type { SurveyResult } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface SurveyResultsClientProps {
    results: SurveyResult;
}

export default function SurveyResultsClient({ results }: SurveyResultsClientProps) {

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

  const processedResults = processSurveyResults(results);

  return (
     <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">{results.survey.title}</CardTitle>
                <CardDescription>{results.survey.description}</CardDescription>
                <CardDescription className="pt-2 font-semibold">
                    {results.survey.completionCount} von {results.survey.assignedUserIds.length} Teilnehmern haben geantwortet.
                </CardDescription>
            </CardHeader>
        </Card>
        
        <div className="space-y-8">
            {processedResults.map((q, index) => (
                <Card key={index}>
                    <CardHeader>
                        <CardTitle>Frage {index+1}: {q.questionText}</CardTitle>
                        {q.type === 'rating' && <CardDescription>Durchschnittliche Bewertung: {q.average}</CardDescription>}
                    </CardHeader>
                    <CardContent>
                    {(q.type === 'rating' || q.type === 'multiple-choice') && q.chartData ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={q.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                                <YAxis allowDecimals={false} />
                                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }}/>
                                <Bar dataKey="count" name="Anzahl" fill="hsl(var(--primary))" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : q.type === 'text' && q.textAnswers ? (
                        <div className="space-y-3">
                            {q.textAnswers.length > 0 ? q.textAnswers.map((answer, i) => (
                                <blockquote key={i} className="p-3 bg-muted rounded-md border-l-4 border-primary text-sm italic">"{answer}"</blockquote>
                            )) : <p className="text-sm text-muted-foreground">Keine Antworten zu dieser Frage.</p>}
                        </div>
                    ) : null}
                    </CardContent>
                </Card>
            ))}
            {results.responses.length === 0 &&
                <Card>
                    <CardContent className="p-10 text-center text-muted-foreground">
                        Noch keine Antworten eingegangen.
                    </CardContent>
                </Card>
            }
        </div>
     </div>
  )
}
